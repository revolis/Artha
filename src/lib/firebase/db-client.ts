import { randomUUID } from "crypto";

import { getAdminDb } from "@/lib/firebase/admin";

type Primitive = string | number | boolean | null;
type Row = Record<string, any>;

type QueryError = {
  code?: string;
  message: string;
};

type QueryResult<T = any> = {
  data: T | null;
  error: QueryError | null;
};

type FilterOperator = "eq" | "gte" | "lte" | "lt" | "gt" | "in" | "is";

type FilterCondition = {
  field: string;
  operator: FilterOperator;
  value: any;
};

type QueryMode = "select" | "insert" | "update" | "upsert" | "delete";

type OrderConfig = {
  field: string;
  ascending: boolean;
};

type UpsertOptions = {
  onConflict?: string;
};

const TABLES_WITH_CREATED_AT = new Set([
  "categories",
  "sources",
  "financial_years",
  "entries",
  "attachments",
  "portfolio_snapshots",
  "goals",
  "user_settings",
  "reports",
  "drive_tokens"
]);

const TABLES_WITH_UPDATED_AT = new Set(["entries", "user_settings", "drive_tokens"]);
const USER_SCOPED_SINGLE_DOC_TABLES = new Set(["drive_tokens", "user_settings"]);

function nowIso() {
  return new Date().toISOString();
}

function asComparable(value: any): Primitive {
  if (value === null || value === undefined) return null;
  if (typeof value === "string" || typeof value === "number" || typeof value === "boolean") {
    return value;
  }
  if (value instanceof Date) {
    return value.toISOString();
  }
  return String(value);
}

function compareValues(left: any, right: any): number {
  const a = asComparable(left);
  const b = asComparable(right);

  if (a === b) return 0;
  if (a === null) return -1;
  if (b === null) return 1;

  if (typeof a === "number" && typeof b === "number") {
    return a > b ? 1 : -1;
  }

  const aText = String(a);
  const bText = String(b);
  if (aText === bText) return 0;
  return aText > bText ? 1 : -1;
}

function matchesCondition(row: Row, condition: FilterCondition): boolean {
  const left = row[condition.field];
  const right = condition.value;

  switch (condition.operator) {
    case "eq":
      return left === right;
    case "gte":
      return compareValues(left, right) >= 0;
    case "lte":
      return compareValues(left, right) <= 0;
    case "lt":
      return compareValues(left, right) < 0;
    case "gt":
      return compareValues(left, right) > 0;
    case "in":
      return Array.isArray(right) ? right.includes(left) : false;
    case "is":
      return right === null ? left === null || left === undefined : left === right;
    default:
      return false;
  }
}

function parseOrExpression(expression: string): FilterCondition[] {
  const parts = expression
    .split(",")
    .map((item) => item.trim())
    .filter(Boolean);

  const conditions: FilterCondition[] = [];

  parts.forEach((part) => {
    const isNullMatch = part.match(/^([a-zA-Z0-9_]+)\.is\.null$/);
    if (isNullMatch) {
      conditions.push({
        field: isNullMatch[1],
        operator: "is",
        value: null
      });
      return;
    }

    const eqMatch = part.match(/^([a-zA-Z0-9_]+)\.eq\.(.+)$/);
    if (eqMatch) {
      conditions.push({
        field: eqMatch[1],
        operator: "eq",
        value: eqMatch[2]
      });
    }
  });

  return conditions;
}

function applyFilters(rows: Row[], andFilters: FilterCondition[], orFilters: FilterCondition[]): Row[] {
  return rows.filter((row) => {
    const andPass = andFilters.every((condition) => matchesCondition(row, condition));
    if (!andPass) return false;

    if (orFilters.length === 0) {
      return true;
    }

    return orFilters.some((condition) => matchesCondition(row, condition));
  });
}

function applyOrdering(rows: Row[], orderBy?: OrderConfig): Row[] {
  if (!orderBy) return rows;

  const next = [...rows];
  next.sort((a, b) => {
    const compared = compareValues(a[orderBy.field], b[orderBy.field]);
    return orderBy.ascending ? compared : -compared;
  });

  return next;
}

function applyLimit(rows: Row[], limitCount?: number): Row[] {
  if (!limitCount || limitCount <= 0) {
    return rows;
  }

  return rows.slice(0, limitCount);
}

function normalizeForWrite(table: string, payload: Row, mode: QueryMode): Row {
  const now = nowIso();
  const next = { ...payload };

  if (mode === "insert" || mode === "upsert") {
    if (TABLES_WITH_CREATED_AT.has(table) && !next.created_at) {
      next.created_at = now;
    }
  }

  if (TABLES_WITH_UPDATED_AT.has(table)) {
    next.updated_at = now;
  }

  return next;
}

async function readAllRows(table: string): Promise<Row[]> {
  const snapshot = await getAdminDb().collection(table).get();
  return snapshot.docs.map((doc) => ({ id: doc.id, ...doc.data() }));
}

async function readRowsByIds(table: string, ids: string[]): Promise<Row[]> {
  if (ids.length === 0) {
    return [];
  }

  const unique = Array.from(new Set(ids.filter(Boolean)));
  if (unique.length === 0) {
    return [];
  }

  const snapshots = await Promise.all(unique.map((id) => getAdminDb().collection(table).doc(id).get()));
  return snapshots
    .filter((snapshot) => snapshot.exists)
    .map((snapshot) => ({ id: snapshot.id, ...snapshot.data() }));
}

async function enrichEntryRows(rows: Row[]): Promise<Row[]> {
  if (rows.length === 0) {
    return rows;
  }

  const categoryIds = rows.map((row) => row.category_id).filter(Boolean);
  const sourceIds = rows.map((row) => row.source_id).filter(Boolean);
  const entryIds = rows.map((row) => row.id).filter(Boolean);

  const [categories, sources, tradeDetailsRows, entryTagRows] = await Promise.all([
    readRowsByIds("categories", categoryIds),
    readRowsByIds("sources", sourceIds),
    readAllRows("trade_details"),
    readAllRows("entry_tags")
  ]);

  const categoryMap = new Map(categories.map((row) => [row.id, row]));
  const sourceMap = new Map(sources.map((row) => [row.id, row]));
  const tradeMap = new Map(
    tradeDetailsRows
      .filter((row) => entryIds.includes(row.entry_id))
      .map((row) => [row.entry_id, row])
  );

  const tagMap = new Map<string, Array<{ tag_id: string }>>();
  entryTagRows
    .filter((row) => entryIds.includes(row.entry_id))
    .forEach((row) => {
      const bucket = tagMap.get(row.entry_id) ?? [];
      bucket.push({ tag_id: row.tag_id });
      tagMap.set(row.entry_id, bucket);
    });

  return rows.map((row) => {
    const category = row.category_id ? categoryMap.get(row.category_id) ?? null : null;
    const source = row.source_id ? sourceMap.get(row.source_id) ?? null : null;

    return {
      ...row,
      category,
      categories: category,
      source,
      sources: source,
      trade_details: tradeMap.get(row.id) ?? null,
      entry_tags: tagMap.get(row.id) ?? []
    };
  });
}

async function enrichGoalRows(rows: Row[]): Promise<Row[]> {
  if (rows.length === 0) {
    return rows;
  }

  const categoryIds = rows.map((row) => row.category_id).filter(Boolean);
  const categories = await readRowsByIds("categories", categoryIds);
  const categoryMap = new Map(categories.map((row) => [row.id, row]));

  return rows.map((row) => {
    const category = row.category_id ? categoryMap.get(row.category_id) ?? null : null;
    return {
      ...row,
      category,
      categories: category
    };
  });
}

async function enrichRows(table: string, rows: Row[]): Promise<Row[]> {
  if (table === "entries") {
    return enrichEntryRows(rows);
  }

  if (table === "goals") {
    return enrichGoalRows(rows);
  }

  return rows;
}

function normalizeInsertDocId(table: string, payload: Row): string {
  if (typeof payload.id === "string" && payload.id.length > 0) {
    return payload.id;
  }

  if (USER_SCOPED_SINGLE_DOC_TABLES.has(table) && typeof payload.user_id === "string") {
    return payload.user_id;
  }

  if (table === "trade_details" && typeof payload.entry_id === "string") {
    return payload.entry_id;
  }

  return randomUUID();
}

function normalizeSingleResult(rows: Row[]): QueryResult<Row> {
  if (rows.length === 0) {
    return {
      data: null,
      error: {
        code: "PGRST116",
        message: "No rows returned"
      }
    };
  }

  return {
    data: rows[0],
    error: null
  };
}

class FirestoreTableQuery {
  private readonly table: string;
  private mode: QueryMode = "select";
  private andFilters: FilterCondition[] = [];
  private orFilters: FilterCondition[] = [];
  private orderBy?: OrderConfig;
  private limitCount?: number;
  private expectSingle = false;
  private mutationPayload: Row[] = [];
  private upsertOptions: UpsertOptions = {};
  private executionPromise: Promise<QueryResult<any>> | null = null;

  constructor(table: string) {
    this.table = table;
  }

  select(_columns: string = "*") {
    return this;
  }

  insert(payload: Row | Row[]) {
    this.mode = "insert";
    this.mutationPayload = Array.isArray(payload) ? payload : [payload];
    return this;
  }

  update(payload: Row) {
    this.mode = "update";
    this.mutationPayload = [payload];
    return this;
  }

  upsert(payload: Row | Row[], options: UpsertOptions = {}) {
    this.mode = "upsert";
    this.mutationPayload = Array.isArray(payload) ? payload : [payload];
    this.upsertOptions = options;
    return this;
  }

  delete() {
    this.mode = "delete";
    return this;
  }

  eq(field: string, value: any) {
    this.andFilters.push({ field, operator: "eq", value });
    return this;
  }

  gte(field: string, value: any) {
    this.andFilters.push({ field, operator: "gte", value });
    return this;
  }

  lte(field: string, value: any) {
    this.andFilters.push({ field, operator: "lte", value });
    return this;
  }

  lt(field: string, value: any) {
    this.andFilters.push({ field, operator: "lt", value });
    return this;
  }

  gt(field: string, value: any) {
    this.andFilters.push({ field, operator: "gt", value });
    return this;
  }

  in(field: string, values: any[]) {
    this.andFilters.push({ field, operator: "in", value: values });
    return this;
  }

  or(expression: string) {
    this.orFilters = parseOrExpression(expression);
    return this;
  }

  order(field: string, options: { ascending?: boolean } = {}) {
    this.orderBy = {
      field,
      ascending: options.ascending !== false
    };
    return this;
  }

  limit(count: number) {
    this.limitCount = count;
    return this;
  }

  single() {
    this.expectSingle = true;
    return this.execute();
  }

  then<TResult1 = QueryResult<any>, TResult2 = never>(
    onfulfilled?: ((value: QueryResult<any>) => TResult1 | PromiseLike<TResult1>) | undefined | null,
    onrejected?: ((reason: any) => TResult2 | PromiseLike<TResult2>) | undefined | null
  ) {
    return this.execute().then(onfulfilled, onrejected);
  }

  catch<TResult = never>(
    onrejected?: ((reason: any) => TResult | PromiseLike<TResult>) | undefined | null
  ) {
    return this.execute().catch(onrejected);
  }

  finally(onfinally?: (() => void) | undefined | null) {
    return this.execute().finally(onfinally);
  }

  private execute() {
    if (!this.executionPromise) {
      this.executionPromise = this.run();
    }

    return this.executionPromise;
  }

  private async run(): Promise<QueryResult<any>> {
    try {
      if (this.mode === "insert") {
        return this.runInsert();
      }

      if (this.mode === "update") {
        return this.runUpdate();
      }

      if (this.mode === "upsert") {
        return this.runUpsert();
      }

      if (this.mode === "delete") {
        return this.runDelete();
      }

      return this.runSelect();
    } catch (error) {
      return {
        data: null,
        error: {
          message: error instanceof Error ? error.message : "Unknown database error"
        }
      };
    }
  }

  private async runSelect(): Promise<QueryResult<any>> {
    const rows = await readAllRows(this.table);
    const filtered = applyFilters(rows, this.andFilters, this.orFilters);
    const enriched = await enrichRows(this.table, filtered);
    const ordered = applyOrdering(enriched, this.orderBy);
    const limited = applyLimit(ordered, this.limitCount);

    if (this.expectSingle) {
      return normalizeSingleResult(limited);
    }

    return {
      data: limited,
      error: null
    };
  }

  private async runInsert(): Promise<QueryResult<any>> {
    const inserted: Row[] = [];

    for (const payload of this.mutationPayload) {
      const docId = normalizeInsertDocId(this.table, payload);
      const normalized = normalizeForWrite(this.table, payload, "insert");
      const next = { ...normalized };

      delete next.id;

      await getAdminDb().collection(this.table).doc(docId).set(next, { merge: false });
      inserted.push({ id: docId, ...next });
    }

    const enriched = await enrichRows(this.table, inserted);
    const ordered = applyOrdering(enriched, this.orderBy);
    const limited = applyLimit(ordered, this.limitCount);

    if (this.expectSingle) {
      return normalizeSingleResult(limited);
    }

    return {
      data: limited,
      error: null
    };
  }

  private async runUpdate(): Promise<QueryResult<any>> {
    const rows = await readAllRows(this.table);
    const filtered = applyFilters(rows, this.andFilters, this.orFilters);

    const payload = this.mutationPayload[0] ?? {};
    const normalizedPayload = normalizeForWrite(this.table, payload, "update");

    for (const row of filtered) {
      const next = { ...normalizedPayload };
      delete next.id;
      await getAdminDb().collection(this.table).doc(row.id).set(next, { merge: true });
    }

    const updated = filtered.map((row) => ({ ...row, ...normalizedPayload }));
    const enriched = await enrichRows(this.table, updated);
    const ordered = applyOrdering(enriched, this.orderBy);
    const limited = applyLimit(ordered, this.limitCount);

    if (this.expectSingle) {
      return normalizeSingleResult(limited);
    }

    return {
      data: limited,
      error: null
    };
  }

  private async runUpsert(): Promise<QueryResult<any>> {
    const existingRows = await readAllRows(this.table);
    const conflictFields = (this.upsertOptions.onConflict ?? "")
      .split(",")
      .map((field) => field.trim())
      .filter(Boolean);

    const upserted: Row[] = [];

    for (const payload of this.mutationPayload) {
      const normalizedPayload = normalizeForWrite(this.table, payload, "upsert");

      let docId =
        typeof payload.id === "string" && payload.id.length > 0
          ? payload.id
          : "";

      if (!docId && conflictFields.length > 0) {
        const matched = existingRows.find((row) =>
          conflictFields.every((field) => row[field] === payload[field])
        );

        if (matched) {
          docId = matched.id;
        }
      }

      if (!docId && USER_SCOPED_SINGLE_DOC_TABLES.has(this.table) && typeof payload.user_id === "string") {
        docId = payload.user_id;
      }

      if (!docId && this.table === "trade_details" && typeof payload.entry_id === "string") {
        docId = payload.entry_id;
      }

      if (!docId) {
        docId = randomUUID();
      }

      const next = { ...normalizedPayload };
      delete next.id;

      await getAdminDb().collection(this.table).doc(docId).set(next, { merge: true });
      upserted.push({ id: docId, ...next });
    }

    const filtered = applyFilters(upserted, this.andFilters, this.orFilters);
    const enriched = await enrichRows(this.table, filtered);
    const ordered = applyOrdering(enriched, this.orderBy);
    const limited = applyLimit(ordered, this.limitCount);

    if (this.expectSingle) {
      return normalizeSingleResult(limited);
    }

    return {
      data: limited,
      error: null
    };
  }

  private async runDelete(): Promise<QueryResult<any>> {
    const rows = await readAllRows(this.table);
    const filtered = applyFilters(rows, this.andFilters, this.orFilters);

    for (const row of filtered) {
      await getAdminDb().collection(this.table).doc(row.id).delete();
    }

    const ordered = applyOrdering(filtered, this.orderBy);
    const limited = applyLimit(ordered, this.limitCount);

    if (this.expectSingle) {
      return normalizeSingleResult(limited);
    }

    return {
      data: limited,
      error: null
    };
  }
}

export function createFirestoreDbClient() {
  return {
    from(table: string) {
      return new FirestoreTableQuery(table);
    }
  };
}

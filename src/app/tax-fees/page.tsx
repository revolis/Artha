import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { MaskedValue } from "@/components/masked-value";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { formatCurrency } from "@/lib/utils";

const rows = [
  { category: "Trading Fees", total: -620 },
  { category: "Exchange Fees", total: -310 },
  { category: "Taxes", total: -960 }
];

export default function TaxFeesPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Tax & Fees" description="Dedicated reporting for tax and fee totals." />

      <div className="grid gap-6 lg:grid-cols-[1.5fr_1fr]">
        <Card>
          <CardHeader>
            <CardTitle>Summary totals</CardTitle>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Category</TableHead>
                  <TableHead>Total</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {rows.map((row) => (
                  <TableRow key={row.category}>
                    <TableCell>{row.category}</TableCell>
                    <TableCell>
                      <MaskedValue value={formatCurrency(row.total)} />
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <p className="text-sm text-mutedForeground">
              Generate CSV/JSON exports for tax filing and fee audits.
            </p>
            <div className="flex flex-col gap-2">
              <button className="rounded-full border border-border px-4 py-2 text-sm">Export CSV</button>
              <button className="rounded-full border border-border px-4 py-2 text-sm">Export JSON</button>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";

import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { DrivePicker } from "@/components/drive-picker";
import { ConfirmDialog } from "@/components/confirm-dialog";

const entryTypes = [
  { value: "profit", label: "Profit" },
  { value: "loss", label: "Loss" },
  { value: "fee", label: "Fee" },
  { value: "tax", label: "Tax" },
  { value: "transfer", label: "Transfer" }
];

type CategoryOption = { id: string; name: string; type: string };

type SourceOption = { id: string; platform: string };
type TagOption = { id: string; name: string };
type AttachmentItem = {
  id: string;
  file_name: string;
  mime_type: string;
  drive_view_link: string | null;
  created_at: string;
};

type EntryPayload = {
  entry_date: string;
  entry_type: string;
  category_id: string;
  source_id: string | null;
  amount_usd_base: number | string;
  fx_rate_used: number | string | null;
  notes: string | null;
  entry_tags?: { tag_id: string }[];
};

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.entryId as string;

  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [sources, setSources] = React.useState<SourceOption[]>([]);
  const [tags, setTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [entryDate, setEntryDate] = React.useState("");
  const [entryType, setEntryType] = React.useState("profit");
  const [categoryId, setCategoryId] = React.useState("");
  const [sourceId, setSourceId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [fxRate, setFxRate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(true);
  const [saving, setSaving] = React.useState(false);
  const [deletingEntry, setDeletingEntry] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [driveConnected, setDriveConnected] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [deleteEntryOpen, setDeleteEntryOpen] = React.useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = React.useState<AttachmentItem | null>(null);
  const [deletingAttachment, setDeletingAttachment] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/sources", { cache: "no-store" }),
      fetch("/api/tags", { cache: "no-store" }),
      fetch(`/api/entries/${entryId}`, { cache: "no-store" }),
      fetch(`/api/entries/${entryId}/attachments`, { cache: "no-store" }),
      fetch("/api/drive/status", { cache: "no-store" })
    ])
      .then(async ([categoriesResponse, sourcesResponse, tagsResponse, entryResponse, attachmentsResponse, driveResponse]) => {
        if (!entryResponse.ok) {
          throw new Error("Failed to load entry");
        }
        const categoriesPayload = await categoriesResponse.json();
        const sourcesPayload = await sourcesResponse.json();
        const tagsPayload = await tagsResponse.json();
        const entryPayload = await entryResponse.json();
        const attachmentsPayload = attachmentsResponse.ok
          ? await attachmentsResponse.json()
          : { attachments: [] };
        const drivePayload = driveResponse.ok ? await driveResponse.json() : { connected: false };

        if (!active) return;
        setCategories(categoriesPayload.categories ?? []);
        setSources(sourcesPayload.sources ?? []);
        setTags(tagsPayload.tags ?? []);
        setAttachments(attachmentsPayload.attachments ?? []);
        setDriveConnected(Boolean(drivePayload.connected));

        const entry = entryPayload.entry as EntryPayload;
        if (entry) {
          setEntryDate(entry.entry_date.slice(0, 16));
          setEntryType(entry.entry_type);
          setCategoryId(entry.category_id);
          setSourceId(entry.source_id ?? null);
          setAmount(String(entry.amount_usd_base ?? ""));
          setFxRate(entry.fx_rate_used ? String(entry.fx_rate_used) : "");
          setNotes(entry.notes ?? "");
          setSelectedTags(entry.entry_tags?.map((tag) => tag.tag_id) ?? []);
        }
        setLoading(false);
      })
      .catch(() => {
        if (!active) return;
        setError("Failed to load entry");
        setLoading(false);
      });

    return () => {
      active = false;
    };
  }, [entryId]);

  const handleUpdate = async () => {
    setSaving(true);
    setError(null);

    try {
      if (!categoryId) {
        setError("Select a category.");
        setSaving(false);
        return;
      }

      const response = await fetch(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          entry_date: entryDate,
          entry_type: entryType,
          category_id: categoryId,
          source_id: sourceId || null,
          amount_usd_base: Number(amount),
          fx_rate_used: fxRate ? Number(fxRate) : null,
          notes,
          tag_ids: selectedTags
        })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to update entry");
      }

      router.replace("/entries");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to update entry");
    } finally {
      setSaving(false);
    }
  };

  const handleDelete = async () => {
    setDeletingEntry(true);
    setError(null);

    try {
      const response = await fetch(`/api/entries/${entryId}`, { method: "DELETE" });
      if (response.ok) {
        router.replace("/entries");
        router.refresh();
        return;
      }
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to delete entry");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete entry");
    } finally {
      setDeletingEntry(false);
    }
  };

  const handleDriveConnect = async () => {
    const response = await fetch("/api/drive/auth", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.url) {
      window.location.href = payload.url as string;
    }
  };

  const handleUpload = async (file: File) => {
    setUploading(true);
    setError(null);

    try {
      const formData = new FormData();
      formData.append("entry_id", entryId);
      formData.append("file", file);

      const response = await fetch("/api/drive/upload", {
        method: "POST",
        body: formData
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Upload failed");
      }

      const payload = await response.json();
      setAttachments((prev) => [payload.attachment, ...prev]);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleAttachmentDelete = async (attachmentId: string) => {
    setDeletingAttachment(true);
    setError(null);
    try {
      const response = await fetch(`/api/entries/${entryId}/attachments/${attachmentId}`, {
        method: "DELETE"
      });
      if (response.ok) {
        setAttachments((prev) => prev.filter((item) => item.id !== attachmentId));
        setAttachmentToDelete(null);
        return;
      }
      const payload = await response.json().catch(() => ({}));
      throw new Error(payload.error || "Failed to delete attachment");
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to delete attachment");
    } finally {
      setDeletingAttachment(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit Entry"
        description="Update a profit, loss, fee, tax, or transfer entry."
        actions={
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={() => setDeleteEntryOpen(true)}>
              Delete
            </Button>
            <Button onClick={handleUpdate} disabled={saving || loading}>
              {saving ? "Updating..." : "Update Entry"}
            </Button>
          </div>
        }
      />

      {loading ? (
        <p className="text-sm text-mutedForeground">Loading entry...</p>
      ) : error ? (
        <div className="rounded-3xl border border-border bg-card p-6 text-sm text-negative">
          {error}
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[2fr_1fr]">
          <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="date">Date & Time</Label>
                <Input
                  id="date"
                  type="datetime-local"
                  value={entryDate}
                  onChange={(event) => setEntryDate(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="type">Entry Type</Label>
                <Select value={entryType} onValueChange={setEntryType}>
                  <SelectTrigger id="type">
                    <SelectValue placeholder="Select type" />
                  </SelectTrigger>
                  <SelectContent>
                    {entryTypes.map((type) => (
                      <SelectItem key={type.value} value={type.value}>
                        {type.label}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="category">Category</Label>
                <Select value={categoryId} onValueChange={setCategoryId}>
                  <SelectTrigger id="category">
                    <SelectValue placeholder="Select category" />
                  </SelectTrigger>
                  <SelectContent>
                    {categories.map((category) => (
                      <SelectItem key={category.id} value={category.id}>
                        {category.name}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="space-y-2">
                <Label htmlFor="source">Source</Label>
                <Select
                  value={sourceId ?? "none"}
                  onValueChange={(value) => setSourceId(value === "none" ? null : value)}
                >
                  <SelectTrigger id="source">
                    <SelectValue placeholder="Select source" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="none">No source</SelectItem>
                    {sources.map((source) => (
                      <SelectItem key={source.id} value={source.id}>
                        {source.platform}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="amount">Amount (USD base)</Label>
                <Input
                  id="amount"
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  value={amount}
                  onChange={(event) => setAmount(event.target.value)}
                  required
                />
              </div>
              <div className="space-y-2">
                <Label htmlFor="fx">Manual FX (USD/NPR)</Label>
                <Input
                  id="fx"
                  type="number"
                  step="0.0001"
                  placeholder="134.00"
                  value={fxRate}
                  onChange={(event) => setFxRate(event.target.value)}
                />
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="notes">Notes</Label>
              <Textarea
                id="notes"
                placeholder="Add context, setup, or outcome..."
                value={notes}
                onChange={(event) => setNotes(event.target.value)}
              />
            </div>

            <div className="space-y-2">
              <Label>Tags</Label>
              <div className="flex flex-wrap gap-2">
                {tags.length === 0 ? (
                  <span className="text-sm text-mutedForeground">No tags yet.</span>
                ) : (
                  tags.map((tag) => {
                    const selected = selectedTags.includes(tag.id);
                    return (
                      <button
                        key={tag.id}
                        type="button"
                        className={`rounded-full border px-3 py-1 text-xs ${
                          selected
                            ? "border-accent bg-accent text-accentForeground"
                            : "border-border text-mutedForeground"
                        }`}
                        onClick={() =>
                          setSelectedTags((prev) =>
                            prev.includes(tag.id)
                              ? prev.filter((id) => id !== tag.id)
                              : [...prev, tag.id]
                          )
                        }
                      >
                        {tag.name}
                      </button>
                    );
                  })
                )}
              </div>
            </div>

            {error ? <p className="text-sm text-negative">{error}</p> : null}
          </div>

          <div className="space-y-6">
            <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
              <h3 className="text-lg font-semibold">Attachments</h3>
              <p className="text-sm text-mutedForeground">
                Upload originals to Google Drive (Drive file IDs stored).
              </p>
              {driveConnected ? (
                <div className="space-y-3">
                  <div className="flex flex-wrap gap-2">
                    <DrivePicker
                      entryId={entryId}
                      onAttached={(items) => setAttachments((prev) => [...items, ...prev])}
                      onError={(message) => setError(message)}
                    />
                    <Input
                      type="file"
                      onChange={(event) => {
                        const file = event.target.files?.[0];
                        if (file) handleUpload(file);
                      }}
                      disabled={uploading}
                    />
                  </div>
                  <p className="text-xs text-mutedForeground">
                    {uploading ? "Uploading..." : "Pick existing files or upload new ones."}
                  </p>
                </div>
              ) : (
                <Button type="button" variant="outline" onClick={handleDriveConnect}>
                  Connect Google Drive
                </Button>
              )}

              {attachments.length > 0 ? (
                <div className="space-y-2">
                  {attachments.map((attachment) => (
                    <div
                      key={attachment.id}
                      className="flex items-center justify-between rounded-2xl border border-border px-3 py-2 text-sm"
                    >
                      {attachment.drive_view_link ? (
                        <a
                          href={attachment.drive_view_link}
                          target="_blank"
                          rel="noreferrer"
                          className="truncate"
                        >
                          {attachment.file_name}
                        </a>
                      ) : (
                        <span className="truncate">{attachment.file_name}</span>
                      )}
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setAttachmentToDelete(attachment)}
                      >
                        Remove
                      </Button>
                    </div>
                  ))}
                </div>
              ) : null}
            </div>
          </div>
        </div>
      )}

      <ConfirmDialog
        open={deleteEntryOpen}
        onOpenChange={setDeleteEntryOpen}
        title="Delete entry?"
        description="This permanently deletes the entry and its attachments."
        confirmLabel="Delete entry"
        onConfirm={handleDelete}
        loading={deletingEntry}
        destructive
      />

      <ConfirmDialog
        open={Boolean(attachmentToDelete)}
        onOpenChange={(open) => {
          if (!open) setAttachmentToDelete(null);
        }}
        title="Remove attachment?"
        description={attachmentToDelete?.file_name}
        confirmLabel="Remove attachment"
        onConfirm={() => {
          if (attachmentToDelete) {
            handleAttachmentDelete(attachmentToDelete.id);
          }
        }}
        loading={deletingAttachment}
        destructive
      />
    </div>
  );
}

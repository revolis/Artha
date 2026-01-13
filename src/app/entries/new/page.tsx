"use client";

import * as React from "react";
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

function getLocalDateTime() {
  const now = new Date();
  const offset = now.getTimezoneOffset();
  const local = new Date(now.getTime() - offset * 60 * 1000);
  return local.toISOString().slice(0, 16);
}

export default function NewEntryPage() {
  const [categories, setCategories] = React.useState<CategoryOption[]>([]);
  const [sources, setSources] = React.useState<SourceOption[]>([]);
  const [tags, setTags] = React.useState<TagOption[]>([]);
  const [selectedTags, setSelectedTags] = React.useState<string[]>([]);
  const [newTagName, setNewTagName] = React.useState("");
  const [tagError, setTagError] = React.useState<string | null>(null);
  const [creatingTag, setCreatingTag] = React.useState(false);
  const [entryId, setEntryId] = React.useState<string | null>(null);
  const [attachments, setAttachments] = React.useState<AttachmentItem[]>([]);
  const [entryDate, setEntryDate] = React.useState(getLocalDateTime());
  const [entryType, setEntryType] = React.useState("profit");
  const [categoryId, setCategoryId] = React.useState("");
  const [sourceId, setSourceId] = React.useState<string | null>(null);
  const [amount, setAmount] = React.useState("");
  const [fxRate, setFxRate] = React.useState("");
  const [notes, setNotes] = React.useState("");
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);
  const [driveConnected, setDriveConnected] = React.useState(false);
  const [uploading, setUploading] = React.useState(false);
  const [attachmentToDelete, setAttachmentToDelete] = React.useState<AttachmentItem | null>(null);
  const [deletingAttachment, setDeletingAttachment] = React.useState(false);

  React.useEffect(() => {
    let active = true;

    Promise.all([
      fetch("/api/categories", { cache: "no-store" }),
      fetch("/api/sources", { cache: "no-store" }),
      fetch("/api/tags", { cache: "no-store" })
    ])
      .then(async ([categoriesResponse, sourcesResponse, tagsResponse]) => {
        const categoriesPayload = await categoriesResponse.json();
        const sourcesPayload = await sourcesResponse.json();
        const tagsPayload = await tagsResponse.json();
        if (!active) return;
        const loadedCategories = categoriesPayload.categories ?? [];
        setCategories(loadedCategories);
        if (loadedCategories.length > 0) {
          setCategoryId((prev) => prev || loadedCategories[0].id);
        }
        setSources(sourcesPayload.sources ?? []);
        setTags(tagsPayload.tags ?? []);
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    let active = true;
    fetch("/api/drive/status", { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { connected: false };
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setDriveConnected(Boolean(payload.connected));
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, []);

  React.useEffect(() => {
    if (!entryId) return;
    let active = true;
    fetch(`/api/entries/${entryId}/attachments`, { cache: "no-store" })
      .then(async (response) => {
        if (!response.ok) return { attachments: [] };
        return response.json();
      })
      .then((payload) => {
        if (!active) return;
        setAttachments(payload.attachments ?? []);
      })
      .catch(() => {
        if (!active) return;
      });

    return () => {
      active = false;
    };
  }, [entryId]);

  const handleDriveConnect = async () => {
    const response = await fetch("/api/drive/auth", { cache: "no-store" });
    if (!response.ok) return;
    const payload = await response.json();
    if (payload.url) {
      window.location.href = payload.url as string;
    }
  };

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setLoading(true);
    setError(null);

    try {
      if (!categoryId) {
        setError("Select a category.");
        setLoading(false);
        return;
      }

      const response = await fetch("/api/entries", {
        method: "POST",
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
        throw new Error(payload.error || "Failed to create entry");
      }

      const payload = await response.json();
      setEntryId(payload.entry?.id ?? null);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
    } finally {
      setLoading(false);
    }
  };

  const handleCreateTag = async () => {
    if (!newTagName.trim()) {
      setTagError("Tag name is required.");
      return;
    }

    setCreatingTag(true);
    setTagError(null);
    try {
      const response = await fetch("/api/tags", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name: newTagName.trim() })
      });

      if (!response.ok) {
        const payload = await response.json().catch(() => ({}));
        throw new Error(payload.error || "Failed to create tag");
      }

      const payload = await response.json();
      const created = payload.tag as TagOption;
      if (created?.id) {
        setTags((prev) => {
          const next = [...prev, created];
          return next.sort((a, b) => a.name.localeCompare(b.name));
        });
        setSelectedTags((prev) => (prev.includes(created.id) ? prev : [...prev, created.id]));
        setNewTagName("");
      }
    } catch (err) {
      setTagError(err instanceof Error ? err.message : "Failed to create tag");
    } finally {
      setCreatingTag(false);
    }
  };

  const handleUpload = async (file: File) => {
    if (!entryId) return;
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
    if (!entryId) return;
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
        title="New Entry"
        description="Log a profit, loss, fee, tax, or transfer with full detail."
        actions={
          <Button type="submit" form="entry-form" disabled={loading}>
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        }
      />

      <form id="entry-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
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
              <Select value={sourceId ?? "none"} onValueChange={(value) => setSourceId(value === "none" ? null : value)}>
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
            <div className="flex flex-col gap-2 sm:flex-row">
            <Input
              placeholder="Create new tag"
              value={newTagName}
              onChange={(event) => {
                setNewTagName(event.target.value);
                if (tagError) setTagError(null);
              }}
              onKeyDown={(event) => {
                if (event.key === "Enter") {
                  event.preventDefault();
                  handleCreateTag();
                }
              }}
            />
              <Button type="button" variant="outline" onClick={handleCreateTag} disabled={creatingTag}>
                {creatingTag ? "Adding..." : "Add Tag"}
              </Button>
            </div>
            {tagError ? <p className="text-xs text-negative">{tagError}</p> : null}
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
              entryId ? (
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
                <p className="text-sm text-mutedForeground">
                  Drive connected. Save the entry to enable uploads.
                </p>
              )
            ) : (
              <Button type="button" variant="outline" onClick={handleDriveConnect}>
                Connect Google Drive
              </Button>
            )}

            {entryId && attachments.length > 0 ? (
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
            ) : entryId ? (
              <p className="text-sm text-mutedForeground">No attachments yet.</p>
            ) : null}
          </div>
        </div>
      </form>

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

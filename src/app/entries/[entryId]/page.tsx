"use client";

import * as React from "react";
import { useParams, useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/supabase/browser";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EntryForm, EntryFormData } from "@/components/entry-form";
import { ConfirmDialog } from "@/components/confirm-dialog";

export default function EditEntryPage() {
  const router = useRouter();
  const params = useParams();
  const entryId = params.entryId as string;

  const [initialData, setInitialData] = React.useState<any>(null);
  const [loading, setLoading] = React.useState(true);
  const [submitting, setSubmitting] = React.useState(false);
  const [deleting, setDeleting] = React.useState(false);
  const [deleteOpen, setDeleteOpen] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  React.useEffect(() => {
    let active = true;
    Promise.all([
      fetchWithAuth(`/api/entries/${entryId}`),
      fetchWithAuth(`/api/entries/${entryId}/attachments`)
    ]).then(async ([entryRes, attachRes]) => {
      if (!entryRes.ok) throw new Error("Entry not found");
      const entryPayload = await entryRes.json();
      const attachPayload = attachRes.ok ? await attachRes.json() : { attachments: [] };

      if (!active) return;
      setInitialData({
        ...entryPayload.entry,
        tag_ids: entryPayload.entry.entry_tags?.map((t: any) => t.tag_id) || [],
        attachments: attachPayload.attachments || []
      });
      setLoading(false);
    }).catch(err => {
      if (!active) return;
      setError("Failed to load entry");
      setLoading(false);
    });
    return () => { active = false; };
  }, [entryId]);

  const handleSubmit = async (data: EntryFormData) => {
    setSubmitting(true);
    try {
      const res = await fetchWithAuth(`/api/entries/${entryId}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });
      if (!res.ok) throw new Error("Update failed");
      router.push("/entries");
      router.refresh();
    } catch (e) {
      setError("Update failed");
      setSubmitting(false);
    }
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      await fetchWithAuth(`/api/entries/${entryId}`, { method: "DELETE" });
      router.replace("/entries");
      router.refresh();
    } catch (e) {
      setError("Delete failed");
      setDeleting(false);
    }
  };

  if (loading) return <div className="p-8">Loading...</div>;
  if (!initialData) return <div className="p-8">Entry not found</div>;

  return (
    <div className="space-y-8">
      <PageHeader
        title="Edit Entry"
        description="Update or remove this transaction."
        actions={
          <div className="flex gap-2">
            <Button variant="outline" onClick={() => setDeleteOpen(true)}>Delete</Button>
            <Button type="submit" form="entry-form" disabled={submitting}>
              {submitting ? "Saving..." : "Update Entry"}
            </Button>
          </div>
        }
      />

      {error && <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>}

      <EntryForm
        initialData={initialData}
        onSubmit={handleSubmit}
        isSubmitting={submitting}
      />

      <ConfirmDialog
        open={deleteOpen}
        onOpenChange={setDeleteOpen}
        title="Delete entry?"
        description="Permanently delete this entry and its attachments."
        onConfirm={handleDelete}
        loading={deleting}
        destructive
      />
    </div>
  );
}

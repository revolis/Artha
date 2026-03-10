"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { fetchWithAuth } from "@/lib/supabase/browser";
import { PageHeader } from "@/components/page-header";
import { Button } from "@/components/ui/button";
import { EntryForm, EntryFormData } from "@/components/entry-form";

export default function NewEntryPage() {
  const router = useRouter();
  const [loading, setLoading] = React.useState(false);
  const [error, setError] = React.useState<string | null>(null);

  const handleSubmit = async (data: EntryFormData) => {
    setLoading(true);
    setError(null);
    try {
      const response = await fetchWithAuth("/api/entries", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data)
      });

      if (!response.ok) {
        throw new Error("Failed to create entry");
      }

      const payload = await response.json();
      // Redirect to edit page to allow adding attachments immediately after
      if (payload.entry?.id) {
        router.replace(`/entries/${payload.entry.id}`);
      } else {
        router.push("/entries");
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to create entry");
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8">
      <PageHeader
        title="New Entry"
        description="Log a profit, loss, fee, tax, or transfer."
        actions={
          <Button type="submit" form="entry-form" disabled={loading}>
            {loading ? "Saving..." : "Save Entry"}
          </Button>
        }
      />

      {error && <div className="p-4 rounded-md bg-destructive/10 text-destructive">{error}</div>}

      <EntryForm onSubmit={handleSubmit} isSubmitting={loading} />
    </div>
  );
}

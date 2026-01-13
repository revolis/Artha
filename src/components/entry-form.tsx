"use client";

import * as React from "react";
import { useRouter } from "next/navigation";
import { format } from "date-fns";

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

export type EntryFormData = {
    entry_date: string;
    entry_type: string;
    category_id: string;
    source_id: string | null;
    amount_usd_base: number;
    fx_rate_used: number | null;
    notes: string | null;
    tag_ids: string[];
};

type EntryFormProps = {
    initialData?: Partial<EntryFormData> & { id?: string; attachments?: AttachmentItem[] };
    onSubmit: (data: EntryFormData) => Promise<void>;
    onDelete?: () => Promise<void>;
    isSubmitting?: boolean;
    isDeleting?: boolean;
};

function getLocalDateTime(dateString?: string) {
    const date = dateString ? new Date(dateString) : new Date();
    const offset = date.getTimezoneOffset();
    const local = new Date(date.getTime() - offset * 60 * 1000);
    return local.toISOString().slice(0, 16);
}

export function EntryForm({ initialData, onSubmit, onDelete, isSubmitting, isDeleting }: EntryFormProps) {
    const router = useRouter();

    // Data State
    const [categories, setCategories] = React.useState<CategoryOption[]>([]);
    const [sources, setSources] = React.useState<SourceOption[]>([]);
    const [tags, setTags] = React.useState<TagOption[]>([]);

    // Form State
    const [entryDate, setEntryDate] = React.useState(getLocalDateTime(initialData?.entry_date));
    const [entryType, setEntryType] = React.useState(initialData?.entry_type || "profit");
    const [categoryId, setCategoryId] = React.useState(initialData?.category_id || "");
    const [sourceId, setSourceId] = React.useState<string | null>(initialData?.source_id || null);
    const [amount, setAmount] = React.useState(initialData?.amount_usd_base ? String(initialData.amount_usd_base) : "");
    const [fxRate, setFxRate] = React.useState(initialData?.fx_rate_used ? String(initialData.fx_rate_used) : "");
    const [notes, setNotes] = React.useState(initialData?.notes || "");
    const [selectedTags, setSelectedTags] = React.useState<string[]>(initialData?.tag_ids || []);

    // Tag Creation
    const [newTagName, setNewTagName] = React.useState("");
    const [tagError, setTagError] = React.useState<string | null>(null);
    const [creatingTag, setCreatingTag] = React.useState(false);

    // Attachments State
    const [attachments, setAttachments] = React.useState<AttachmentItem[]>(initialData?.attachments || []);
    const [driveConnected, setDriveConnected] = React.useState(false);
    const [uploading, setUploading] = React.useState(false);
    const [attachmentToDelete, setAttachmentToDelete] = React.useState<AttachmentItem | null>(null);
    const [deletingAttachment, setDeletingAttachment] = React.useState(false);
    const [error, setError] = React.useState<string | null>(null);

    // Load Metadata
    React.useEffect(() => {
        let active = true;

        Promise.all([
            fetch("/api/categories").then(res => res.json()),
            fetch("/api/sources").then(res => res.json()),
            fetch("/api/tags").then(res => res.json()),
            fetch("/api/drive/status").then(res => res.ok ? res.json() : { connected: false })
        ]).then(([catData, srcData, tagData, driveData]) => {
            if (!active) return;
            setCategories(catData.categories ?? []);
            setSources(srcData.sources ?? []);
            setTags(tagData.tags ?? []);
            setDriveConnected(Boolean(driveData.connected));

            // Default category if new
            if (!initialData?.category_id && catData.categories?.length > 0) {
                setCategoryId(catData.categories[0].id);
            }
        }).catch(console.error);

        return () => { active = false; };
    }, []);

    // Update attachments if initialData changes (e.g. after fetch in parent)
    React.useEffect(() => {
        if (initialData?.attachments) {
            setAttachments(initialData.attachments);
        }
    }, [initialData?.attachments]);


    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!categoryId) {
            setError("Category is required");
            return;
        }
        await onSubmit({
            entry_date: entryDate,
            entry_type: entryType,
            category_id: categoryId,
            source_id: sourceId,
            amount_usd_base: Number(amount),
            fx_rate_used: fxRate ? Number(fxRate) : null,
            notes,
            tag_ids: selectedTags
        });
    };

    const handleCreateTag = async () => {
        if (!newTagName.trim()) return;
        setCreatingTag(true);
        setTagError(null);
        try {
            const res = await fetch("/api/tags", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ name: newTagName.trim() })
            });
            if (!res.ok) throw new Error("Failed");
            const { tag } = await res.json();
            setTags(prev => [...prev, tag].sort((a, b) => a.name.localeCompare(b.name)));
            setSelectedTags(prev => [...prev, tag.id]);
            setNewTagName("");
        } catch (e) {
            setTagError("Failed to create tag");
        } finally {
            setCreatingTag(false);
        }
    };

    const handleUpload = async (file: File) => {
        if (!initialData?.id) return; // Must save entry first
        setUploading(true);
        try {
            const formData = new FormData();
            formData.append("entry_id", initialData.id);
            formData.append("file", file);
            const res = await fetch("/api/drive/upload", { method: "POST", body: formData });
            if (!res.ok) throw new Error("Upload failed");
            const { attachment } = await res.json();
            setAttachments(prev => [attachment, ...prev]);
        } catch (e) {
            setError("Upload failed");
        } finally {
            setUploading(false);
        }
    };

    const handleDeleteAttachment = async () => {
        if (!attachmentToDelete || !initialData?.id) return;
        setDeletingAttachment(true);
        try {
            const res = await fetch(`/api/entries/${initialData.id}/attachments/${attachmentToDelete.id}`, { method: "DELETE" });
            if (!res.ok) throw new Error("Delete failed");
            setAttachments(prev => prev.filter(a => a.id !== attachmentToDelete.id));
            setAttachmentToDelete(null);
        } catch (e) {
            setError("Failed to delete attachment");
        } finally {
            setDeletingAttachment(false);
        }
    };

    return (
        <form id="entry-form" onSubmit={handleSubmit} className="grid gap-6 lg:grid-cols-[2fr_1fr]">
            <div className="space-y-6 rounded-3xl border border-border bg-card p-6 shadow-soft">
                {/* Core Fields */}
                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="date">Date & Time</Label>
                        <Input type="datetime-local" id="date" value={entryDate} onChange={e => setEntryDate(e.target.value)} required />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="type">Type</Label>
                        <Select value={entryType} onValueChange={setEntryType}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                {entryTypes.map(t => <SelectItem key={t.value} value={t.value}>{t.label}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="category">Category</Label>
                        <Select value={categoryId} onValueChange={setCategoryId}>
                            <SelectTrigger><SelectValue placeholder="Select..." /></SelectTrigger>
                            <SelectContent>
                                {categories.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="source">Source</Label>
                        <Select value={sourceId ?? "none"} onValueChange={v => setSourceId(v === "none" ? null : v)}>
                            <SelectTrigger><SelectValue placeholder="No source" /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="none">No source</SelectItem>
                                {sources.map(s => <SelectItem key={s.id} value={s.id}>{s.platform}</SelectItem>)}
                            </SelectContent>
                        </Select>
                    </div>
                </div>

                <div className="grid gap-4 md:grid-cols-2">
                    <div className="space-y-2">
                        <Label htmlFor="amount">Amount (USD)</Label>
                        <Input type="number" step="0.01" value={amount} onChange={e => setAmount(e.target.value)} required placeholder="0.00" />
                    </div>
                    <div className="space-y-2">
                        <Label htmlFor="fx">Manual FX</Label>
                        <Input type="number" step="0.0001" value={fxRate} onChange={e => setFxRate(e.target.value)} placeholder="e.g. 135.0" />
                    </div>
                </div>

                <div className="space-y-2">
                    <Label htmlFor="notes">Notes</Label>
                    <Textarea id="notes" value={notes} onChange={e => setNotes(e.target.value)} placeholder="Context..." />
                </div>

                {/* Tags */}
                <div className="space-y-2">
                    <Label>Tags</Label>
                    <div className="flex flex-wrap gap-2 mb-2">
                        {tags.map(tag => (
                            <button
                                key={tag.id}
                                type="button"
                                onClick={() => setSelectedTags(p => p.includes(tag.id) ? p.filter(t => t !== tag.id) : [...p, tag.id])}
                                className={`rounded-full border px-3 py-1 text-xs ${selectedTags.includes(tag.id) ? "bg-primary text-primary-foreground border-primary" : "bg-background"}`}
                            >
                                {tag.name}
                            </button>
                        ))}
                    </div>
                    <div className="flex gap-2">
                        <Input value={newTagName} onChange={e => setNewTagName(e.target.value)} placeholder="New tag..." className="max-w-[200px]"
                            onKeyDown={e => e.key === "Enter" && (e.preventDefault(), handleCreateTag())} />
                        <Button type="button" variant="ghost" onClick={handleCreateTag} disabled={creatingTag}>Add</Button>
                    </div>
                    {tagError && <p className="text-destructive text-xs">{tagError}</p>}
                </div>

                {error && <p className="text-destructive text-sm">{error}</p>}
            </div>

            {/* Attachments Sidebar */}
            <div className="space-y-6">
                <div className="space-y-4 rounded-3xl border border-border bg-card p-6 shadow-soft">
                    <h3 className="text-lg font-semibold">Attachments</h3>
                    {!driveConnected ? (
                        <Button type="button" variant="outline" onClick={async () => {
                            const res = await fetch("/api/drive/auth");
                            if (res.ok) window.location.href = (await res.json()).url;
                        }}>Connect Drive</Button>
                    ) : initialData?.id ? (
                        <div className="space-y-4">
                            <div className="flex flex-wrap gap-2">
                                <DrivePicker entryId={initialData.id} onAttached={files => setAttachments(p => [...files, ...p])} onError={setError} />
                                <Input type="file" onChange={e => e.target.files?.[0] && handleUpload(e.target.files[0])} disabled={uploading} className="w-[200px]" />
                            </div>

                            <div className="space-y-2">
                                {attachments.map(att => (
                                    <div key={att.id} className="flex items-center justify-between rounded-md border p-2 text-sm">
                                        <a href={att.drive_view_link || "#"} target="_blank" rel="noreferrer" className="truncate hover:underline max-w-[150px]">{att.file_name}</a>
                                        <Button type="button" variant="ghost" size="sm" onClick={() => setAttachmentToDelete(att)}>×</Button>
                                    </div>
                                ))}
                            </div>
                        </div>
                    ) : (
                        <p className="text-muted-foreground text-sm">Save entry to add files.</p>
                    )}
                </div>
            </div>

            <ConfirmDialog
                open={!!attachmentToDelete}
                onOpenChange={o => !o && setAttachmentToDelete(null)}
                title="Delete attachment?"
                description="This will delete the file from Drive."
                onConfirm={handleDeleteAttachment}
                loading={deletingAttachment}
                destructive
            />
        </form>
    );
}

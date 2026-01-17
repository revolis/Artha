"use client";

import * as React from "react";
import { format } from "date-fns";
import { fetchWithAuth } from "@/lib/supabase/browser";
import {
    Download,
    Share2,
    Trash2,
    FileText,
    Check,
    Copy,
    Loader2,
    Globe
} from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { ConfirmDialog } from "@/components/confirm-dialog";
import {
    Dialog,
    DialogContent,
    DialogHeader,
    DialogTitle,
    DialogDescription
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

type Report = {
    id: string;
    created_at: string;
    range_start: string;
    range_end: string;
    report_type: string;
    export_format: string;
    share_enabled: boolean;
    share_token: string | null;
};

type ReportListProps = {
    reports: Report[];
    loading: boolean;
    onRefresh: () => void;
};

export function ReportList({ reports, loading, onRefresh }: ReportListProps) {
    const [deleteId, setDeleteId] = React.useState<string | null>(null);
    const [deleting, setDeleting] = React.useState(false);
    const [shareDialogReport, setShareDialogReport] = React.useState<Report | null>(null);

    const handleDelete = async () => {
        if (!deleteId) return;
        setDeleting(true);
        try {
            await fetchWithAuth(`/api/reports/${deleteId}`, { method: "DELETE" });
            onRefresh();
        } catch (err) {
            console.error(err);
        } finally {
            setDeleting(false);
            setDeleteId(null);
        }
    };

    const toggleShare = async (report: Report, enabled: boolean) => {
        // If enabling, optimistically update UI or handle loading?
        // Let's do a quick local update + fetch
        try {
            const res = await fetchWithAuth(`/api/reports/${report.id}`, {
                method: 'PATCH',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ share_enabled: enabled })
            });
            if (res.ok) {
                onRefresh();
                if (enabled) {
                    // If enabling, maybe auto-open share dialog once updated?
                    // For now just refresh list.
                    // We need the new token if enabled.
                    const data = await res.json();
                    setShareDialogReport(data.report);
                }
            }
        } catch (err) {
            console.error("Failed to share", err);
        }
    };

    if (loading && reports.length === 0) {
        return <div className="p-8 text-center text-mutedForeground">Loading reports...</div>;
    }

    if (reports.length === 0) {
        return (
            <div className="flex flex-col items-center justify-center py-12 text-center text-mutedForeground border-2 border-dashed rounded-xl">
                <FileText className="w-12 h-12 mb-4 opacity-50" />
                <h3 className="text-lg font-medium text-foreground">No reports generated</h3>
                <p className="max-w-sm mt-1">
                    Create regular summaries of your financial activity to track your progress.
                </p>
            </div>
        );
    }

    return (
        <>
            <div className="border rounded-xl bg-card overflow-hidden">
                <Table>
                    <TableHeader>
                        <TableRow>
                            <TableHead>Date Generated</TableHead>
                            <TableHead>Type</TableHead>
                            <TableHead>Range</TableHead>
                            <TableHead>Format</TableHead>
                            <TableHead className="text-right">Actions</TableHead>
                        </TableRow>
                    </TableHeader>
                    <TableBody>
                        {reports.map((report) => (
                            <TableRow key={report.id}>
                                <TableCell className="font-medium">
                                    {format(new Date(report.created_at), "MMM d, yyyy")}
                                </TableCell>
                                <TableCell className="capitalize">
                                    {report.report_type.replace('_', ' ')}
                                </TableCell>
                                <TableCell className="text-sm text-mutedForeground">
                                    {report.range_start} <span className="mx-1">→</span> {report.range_end}
                                </TableCell>
                                <TableCell>
                                    <Badge variant="default" className="uppercase text-[10px]">
                                        {report.export_format}
                                    </Badge>
                                </TableCell>
                                <TableCell className="text-right">
                                    <div className="flex items-center justify-end gap-2">
                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className={report.share_enabled ? "text-primary bg-primary/10" : "text-mutedForeground"}
                                            onClick={() => {
                                                if (report.share_enabled) {
                                                    setShareDialogReport(report);
                                                } else {
                                                    toggleShare(report, true);
                                                }
                                            }}
                                        >
                                            <Share2 className="w-4 h-4" />
                                        </Button>

                                        <Button asChild size="icon" variant="ghost">
                                            <a
                                                href={`/api/reports/${report.id}/download`}
                                                target="_blank"
                                                rel="noopener noreferrer"
                                                download
                                            >
                                                <Download className="w-4 h-4" />
                                            </a>
                                        </Button>

                                        <Button
                                            size="icon"
                                            variant="ghost"
                                            className="text-mutedForeground hover:text-negative"
                                            onClick={() => setDeleteId(report.id)}
                                        >
                                            <Trash2 className="w-4 h-4" />
                                        </Button>
                                    </div>
                                </TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                </Table>
            </div>

            <ConfirmDialog
                open={!!deleteId}
                onOpenChange={(open) => !open && setDeleteId(null)}
                title="Delete Report?"
                description="This action cannot be undone. The report metadata will be removed."
                confirmLabel="Delete"
                destructive
                onConfirm={handleDelete}
                loading={deleting}
            />

            {/* Share Dialog */}
            <ShareDialog
                open={!!shareDialogReport}
                onOpenChange={(open) => !open && setShareDialogReport(null)}
                report={shareDialogReport}
                onDisableShare={() => {
                    if (shareDialogReport) {
                        toggleShare(shareDialogReport, false);
                        setShareDialogReport(null);
                    }
                }}
            />
        </>
    );
}

function ShareDialog({
    open,
    onOpenChange,
    report,
    onDisableShare
}: {
    open: boolean;
    onOpenChange: (o: boolean) => void;
    report: Report | null;
    onDisableShare: () => void;
}) {
    const [copied, setCopied] = React.useState(false);

    if (!report) return null;

    // Construct full URL
    // Since we are client side, window.location.origin works
    const shareUrl = typeof window !== 'undefined'
        ? `${window.location.origin}/reports/shared/${report.share_token}`
        : '';

    const handleCopy = () => {
        navigator.clipboard.writeText(shareUrl);
        setCopied(true);
        setTimeout(() => setCopied(false), 2000);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent>
                <DialogHeader>
                    <DialogTitle>Share Report</DialogTitle>
                    <DialogDescription>
                        Anyone with this link can view this report without logging in.
                    </DialogDescription>
                </DialogHeader>

                <div className="space-y-4 py-4">
                    <div className="space-y-2">
                        <Label>Public Link</Label>
                        <div className="flex gap-2">
                            <Input value={shareUrl} readOnly className="font-mono text-xs" />
                            <Button size="icon" variant="outline" onClick={handleCopy}>
                                {copied ? <Check className="w-4 h-4" /> : <Copy className="w-4 h-4" />}
                            </Button>
                        </div>
                    </div>

                    <div className="flex items-center justify-between rounded-lg border p-4 bg-muted/30">
                        <div className="flex items-center gap-3">
                            <Globe className="w-5 h-5 text-primary" />
                            <div className="text-sm">
                                <p className="font-medium">Public Access is On</p>
                                <p className="text-mutedForeground text-xs">Report is visible via link</p>
                            </div>
                        </div>
                        <Button variant="outline" size="sm" onClick={onDisableShare}>
                            Disable
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog>
    )
}

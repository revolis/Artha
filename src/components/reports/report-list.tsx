"use client";

import * as React from "react";
import { format } from "date-fns";
import {
  Check,
  Copy,
  Download,
  FileText,
  Globe,
  Loader2,
  Share2,
  Trash2
} from "lucide-react";

import { fetchWithAuth } from "@/lib/firebase/browser";
import { ConfirmDialog } from "@/components/confirm-dialog";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle
} from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow
} from "@/components/ui/table";

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
  const [downloadingId, setDownloadingId] = React.useState<string | null>(null);

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
    try {
      const res = await fetchWithAuth(`/api/reports/${report.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ share_enabled: enabled })
      });

      if (!res.ok) {
        return;
      }

      onRefresh();

      if (enabled) {
        const data = await res.json();
        setShareDialogReport(data.report);
      }
    } catch (err) {
      console.error("Failed to share report", err);
    }
  };

  const handleDownload = async (report: Report) => {
    setDownloadingId(report.id);
    try {
      const res = await fetchWithAuth(`/api/reports/${report.id}/download`);
      if (!res.ok) {
        throw new Error("Failed to download report");
      }

      const blob = await res.blob();
      const disposition = res.headers.get("content-disposition") || "";
      const filenameMatch = disposition.match(/filename="?([^"]+)"?/i);
      const fallbackName = `report-${report.range_start}-${report.report_type}.${report.export_format}`;
      const filename = filenameMatch?.[1] || fallbackName;

      const url = window.URL.createObjectURL(blob);
      const anchor = document.createElement("a");
      anchor.href = url;
      anchor.download = filename;
      document.body.appendChild(anchor);
      anchor.click();
      anchor.remove();
      window.URL.revokeObjectURL(url);
    } catch (err) {
      console.error("Download failed:", err);
    } finally {
      setDownloadingId(null);
    }
  };

  if (loading && reports.length === 0) {
    return <div className="p-8 text-center text-mutedForeground">Loading reports...</div>;
  }

  if (reports.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center rounded-xl border-2 border-dashed py-12 text-center text-mutedForeground">
        <FileText className="mb-4 h-12 w-12 opacity-50" />
        <h3 className="text-lg font-medium text-foreground">No reports generated</h3>
        <p className="mt-1 max-w-sm">
          Create regular summaries of your financial activity to track your progress.
        </p>
      </div>
    );
  }

  return (
    <>
      <div className="overflow-hidden rounded-xl border bg-card">
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
                <TableCell className="capitalize">{report.report_type.replace("_", " ")}</TableCell>
                <TableCell className="text-sm text-mutedForeground">
                  {report.range_start} <span className="mx-1">to</span> {report.range_end}
                </TableCell>
                <TableCell>
                  <Badge variant="default" className="text-[10px] uppercase">
                    {report.export_format}
                  </Badge>
                </TableCell>
                <TableCell className="text-right">
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      size="icon"
                      variant="ghost"
                      className={report.share_enabled ? "bg-primary/10 text-primary" : "text-mutedForeground"}
                      onClick={() => {
                        if (report.share_enabled) {
                          setShareDialogReport(report);
                        } else {
                          toggleShare(report, true);
                        }
                      }}
                    >
                      <Share2 className="h-4 w-4" />
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      onClick={() => handleDownload(report)}
                      disabled={downloadingId === report.id}
                    >
                      {downloadingId === report.id ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                    </Button>

                    <Button
                      size="icon"
                      variant="ghost"
                      className="text-mutedForeground hover:text-negative"
                      onClick={() => setDeleteId(report.id)}
                    >
                      <Trash2 className="h-4 w-4" />
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
  onOpenChange: (open: boolean) => void;
  report: Report | null;
  onDisableShare: () => void;
}) {
  const [copied, setCopied] = React.useState(false);

  if (!report) return null;

  const shareUrl =
    typeof window !== "undefined" ? `${window.location.origin}/reports/shared/${report.share_token}` : "";

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
                {copied ? <Check className="h-4 w-4" /> : <Copy className="h-4 w-4" />}
              </Button>
            </div>
          </div>

          <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-4">
            <div className="flex items-center gap-3">
              <Globe className="h-5 w-5 text-primary" />
              <div className="text-sm">
                <p className="font-medium">Public Access is On</p>
                <p className="text-xs text-mutedForeground">Report is visible via link</p>
              </div>
            </div>
            <Button variant="outline" size="sm" onClick={onDisableShare}>
              Disable
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}


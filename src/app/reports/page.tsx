"use client";

import * as React from "react";
import { Plus } from "lucide-react";

import { Button } from "@/components/ui/button";
import { CreateReportDialog } from "@/components/reports/create-report-dialog";
import { ReportList } from "@/components/reports/report-list";

export default function ReportsPage() {
  const [createOpen, setCreateOpen] = React.useState(false);
  const [reports, setReports] = React.useState([]);
  const [loading, setLoading] = React.useState(true);

  // Initial fetch
  React.useEffect(() => {
    fetchReports();
  }, []);

  const fetchReports = async () => {
    setLoading(true);
    try {
      const res = await fetch("/api/reports");
      if (res.ok) {
        const data = await res.json();
        setReports(data.reports || []);
      }
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container max-w-5xl py-8 space-y-8">
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <h1 className="text-3xl font-bold tracking-tight">Financial Reports</h1>
          <p className="text-mutedForeground">
            Generate, download, and share detailed financial summaries.
          </p>
        </div>
        <Button onClick={() => setCreateOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          New Report
        </Button>
      </div>

      <ReportList
        reports={reports}
        loading={loading}
        onRefresh={fetchReports}
      />

      <CreateReportDialog
        open={createOpen}
        onOpenChange={setCreateOpen}
        onReportCreated={fetchReports}
      />
    </div>
  );
}

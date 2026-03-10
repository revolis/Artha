"use client";

import * as React from "react";
import { format } from "date-fns";
import { Download, AlertCircle } from "lucide-react";

import { Button } from "@/components/ui/button";
import {
    Card,
    CardContent,
    CardDescription,
    CardHeader,
    CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
    Table,
    TableBody,
    TableCell,
    TableHead,
    TableHeader,
    TableRow,
} from "@/components/ui/table";
import { Alert, AlertDescription, AlertTitle } from "@/components/ui/alert";

export default function SharedReportPage({ params }: { params: { token: string } }) {
    const [data, setData] = React.useState<any>(null);
    const [loading, setLoading] = React.useState(true);
    const [error, setError] = React.useState<string | null>(null);

    React.useEffect(() => {
        fetch(`/api/reports/shared/${params.token}`)
            .then(async (res) => {
                if (!res.ok) throw new Error("Report not found or unrestricted");
                return res.json();
            })
            .then((payload) => {
                setData(payload);
            })
            .catch((err) => {
                setError(err.message);
            })
            .finally(() => {
                setLoading(false);
            });
    }, [params.token]);

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background">
                <p className="text-mutedForeground animate-pulse">Loading report...</p>
            </div>
        );
    }

    if (error || !data) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-background p-4">
                <Alert variant="destructive" className="max-w-md">
                    <AlertCircle className="h-4 w-4" />
                    <AlertTitle>Access Denied</AlertTitle>
                    <AlertDescription>
                        This report does not exist or is no longer shared publicly.
                    </AlertDescription>
                </Alert>
            </div>
        );
    }

    const { report, summary, data: entries } = data;

    return (
        <div className="min-h-screen bg-background">
            {/* Header */}
            <header className="border-b bg-card">
                <div className="container max-w-5xl py-6 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4">
                    <div>
                        <div className="flex items-center gap-3 mb-1">
                            <h1 className="text-2xl font-bold tracking-tight">Financial Report</h1>
                            <Badge variant="default" className="uppercase">
                                {report.report_type}
                            </Badge>
                        </div>
                        <p className="text-mutedForeground">
                            Period: <span className="text-foreground font-medium">{report.range_start}</span> to <span className="text-foreground font-medium">{report.range_end}</span>
                        </p>
                    </div>
                    <div className="text-sm text-right text-mutedForeground">
                        Generated on {format(new Date(report.created_at), "MMM d, yyyy")}
                    </div>
                </div>
            </header>

            <main className="container max-w-5xl py-8 space-y-8">

                {/* Summary Cards */}
                {summary && (
                    <div className="grid gap-4 md:grid-cols-3">
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-mutedForeground">Total Income</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-emerald-500">
                                    +${summary.total_income?.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-mutedForeground">Total Expense</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className="text-2xl font-bold text-red-500">
                                    -${summary.total_expense?.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                        <Card>
                            <CardHeader className="pb-2">
                                <CardTitle className="text-sm font-medium text-mutedForeground">Net Income</CardTitle>
                            </CardHeader>
                            <CardContent>
                                <div className={summary.net_income >= 0 ? "text-2xl font-bold text-foreground" : "text-2xl font-bold text-red-500"}>
                                    {summary.net_income >= 0 ? "+" : ""}${summary.net_income?.toLocaleString()}
                                </div>
                            </CardContent>
                        </Card>
                    </div>
                )}

                {/* Entries Table */}
                <Card>
                    <CardHeader>
                        <CardTitle>Detailed Entries</CardTitle>
                        <CardDescription>
                            {entries?.length || 0} transaction{entries?.length !== 1 ? "s" : ""} in this period
                        </CardDescription>
                    </CardHeader>
                    <CardContent>
                        <Table>
                            <TableHeader>
                                <TableRow>
                                    <TableHead>Date</TableHead>
                                    <TableHead>Category</TableHead>
                                    <TableHead>Notes</TableHead>
                                    <TableHead className="text-right">Amount</TableHead>
                                </TableRow>
                            </TableHeader>
                            <TableBody>
                                {entries?.map((entry: any) => (
                                    <TableRow key={entry.id}>
                                        <TableCell className="whitespace-nowrap">
                                            {format(new Date(entry.entry_date), "MMM d")}
                                        </TableCell>
                                        <TableCell>
                                            <Badge variant="default" className="font-normal">
                                                {entry.categories?.name || "Uncategorized"}
                                            </Badge>
                                        </TableCell>
                                        <TableCell className="max-w-[200px] truncate text-mutedForeground" title={entry.notes}>
                                            {entry.notes || "-"}
                                        </TableCell>
                                        <TableCell className={entry.entry_type === 'profit' ? "text-right font-medium text-emerald-600" : "text-right font-medium text-red-600"}>
                                            {entry.entry_type === 'profit' ? '+' : '-'}${Number(entry.amount_usd_base).toLocaleString()}
                                        </TableCell>
                                    </TableRow>
                                ))}
                            </TableBody>
                        </Table>
                    </CardContent>
                </Card>
            </main>
        </div>
    );
}

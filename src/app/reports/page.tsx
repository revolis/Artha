import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";

export default function ReportsPage() {
  return (
    <div className="space-y-8">
      <PageHeader
        title="Reports"
        description="Generate shareable summaries with CSV/JSON backups."
      />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Export</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            <button className="w-full rounded-full border border-border px-4 py-2 text-sm">
              Download CSV
            </button>
            <button className="w-full rounded-full border border-border px-4 py-2 text-sm">
              Download JSON
            </button>
          </CardContent>
        </Card>
        <Card>
          <CardHeader>
            <CardTitle>Shareable report</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Enable share link</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Hide notes</span>
              <Switch />
            </div>
            <div className="flex items-center justify-between">
              <span className="text-sm">Hide sources</span>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

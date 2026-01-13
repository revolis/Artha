import { PageHeader } from "@/components/page-header";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";

export default function SettingsPage() {
  return (
    <div className="space-y-8">
      <PageHeader title="Settings" description="Control currency display and privacy defaults." />

      <div className="grid gap-6 lg:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle>Currency</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="space-y-2">
              <Label htmlFor="display-currency">Display Mode</Label>
              <Select>
                <SelectTrigger id="display-currency">
                  <SelectValue placeholder="Select display mode" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD only</SelectItem>
                  <SelectItem value="npr">NPR only</SelectItem>
                  <SelectItem value="both">Both</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="fx">Manual USD/NPR Rate</Label>
              <Input id="fx" type="number" placeholder="134.00" />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Privacy</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="flex items-center justify-between">
              <span className="text-sm">Private Mode default</span>
              <Switch />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

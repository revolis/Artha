"use client";

import * as React from "react";
import { Check, Settings, Info, Save } from "lucide-react";
import { useSettings } from "@/lib/hooks/use-settings";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Switch } from "@/components/ui/switch";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";

export default function SettingsPage() {
  const { settings, updateSettings, loading } = useSettings();
  const [localRate, setLocalRate] = React.useState("135"); // string for input
  const [saving, setSaving] = React.useState(false);

  React.useEffect(() => {
    if (settings?.fx_manual_rate_usd_npr) {
      setLocalRate(settings.fx_manual_rate_usd_npr.toString());
    }
  }, [settings]);

  if (loading) return <div className="p-8">Loading settings...</div>;
  if (!settings) return <div className="p-8">Failed to load settings.</div>;

  const handleSaveRate = async () => {
    setSaving(true);
    const rate = parseFloat(localRate);
    if (!isNaN(rate) && rate > 0) {
      await updateSettings({ fx_manual_rate_usd_npr: rate });
    }
    setSaving(false);
  };

  return (
    <div className="container max-w-3xl py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight">Settings</h1>
        <p className="text-mutedForeground">
          Manage your interface preferences and currency options.
        </p>
      </div>

      <div className="grid gap-6">
        {/* Currency Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Settings className="w-5 h-5" />
              Currency & Exchange Rates
            </CardTitle>
            <CardDescription>
              Configure how monetary values are displayed across the application.
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">

            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Display Currency</Label>
                <p className="text-sm text-mutedForeground">
                  Choose primary currency for dashboards.
                </p>
              </div>
              <Select
                value={settings.display_currency_mode}
                onValueChange={(val: any) => updateSettings({ display_currency_mode: val })}
              >
                <SelectTrigger className="w-[180px]">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="usd">USD Only ($)</SelectItem>
                  <SelectItem value="npr">NPR Only (Rs.)</SelectItem>
                  <SelectItem value="both">Both (USD + NPR)</SelectItem>
                </SelectContent>
              </Select>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="space-y-0.5">
                  <Label className="text-base">Exchange Rate Mode</Label>
                  <p className="text-sm text-mutedForeground">
                    Method used for USD to NPR conversion.
                  </p>
                </div>
                <Select
                  value={settings.fx_mode}
                  onValueChange={(val: any) => updateSettings({ fx_mode: val })}
                >
                  <SelectTrigger className="w-[180px]">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="stored_only">Auto (1 USD = 135 NPR)</SelectItem>
                    <SelectItem value="manual">Manual Rate</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {settings.fx_mode === 'manual' && (
                <div className="flex items-end gap-4 p-4 border rounded-lg bg-muted/30">
                  <div className="space-y-2 flex-1">
                    <Label>Manual USD to NPR Rate</Label>
                    <Input
                      type="number"
                      value={localRate}
                      onChange={(e) => setLocalRate(e.target.value)}
                      placeholder="e.g. 135.5"
                    />
                  </div>
                  <Button onClick={handleSaveRate} disabled={saving}>
                    {saving ? "Saving..." : "Save Rate"}
                  </Button>
                </div>
              )}
            </div>

          </CardContent>
        </Card>

        {/* Interface Settings */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              Preferences
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex items-center justify-between">
              <div className="space-y-0.5">
                <Label className="text-base">Default Private Mode</Label>
                <p className="text-sm text-mutedForeground">
                  Automatically hide values when application loads.
                </p>
              </div>
              <Switch
                checked={settings.private_mode_default}
                onCheckedChange={(checked) => updateSettings({ private_mode_default: checked })}
              />
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

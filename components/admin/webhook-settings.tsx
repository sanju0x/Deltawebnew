"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  RefreshCw,
  Webhook,
  Globe,
  Eye,
  Shield,
  Activity,
  Settings,
  Send,
  CheckCircle,
  XCircle,
  Clock,
  MapPin,
  Monitor,
  Smartphone,
} from "lucide-react";

interface WebhookSettings {
  enabled: boolean;
  embedColor: string;
  embedTitle: string;
  embedFooter: string;
  embedThumbnail: string;
  includeIP: boolean;
  includeLocation: boolean;
  includeBrowser: boolean;
  includeOS: boolean;
  includeDevice: boolean;
  includeScreen: boolean;
  includeReferrer: boolean;
  includePageVisited: boolean;
  includeLanguage: boolean;
  includeTimezone: boolean;
  rateLimitPerMinute: number;
  cooldownSeconds: number;
}

interface VisitorLog {
  _id: string;
  ip: string;
  country?: string;
  city?: string;
  browser?: string;
  os?: string;
  device?: string;
  screen?: string;
  referrer?: string;
  page?: string;
  language?: string;
  timezone?: string;
  visitedAt: string;
  webhookSent: boolean;
}

const defaultSettings: WebhookSettings = {
  enabled: false,
  discordBotToken: "",
  discordChannelId: "",
  embedColor: "#dc2626",
  embedTitle: "New Visitor Alert",
  embedFooter: "Delta Visitor Tracking",
  embedThumbnail: "",
  includeIP: true,
  includeLocation: true,
  includeBrowser: true,
  includeOS: true,
  includeDevice: true,
  includeScreen: true,
  includeReferrer: true,
  includePageVisited: true,
  includeLanguage: true,
  includeTimezone: true,
  rateLimitPerMinute: 30,
  cooldownSeconds: 5,
};

export function WebhookSettings() {
  const [settings, setSettings] = useState<WebhookSettings>(defaultSettings);
  const [logs, setLogs] = useState<VisitorLog[]>([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [testing, setTesting] = useState(false);
  const [testResult, setTestResult] = useState<"success" | "error" | null>(null);

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/webhook-settings");
      if (response.ok) {
        const data = await response.json();
        if (data.settings) {
          setSettings({ ...defaultSettings, ...data.settings });
        }
        setLogs(data.logs || []);
      }
    } catch (error) {
      console.error("Error fetching webhook settings:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      await fetch("/api/admin/webhook-settings", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ settings }),
      });
    } catch (error) {
      console.error("Error saving settings:", error);
    }
    setSaving(false);
  };

  const handleTest = async () => {
    if (!settings.discordBotToken || !settings.discordChannelId) return;
    
    setTesting(true);
    setTestResult(null);
    try {
      const response = await fetch("/api/admin/webhook-settings/test", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ 
          discordBotToken: settings.discordBotToken,
          discordChannelId: settings.discordChannelId,
          settings 
        }),
      });
      setTestResult(response.ok ? "success" : "error");
    } catch {
      setTestResult("error");
    }
    setTesting(false);
    
    setTimeout(() => setTestResult(null), 3000);
  };

  const updateSetting = <K extends keyof WebhookSettings>(key: K, value: WebhookSettings[K]) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Webhook className="h-5 w-5 text-primary" />
                Visitor Webhook Settings
              </CardTitle>
              <CardDescription>
                Track visitors and send detailed analytics to Discord
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs defaultValue="settings">
            <TabsList className="grid w-full grid-cols-2 rounded-xl bg-secondary/50 p-1 mb-6">
              <TabsTrigger value="settings" className="rounded-lg data-[state=active]:bg-card flex items-center gap-2">
                <Settings className="h-4 w-4" />
                <span>Settings</span>
              </TabsTrigger>
              <TabsTrigger value="logs" className="rounded-lg data-[state=active]:bg-card flex items-center gap-2">
                <Activity className="h-4 w-4" />
                <span>Recent Visitors ({logs.length})</span>
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                <TabsContent value="settings" className="space-y-6">
                  {/* Enable/Disable */}
                  <div className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/20">
                    <div className="flex items-center gap-3">
                      <div className={`h-10 w-10 rounded-xl flex items-center justify-center ${settings.enabled ? "bg-green-500/20" : "bg-secondary"}`}>
                        {settings.enabled ? (
                          <Eye className="h-5 w-5 text-green-500" />
                        ) : (
                          <Shield className="h-5 w-5 text-muted-foreground" />
                        )}
                      </div>
                      <div>
                        <p className="font-medium text-foreground">Visitor Tracking</p>
                        <p className="text-sm text-muted-foreground">
                          {settings.enabled ? "Tracking is active" : "Tracking is disabled"}
                        </p>
                      </div>
                    </div>
                    <Switch
                      checked={settings.enabled}
                      onCheckedChange={(checked) => updateSetting("enabled", checked)}
                    />
                  </div>

                  {/* Discord Bot Settings */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Discord Bot Configuration</Label>
                    <div className="grid gap-4">
                      <div className="space-y-2">
                        <Label>Bot Token</Label>
                        <Input
                          type="password"
                          value={settings.discordBotToken}
                          onChange={(e) => updateSetting("discordBotToken", e.target.value)}
                          placeholder="Enter your Discord bot token..."
                          className="font-mono"
                        />
                        <p className="text-xs text-muted-foreground">
                          Get this from Discord Developer Portal. Keep it secret!
                        </p>
                      </div>
                      <div className="space-y-2">
                        <Label>Channel ID</Label>
                        <div className="flex gap-2">
                          <Input
                            value={settings.discordChannelId}
                            onChange={(e) => updateSetting("discordChannelId", e.target.value)}
                            placeholder="e.g., 1234567890123456789"
                            className="flex-1 font-mono"
                          />
                          <Button
                            variant="outline"
                            onClick={handleTest}
                            disabled={!settings.discordBotToken || !settings.discordChannelId || testing}
                            className="rounded-xl"
                          >
                            {testing ? (
                              <RefreshCw className="h-4 w-4 animate-spin" />
                            ) : testResult === "success" ? (
                              <CheckCircle className="h-4 w-4 text-green-500" />
                            ) : testResult === "error" ? (
                              <XCircle className="h-4 w-4 text-red-500" />
                            ) : (
                              <Send className="h-4 w-4" />
                            )}
                            <span className="ml-2">Test</span>
                          </Button>
                        </div>
                        <p className="text-xs text-muted-foreground">
                          Right-click the channel in Discord and select &quot;Copy Channel ID&quot;
                        </p>
                      </div>
                    </div>
                  </div>

                  {/* Embed Customization */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Embed Customization</Label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
                      <div className="space-y-2">
                        <Label>Embed Color</Label>
                        <div className="flex gap-2">
                          <Input
                            type="color"
                            value={settings.embedColor}
                            onChange={(e) => updateSetting("embedColor", e.target.value)}
                            className="w-12 h-10 p-1 rounded-xl"
                          />
                          <Input
                            value={settings.embedColor}
                            onChange={(e) => updateSetting("embedColor", e.target.value)}
                            placeholder="#dc2626"
                            className="flex-1"
                          />
                        </div>
                      </div>
                      <div className="space-y-2">
                        <Label>Embed Title</Label>
                        <Input
                          value={settings.embedTitle}
                          onChange={(e) => updateSetting("embedTitle", e.target.value)}
                          placeholder="New Visitor Alert"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Embed Footer</Label>
                        <Input
                          value={settings.embedFooter}
                          onChange={(e) => updateSetting("embedFooter", e.target.value)}
                          placeholder="Delta Visitor Tracking"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Embed Thumbnail URL</Label>
                        <Input
                          value={settings.embedThumbnail}
                          onChange={(e) => updateSetting("embedThumbnail", e.target.value)}
                          placeholder="https://example.com/image.png"
                        />
                      </div>
                    </div>
                  </div>

                  {/* Data Fields */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Data to Include</Label>
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
                      {[
                        { key: "includeIP" as const, label: "IP Address", icon: Globe },
                        { key: "includeLocation" as const, label: "Location (City, Country)", icon: MapPin },
                        { key: "includeBrowser" as const, label: "Browser", icon: Globe },
                        { key: "includeOS" as const, label: "Operating System", icon: Monitor },
                        { key: "includeDevice" as const, label: "Device Type", icon: Smartphone },
                        { key: "includeScreen" as const, label: "Screen Resolution", icon: Monitor },
                        { key: "includeReferrer" as const, label: "Referrer URL", icon: Globe },
                        { key: "includePageVisited" as const, label: "Page Visited", icon: Globe },
                        { key: "includeLanguage" as const, label: "Language", icon: Globe },
                        { key: "includeTimezone" as const, label: "Timezone", icon: Clock },
                      ].map(({ key, label, icon: Icon }) => (
                        <div
                          key={key}
                          className="flex items-center justify-between p-3 border border-border rounded-xl bg-secondary/10"
                        >
                          <div className="flex items-center gap-2">
                            <Icon className="h-4 w-4 text-muted-foreground" />
                            <span className="text-sm">{label}</span>
                          </div>
                          <Switch
                            checked={settings[key]}
                            onCheckedChange={(checked) => updateSetting(key, checked)}
                          />
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Rate Limiting */}
                  <div className="space-y-4">
                    <Label className="text-base font-semibold">Rate Limiting</Label>
                    <div className="grid sm:grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Max Webhooks Per Minute</Label>
                        <Input
                          type="number"
                          value={settings.rateLimitPerMinute}
                          onChange={(e) => updateSetting("rateLimitPerMinute", parseInt(e.target.value) || 30)}
                          min={1}
                          max={60}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Cooldown Between Same IP (seconds)</Label>
                        <Input
                          type="number"
                          value={settings.cooldownSeconds}
                          onChange={(e) => updateSetting("cooldownSeconds", parseInt(e.target.value) || 5)}
                          min={1}
                          max={3600}
                        />
                      </div>
                    </div>
                  </div>

                  {/* Save Button */}
                  <div className="flex justify-end pt-4">
                    <Button onClick={handleSave} disabled={saving} className="rounded-xl">
                      {saving ? (
                        <>
                          <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
                          Saving...
                        </>
                      ) : (
                        <>
                          <CheckCircle className="h-4 w-4 mr-2" />
                          Save Settings
                        </>
                      )}
                    </Button>
                  </div>
                </TabsContent>

                <TabsContent value="logs" className="space-y-4">
                  {logs.length === 0 ? (
                    <div className="text-center py-12">
                      <Activity className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No visitor logs yet</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {logs.slice(0, 50).map((log) => (
                        <div
                          key={log._id}
                          className="p-4 border border-border rounded-xl bg-secondary/20"
                        >
                          <div className="flex items-start justify-between">
                            <div className="space-y-2">
                              <div className="flex items-center gap-2">
                                <Badge variant="outline" className="font-mono">
                                  {log.ip}
                                </Badge>
                                {log.webhookSent ? (
                                  <Badge className="bg-green-500/20 text-green-500 border-green-500/30">
                                    <CheckCircle className="h-3 w-3 mr-1" />
                                    Sent
                                  </Badge>
                                ) : (
                                  <Badge className="bg-yellow-500/20 text-yellow-500 border-yellow-500/30">
                                    <Clock className="h-3 w-3 mr-1" />
                                    Pending
                                  </Badge>
                                )}
                              </div>
                              <div className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
                                {log.country && (
                                  <span className="flex items-center gap-1">
                                    <MapPin className="h-3 w-3" />
                                    {log.city ? `${log.city}, ` : ""}{log.country}
                                  </span>
                                )}
                                {log.browser && (
                                  <span className="flex items-center gap-1">
                                    <Globe className="h-3 w-3" />
                                    {log.browser}
                                  </span>
                                )}
                                {log.os && (
                                  <span className="flex items-center gap-1">
                                    <Monitor className="h-3 w-3" />
                                    {log.os}
                                  </span>
                                )}
                                {log.device && (
                                  <span className="flex items-center gap-1">
                                    <Smartphone className="h-3 w-3" />
                                    {log.device}
                                  </span>
                                )}
                              </div>
                              {log.page && (
                                <div className="text-xs text-muted-foreground">
                                  Page: {log.page}
                                </div>
                              )}
                              {log.referrer && (
                                <div className="text-xs text-muted-foreground">
                                  Referrer: {log.referrer}
                                </div>
                              )}
                            </div>
                            <div className="text-xs text-muted-foreground">
                              {new Date(log.visitedAt).toLocaleString()}
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>
              </>
            )}
          </Tabs>
        </CardContent>
      </Card>
    </div>
  );
}

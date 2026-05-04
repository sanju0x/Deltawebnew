"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Activity, CheckCircle2, XCircle, AlertTriangle, RefreshCw, Save } from "lucide-react";

type BotStatusType = "online" | "offline" | "maintenance";

interface BotStatus {
  status: BotStatusType;
  message: string;
  updatedAt: string;
}

const statusOptions: { value: BotStatusType; label: string; icon: React.ReactNode; color: string }[] = [
  {
    value: "online",
    label: "Online",
    icon: <CheckCircle2 className="h-5 w-5" />,
    color: "border-green-500 bg-green-500/20 text-green-500",
  },
  {
    value: "offline",
    label: "Offline",
    icon: <XCircle className="h-5 w-5" />,
    color: "border-red-500 bg-red-500/20 text-red-500",
  },
  {
    value: "maintenance",
    label: "Maintenance",
    icon: <AlertTriangle className="h-5 w-5" />,
    color: "border-amber-500 bg-amber-500/20 text-amber-500",
  },
];

export function StatusManager() {
  const [status, setStatus] = useState<BotStatus | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [selectedStatus, setSelectedStatus] = useState<BotStatusType>("online");
  const [message, setMessage] = useState("");

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/bot-status");
      if (response.ok) {
        const data = await response.json();
        setStatus(data);
        setSelectedStatus(data.status);
        setMessage(data.message || "");
      }
    } catch (error) {
      console.error("Error fetching status:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStatus();
  }, []);

  const handleSave = async () => {
    setSaving(true);
    try {
      const response = await fetch("/api/admin/bot-status", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: selectedStatus, message }),
      });
      if (response.ok) {
        fetchStatus();
      }
    } catch (error) {
      console.error("Error saving status:", error);
    } finally {
      setSaving(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-primary" />
              Bot Status
            </CardTitle>
            <CardDescription>
              Control the bot status displayed on the status page
            </CardDescription>
          </div>
          <Button variant="outline" size="sm" onClick={fetchStatus} className="rounded-xl">
            <RefreshCw className="h-4 w-4" />
          </Button>
        </div>
      </CardHeader>
      <CardContent>
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="space-y-6">
            {/* Current Status Display */}
            {status && (
              <div className="rounded-xl border border-border bg-secondary/30 p-4">
                <p className="text-sm text-muted-foreground mb-2">Current Status</p>
                <div className="flex items-center gap-3">
                  <div
                    className={`flex items-center gap-2 rounded-lg border px-3 py-1.5 ${
                      statusOptions.find((s) => s.value === status.status)?.color
                    }`}
                  >
                    {statusOptions.find((s) => s.value === status.status)?.icon}
                    <span className="font-medium capitalize">{status.status}</span>
                  </div>
                  <span className="text-xs text-muted-foreground">
                    Last updated: {new Date(status.updatedAt).toLocaleString()}
                  </span>
                </div>
              </div>
            )}

            {/* Status Selection */}
            <div>
              <label className="text-sm font-medium mb-3 block">Select Status</label>
              <div className="grid grid-cols-3 gap-3">
                {statusOptions.map((option) => (
                  <button
                    key={option.value}
                    onClick={() => setSelectedStatus(option.value)}
                    className={`flex flex-col items-center gap-2 rounded-xl border-2 p-4 transition-all ${
                      selectedStatus === option.value
                        ? option.color + " border-current"
                        : "border-border hover:border-primary/50"
                    }`}
                  >
                    {option.icon}
                    <span className="text-sm font-medium">{option.label}</span>
                  </button>
                ))}
              </div>
            </div>

            {/* Message */}
            <div>
              <label className="text-sm font-medium mb-2 block">Status Message (optional)</label>
              <Textarea
                placeholder="Enter a message to display on the status page..."
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                className="rounded-xl"
              />
            </div>

            {/* Save Button */}
            <Button onClick={handleSave} disabled={saving} className="w-full rounded-xl">
              {saving ? (
                <RefreshCw className="h-4 w-4 animate-spin mr-2" />
              ) : (
                <Save className="h-4 w-4 mr-2" />
              )}
              Save Status
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}

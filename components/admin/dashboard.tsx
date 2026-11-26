"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
  AlertDialogTrigger,
} from "@/components/ui/alert-dialog";
import {
  Bug,
  CheckCircle,
  Clock,
  RefreshCw,
  Trash2,
  XCircle,
  AlertTriangle,
  Filter,
  Newspaper,
  Activity,
  Sparkles,
  Users,
  Handshake,
  Crown,
} from "lucide-react";
import Link from "next/link";
import { PageBanner } from "@/components/page-banner";
import { AudioLines, Grid2X2, SlidersHorizontal } from "lucide-react";
import { RuntimeMonitor } from "./runtime-monitor";
import { BrandLogo } from "@/components/brand-logo";
import { NewsManager } from "./news-manager";
import { StatusManager } from "./status-manager";
import { UpdatesManager } from "./updates-manager";
import { TeamManager } from "./team-manager";
import { PartnersManager } from "./partners-manager";
import { PremiumManager } from "./premium-manager";
import { SiteActivity } from "./site-activity";
import { BotActivity } from "./bot-activity";
import { TrialsManager } from "./trials-manager";
import { MaintenanceToggle } from "./maintenance-toggle";
import { BetaTestersManager } from "./beta-testers-manager";

interface BugReport {
  id: string;
  title: string;
  description: string;
  category: string;
  severity: string;
  status: string;
  reporter_email: string | null;
  reporter_discord_id: string | null;
  reporter_discord_username: string | null;
  created_at: string;
  updated_at: string;
}

const statusColors: Record<string, string> = {
  open: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  in_progress: "bg-blue-500/20 text-blue-500 border-blue-500/30",
  resolved: "bg-green-500/20 text-green-500 border-green-500/30",
  closed: "bg-gray-500/20 text-gray-500 border-gray-500/30",
};

const severityColors: Record<string, string> = {
  low: "bg-green-500/20 text-green-500 border-green-500/30",
  medium: "bg-yellow-500/20 text-yellow-500 border-yellow-500/30",
  high: "bg-orange-500/20 text-orange-500 border-orange-500/30",
  critical: "bg-red-500/20 text-red-500 border-red-500/30",
};

const statusIcons: Record<string, React.ReactNode> = {
  open: <Clock className="h-4 w-4" />,
  in_progress: <RefreshCw className="h-4 w-4" />,
  resolved: <CheckCircle className="h-4 w-4" />,
  closed: <XCircle className="h-4 w-4" />,
};

export function AdminDashboard() {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const [error, setError] = useState("");
  const [pendingReport, setPendingReport] = useState<string | null>(null);
  const requestVersion = useRef(0);

  const fetchReports = useCallback(async () => {
    const version = ++requestVersion.current;
    setLoading(true);
    setError("");
    const params = new URLSearchParams({
      status: statusFilter,
      severity: severityFilter,
    });
    try {
      const response = await fetch(`/api/admin/bug-reports?${params.toString()}`, { cache: "no-store" });
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again to manage reports." : payload.error || "Could not load bug reports.");
      if (version === requestVersion.current) setReports(payload.data || []);
    } catch (error) {
      if (version === requestVersion.current) setError(error instanceof Error ? error.message : "Could not load bug reports.");
    } finally {
      if (version === requestVersion.current) setLoading(false);
    }
  }, [statusFilter, severityFilter]);

  useEffect(() => {
    void fetchReports();
    return () => { requestVersion.current += 1; };
  }, [fetchReports]);

  const mutateReport = async (id: string, method: "PATCH" | "DELETE", status?: string) => {
    setPendingReport(id);
    setError("");
    try {
      const response = await fetch(`/api/admin/bug-reports/${id}`, {
        method,
        ...(method === "PATCH" ? { headers: { "Content-Type": "application/json" }, body: JSON.stringify({ status }) } : {}),
      });
      const payload = await response.json();
      if (!response.ok) throw new Error(response.status === 401 ? "Your session expired. Sign in again to manage reports." : payload.error || "Could not save bug report changes.");
      await fetchReports();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Could not save bug report changes.");
    } finally {
      setPendingReport(null);
    }
  };

  const updateStatus = (id: string, status: string) => mutateReport(id, "PATCH", status);
  const deleteReport = (id: string) => mutateReport(id, "DELETE");

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    inProgress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="admin-workspace min-h-screen bg-background">
      <header className="sticky top-0 z-50 border-b border-border bg-card">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-3 rounded-xl focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring focus-visible:ring-offset-2 focus-visible:ring-offset-background">
              <BrandLogo compact />
              <span className="hidden border-l border-border pl-3 text-sm font-medium text-muted-foreground sm:inline">
                Admin
              </span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <Badge variant="outline" className="rounded-full border-emerald-500/30 bg-emerald-500/10 px-3 py-1.5 text-emerald-400">
              Discord verified
            </Badge>
          </div>
        </div>
      </header>

      <main className="site-container py-8">
        <PageBanner icon={<SlidersHorizontal />} eyebrow="Delta administration" title="Control room" description="Review reports, manage access, and publish updates for your community." />
        
        <Tabs defaultValue="bugs" className="space-y-6">
          <TabsList aria-label="Administration sections" className="admin-tabs">
            <TabsTrigger value="maintenance" className="admin-tab"><SlidersHorizontal /><span>Maintenance</span></TabsTrigger>
            <TabsTrigger value="bugs" className="admin-tab">
              <Bug className="h-4 w-4" />
              <span>Bugs</span>
            </TabsTrigger>
            <TabsTrigger value="news" className="admin-tab">
              <Newspaper className="h-4 w-4" />
              <span>News</span>
            </TabsTrigger>
            <TabsTrigger value="status" className="admin-tab">
              <Activity className="h-4 w-4" />
              <span>Status</span>
            </TabsTrigger>
            <TabsTrigger value="updates" className="admin-tab">
              <Sparkles className="h-4 w-4" />
              <span>Updates</span>
            </TabsTrigger>
            <TabsTrigger value="team" className="admin-tab">
              <Users className="h-4 w-4" />
              <span>Team</span>
            </TabsTrigger>
            <TabsTrigger value="partners" className="admin-tab">
              <Handshake className="h-4 w-4" />
              <span>Partners</span>
            </TabsTrigger>
            <TabsTrigger value="premium" className="admin-tab">
              <Crown className="h-4 w-4" />
              <span>Premium</span>
            </TabsTrigger>
            <TabsTrigger value="blacklist" className="admin-tab"><Users /><span>Blacklist</span></TabsTrigger>
            <TabsTrigger value="activity" className="admin-tab"><Activity /><span>Activity</span></TabsTrigger>
            <TabsTrigger value="analytics" className="admin-tab"><Activity /><span>Bot analytics</span></TabsTrigger>
            <TabsTrigger value="trials" className="admin-tab"><AudioLines /><span>No-prefix trials</span></TabsTrigger>
            <TabsTrigger value="audio" className="admin-tab runtime-tab audio-tab"><AudioLines /><span>Lavalink monitor</span></TabsTrigger>
            <TabsTrigger value="shards" className="admin-tab runtime-tab shard-tab"><Grid2X2 /><span>Shard manager grid</span></TabsTrigger>
          </TabsList>
          <TabsContent value="maintenance">
            <MaintenanceToggle scope="website" title="Whole website" />
            <MaintenanceToggle scope="dashboard" title="Server dashboard" />
            <MaintenanceToggle scope="user" title="User dashboard" />
            <BetaTestersManager />
          </TabsContent>
          <TabsContent value="audio"><RuntimeMonitor mode="audio" /></TabsContent>
          <TabsContent value="shards"><RuntimeMonitor mode="shards" /></TabsContent>

          {(["blacklist", "activity", "analytics"] as const).map(section => <TabsContent key={section} value={section}>{section === "activity" && <SiteActivity />}<BotActivity section={section} /></TabsContent>)}
          <TabsContent value="trials"><TrialsManager /></TabsContent>

          <TabsContent value="bugs" className="space-y-6">
        {error && <div role="alert" className="rounded-xl border border-destructive/30 bg-destructive/10 p-4 text-sm text-destructive">{error} <Link href="/admin/login" className="underline">Sign in</Link></div>}
        <div className="admin-metrics grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Total Reports</p>
                  <p className="text-2xl font-bold">{stats.total}</p>
                </div>
                <Bug className="h-8 w-8 text-primary opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Open</p>
                  <p className="text-2xl font-bold text-yellow-500">{stats.open}</p>
                </div>
                <Clock className="h-8 w-8 text-yellow-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">In Progress</p>
                  <p className="text-2xl font-bold text-blue-500">{stats.inProgress}</p>
                </div>
                <RefreshCw className="h-8 w-8 text-blue-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
          <Card className="bg-card border-border">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-muted-foreground">Resolved</p>
                  <p className="text-2xl font-bold text-green-500">{stats.resolved}</p>
                </div>
                <CheckCircle className="h-8 w-8 text-green-500 opacity-50" />
              </div>
            </CardContent>
          </Card>
        </div>

        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter} disabled={pendingReport !== null}>
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={severityFilter} onValueChange={setSeverityFilter} disabled={pendingReport !== null}>
                <SelectTrigger className="w-40 rounded-xl">
                  <SelectValue placeholder="Severity" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Severity</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="critical">Critical</SelectItem>
                </SelectContent>
              </Select>
              <Button
                variant="outline"
                size="sm"
                onClick={fetchReports}
                disabled={loading || pendingReport !== null}
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card className="bg-card border-border">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Bug className="h-5 w-5 text-primary" />
              Bug Reports
            </CardTitle>
            <CardDescription>
              Manage and track all submitted bug reports
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : reports.length === 0 && error ? (
              <p className="py-12 text-center text-muted-foreground">Reports could not be loaded. Use Refresh to try again.</p>
            ) : reports.length === 0 ? (
              <div className="text-center py-12">
                <Bug className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                <p className="text-muted-foreground">No bug reports found</p>
              </div>
            ) : (
              <div className="space-y-4">
                {reports.map((report) => (
                  <div
                    key={report.id}
                    className="border border-border rounded-xl p-4 hover:bg-secondary/30 transition-colors"
                  >
                    <div className="flex flex-col md:flex-row md:items-start justify-between gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-2 mb-2">
                          <h3 className="font-semibold text-foreground">
                            {report.title}
                          </h3>
                          <Badge
                            variant="outline"
                            className={severityColors[report.severity]}
                          >
                            {report.severity}
                          </Badge>
                          <Badge
                            variant="outline"
                            className={statusColors[report.status]}
                          >
                            {statusIcons[report.status]}
                            <span className="ml-1">{report.status.replace("_", " ")}</span>
                          </Badge>
                        </div>
                        <p className="text-sm text-muted-foreground mb-2 line-clamp-2">
                          {report.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-4 text-xs text-muted-foreground">
                          <span>Category: {report.category}</span>
                          {report.reporter_discord_username && (
                            <span>Reporter: {report.reporter_discord_username}</span>
                          )}
                          {report.reporter_email && (
                            <span>Email: {report.reporter_email}</span>
                          )}
                          <span>
                            Created:{" "}
                            {new Date(report.created_at).toLocaleDateString()}
                          </span>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <Select
                          value={report.status}
                          disabled={pendingReport !== null}
                          onValueChange={(value) => updateStatus(report.id, value)}
                        >
                          <SelectTrigger className="w-32 rounded-xl">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Open</SelectItem>
                            <SelectItem value="in_progress">In Progress</SelectItem>
                            <SelectItem value="resolved">Resolved</SelectItem>
                            <SelectItem value="closed">Closed</SelectItem>
                          </SelectContent>
                        </Select>
                        <AlertDialog>
                          <AlertDialogTrigger asChild>
                            <Button
                              variant="outline"
                              size="icon"
                              disabled={pendingReport !== null}
                              aria-label={`Delete report: ${report.title}`}
                              className="rounded-xl text-destructive hover:bg-destructive/10"
                            >
                              <Trash2 className="h-4 w-4" />
                            </Button>
                          </AlertDialogTrigger>
                          <AlertDialogContent>
                            <AlertDialogHeader>
                              <AlertDialogTitle className="flex items-center gap-2">
                                <AlertTriangle className="h-5 w-5 text-destructive" />
                                Delete Bug Report
                              </AlertDialogTitle>
                              <AlertDialogDescription>
                                Are you sure you want to delete this bug report? This
                                action cannot be undone.
                              </AlertDialogDescription>
                            </AlertDialogHeader>
                            <AlertDialogFooter>
                              <AlertDialogCancel className="rounded-xl">
                                Cancel
                              </AlertDialogCancel>
                              <AlertDialogAction
                                onClick={() => deleteReport(report.id)}
                                className="rounded-xl bg-destructive hover:bg-destructive/90"
                              >
                                Delete
                              </AlertDialogAction>
                            </AlertDialogFooter>
                          </AlertDialogContent>
                        </AlertDialog>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>
          </TabsContent>

          <TabsContent value="news">
            <NewsManager />
          </TabsContent>

          <TabsContent value="status">
            <StatusManager />
          </TabsContent>

          <TabsContent value="updates">
            <UpdatesManager />
          </TabsContent>

          <TabsContent value="team">
            <TeamManager />
          </TabsContent>

          <TabsContent value="partners">
            <PartnersManager />
          </TabsContent>

          <TabsContent value="premium">
            <PremiumManager />
          </TabsContent>
        </Tabs>
      </main>
    </div>
  );
}

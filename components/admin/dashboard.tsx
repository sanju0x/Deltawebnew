"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
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
  LogOut,
  RefreshCw,
  Trash2,
  XCircle,
  AlertTriangle,
  Filter,
} from "lucide-react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

interface AdminUser {
  discord_id: string;
  discord_username: string;
  discord_avatar: string | null;
}

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

export function AdminDashboard({ user }: { user: AdminUser }) {
  const [reports, setReports] = useState<BugReport[]>([]);
  const [loading, setLoading] = useState(true);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [severityFilter, setSeverityFilter] = useState<string>("all");
  const supabase = createClient();

  const fetchReports = async () => {
    setLoading(true);
    let query = supabase
      .from("bug_reports")
      .select("*")
      .order("created_at", { ascending: false });

    if (statusFilter !== "all") {
      query = query.eq("status", statusFilter);
    }
    if (severityFilter !== "all") {
      query = query.eq("severity", severityFilter);
    }

    const { data, error } = await query;

    if (error) {
      console.error("Error fetching reports:", error);
    } else {
      setReports(data || []);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchReports();
  }, [statusFilter, severityFilter]);

  const updateStatus = async (id: string, newStatus: string) => {
    const { error } = await supabase
      .from("bug_reports")
      .update({ status: newStatus })
      .eq("id", id);

    if (error) {
      console.error("Error updating status:", error);
    } else {
      fetchReports();
    }
  };

  const deleteReport = async (id: string) => {
    const { error } = await supabase.from("bug_reports").delete().eq("id", id);

    if (error) {
      console.error("Error deleting report:", error);
    } else {
      fetchReports();
    }
  };

  const handleLogout = async () => {
    await fetch("/api/auth/discord/logout", { method: "POST" });
    window.location.href = "/admin/login";
  };

  const stats = {
    total: reports.length,
    open: reports.filter((r) => r.status === "open").length,
    inProgress: reports.filter((r) => r.status === "in_progress").length,
    resolved: reports.filter((r) => r.status === "resolved").length,
  };

  return (
    <div className="min-h-screen bg-background">
      {/* Header */}
      <header className="sticky top-0 z-50 border-b border-border bg-card/80 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Link href="/" className="flex items-center gap-2">
              <div className="flex h-10 w-10 items-center justify-center rounded-full bg-primary">
                <svg
                  className="h-6 w-6 text-primary-foreground"
                  viewBox="0 0 24 24"
                  fill="currentColor"
                >
                  <path d="M12 2L2 7l10 5 10-5-10-5zM2 17l10 5 10-5M2 12l10 5 10-5" />
                </svg>
              </div>
              <span className="text-xl font-bold">Delta Admin</span>
            </Link>
          </div>

          <div className="flex items-center gap-4">
            <div className="flex items-center gap-2">
              {user.discord_avatar ? (
                <img
                  src={`https://cdn.discordapp.com/avatars/${user.discord_id}/${user.discord_avatar}.png`}
                  alt={user.discord_username}
                  className="h-8 w-8 rounded-full"
                />
              ) : (
                <div className="h-8 w-8 rounded-full bg-primary flex items-center justify-center text-primary-foreground font-semibold">
                  {user.discord_username[0].toUpperCase()}
                </div>
              )}
              <span className="text-sm font-medium">{user.discord_username}</span>
            </div>
            <Button
              variant="outline"
              size="sm"
              onClick={handleLogout}
              className="rounded-xl"
            >
              <LogOut className="h-4 w-4 mr-2" />
              Logout
            </Button>
          </div>
        </div>
      </header>

      <main className="container mx-auto px-4 py-8">
        {/* Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
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

        {/* Filters */}
        <Card className="bg-card border-border mb-6">
          <CardContent className="p-4">
            <div className="flex flex-wrap items-center gap-4">
              <div className="flex items-center gap-2">
                <Filter className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm font-medium">Filters:</span>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
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
              <Select value={severityFilter} onValueChange={setSeverityFilter}>
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
                className="rounded-xl"
              >
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Reports List */}
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
      </main>
    </div>
  );
}

"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
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
import { Sparkles, Plus, Trash2, Edit2, X, Check, RefreshCw, AlertTriangle, Eye, EyeOff } from "lucide-react";

interface Update {
  _id: string;
  title: string;
  content: string;
  version: string;
  createdAt: string;
}

export function UpdatesManager() {
  const [updates, setUpdates] = useState<Update[]>([]);
  const [pageEnabled, setPageEnabled] = useState(true);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", version: "" });
  const [saving, setSaving] = useState(false);
  const [togglingPage, setTogglingPage] = useState(false);

  const fetchUpdates = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/updates");
      if (response.ok) {
        const data = await response.json();
        setUpdates(data.updates);
        setPageEnabled(data.pageEnabled);
      }
    } catch (error) {
      console.error("Error fetching updates:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchUpdates();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", content: "", version: "" });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim() || !formData.version.trim()) return;

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/updates/${editingId}` : "/api/admin/updates";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error saving update:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (update: Update) => {
    setFormData({ title: update.title, content: update.content, version: update.version });
    setEditingId(update._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/updates/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchUpdates();
      }
    } catch (error) {
      console.error("Error deleting update:", error);
    }
  };

  const togglePageEnabled = async () => {
    setTogglingPage(true);
    try {
      const response = await fetch("/api/admin/updates/config", {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ pageEnabled: !pageEnabled }),
      });
      if (response.ok) {
        setPageEnabled(!pageEnabled);
      }
    } catch (error) {
      console.error("Error toggling page:", error);
    } finally {
      setTogglingPage(false);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Sparkles className="h-5 w-5 text-primary" />
              Updates Management
            </CardTitle>
            <CardDescription>
              Manage changelog entries and control the updates page visibility
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchUpdates} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add Update
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Page Toggle */}
        <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              {pageEnabled ? (
                <Eye className="h-5 w-5 text-green-500" />
              ) : (
                <EyeOff className="h-5 w-5 text-muted-foreground" />
              )}
              <div>
                <p className="font-medium">Updates Page Visibility</p>
                <p className="text-sm text-muted-foreground">
                  {pageEnabled ? "The updates page is visible to visitors" : "The updates page is hidden from visitors"}
                </p>
              </div>
            </div>
            <Switch checked={pageEnabled} onCheckedChange={togglePageEnabled} disabled={togglingPage} />
          </div>
        </div>

        {/* Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{editingId ? "Edit Update" : "Add Update"}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <Input
                  placeholder="Title"
                  value={formData.title}
                  onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                  className="rounded-xl"
                />
                <Input
                  placeholder="Version (e.g., v1.2.0)"
                  value={formData.version}
                  onChange={(e) => setFormData({ ...formData, version: e.target.value })}
                  className="rounded-xl"
                />
              </div>
              <Textarea
                placeholder="What's new in this update..."
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="rounded-xl min-h-24"
              />
              <div className="flex justify-end">
                <Button onClick={handleSubmit} disabled={saving} className="rounded-xl">
                  {saving ? (
                    <RefreshCw className="h-4 w-4 animate-spin mr-2" />
                  ) : (
                    <Check className="h-4 w-4 mr-2" />
                  )}
                  {editingId ? "Update" : "Create"}
                </Button>
              </div>
            </div>
          </div>
        )}

        {/* List */}
        {loading ? (
          <div className="flex items-center justify-center py-12">
            <RefreshCw className="h-8 w-8 animate-spin text-primary" />
          </div>
        ) : updates.length === 0 ? (
          <div className="text-center py-12">
            <Sparkles className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No updates created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {updates.map((update) => (
              <div
                key={update._id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{update.title}</h4>
                    <Badge variant="outline" className="bg-cyan-500/20 text-cyan-500 border-cyan-500/30">
                      {update.version}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{update.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(update.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Button variant="outline" size="icon" onClick={() => handleEdit(update)} className="rounded-xl">
                    <Edit2 className="h-4 w-4" />
                  </Button>
                  <AlertDialog>
                    <AlertDialogTrigger asChild>
                      <Button variant="outline" size="icon" className="rounded-xl text-destructive hover:bg-destructive/10">
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </AlertDialogTrigger>
                    <AlertDialogContent>
                      <AlertDialogHeader>
                        <AlertDialogTitle className="flex items-center gap-2">
                          <AlertTriangle className="h-5 w-5 text-destructive" />
                          Delete Update
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this update? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(update._id)}
                          className="rounded-xl bg-destructive hover:bg-destructive/90"
                        >
                          Delete
                        </AlertDialogAction>
                      </AlertDialogFooter>
                    </AlertDialogContent>
                  </AlertDialog>
                </div>
              </div>
            ))}
          </div>
        )}
      </CardContent>
    </Card>
  );
}

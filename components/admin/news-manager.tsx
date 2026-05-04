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
import { Newspaper, Plus, Trash2, Edit2, X, Check, RefreshCw, AlertTriangle } from "lucide-react";

interface NewsItem {
  _id: string;
  title: string;
  content: string;
  active: boolean;
  createdAt: string;
}

export function NewsManager() {
  const [newsList, setNewsList] = useState<NewsItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formData, setFormData] = useState({ title: "", content: "", active: true });
  const [saving, setSaving] = useState(false);

  const fetchNews = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/news");
      if (response.ok) {
        const data = await response.json();
        setNewsList(data);
      }
    } catch (error) {
      console.error("Error fetching news:", error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNews();
  }, []);

  const resetForm = () => {
    setFormData({ title: "", content: "", active: true });
    setShowForm(false);
    setEditingId(null);
  };

  const handleSubmit = async () => {
    if (!formData.title.trim() || !formData.content.trim()) return;

    setSaving(true);
    try {
      const url = editingId ? `/api/admin/news/${editingId}` : "/api/admin/news";
      const method = editingId ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(formData),
      });

      if (response.ok) {
        resetForm();
        fetchNews();
      }
    } catch (error) {
      console.error("Error saving news:", error);
    } finally {
      setSaving(false);
    }
  };

  const handleEdit = (news: NewsItem) => {
    setFormData({ title: news.title, content: news.content, active: news.active });
    setEditingId(news._id);
    setShowForm(true);
  };

  const handleDelete = async (id: string) => {
    try {
      const response = await fetch(`/api/admin/news/${id}`, { method: "DELETE" });
      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error("Error deleting news:", error);
    }
  };

  const toggleActive = async (news: NewsItem) => {
    try {
      const response = await fetch(`/api/admin/news/${news._id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ ...news, active: !news.active }),
      });
      if (response.ok) {
        fetchNews();
      }
    } catch (error) {
      console.error("Error toggling news:", error);
    }
  };

  return (
    <Card className="bg-card border-border">
      <CardHeader>
        <div className="flex items-center justify-between">
          <div>
            <CardTitle className="flex items-center gap-2">
              <Newspaper className="h-5 w-5 text-primary" />
              News Management
            </CardTitle>
            <CardDescription>
              Create and manage news popups shown to visitors
            </CardDescription>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm" onClick={fetchNews} className="rounded-xl">
              <RefreshCw className="h-4 w-4" />
            </Button>
            <Button size="sm" onClick={() => setShowForm(true)} className="rounded-xl">
              <Plus className="h-4 w-4 mr-2" />
              Add News
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        {/* Form */}
        {showForm && (
          <div className="mb-6 rounded-xl border border-border bg-secondary/30 p-4">
            <div className="mb-4 flex items-center justify-between">
              <h3 className="font-semibold">{editingId ? "Edit News" : "Add News"}</h3>
              <Button variant="ghost" size="icon" onClick={resetForm}>
                <X className="h-4 w-4" />
              </Button>
            </div>
            <div className="space-y-4">
              <Input
                placeholder="Title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                className="rounded-xl"
              />
              <Textarea
                placeholder="Content"
                value={formData.content}
                onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                className="rounded-xl min-h-24"
              />
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Switch
                    checked={formData.active}
                    onCheckedChange={(checked) => setFormData({ ...formData, active: checked })}
                  />
                  <span className="text-sm">Set as active (show to visitors)</span>
                </div>
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
        ) : newsList.length === 0 ? (
          <div className="text-center py-12">
            <Newspaper className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
            <p className="text-muted-foreground">No news created yet</p>
          </div>
        ) : (
          <div className="space-y-3">
            {newsList.map((news) => (
              <div
                key={news._id}
                className="flex items-start justify-between gap-4 rounded-xl border border-border p-4 hover:bg-secondary/30 transition-colors"
              >
                <div className="flex-1">
                  <div className="flex items-center gap-2 mb-1">
                    <h4 className="font-medium">{news.title}</h4>
                    <Badge
                      variant="outline"
                      className={
                        news.active
                          ? "bg-green-500/20 text-green-500 border-green-500/30"
                          : "bg-gray-500/20 text-gray-500 border-gray-500/30"
                      }
                    >
                      {news.active ? "Active" : "Inactive"}
                    </Badge>
                  </div>
                  <p className="text-sm text-muted-foreground line-clamp-2">{news.content}</p>
                  <p className="text-xs text-muted-foreground mt-2">
                    Created: {new Date(news.createdAt).toLocaleDateString()}
                  </p>
                </div>
                <div className="flex items-center gap-2">
                  <Switch checked={news.active} onCheckedChange={() => toggleActive(news)} />
                  <Button variant="outline" size="icon" onClick={() => handleEdit(news)} className="rounded-xl">
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
                          Delete News
                        </AlertDialogTitle>
                        <AlertDialogDescription>
                          Are you sure you want to delete this news? This action cannot be undone.
                        </AlertDialogDescription>
                      </AlertDialogHeader>
                      <AlertDialogFooter>
                        <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                        <AlertDialogAction
                          onClick={() => handleDelete(news._id)}
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

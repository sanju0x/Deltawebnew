"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
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
import { Plus, RefreshCw, Trash2, Edit, Users, AlertTriangle, ExternalLink } from "lucide-react";
import Image from "next/image";

interface TeamMember {
  _id: string;
  name: string;
  avatar: string;
  avatarUrl?: string;
  role: string;
  roleCategory: string;
  socialLink?: string;
  order: number;
}

const roleCategories = [
  "Founder",
  "Owner",
  "Developer",
  "Assistant Developer",
  "Council",
  "Audio Server Manager",
];

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    avatarUrl: "",
    role: "",
    roleCategory: "Developer",
    socialLink: "",
    order: 0,
  });

  const fetchMembers = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/team");
      if (response.ok) {
        const data = await response.json();
        setMembers(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching team:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchMembers();
  }, []);

  const handleSubmit = async () => {
    try {
      if (editingMember) {
        await fetch(`/api/admin/team/${editingMember._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      } else {
        await fetch("/api/admin/team", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchMembers();
    } catch (error) {
      console.error("Error saving team member:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/team/${id}`, { method: "DELETE" });
      fetchMembers();
    } catch (error) {
      console.error("Error deleting team member:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      avatar: "",
      avatarUrl: "",
      role: "",
      roleCategory: "Developer",
      socialLink: "",
      order: 0,
    });
    setEditingMember(null);
  };

  const openEditDialog = (member: TeamMember) => {
    setEditingMember(member);
    setFormData({
      name: member.name,
      avatar: member.avatar,
      avatarUrl: member.avatarUrl || "",
      role: member.role,
      roleCategory: member.roleCategory,
      socialLink: member.socialLink || "",
      order: member.order,
    });
    setDialogOpen(true);
  };

  const groupedMembers = members.reduce((acc, member) => {
    if (!acc[member.roleCategory]) {
      acc[member.roleCategory] = [];
    }
    acc[member.roleCategory].push(member);
    return acc;
  }, {} as Record<string, TeamMember[]>);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Management
              </CardTitle>
              <CardDescription>
                Manage team members with custom avatars and roles
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchMembers} className="rounded-xl">
                <RefreshCw className="h-4 w-4 mr-2" />
                Refresh
              </Button>
              <Dialog open={dialogOpen} onOpenChange={(open) => {
                setDialogOpen(open);
                if (!open) resetForm();
              }}>
                <DialogTrigger asChild>
                  <Button size="sm" className="rounded-xl">
                    <Plus className="h-4 w-4 mr-2" />
                    Add Member
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-md">
                  <DialogHeader>
                    <DialogTitle>{editingMember ? "Edit" : "Add"} Team Member</DialogTitle>
                    <DialogDescription>
                      Fill in the details for the team member
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="John Doe"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Avatar Initials</Label>
                        <Input
                          value={formData.avatar}
                          onChange={(e) => setFormData({ ...formData, avatar: e.target.value })}
                          placeholder="JD"
                          maxLength={3}
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Avatar URL (optional)</Label>
                      <Input
                        value={formData.avatarUrl}
                        onChange={(e) => setFormData({ ...formData, avatarUrl: e.target.value })}
                        placeholder="https://example.com/avatar.png"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role Title</Label>
                      <Input
                        value={formData.role}
                        onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                        placeholder="Lead Developer"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Role Category</Label>
                      <Select
                        value={formData.roleCategory}
                        onValueChange={(value) => setFormData({ ...formData, roleCategory: value })}
                      >
                        <SelectTrigger>
                          <SelectValue />
                        </SelectTrigger>
                        <SelectContent>
                          {roleCategories.map((cat) => (
                            <SelectItem key={cat} value={cat}>{cat}</SelectItem>
                          ))}
                        </SelectContent>
                      </Select>
                    </div>
                    <div className="space-y-2">
                      <Label>Social Link (optional)</Label>
                      <Input
                        value={formData.socialLink}
                        onChange={(e) => setFormData({ ...formData, socialLink: e.target.value })}
                        placeholder="https://twitter.com/username"
                      />
                    </div>
                    <div className="space-y-2">
                      <Label>Display Order</Label>
                      <Input
                        type="number"
                        value={formData.order}
                        onChange={(e) => setFormData({ ...formData, order: parseInt(e.target.value) || 0 })}
                      />
                    </div>
                  </div>
                  <DialogFooter>
                    <Button variant="outline" onClick={() => setDialogOpen(false)}>Cancel</Button>
                    <Button onClick={handleSubmit}>
                      {editingMember ? "Save Changes" : "Add Member"}
                    </Button>
                  </DialogFooter>
                </DialogContent>
              </Dialog>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          {loading ? (
            <div className="flex items-center justify-center py-12">
              <RefreshCw className="h-8 w-8 animate-spin text-primary" />
            </div>
          ) : members.length === 0 ? (
            <div className="text-center py-12">
              <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No team members added yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {Object.entries(groupedMembers).map(([category, categoryMembers]) => (
                <div key={category}>
                  <h3 className="text-lg font-semibold mb-3 text-foreground">{category}</h3>
                  <div className="grid gap-3">
                    {categoryMembers.map((member) => (
                      <div
                        key={member._id}
                        className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/20"
                      >
                        <div className="flex items-center gap-4">
                          {member.avatarUrl ? (
                            <div className="h-12 w-12 rounded-xl overflow-hidden">
                              <Image
                                src={member.avatarUrl}
                                alt={member.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
                              {member.avatar}
                            </div>
                          )}
                          <div>
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-foreground">{member.name}</span>
                              {member.socialLink && (
                                <a href={member.socialLink} target="_blank" rel="noopener noreferrer">
                                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                </a>
                              )}
                            </div>
                            <span className="text-sm text-muted-foreground">{member.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="rounded-xl"
                            onClick={() => openEditDialog(member)}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
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
                                  Delete Team Member
                                </AlertDialogTitle>
                                <AlertDialogDescription>
                                  Are you sure you want to delete {member.name}? This action cannot be undone.
                                </AlertDialogDescription>
                              </AlertDialogHeader>
                              <AlertDialogFooter>
                                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                <AlertDialogAction
                                  onClick={() => handleDelete(member._id)}
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
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

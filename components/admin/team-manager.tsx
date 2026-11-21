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
import { ArrowDown, ArrowUp, CheckCircle2, Plus, RefreshCw, Trash2, Edit, Users, AlertTriangle, ExternalLink, GripVertical } from "lucide-react";
import Image from "next/image";
import { TEAM_ROLE_CATEGORIES, normalizeTeamRoleCategory } from "@/lib/team-roles";
import type { TeamRoleCategory } from "@/lib/team-roles";

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

export function TeamManager() {
  const [members, setMembers] = useState<TeamMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingMember, setEditingMember] = useState<TeamMember | null>(null);
  const [draggedMemberId, setDraggedMemberId] = useState<string | null>(null);
  const [dropTarget, setDropTarget] = useState<string | null>(null);
  const [reordering, setReordering] = useState(false);
  const [reorderState, setReorderState] = useState<"idle" | "saved" | "error">("idle");
  const [formData, setFormData] = useState({
    name: "",
    avatar: "",
    avatarUrl: "",
    role: "",
    roleCategory: "Lead Developer",
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
        setReorderState("idle");
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

  const createGroups = (source: TeamMember[]) => {
    const groups = Object.fromEntries(
      TEAM_ROLE_CATEGORIES.map((category) => [category, [] as TeamMember[]]),
    ) as Record<TeamRoleCategory, TeamMember[]>;

    source.forEach((member) => {
      groups[normalizeTeamRoleCategory(member.roleCategory)].push(member);
    });
    Object.values(groups).forEach((group) => group.sort((left, right) => left.order - right.order));
    return groups;
  };

  const saveGroups = async (groups: Record<TeamRoleCategory, TeamMember[]>, previousMembers: TeamMember[]) => {
    const nextMembers = TEAM_ROLE_CATEGORIES.flatMap((category) =>
      groups[category].map((member, order) => ({ ...member, roleCategory: category, order })),
    );

    setMembers(nextMembers);
    setReordering(true);
    setReorderState("idle");

    try {
      const response = await fetch("/api/admin/team/reorder", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          members: nextMembers.map((member) => ({ id: member._id, roleCategory: member.roleCategory, order: member.order })),
        }),
      });
      if (!response.ok) throw new Error("Could not save team order");
      setReorderState("saved");
    } catch (error) {
      console.error("Error reordering team:", error);
      setMembers(previousMembers);
      setReorderState("error");
    } finally {
      setReordering(false);
      setDraggedMemberId(null);
      setDropTarget(null);
    }
  };

  const moveMember = (memberId: string, targetCategory: TeamRoleCategory, targetMemberId?: string) => {
    if (reordering) return;
    if (targetMemberId === memberId) return;
    const previousMembers = members;
    const groups = createGroups(members);
    const sourceCategory = TEAM_ROLE_CATEGORIES.find((category) => groups[category].some((member) => member._id === memberId));
    if (!sourceCategory) return;

    const sourceIndex = groups[sourceCategory].findIndex((member) => member._id === memberId);
    const [member] = groups[sourceCategory].splice(sourceIndex, 1);
    const targetIndex = targetMemberId
      ? groups[targetCategory].findIndex((item) => item._id === targetMemberId)
      : groups[targetCategory].length;
    groups[targetCategory].splice(targetIndex < 0 ? groups[targetCategory].length : targetIndex, 0, member);
    void saveGroups(groups, previousMembers);
  };

  const moveMemberBy = (memberId: string, offset: -1 | 1) => {
    if (reordering) return;
    const previousMembers = members;
    const groups = createGroups(members);
    const category = TEAM_ROLE_CATEGORIES.find((item) => groups[item].some((member) => member._id === memberId));
    if (!category) return;
    const index = groups[category].findIndex((member) => member._id === memberId);
    const nextIndex = index + offset;
    if (nextIndex < 0 || nextIndex >= groups[category].length) return;
    [groups[category][index], groups[category][nextIndex]] = [groups[category][nextIndex], groups[category][index]];
    void saveGroups(groups, previousMembers);
  };

  const resetForm = () => {
    setFormData({
      name: "",
      avatar: "",
      avatarUrl: "",
      role: "",
      roleCategory: "Lead Developer",
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
      roleCategory: normalizeTeamRoleCategory(member.roleCategory),
      socialLink: member.socialLink || "",
      order: member.order,
    });
    setDialogOpen(true);
  };

  const groupedMembers = createGroups(members);

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Users className="h-5 w-5 text-primary" />
                Team Management
              </CardTitle>
              <CardDescription>
                Drag members to reorder them or move them between role categories
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
                          {TEAM_ROLE_CATEGORIES.map((cat) => (
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
              <div id="team-reorder-help" className="flex flex-col gap-3 rounded-xl border border-border bg-secondary/30 p-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
                <div className="flex items-start gap-3">
                  <GripVertical className="mt-0.5 h-4 w-4 shrink-0 text-primary" />
                  <p>Drag a member by the handle to reorder or move them to another role. Use the arrows to reorder on touch devices, or Edit to change roles.</p>
                </div>
                <div className="min-h-5 shrink-0" aria-live="polite">
                  {reordering && <span className="inline-flex items-center gap-2 font-medium text-foreground"><RefreshCw className="h-4 w-4 animate-spin" />Saving order...</span>}
                  {reorderState === "saved" && <span className="inline-flex items-center gap-2 font-medium text-emerald-600"><CheckCircle2 className="h-4 w-4" />Order saved</span>}
                  {reorderState === "error" && <span className="font-medium text-destructive">Could not save. Order restored.</span>}
                </div>
              </div>

              {TEAM_ROLE_CATEGORIES.map((category) => {
                  const categoryMembers = groupedMembers[category];
                  return (
                <section
                  key={category}
                  className={`rounded-2xl border p-3 transition-colors sm:p-4 ${dropTarget === `category:${category}` ? "border-primary bg-primary/5" : "border-border/70"}`}
                  onDragOver={(event) => {
                    event.preventDefault();
                    event.dataTransfer.dropEffect = "move";
                    setDropTarget(`category:${category}`);
                  }}
                  onDrop={(event) => {
                    event.preventDefault();
                    const memberId = draggedMemberId || event.dataTransfer.getData("text/plain");
                    if (memberId) moveMember(memberId, category);
                  }}
                >
                  <div className="mb-3 flex items-center justify-between gap-3 px-1">
                    <h3 className="text-base font-semibold text-foreground sm:text-lg">{category}</h3>
                    <span className="rounded-full bg-secondary px-2.5 py-1 text-xs font-semibold text-muted-foreground">{categoryMembers.length}</span>
                  </div>
                  <div className="grid gap-3">
                    {categoryMembers.length === 0 && (
                      <div className={`grid min-h-20 place-items-center rounded-xl border border-dashed text-sm transition-colors ${dropTarget === `category:${category}` ? "border-primary text-primary" : "border-border text-muted-foreground"}`}>
                        Drop a member here
                      </div>
                    )}
                    {categoryMembers.map((member, index) => (
                      <div
                        key={member._id}
                        onDragOver={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          event.dataTransfer.dropEffect = "move";
                          setDropTarget(`member:${member._id}`);
                        }}
                        onDrop={(event) => {
                          event.preventDefault();
                          event.stopPropagation();
                          const memberId = draggedMemberId || event.dataTransfer.getData("text/plain");
                          if (memberId) moveMember(memberId, category, member._id);
                        }}
                        className={`flex flex-col gap-3 rounded-xl border bg-card p-3 transition-[border-color,box-shadow,opacity] sm:flex-row sm:items-center sm:justify-between sm:p-4 ${draggedMemberId === member._id ? "opacity-40" : "opacity-100"} ${dropTarget === `member:${member._id}` ? "border-primary shadow-md shadow-primary/10" : "border-border"}`}
                      >
                        <div className="flex min-w-0 items-center gap-3 sm:gap-4">
                          <span
                            draggable={!reordering}
                            role="button"
                            tabIndex={0}
                            aria-label={`Drag ${member.name} to reorder`}
                            aria-describedby="team-reorder-help"
                            onDragStart={(event) => {
                              setDraggedMemberId(member._id);
                              event.dataTransfer.effectAllowed = "move";
                              event.dataTransfer.setData("text/plain", member._id);
                            }}
                            onDragEnd={() => {
                              setDraggedMemberId(null);
                              setDropTarget(null);
                            }}
                            onKeyDown={(event) => {
                              if (event.key === "ArrowUp") {
                                event.preventDefault();
                                moveMemberBy(member._id, -1);
                              }
                              if (event.key === "ArrowDown") {
                                event.preventDefault();
                                moveMemberBy(member._id, 1);
                              }
                            }}
                            className="grid size-11 shrink-0 cursor-grab place-items-center rounded-xl border border-border bg-secondary text-muted-foreground outline-none transition-colors hover:border-primary/30 hover:text-primary focus-visible:ring-2 focus-visible:ring-ring active:cursor-grabbing"
                          >
                            <GripVertical className="h-5 w-5" />
                          </span>
                          {member.avatarUrl ? (
                            <div className="h-12 w-12 shrink-0 overflow-hidden rounded-xl">
                              <Image
                                src={member.avatarUrl}
                                alt={member.name}
                                width={48}
                                height={48}
                                className="h-full w-full object-cover"
                              />
                            </div>
                          ) : (
                            <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-xl bg-primary/20 font-bold text-primary">
                              {member.avatar}
                            </div>
                          )}
                          <div className="min-w-0">
                            <div className="flex items-center gap-2">
                              <span className="truncate font-medium text-foreground">{member.name}</span>
                              {member.socialLink && (
                                <a href={member.socialLink} target="_blank" rel="noopener noreferrer" aria-label={`Open ${member.name}'s profile`}>
                                  <ExternalLink className="h-3 w-3 text-muted-foreground hover:text-primary" />
                                </a>
                              )}
                            </div>
                            <span className="block truncate text-sm text-muted-foreground">{member.role}</span>
                          </div>
                        </div>
                        <div className="flex items-center justify-end gap-2">
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-11 rounded-xl"
                            onClick={() => moveMemberBy(member._id, -1)}
                            disabled={reordering || index === 0}
                            aria-label={`Move ${member.name} up`}
                            title="Move up"
                          >
                            <ArrowUp className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-11 rounded-xl"
                            onClick={() => moveMemberBy(member._id, 1)}
                            disabled={reordering || index === categoryMembers.length - 1}
                            aria-label={`Move ${member.name} down`}
                            title="Move down"
                          >
                            <ArrowDown className="h-4 w-4" />
                          </Button>
                          <Button
                            variant="outline"
                            size="icon"
                            className="size-11 rounded-xl"
                            onClick={() => openEditDialog(member)}
                            aria-label={`Edit ${member.name}`}
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <AlertDialog>
                            <AlertDialogTrigger asChild>
                              <Button
                                variant="outline"
                                size="icon"
                                className="size-11 rounded-xl text-destructive hover:bg-destructive/10"
                                aria-label={`Delete ${member.name}`}
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
                </section>
              );
              })}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

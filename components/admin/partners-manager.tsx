"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import { Plus, RefreshCw, Trash2, Edit, Handshake, AlertTriangle, Star, Users, ImageIcon } from "lucide-react";
import Image from "next/image";

interface Partner {
  _id: string;
  name: string;
  description: string;
  logo: string;
  iconUrl?: string;
  bannerUrl?: string;
  website?: string;
  inviteLink?: string;
  members?: string;
  type: "featured" | "community";
  features?: string[];
  order: number;
}

export function PartnersManager() {
  const [partners, setPartners] = useState<Partner[]>([]);
  const [loading, setLoading] = useState(true);
  const [dialogOpen, setDialogOpen] = useState(false);
  const [editingPartner, setEditingPartner] = useState<Partner | null>(null);
  const [formData, setFormData] = useState({
    name: "",
    description: "",
    logo: "",
    iconUrl: "",
    bannerUrl: "",
    website: "",
    inviteLink: "",
    members: "",
    type: "community" as "featured" | "community",
    features: "",
    order: 0,
  });

  const fetchPartners = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/partners");
      if (response.ok) {
        const data = await response.json();
        setPartners(data.data || []);
      }
    } catch (error) {
      console.error("Error fetching partners:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchPartners();
  }, []);

  const handleSubmit = async () => {
    try {
      const submitData = {
        ...formData,
        features: formData.features.split(",").map((f) => f.trim()).filter(Boolean),
      };

      if (editingPartner) {
        await fetch(`/api/admin/partners/${editingPartner._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      } else {
        await fetch("/api/admin/partners", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(submitData),
        });
      }
      setDialogOpen(false);
      resetForm();
      fetchPartners();
    } catch (error) {
      console.error("Error saving partner:", error);
    }
  };

  const handleDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/partners/${id}`, { method: "DELETE" });
      fetchPartners();
    } catch (error) {
      console.error("Error deleting partner:", error);
    }
  };

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      logo: "",
      iconUrl: "",
      bannerUrl: "",
      website: "",
      inviteLink: "",
      members: "",
      type: "community",
      features: "",
      order: 0,
    });
    setEditingPartner(null);
  };

  const openEditDialog = (partner: Partner) => {
    setEditingPartner(partner);
    setFormData({
      name: partner.name,
      description: partner.description,
      logo: partner.logo,
      iconUrl: partner.iconUrl || "",
      bannerUrl: partner.bannerUrl || "",
      website: partner.website || "",
      inviteLink: partner.inviteLink || "",
      members: partner.members || "",
      type: partner.type,
      features: partner.features?.join(", ") || "",
      order: partner.order,
    });
    setDialogOpen(true);
  };

  const featuredPartners = partners.filter((p) => p.type === "featured");
  const communityPartners = partners.filter((p) => p.type === "community");

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Handshake className="h-5 w-5 text-primary" />
                Partners Management
              </CardTitle>
              <CardDescription>
                Manage partners with server icons and banners
              </CardDescription>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" size="sm" onClick={fetchPartners} className="rounded-xl">
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
                    Add Partner
                  </Button>
                </DialogTrigger>
                <DialogContent className="max-w-lg max-h-[90vh] overflow-y-auto">
                  <DialogHeader>
                    <DialogTitle>{editingPartner ? "Edit" : "Add"} Partner</DialogTitle>
                    <DialogDescription>
                      Fill in the partner details including server icon and banner
                    </DialogDescription>
                  </DialogHeader>
                  <div className="space-y-4">
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Name</Label>
                        <Input
                          value={formData.name}
                          onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                          placeholder="Partner Name"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Type</Label>
                        <Select
                          value={formData.type}
                          onValueChange={(value: "featured" | "community") => setFormData({ ...formData, type: value })}
                        >
                          <SelectTrigger>
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="featured">Featured</SelectItem>
                            <SelectItem value="community">Community</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Description</Label>
                      <Textarea
                        value={formData.description}
                        onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                        placeholder="Partner description..."
                        rows={3}
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Logo Initials</Label>
                        <Input
                          value={formData.logo}
                          onChange={(e) => setFormData({ ...formData, logo: e.target.value })}
                          placeholder="AB"
                          maxLength={3}
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Members</Label>
                        <Input
                          value={formData.members}
                          onChange={(e) => setFormData({ ...formData, members: e.target.value })}
                          placeholder="50K+"
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Server Icon URL
                      </Label>
                      <Input
                        value={formData.iconUrl}
                        onChange={(e) => setFormData({ ...formData, iconUrl: e.target.value })}
                        placeholder="https://cdn.discordapp.com/icons/..."
                      />
                    </div>
                    <div className="space-y-2">
                      <Label className="flex items-center gap-2">
                        <ImageIcon className="h-4 w-4" />
                        Server Banner URL
                      </Label>
                      <Input
                        value={formData.bannerUrl}
                        onChange={(e) => setFormData({ ...formData, bannerUrl: e.target.value })}
                        placeholder="https://cdn.discordapp.com/banners/..."
                      />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <Label>Website URL</Label>
                        <Input
                          value={formData.website}
                          onChange={(e) => setFormData({ ...formData, website: e.target.value })}
                          placeholder="https://example.com"
                        />
                      </div>
                      <div className="space-y-2">
                        <Label>Invite Link</Label>
                        <Input
                          value={formData.inviteLink}
                          onChange={(e) => setFormData({ ...formData, inviteLink: e.target.value })}
                          placeholder="https://discord.gg/..."
                        />
                      </div>
                    </div>
                    <div className="space-y-2">
                      <Label>Features (comma separated)</Label>
                      <Input
                        value={formData.features}
                        onChange={(e) => setFormData({ ...formData, features: e.target.value })}
                        placeholder="24/7 Support, DDoS Protection, Auto Scaling"
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
                      {editingPartner ? "Save Changes" : "Add Partner"}
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
          ) : partners.length === 0 ? (
            <div className="text-center py-12">
              <Handshake className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
              <p className="text-muted-foreground">No partners added yet</p>
            </div>
          ) : (
            <div className="space-y-6">
              {featuredPartners.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-500" />
                    Featured Partners
                  </h3>
                  <div className="grid gap-3">
                    {featuredPartners.map((partner) => (
                      <PartnerCard
                        key={partner._id}
                        partner={partner}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
              {communityPartners.length > 0 && (
                <div>
                  <h3 className="text-lg font-semibold mb-3 text-foreground flex items-center gap-2">
                    <Users className="h-4 w-4 text-primary" />
                    Community Partners
                  </h3>
                  <div className="grid gap-3">
                    {communityPartners.map((partner) => (
                      <PartnerCard
                        key={partner._id}
                        partner={partner}
                        onEdit={openEditDialog}
                        onDelete={handleDelete}
                      />
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function PartnerCard({
  partner,
  onEdit,
  onDelete,
}: {
  partner: Partner;
  onEdit: (partner: Partner) => void;
  onDelete: (id: string) => void;
}) {
  return (
    <div className="border border-border rounded-xl bg-secondary/20 overflow-hidden">
      {partner.bannerUrl && (
        <div className="h-16 w-full relative">
          <Image
            src={partner.bannerUrl}
            alt={`${partner.name} banner`}
            fill
            className="object-cover"
          />
        </div>
      )}
      <div className="p-4 flex items-center justify-between">
        <div className="flex items-center gap-4">
          {partner.iconUrl ? (
            <div className="h-12 w-12 rounded-xl overflow-hidden">
              <Image
                src={partner.iconUrl}
                alt={partner.name}
                width={48}
                height={48}
                className="h-full w-full object-cover"
              />
            </div>
          ) : (
            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center text-primary font-bold">
              {partner.logo}
            </div>
          )}
          <div>
            <div className="flex items-center gap-2">
              <span className="font-medium text-foreground">{partner.name}</span>
              <span className={`text-xs px-2 py-0.5 rounded-full ${
                partner.type === "featured" 
                  ? "bg-yellow-500/20 text-yellow-500" 
                  : "bg-primary/20 text-primary"
              }`}>
                {partner.type}
              </span>
            </div>
            <span className="text-sm text-muted-foreground line-clamp-1">{partner.description}</span>
            {partner.members && (
              <span className="text-xs text-primary">{partner.members} members</span>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button
            variant="outline"
            size="icon"
            className="rounded-xl"
            onClick={() => onEdit(partner)}
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
                  Delete Partner
                </AlertDialogTitle>
                <AlertDialogDescription>
                  Are you sure you want to delete {partner.name}? This action cannot be undone.
                </AlertDialogDescription>
              </AlertDialogHeader>
              <AlertDialogFooter>
                <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                <AlertDialogAction
                  onClick={() => onDelete(partner._id)}
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
  );
}

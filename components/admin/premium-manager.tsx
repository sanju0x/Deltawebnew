"use client";

import { useState, useEffect } from "react";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
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
import {
  Plus,
  RefreshCw,
  Trash2,
  Edit,
  Crown,
  Users,
  Server,
  AlertTriangle,
  Calendar,
  CreditCard,
  Sparkles,
  Settings,
} from "lucide-react";

interface PremiumUser {
  _id: string;
  discordId: string;
  discordUsername?: string;
  planId: string;
  expiresAt: string;
  features: string[];
  createdAt: string;
}

interface PremiumServer {
  _id: string;
  serverId: string;
  serverName?: string;
  planId: string;
  expiresAt: string;
  features: string[];
  addedBy: string;
  createdAt: string;
}

interface PremiumPlan {
  _id: string;
  name: string;
  price: number;
  duration: number; // in days
  features: string[];
  color: string;
  popular: boolean;
  order: number;
}

export function PremiumManager() {
  const [users, setUsers] = useState<PremiumUser[]>([]);
  const [servers, setServers] = useState<PremiumServer[]>([]);
  const [plans, setPlans] = useState<PremiumPlan[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState("users");

  // User dialog state
  const [userDialogOpen, setUserDialogOpen] = useState(false);
  const [editingUser, setEditingUser] = useState<PremiumUser | null>(null);
  const [userFormData, setUserFormData] = useState({
    discordId: "",
    discordUsername: "",
    planId: "",
    expiresAt: "",
    features: "",
  });

  // Server dialog state
  const [serverDialogOpen, setServerDialogOpen] = useState(false);
  const [editingServer, setEditingServer] = useState<PremiumServer | null>(null);
  const [serverFormData, setServerFormData] = useState({
    serverId: "",
    serverName: "",
    planId: "",
    expiresAt: "",
    features: "",
    addedBy: "",
  });

  // Plan dialog state
  const [planDialogOpen, setPlanDialogOpen] = useState(false);
  const [editingPlan, setEditingPlan] = useState<PremiumPlan | null>(null);
  const [planFormData, setPlanFormData] = useState({
    name: "",
    price: 0,
    duration: 30,
    features: "",
    color: "from-primary to-red-700",
    popular: false,
    order: 0,
  });

  const fetchData = async () => {
    setLoading(true);
    try {
      const response = await fetch("/api/admin/premium-management");
      if (response.ok) {
        const data = await response.json();
        setUsers(data.users || []);
        setServers(data.servers || []);
        setPlans(data.plans || []);
      }
    } catch (error) {
      console.error("Error fetching premium data:", error);
    }
    setLoading(false);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // User handlers
  const handleUserSubmit = async () => {
    try {
      const payload = {
        ...userFormData,
        features: userFormData.features.split(",").map((f) => f.trim()).filter(Boolean),
      };

      if (editingUser) {
        await fetch(`/api/admin/premium-management/users/${editingUser._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/premium-management/users", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setUserDialogOpen(false);
      resetUserForm();
      fetchData();
    } catch (error) {
      console.error("Error saving premium user:", error);
    }
  };

  const handleUserDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/premium-management/users/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting premium user:", error);
    }
  };

  const resetUserForm = () => {
    setUserFormData({
      discordId: "",
      discordUsername: "",
      planId: "",
      expiresAt: "",
      features: "",
    });
    setEditingUser(null);
  };

  const openEditUserDialog = (user: PremiumUser) => {
    setEditingUser(user);
    setUserFormData({
      discordId: user.discordId,
      discordUsername: user.discordUsername || "",
      planId: user.planId,
      expiresAt: user.expiresAt.split("T")[0],
      features: user.features.join(", "),
    });
    setUserDialogOpen(true);
  };

  // Server handlers
  const handleServerSubmit = async () => {
    try {
      const payload = {
        ...serverFormData,
        features: serverFormData.features.split(",").map((f) => f.trim()).filter(Boolean),
      };

      if (editingServer) {
        await fetch(`/api/admin/premium-management/servers/${editingServer._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/premium-management/servers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setServerDialogOpen(false);
      resetServerForm();
      fetchData();
    } catch (error) {
      console.error("Error saving premium server:", error);
    }
  };

  const handleServerDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/premium-management/servers/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting premium server:", error);
    }
  };

  const resetServerForm = () => {
    setServerFormData({
      serverId: "",
      serverName: "",
      planId: "",
      expiresAt: "",
      features: "",
      addedBy: "",
    });
    setEditingServer(null);
  };

  const openEditServerDialog = (server: PremiumServer) => {
    setEditingServer(server);
    setServerFormData({
      serverId: server.serverId,
      serverName: server.serverName || "",
      planId: server.planId,
      expiresAt: server.expiresAt.split("T")[0],
      features: server.features.join(", "),
      addedBy: server.addedBy,
    });
    setServerDialogOpen(true);
  };

  // Plan handlers
  const handlePlanSubmit = async () => {
    try {
      const payload = {
        ...planFormData,
        features: planFormData.features.split(",").map((f) => f.trim()).filter(Boolean),
      };

      if (editingPlan) {
        await fetch(`/api/admin/premium-management/plans/${editingPlan._id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        await fetch("/api/admin/premium-management/plans", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }
      setPlanDialogOpen(false);
      resetPlanForm();
      fetchData();
    } catch (error) {
      console.error("Error saving premium plan:", error);
    }
  };

  const handlePlanDelete = async (id: string) => {
    try {
      await fetch(`/api/admin/premium-management/plans/${id}`, { method: "DELETE" });
      fetchData();
    } catch (error) {
      console.error("Error deleting premium plan:", error);
    }
  };

  const resetPlanForm = () => {
    setPlanFormData({
      name: "",
      price: 0,
      duration: 30,
      features: "",
      color: "from-primary to-red-700",
      popular: false,
      order: 0,
    });
    setEditingPlan(null);
  };

  const openEditPlanDialog = (plan: PremiumPlan) => {
    setEditingPlan(plan);
    setPlanFormData({
      name: plan.name,
      price: plan.price,
      duration: plan.duration,
      features: plan.features.join(", "),
      color: plan.color,
      popular: plan.popular,
      order: plan.order,
    });
    setPlanDialogOpen(true);
  };

  const isExpired = (date: string) => new Date(date) < new Date();
  const getPlanName = (planId: string) => plans.find((p) => p._id === planId)?.name || "Unknown";

  return (
    <div className="space-y-6">
      <Card className="bg-card border-border">
        <CardHeader>
          <div className="flex items-center justify-between">
            <div>
              <CardTitle className="flex items-center gap-2">
                <Crown className="h-5 w-5 text-yellow-500" />
                Premium Management
              </CardTitle>
              <CardDescription>
                Manage premium users, servers, and subscription plans
              </CardDescription>
            </div>
            <Button variant="outline" size="sm" onClick={fetchData} className="rounded-xl">
              <RefreshCw className="h-4 w-4 mr-2" />
              Refresh
            </Button>
          </div>
        </CardHeader>
        <CardContent>
          <Tabs value={activeTab} onValueChange={setActiveTab}>
            <TabsList className="grid w-full grid-cols-3 rounded-xl bg-secondary/50 p-1 mb-6">
              <TabsTrigger value="users" className="rounded-lg data-[state=active]:bg-card flex items-center gap-2">
                <Users className="h-4 w-4" />
                <span className="hidden sm:inline">Users ({users.length})</span>
              </TabsTrigger>
              <TabsTrigger value="servers" className="rounded-lg data-[state=active]:bg-card flex items-center gap-2">
                <Server className="h-4 w-4" />
                <span className="hidden sm:inline">Servers ({servers.length})</span>
              </TabsTrigger>
              <TabsTrigger value="plans" className="rounded-lg data-[state=active]:bg-card flex items-center gap-2">
                <CreditCard className="h-4 w-4" />
                <span className="hidden sm:inline">Plans ({plans.length})</span>
              </TabsTrigger>
            </TabsList>

            {loading ? (
              <div className="flex items-center justify-center py-12">
                <RefreshCw className="h-8 w-8 animate-spin text-primary" />
              </div>
            ) : (
              <>
                {/* Users Tab */}
                <TabsContent value="users" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={userDialogOpen} onOpenChange={(open) => {
                      setUserDialogOpen(open);
                      if (!open) resetUserForm();
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Premium User
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingUser ? "Edit" : "Add"} Premium User</DialogTitle>
                          <DialogDescription>
                            Grant premium access to a Discord user
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Discord User ID</Label>
                            <Input
                              value={userFormData.discordId}
                              onChange={(e) => setUserFormData({ ...userFormData, discordId: e.target.value })}
                              placeholder="123456789012345678"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Discord Username (optional)</Label>
                            <Input
                              value={userFormData.discordUsername}
                              onChange={(e) => setUserFormData({ ...userFormData, discordUsername: e.target.value })}
                              placeholder="username#0000"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select
                              value={userFormData.planId}
                              onValueChange={(value) => setUserFormData({ ...userFormData, planId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {plans.map((plan) => (
                                  <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input
                              type="date"
                              value={userFormData.expiresAt}
                              onChange={(e) => setUserFormData({ ...userFormData, expiresAt: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Custom Features (comma separated)</Label>
                            <Input
                              value={userFormData.features}
                              onChange={(e) => setUserFormData({ ...userFormData, features: e.target.value })}
                              placeholder="Unlimited queues, Priority support"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setUserDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleUserSubmit}>
                            {editingUser ? "Save Changes" : "Add User"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {users.length === 0 ? (
                    <div className="text-center py-12">
                      <Users className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No premium users</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {users.map((user) => (
                        <div
                          key={user._id}
                          className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/20"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-yellow-500/20 flex items-center justify-center">
                              <Crown className="h-6 w-6 text-yellow-500" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {user.discordUsername || user.discordId}
                                </span>
                                <Badge variant="outline" className={isExpired(user.expiresAt) ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                                  {isExpired(user.expiresAt) ? "Expired" : "Active"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{getPlanName(user.planId)}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(user.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => openEditUserDialog(user)}
                            >
                              <Edit className="h-4 w-4" />
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
                                    Remove Premium Access
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove premium access for this user?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleUserDelete(user._id)}
                                    className="rounded-xl bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Servers Tab */}
                <TabsContent value="servers" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={serverDialogOpen} onOpenChange={(open) => {
                      setServerDialogOpen(open);
                      if (!open) resetServerForm();
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Premium Server
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingServer ? "Edit" : "Add"} Premium Server</DialogTitle>
                          <DialogDescription>
                            Grant premium access to a Discord server
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="space-y-2">
                            <Label>Server ID</Label>
                            <Input
                              value={serverFormData.serverId}
                              onChange={(e) => setServerFormData({ ...serverFormData, serverId: e.target.value })}
                              placeholder="123456789012345678"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Server Name (optional)</Label>
                            <Input
                              value={serverFormData.serverName}
                              onChange={(e) => setServerFormData({ ...serverFormData, serverName: e.target.value })}
                              placeholder="My Awesome Server"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Plan</Label>
                            <Select
                              value={serverFormData.planId}
                              onValueChange={(value) => setServerFormData({ ...serverFormData, planId: value })}
                            >
                              <SelectTrigger>
                                <SelectValue placeholder="Select a plan" />
                              </SelectTrigger>
                              <SelectContent>
                                {plans.map((plan) => (
                                  <SelectItem key={plan._id} value={plan._id}>{plan.name}</SelectItem>
                                ))}
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Expiry Date</Label>
                            <Input
                              type="date"
                              value={serverFormData.expiresAt}
                              onChange={(e) => setServerFormData({ ...serverFormData, expiresAt: e.target.value })}
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Added By (Discord ID)</Label>
                            <Input
                              value={serverFormData.addedBy}
                              onChange={(e) => setServerFormData({ ...serverFormData, addedBy: e.target.value })}
                              placeholder="Admin Discord ID"
                            />
                          </div>
                          <div className="space-y-2">
                            <Label>Custom Features (comma separated)</Label>
                            <Input
                              value={serverFormData.features}
                              onChange={(e) => setServerFormData({ ...serverFormData, features: e.target.value })}
                              placeholder="Unlimited queues, Custom prefix"
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setServerDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handleServerSubmit}>
                            {editingServer ? "Save Changes" : "Add Server"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {servers.length === 0 ? (
                    <div className="text-center py-12">
                      <Server className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No premium servers</p>
                    </div>
                  ) : (
                    <div className="space-y-3">
                      {servers.map((server) => (
                        <div
                          key={server._id}
                          className="flex items-center justify-between p-4 border border-border rounded-xl bg-secondary/20"
                        >
                          <div className="flex items-center gap-4">
                            <div className="h-12 w-12 rounded-xl bg-primary/20 flex items-center justify-center">
                              <Server className="h-6 w-6 text-primary" />
                            </div>
                            <div>
                              <div className="flex items-center gap-2">
                                <span className="font-medium text-foreground">
                                  {server.serverName || server.serverId}
                                </span>
                                <Badge variant="outline" className={isExpired(server.expiresAt) ? "border-red-500 text-red-500" : "border-green-500 text-green-500"}>
                                  {isExpired(server.expiresAt) ? "Expired" : "Active"}
                                </Badge>
                              </div>
                              <div className="flex items-center gap-2 text-sm text-muted-foreground">
                                <span>{getPlanName(server.planId)}</span>
                                <span className="flex items-center gap-1">
                                  <Calendar className="h-3 w-3" />
                                  {new Date(server.expiresAt).toLocaleDateString()}
                                </span>
                              </div>
                            </div>
                          </div>
                          <div className="flex items-center gap-2">
                            <Button
                              variant="outline"
                              size="icon"
                              className="rounded-xl"
                              onClick={() => openEditServerDialog(server)}
                            >
                              <Edit className="h-4 w-4" />
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
                                    Remove Premium Access
                                  </AlertDialogTitle>
                                  <AlertDialogDescription>
                                    Are you sure you want to remove premium access for this server?
                                  </AlertDialogDescription>
                                </AlertDialogHeader>
                                <AlertDialogFooter>
                                  <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                  <AlertDialogAction
                                    onClick={() => handleServerDelete(server._id)}
                                    className="rounded-xl bg-destructive hover:bg-destructive/90"
                                  >
                                    Remove
                                  </AlertDialogAction>
                                </AlertDialogFooter>
                              </AlertDialogContent>
                            </AlertDialog>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </TabsContent>

                {/* Plans Tab */}
                <TabsContent value="plans" className="space-y-4">
                  <div className="flex justify-end">
                    <Dialog open={planDialogOpen} onOpenChange={(open) => {
                      setPlanDialogOpen(open);
                      if (!open) resetPlanForm();
                    }}>
                      <DialogTrigger asChild>
                        <Button size="sm" className="rounded-xl">
                          <Plus className="h-4 w-4 mr-2" />
                          Add Plan
                        </Button>
                      </DialogTrigger>
                      <DialogContent className="max-w-md">
                        <DialogHeader>
                          <DialogTitle>{editingPlan ? "Edit" : "Add"} Premium Plan</DialogTitle>
                          <DialogDescription>
                            Create or modify a premium subscription plan
                          </DialogDescription>
                        </DialogHeader>
                        <div className="space-y-4">
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Plan Name</Label>
                              <Input
                                value={planFormData.name}
                                onChange={(e) => setPlanFormData({ ...planFormData, name: e.target.value })}
                                placeholder="Pro"
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Price (USD)</Label>
                              <Input
                                type="number"
                                step="0.01"
                                value={planFormData.price}
                                onChange={(e) => setPlanFormData({ ...planFormData, price: parseFloat(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="grid grid-cols-2 gap-4">
                            <div className="space-y-2">
                              <Label>Duration (days)</Label>
                              <Input
                                type="number"
                                value={planFormData.duration}
                                onChange={(e) => setPlanFormData({ ...planFormData, duration: parseInt(e.target.value) || 30 })}
                              />
                            </div>
                            <div className="space-y-2">
                              <Label>Display Order</Label>
                              <Input
                                type="number"
                                value={planFormData.order}
                                onChange={(e) => setPlanFormData({ ...planFormData, order: parseInt(e.target.value) || 0 })}
                              />
                            </div>
                          </div>
                          <div className="space-y-2">
                            <Label>Gradient Color</Label>
                            <Select
                              value={planFormData.color}
                              onValueChange={(value) => setPlanFormData({ ...planFormData, color: value })}
                            >
                              <SelectTrigger>
                                <SelectValue />
                              </SelectTrigger>
                              <SelectContent>
                                <SelectItem value="from-primary to-red-700">Red (Primary)</SelectItem>
                                <SelectItem value="from-yellow-500 to-orange-500">Gold</SelectItem>
                                <SelectItem value="from-blue-500 to-cyan-500">Blue</SelectItem>
                                <SelectItem value="from-purple-500 to-pink-500">Purple</SelectItem>
                                <SelectItem value="from-emerald-500 to-green-600">Green</SelectItem>
                              </SelectContent>
                            </Select>
                          </div>
                          <div className="space-y-2">
                            <Label>Features (comma separated)</Label>
                            <Textarea
                              value={planFormData.features}
                              onChange={(e) => setPlanFormData({ ...planFormData, features: e.target.value })}
                              placeholder="Unlimited queues, 24/7 mode, Custom prefix"
                              rows={3}
                            />
                          </div>
                          <div className="flex items-center justify-between">
                            <Label htmlFor="popular">Mark as Popular</Label>
                            <Switch
                              id="popular"
                              checked={planFormData.popular}
                              onCheckedChange={(checked) => setPlanFormData({ ...planFormData, popular: checked })}
                            />
                          </div>
                        </div>
                        <DialogFooter>
                          <Button variant="outline" onClick={() => setPlanDialogOpen(false)}>Cancel</Button>
                          <Button onClick={handlePlanSubmit}>
                            {editingPlan ? "Save Changes" : "Add Plan"}
                          </Button>
                        </DialogFooter>
                      </DialogContent>
                    </Dialog>
                  </div>

                  {plans.length === 0 ? (
                    <div className="text-center py-12">
                      <CreditCard className="h-12 w-12 mx-auto text-muted-foreground mb-4" />
                      <p className="text-muted-foreground">No plans configured</p>
                    </div>
                  ) : (
                    <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
                      {plans.sort((a, b) => a.order - b.order).map((plan) => (
                        <div
                          key={plan._id}
                          className={`relative border border-border rounded-xl p-6 bg-gradient-to-br ${plan.color} bg-opacity-10`}
                        >
                          {plan.popular && (
                            <Badge className="absolute -top-2 right-4 bg-yellow-500 text-yellow-950">
                              <Sparkles className="h-3 w-3 mr-1" />
                              Popular
                            </Badge>
                          )}
                          <div className="flex items-center justify-between mb-4">
                            <h3 className="text-xl font-bold text-foreground">{plan.name}</h3>
                            <div className="flex gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => openEditPlanDialog(plan)}
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <AlertDialog>
                                <AlertDialogTrigger asChild>
                                  <Button variant="ghost" size="icon" className="h-8 w-8 text-destructive">
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </AlertDialogTrigger>
                                <AlertDialogContent>
                                  <AlertDialogHeader>
                                    <AlertDialogTitle className="flex items-center gap-2">
                                      <AlertTriangle className="h-5 w-5 text-destructive" />
                                      Delete Plan
                                    </AlertDialogTitle>
                                    <AlertDialogDescription>
                                      Are you sure you want to delete the {plan.name} plan?
                                    </AlertDialogDescription>
                                  </AlertDialogHeader>
                                  <AlertDialogFooter>
                                    <AlertDialogCancel className="rounded-xl">Cancel</AlertDialogCancel>
                                    <AlertDialogAction
                                      onClick={() => handlePlanDelete(plan._id)}
                                      className="rounded-xl bg-destructive hover:bg-destructive/90"
                                    >
                                      Delete
                                    </AlertDialogAction>
                                  </AlertDialogFooter>
                                </AlertDialogContent>
                              </AlertDialog>
                            </div>
                          </div>
                          <div className="text-3xl font-bold text-foreground mb-2">
                            ${plan.price}
                            <span className="text-sm font-normal text-muted-foreground">
                              /{plan.duration} days
                            </span>
                          </div>
                          <div className="space-y-2 mt-4">
                            {plan.features.slice(0, 4).map((feature, i) => (
                              <div key={i} className="flex items-center gap-2 text-sm text-muted-foreground">
                                <Sparkles className="h-3 w-3 text-primary" />
                                {feature}
                              </div>
                            ))}
                            {plan.features.length > 4 && (
                              <div className="text-xs text-muted-foreground">
                                +{plan.features.length - 4} more features
                              </div>
                            )}
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

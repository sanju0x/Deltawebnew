"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { LayoutDashboard, LogOut } from "lucide-react";
import { Avatar, AvatarFallback, AvatarImage } from "@/components/ui/avatar";
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuLabel, DropdownMenuSeparator, DropdownMenuTrigger } from "@/components/ui/dropdown-menu";

type Account = { id: string; name: string; avatar: string | null };

export function DashboardAccountMenu() {
  const [account, setAccount] = useState<Account | null | undefined>(undefined);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    const controller = new AbortController();
    async function refresh() {
      try {
        const response = await fetch("/api/dashboard/account", { cache: "no-store", signal: controller.signal });
        if (response.status === 401) setAccount(null);
        else if (response.ok) setAccount(await response.json());
      } catch { /* The dashboard link stays available during network interruptions. */ }
    }
    function onShow(event: PageTransitionEvent) { if (event.persisted) void refresh(); }
    void refresh();
    window.addEventListener("pageshow", onShow);
    return () => { controller.abort(); window.removeEventListener("pageshow", onShow); };
  }, []);

  async function logout() {
    setBusy(true);
    setError("");
    try {
      const response = await fetch("/api/dashboard/logout", { method: "POST" });
      if (!response.ok) throw new Error();
      window.location.replace("/dashboard");
    } catch {
      setError("Could not log out. Try again.");
      setBusy(false);
    }
  }

  if (!account) return (
    <a className="dashboard-login" href={account === null ? "/api/dashboard/login" : "/dashboard"}>
      {account === null ? "Log in" : "Dashboard"}
    </a>
  );
  const avatar = account.avatar
    ? `https://cdn.discordapp.com/avatars/${account.id}/${account.avatar}.webp?size=64`
    : `https://cdn.discordapp.com/embed/avatars/${Number((BigInt(account.id) >> BigInt(22)) % BigInt(6))}.png`;
  return (
    <DropdownMenu>
      <DropdownMenuTrigger className="dashboard-avatar" aria-label={`Account menu for ${account.name}`}>
        <Avatar><AvatarImage src={avatar} alt="" /><AvatarFallback>{account.name.slice(0, 1)}</AvatarFallback></Avatar>
      </DropdownMenuTrigger>
      <DropdownMenuContent align="end" sideOffset={8} className="w-56">
        <DropdownMenuLabel className="truncate">{account.name}</DropdownMenuLabel>
        <DropdownMenuSeparator />
        <DropdownMenuItem asChild><Link href="/dashboard"><LayoutDashboard />Dashboard</Link></DropdownMenuItem>
        <DropdownMenuItem disabled={busy} onSelect={event => { event.preventDefault(); void logout(); }}>
          <LogOut />{busy ? "Logging out…" : "Log out"}
        </DropdownMenuItem>
        {error && <p role="alert" className="px-2 py-1 text-sm">{error}</p>}
      </DropdownMenuContent>
    </DropdownMenu>
  );
}

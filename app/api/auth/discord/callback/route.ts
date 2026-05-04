import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";
import { cookies } from "next/headers";

interface DiscordUser {
  id: string;
  username: string;
  avatar: string | null;
}

interface GuildMember {
  roles: string[];
}

export async function GET(request: NextRequest) {
  const searchParams = request.nextUrl.searchParams;
  const code = searchParams.get("code");
  const error = searchParams.get("error");

  if (error) {
    return NextResponse.redirect(new URL("/admin/login?error=access_denied", request.url));
  }

  if (!code) {
    return NextResponse.redirect(new URL("/admin/login?error=no_code", request.url));
  }

  const clientId = process.env.DISCORD_CLIENT_ID;
  const clientSecret = process.env.DISCORD_CLIENT_SECRET;
  const adminGuildId = process.env.ADMIN_GUILD_ID;
  const adminRoleIds = process.env.ADMIN_ROLE_IDS?.split(",") || [];

  if (!clientId || !clientSecret || !adminGuildId) {
    return NextResponse.redirect(new URL("/admin/login?error=config_missing", request.url));
  }

  const redirectUri = `${process.env.NEXT_PUBLIC_APP_URL || "http://localhost:3000"}/api/auth/discord/callback`;

  try {
    const tokenResponse = await fetch("https://discord.com/api/oauth2/token", {
      method: "POST",
      headers: {
        "Content-Type": "application/x-www-form-urlencoded",
      },
      body: new URLSearchParams({
        client_id: clientId,
        client_secret: clientSecret,
        grant_type: "authorization_code",
        code,
        redirect_uri: redirectUri,
      }),
    });

    if (!tokenResponse.ok) {
      return NextResponse.redirect(new URL("/admin/login?error=token_exchange_failed", request.url));
    }

    const tokenData = await tokenResponse.json();
    const accessToken = tokenData.access_token;

    const userResponse = await fetch("https://discord.com/api/users/@me", {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!userResponse.ok) {
      return NextResponse.redirect(new URL("/admin/login?error=user_fetch_failed", request.url));
    }

    const userData: DiscordUser = await userResponse.json();

    const memberResponse = await fetch(`https://discord.com/api/users/@me/guilds/${adminGuildId}/member`, {
      headers: {
        Authorization: `Bearer ${accessToken}`,
      },
    });

    if (!memberResponse.ok) {
      return NextResponse.redirect(new URL("/admin/login?error=not_in_guild", request.url));
    }

    const memberData: GuildMember = await memberResponse.json();
    const hasAdminRole = adminRoleIds.some((roleId) => memberData.roles.includes(roleId.trim()));

    if (!hasAdminRole && adminRoleIds.length > 0) {
      return NextResponse.redirect(new URL("/admin/login?error=no_permission", request.url));
    }

    const db = await getDb();
    await db.collection("admin_users").updateOne(
      { discord_id: userData.id },
      {
        $set: {
          discord_id: userData.id,
          discord_username: userData.username,
          discord_avatar: userData.avatar,
          discord_guild_id: adminGuildId,
          discord_roles: memberData.roles,
          last_login: new Date().toISOString(),
        },
      },
      { upsert: true }
    );

    const cookieStore = await cookies();
    cookieStore.set(
      "admin_session",
      JSON.stringify({
        discord_id: userData.id,
        discord_username: userData.username,
        discord_avatar: userData.avatar,
        expires: Date.now() + 24 * 60 * 60 * 1000,
      }),
      {
        httpOnly: true,
        secure: process.env.NODE_ENV === "production",
        sameSite: "lax",
        maxAge: 24 * 60 * 60,
        path: "/",
      }
    );

    return NextResponse.redirect(new URL("/admin", request.url));
  } catch (err) {
    console.error("Discord auth error:", err);
    return NextResponse.redirect(new URL("/admin/login?error=unknown", request.url));
  }
}

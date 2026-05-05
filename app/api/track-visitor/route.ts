import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Rate limiting in-memory store (for simple rate limiting)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipCooldownStore = new Map<string, number>();

export async function POST(request: NextRequest) {
  try {
    const db = await getDb();

    // Get settings
    const settings = await db.collection("webhook_settings").findOne({ type: "visitor_tracking" });

    if (!settings?.enabled || !settings?.discordBotToken || !settings?.discordChannelId) {
      return NextResponse.json({ success: false, reason: "disabled" });
    }

    // Get visitor data from request
    const body = await request.json();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Check IP cooldown
    const lastVisit = ipCooldownStore.get(ip);
    const cooldownMs = (settings.cooldownSeconds || 5) * 1000;
    if (lastVisit && Date.now() - lastVisit < cooldownMs) {
      return NextResponse.json({ success: false, reason: "cooldown" });
    }

    // Check rate limit
    const now = Date.now();
    const rateLimitWindow = 60000; // 1 minute
    const maxPerMinute = settings.rateLimitPerMinute || 30;

    const rateData = rateLimitStore.get("global") || { count: 0, resetTime: now + rateLimitWindow };
    if (now > rateData.resetTime) {
      rateData.count = 0;
      rateData.resetTime = now + rateLimitWindow;
    }

    if (rateData.count >= maxPerMinute) {
      return NextResponse.json({ success: false, reason: "rate_limited" });
    }

    // Update cooldown and rate limit
    ipCooldownStore.set(ip, now);
    rateData.count++;
    rateLimitStore.set("global", rateData);

    // Fetch geolocation data
    let geoData: { country?: string; city?: string; region?: string } = {};
    try {
      const geoResponse = await fetch(`http://ip-api.com/json/${ip}?fields=status,country,regionName,city`);
      if (geoResponse.ok) {
        const geo = await geoResponse.json();
        if (geo.status === "success") {
          geoData = {
            country: geo.country,
            city: geo.city,
            region: geo.regionName,
          };
        }
      }
    } catch {
      // Geo lookup failed, continue without it
    }

    // Build visitor log
    const visitorLog = {
      ip: settings.includeIP ? ip : "hidden",
      country: settings.includeLocation ? geoData.country : undefined,
      city: settings.includeLocation ? geoData.city : undefined,
      browser: settings.includeBrowser ? body.browser : undefined,
      os: settings.includeOS ? body.os : undefined,
      device: settings.includeDevice ? body.device : undefined,
      screen: settings.includeScreen ? body.screen : undefined,
      referrer: settings.includeReferrer ? body.referrer : undefined,
      page: settings.includePageVisited ? body.page : undefined,
      language: settings.includeLanguage ? body.language : undefined,
      timezone: settings.includeTimezone ? body.timezone : undefined,
      visitedAt: new Date(),
      webhookSent: false,
    };

    // Save to database
    const result = await db.collection("visitor_logs").insertOne(visitorLog);

    // Build Discord embed fields
    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (settings.includeIP && ip !== "unknown") {
      fields.push({ name: "IP Address", value: `\`${ip}\``, inline: true });
    }
    if (settings.includeLocation && (geoData.city || geoData.country)) {
      fields.push({
        name: "Location",
        value: [geoData.city, geoData.region, geoData.country].filter(Boolean).join(", ") || "Unknown",
        inline: true,
      });
    }
    if (settings.includeBrowser && body.browser) {
      fields.push({ name: "Browser", value: body.browser, inline: true });
    }
    if (settings.includeOS && body.os) {
      fields.push({ name: "Operating System", value: body.os, inline: true });
    }
    if (settings.includeDevice && body.device) {
      fields.push({ name: "Device", value: body.device, inline: true });
    }
    if (settings.includeScreen && body.screen) {
      fields.push({ name: "Screen", value: body.screen, inline: true });
    }
    if (settings.includePageVisited && body.page) {
      fields.push({ name: "Page Visited", value: body.page, inline: false });
    }
    if (settings.includeReferrer && body.referrer) {
      fields.push({ name: "Referrer", value: body.referrer || "Direct", inline: false });
    }
    if (settings.includeLanguage && body.language) {
      fields.push({ name: "Language", value: body.language, inline: true });
    }
    if (settings.includeTimezone && body.timezone) {
      fields.push({ name: "Timezone", value: body.timezone, inline: true });
    }

    // Duration placeholder (will be updated on page unload)
    fields.push({ name: "Session Started", value: new Date().toLocaleString(), inline: false });

    // Build embed
    const embed: {
      title: string;
      color: number;
      fields: typeof fields;
      footer: { text: string; icon_url?: string };
      timestamp: string;
      thumbnail?: { url: string };
    } = {
      title: settings.embedTitle || "New Visitor Alert",
      color: parseInt((settings.embedColor || "#dc2626").replace("#", ""), 16),
      fields,
      footer: {
        text: settings.embedFooter || "Delta Visitor Tracking",
      },
      timestamp: new Date().toISOString(),
    };

    // Add thumbnail if configured
    if (settings.embedThumbnail) {
      embed.thumbnail = { url: settings.embedThumbnail };
    }

    // Send to Discord channel using Bot API
    try {
      const discordResponse = await fetch(
        `https://discord.com/api/v10/channels/${settings.discordChannelId}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${settings.discordBotToken}`,
          },
          body: JSON.stringify({ embeds: [embed] }),
        }
      );

      if (discordResponse.ok) {
        await db.collection("visitor_logs").updateOne(
          { _id: result.insertedId },
          { $set: { webhookSent: true } }
        );
      }
    } catch {
      // Discord API failed, but we still logged the visit
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json({ error: "Failed to track visitor" }, { status: 500 });
  }
}

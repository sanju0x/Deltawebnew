import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Rate limiting in-memory store (for simple rate limiting)
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipCooldownStore = new Map<string, number>();

// Get configuration from environment variables
const VISITOR_WEBHOOK_ENABLED = process.env.VISITOR_WEBHOOK_ENABLED === "true";
const DISCORD_BOT_TOKEN = process.env.DISCORD_BOT_TOKEN;
const DISCORD_CHANNEL_ID = process.env.DISCORD_CHANNEL_ID;
const WEBHOOK_EMBED_COLOR = process.env.WEBHOOK_EMBED_COLOR || "#dc2626";
const WEBHOOK_EMBED_TITLE = process.env.WEBHOOK_EMBED_TITLE || "New Visitor Alert";
const WEBHOOK_EMBED_FOOTER = process.env.WEBHOOK_EMBED_FOOTER || "Delta Visitor Tracking";
const WEBHOOK_EMBED_THUMBNAIL = process.env.WEBHOOK_EMBED_THUMBNAIL || "";
const WEBHOOK_RATE_LIMIT = parseInt(process.env.WEBHOOK_RATE_LIMIT || "30", 10);
const WEBHOOK_COOLDOWN = parseInt(process.env.WEBHOOK_COOLDOWN || "5", 10);

// Feature flags from env (default all true)
const INCLUDE_IP = process.env.WEBHOOK_INCLUDE_IP !== "false";
const INCLUDE_LOCATION = process.env.WEBHOOK_INCLUDE_LOCATION !== "false";
const INCLUDE_BROWSER = process.env.WEBHOOK_INCLUDE_BROWSER !== "false";
const INCLUDE_OS = process.env.WEBHOOK_INCLUDE_OS !== "false";
const INCLUDE_DEVICE = process.env.WEBHOOK_INCLUDE_DEVICE !== "false";
const INCLUDE_SCREEN = process.env.WEBHOOK_INCLUDE_SCREEN !== "false";
const INCLUDE_REFERRER = process.env.WEBHOOK_INCLUDE_REFERRER !== "false";
const INCLUDE_PAGE = process.env.WEBHOOK_INCLUDE_PAGE !== "false";
const INCLUDE_LANGUAGE = process.env.WEBHOOK_INCLUDE_LANGUAGE !== "false";
const INCLUDE_TIMEZONE = process.env.WEBHOOK_INCLUDE_TIMEZONE !== "false";

export async function POST(request: NextRequest) {
  try {
    // Check if webhook is enabled via environment variable
    if (!VISITOR_WEBHOOK_ENABLED || !DISCORD_BOT_TOKEN || !DISCORD_CHANNEL_ID) {
      return NextResponse.json({ success: false, reason: "disabled" });
    }

    const db = await getDb();

    // Get visitor data from request
    const body = await request.json();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Check IP cooldown
    const lastVisit = ipCooldownStore.get(ip);
    const cooldownMs = WEBHOOK_COOLDOWN * 1000;
    if (lastVisit && Date.now() - lastVisit < cooldownMs) {
      return NextResponse.json({ success: false, reason: "cooldown" });
    }

    // Check rate limit
    const now = Date.now();
    const rateLimitWindow = 60000; // 1 minute
    const maxPerMinute = WEBHOOK_RATE_LIMIT;

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
      ip: INCLUDE_IP ? ip : "hidden",
      country: INCLUDE_LOCATION ? geoData.country : undefined,
      city: INCLUDE_LOCATION ? geoData.city : undefined,
      browser: INCLUDE_BROWSER ? body.browser : undefined,
      os: INCLUDE_OS ? body.os : undefined,
      device: INCLUDE_DEVICE ? body.device : undefined,
      screen: INCLUDE_SCREEN ? body.screen : undefined,
      referrer: INCLUDE_REFERRER ? body.referrer : undefined,
      page: INCLUDE_PAGE ? body.page : undefined,
      language: INCLUDE_LANGUAGE ? body.language : undefined,
      timezone: INCLUDE_TIMEZONE ? body.timezone : undefined,
      visitedAt: new Date(),
      webhookSent: false,
    };

    // Save to database
    const result = await db.collection("visitor_logs").insertOne(visitorLog);

    // Build Discord embed fields
    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (INCLUDE_IP && ip !== "unknown") {
      fields.push({ name: "IP Address", value: `\`${ip}\``, inline: true });
    }
    if (INCLUDE_LOCATION && (geoData.city || geoData.country)) {
      fields.push({
        name: "Location",
        value: [geoData.city, geoData.region, geoData.country].filter(Boolean).join(", ") || "Unknown",
        inline: true,
      });
    }
    if (INCLUDE_BROWSER && body.browser) {
      fields.push({ name: "Browser", value: body.browser, inline: true });
    }
    if (INCLUDE_OS && body.os) {
      fields.push({ name: "Operating System", value: body.os, inline: true });
    }
    if (INCLUDE_DEVICE && body.device) {
      fields.push({ name: "Device", value: body.device, inline: true });
    }
    if (INCLUDE_SCREEN && body.screen) {
      fields.push({ name: "Screen", value: body.screen, inline: true });
    }
    if (INCLUDE_PAGE && body.page) {
      fields.push({ name: "Page Visited", value: body.page, inline: false });
    }
    if (INCLUDE_REFERRER && body.referrer) {
      fields.push({ name: "Referrer", value: body.referrer || "Direct", inline: false });
    }
    if (INCLUDE_LANGUAGE && body.language) {
      fields.push({ name: "Language", value: body.language, inline: true });
    }
    if (INCLUDE_TIMEZONE && body.timezone) {
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
      title: WEBHOOK_EMBED_TITLE,
      color: parseInt(WEBHOOK_EMBED_COLOR.replace("#", ""), 16),
      fields,
      footer: {
        text: WEBHOOK_EMBED_FOOTER,
      },
      timestamp: new Date().toISOString(),
    };

    // Add thumbnail if configured
    if (WEBHOOK_EMBED_THUMBNAIL) {
      embed.thumbnail = { url: WEBHOOK_EMBED_THUMBNAIL };
    }

    // Send to Discord channel using Bot API
    try {
      const discordResponse = await fetch(
        `https://discord.com/api/v10/channels/${DISCORD_CHANNEL_ID}/messages`,
        {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bot ${DISCORD_BOT_TOKEN}`,
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

import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

// Rate limiting in-memory store
const rateLimitStore = new Map<string, { count: number; resetTime: number }>();
const ipCooldownStore = new Map<string, number>();

// Only one env variable needed - the Discord webhook URL
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    // Check if webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json({ success: false, reason: "disabled" });
    }

    const db = await getDb();

    // Get visitor data from request
    const body = await request.json();
    const forwardedFor = request.headers.get("x-forwarded-for");
    const realIp = request.headers.get("x-real-ip");
    const ip = forwardedFor?.split(",")[0]?.trim() || realIp || "unknown";

    // Check IP cooldown (5 seconds default)
    const lastVisit = ipCooldownStore.get(ip);
    const cooldownMs = 5000;
    if (lastVisit && Date.now() - lastVisit < cooldownMs) {
      return NextResponse.json({ success: false, reason: "cooldown" });
    }

    // Check rate limit (30 per minute default)
    const now = Date.now();
    const rateLimitWindow = 60000;
    const maxPerMinute = 30;

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

    // Build visitor log (all features enabled by default)
    const visitorLog = {
      ip,
      country: geoData.country,
      city: geoData.city,
      browser: body.browser,
      os: body.os,
      device: body.device,
      screen: body.screen,
      referrer: body.referrer,
      page: body.page,
      language: body.language,
      timezone: body.timezone,
      visitedAt: new Date(),
      webhookSent: false,
    };

    // Save to database
    const result = await db.collection("visitor_logs").insertOne(visitorLog);

    // Build Discord embed fields (all included by default)
    const fields: { name: string; value: string; inline: boolean }[] = [];

    if (ip !== "unknown") {
      fields.push({ name: "IP Address", value: `\`${ip}\``, inline: true });
    }
    if (geoData.city || geoData.country) {
      fields.push({
        name: "Location",
        value: [geoData.city, geoData.region, geoData.country].filter(Boolean).join(", ") || "Unknown",
        inline: true,
      });
    }
    if (body.browser) {
      fields.push({ name: "Browser", value: body.browser, inline: true });
    }
    if (body.os) {
      fields.push({ name: "Operating System", value: body.os, inline: true });
    }
    if (body.device) {
      fields.push({ name: "Device", value: body.device, inline: true });
    }
    if (body.screen) {
      fields.push({ name: "Screen", value: body.screen, inline: true });
    }
    if (body.page) {
      fields.push({ name: "Page Visited", value: body.page, inline: false });
    }
    if (body.referrer) {
      fields.push({ name: "Referrer", value: body.referrer || "Direct", inline: false });
    }
    if (body.language) {
      fields.push({ name: "Language", value: body.language, inline: true });
    }
    if (body.timezone) {
      fields.push({ name: "Timezone", value: body.timezone, inline: true });
    }

    fields.push({ name: "Session Started", value: new Date().toLocaleString(), inline: false });

    // Build embed with default styling
    const embed = {
      title: "New Visitor Alert",
      color: 0xdc2626, // Red color
      fields,
      footer: {
        text: "Delta Visitor Tracking",
      },
      timestamp: new Date().toISOString(),
    };

    // Send to Discord webhook
    try {
      const discordResponse = await fetch(DISCORD_WEBHOOK_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({ embeds: [embed] }),
      });

      if (discordResponse.ok) {
        await db.collection("visitor_logs").updateOne(
          { _id: result.insertedId },
          { $set: { webhookSent: true } }
        );
      }
    } catch {
      // Discord webhook failed, but we still logged the visit
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error tracking visitor:", error);
    return NextResponse.json({ error: "Failed to track visitor" }, { status: 500 });
  }
}

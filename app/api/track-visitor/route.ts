import { submissionQuota } from "@/lib/submission-quota";
import { NextRequest, NextResponse } from "next/server";
import { getDb } from "@/lib/mongodb";

import { readSubmission, submissionLimit, visitorAddress } from "@/lib/public-submission";

const limit = submissionLimit(12, 30, 5000);
const DISCORD_WEBHOOK_URL = process.env.DISCORD_WEBHOOK_URL;

export async function POST(request: NextRequest) {
  try {
    // Check if webhook URL is configured
    if (!DISCORD_WEBHOOK_URL) {
      return NextResponse.json({ success: false, reason: "disabled" });
    }

    const body = await readSubmission(request, limit, 12000);
    if (body instanceof Response) return body;
    if (Object.values(body).some(value => value.length > 1024)) {
      return NextResponse.json({ error: "Invalid visitor data" }, { status: 400 });
    }
    const db = await getDb();
    const limited = await submissionQuota(db, "track-visitor", 30);
    if (limited) return limited;
    const ip = visitorAddress(request.headers) || "unknown";
    const platformHeaders = process.env.VERCEL === "1" ? request.headers : new Headers();
    let geoData = {
      country: platformHeaders.get("x-vercel-ip-country") || undefined,
      city: platformHeaders.get("x-vercel-ip-city") || undefined,
      region: platformHeaders.get("x-vercel-ip-country-region") || undefined,
    };
    if (!geoData.country && ip !== "unknown" && process.env.IP_API_PRO_KEY) {
      try {
        const url = new URL("https://pro.ip-api.com/json/" + ip);
        url.searchParams.set("fields", "status,country,regionName,city");
        url.searchParams.set("key", process.env.IP_API_PRO_KEY);
        const geoResponse = await fetch(url, { signal: AbortSignal.timeout(3000), redirect: "error" });
        if (geoResponse.ok) {
          const geo = await geoResponse.json();
          if (geo.status === "success") geoData = { country: geo.country, city: geo.city, region: geo.regionName };
        }
      } catch { /* Location is optional. */ }
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
        signal: AbortSignal.timeout(5000),
        redirect: "error",
        body: JSON.stringify({ embeds: [embed], allowed_mentions: { parse: [] } }),
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

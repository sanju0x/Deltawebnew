import { NextRequest, NextResponse } from "next/server";
import { cookies } from "next/headers";

async function verifyAdmin() {
  const cookieStore = await cookies();
  const session = cookieStore.get("admin_session");
  return !!session?.value;
}

export async function POST(request: NextRequest) {
  if (!(await verifyAdmin())) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  try {
    const { discordBotToken, discordChannelId, settings } = await request.json();

    if (!discordBotToken || !discordChannelId) {
      return NextResponse.json({ error: "Bot token and channel ID required" }, { status: 400 });
    }

    // Build test embed
    const embed: {
      title: string;
      description: string;
      color: number;
      fields: { name: string; value: string; inline: boolean }[];
      footer: { text: string; icon_url?: string };
      timestamp: string;
      thumbnail?: { url: string };
    } = {
      title: settings?.embedTitle || "Test Visitor Alert",
      description: "This is a test message from Delta Admin Panel",
      color: parseInt((settings?.embedColor || "#dc2626").replace("#", ""), 16),
      fields: [
        { name: "IP Address", value: "`127.0.0.1` (Test)", inline: true },
        { name: "Location", value: "Test City, Test Country", inline: true },
        { name: "Browser", value: "Chrome 120", inline: true },
        { name: "Operating System", value: "Windows 11", inline: true },
        { name: "Device", value: "Desktop", inline: true },
        { name: "Screen", value: "1920x1080", inline: true },
        { name: "Page Visited", value: "/admin", inline: false },
        { name: "Referrer", value: "https://google.com", inline: false },
        { name: "Language", value: "en-US", inline: true },
        { name: "Timezone", value: "America/New_York", inline: true },
      ],
      footer: {
        text: settings?.embedFooter || "Delta Visitor Tracking - Test Message",
      },
      timestamp: new Date().toISOString(),
    };

    // Add thumbnail if configured
    if (settings?.embedThumbnail) {
      embed.thumbnail = { url: settings.embedThumbnail };
    }

    // Send to Discord channel using Bot API
    const response = await fetch(
      `https://discord.com/api/v10/channels/${discordChannelId}/messages`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bot ${discordBotToken}`,
        },
        body: JSON.stringify({ embeds: [embed] }),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      console.error("Discord API error:", errorData);
      return NextResponse.json({ error: "Failed to send test message to Discord" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error("Error testing Discord:", error);
    return NextResponse.json({ error: "Failed to test Discord connection" }, { status: 500 });
  }
}

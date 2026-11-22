import { NextRequest } from "next/server";
import { handleServerConfig } from "@/lib/server-config";
export async function GET(request: NextRequest, context: { params: Promise<{ guildId: string }> }) { return handleServerConfig(request, (await context.params).guildId); }
export const PATCH = GET;
export const PUT = GET;

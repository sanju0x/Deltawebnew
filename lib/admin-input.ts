import { readJsonObject } from "./request-json.js";
import { z } from "zod";
import { webLink } from "@/lib/web-link";

const label = z.string().max(512);
const content = z.string().max(32000);
const link = z.string().refine(value => !value || webLink(value) !== undefined).nullish();
const order = z.number().int().safe().optional();
const features = z.array(label).max(250).optional();
const discordId = z.string().regex(/^\d{17,20}$/);
const membership = z.object({
  planId: z.string().min(1).max(128),
  expiresAt: z.string().max(64).refine(value => Number.isFinite(Date.parse(value))),
  features,
});

export const teamInput = z.object({
  name: label, avatar: label.optional(), avatarUrl: link, role: label,
  roleCategory: label, socialLink: link, order,
});
export const partnerInput = z.object({
  name: label, type: z.enum(["community", "featured"]), description: content.optional(),
  logo: label.optional(), iconUrl: link, bannerUrl: link, website: link, inviteLink: link,
  members: label.optional(), features, order,
});
export const newsInput = z.object({ title: label, content, active: z.boolean().optional() });
export const updateInput = z.object({ title: label, content, version: label });
export const updateSettingsInput = z.object({ pageEnabled: z.boolean() });
export const statusInput = z.object({ status: z.enum(["online", "offline", "maintenance"]), message: content.optional() });
export const userInput = membership.extend({ discordId, discordUsername: label.nullish() });
export const serverInput = membership.extend({ serverId: discordId, serverName: label.nullish(), addedBy: label.optional() });
export const planInput = z.object({
  name: label.min(1), price: z.number().finite().nonnegative(), duration: z.number().int().positive(),
  features, color: label.optional(), popular: z.boolean().optional(), order,
});

// Legacy premium content supports custom display fields, but never database paths or operators.
const fieldName = z.string().regex(/^[a-zA-Z][a-zA-Z0-9_]{0,63}$/)
  .refine(key => !["constructor", "prototype", "createdAt", "updatedAt"].includes(key));
const field = z.union([content, z.number().finite(), z.boolean(), z.null()]);
export const premiumItemInput = z.record(fieldName, z.union([field, z.array(field).max(250)]));
export const premiumActionInput = z.object({
  action: z.enum(["updateConfig", "addFeature", "addPlan", "addComparison"]), data: premiumItemInput,
});

export async function readAdminInput<T>(request: Request, schema: z.ZodType<T>) {
  const data = await readJsonObject(request, 256 * 1024);
  if (data instanceof Response) return data;
  const result = schema.safeParse(data);
  return result.success ? result.data : Response.json({ error: "Invalid input fields" }, { status: 400 });
}

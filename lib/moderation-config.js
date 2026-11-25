"use strict";
const defaults = { logChannelId: "", automod: { enabled: false, blockInvites: true, blockSpam: true, mentionLimit: 5, blockedWords: [], action: "delete", timeoutSeconds: 600, exemptChannels: [], exemptRoles: [] } };
function validateModeration(input) {
    if (input === undefined) return JSON.parse(JSON.stringify(defaults));
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid moderation settings.");
    if (input.automod !== undefined && (!input.automod || typeof input.automod !== "object" || Array.isArray(input.automod))) throw new Error("Invalid automod settings.");
    const a = { ...defaults.automod, ...input.automod };
    const ids = value => Array.isArray(value) && value.length <= 100 && value.every(id => typeof id === "string" && /^\d{17,20}$/.test(id));
    const logChannelId = input.logChannelId ?? "";
    if (typeof logChannelId !== "string" || (logChannelId !== "" && !/^\d{17,20}$/.test(logChannelId))) throw new Error("Invalid moderation log channel.");
    if ([a.enabled, a.blockInvites, a.blockSpam].some(v => typeof v !== "boolean") || !Number.isInteger(a.mentionLimit) || a.mentionLimit < 0 || a.mentionLimit > 50 || !["delete", "warn", "timeout"].includes(a.action) || !Number.isInteger(a.timeoutSeconds) || a.timeoutSeconds < 10 || a.timeoutSeconds > 2419200) throw new Error("Invalid automod action or limits.");
    if (!ids(a.exemptChannels) || !ids(a.exemptRoles)) throw new Error("Invalid automod exemptions.");
    if (!Array.isArray(a.blockedWords) || a.blockedWords.length > 100 || a.blockedWords.some(w => typeof w !== "string" || !w.trim() || w.length > 64)) throw new Error("Use up to 100 blocked words, each 1–64 characters.");
    return { logChannelId, automod: { enabled: a.enabled, blockInvites: a.blockInvites, blockSpam: a.blockSpam, mentionLimit: a.mentionLimit, blockedWords: [...new Set(a.blockedWords.map(w => w.trim().toLowerCase()))], action: a.action, timeoutSeconds: a.timeoutSeconds, exemptChannels: [...new Set(a.exemptChannels)], exemptRoles: [...new Set(a.exemptRoles)] } };
}
module.exports = { defaults, validateModeration };

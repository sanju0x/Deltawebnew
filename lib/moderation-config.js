"use strict";
const defaults = { logChannelId: "", automod: { enabled: false, blockInvites: true, blockSpam: true, blockLinks: false, blockEveryone: false, blockDuplicates: false, spamMessageLimit: 6, spamWindowSeconds: 5, duplicateLimit: 3, capsPercent: 0, capsMinLength: 12, mentionLimit: 5, blockedWords: [], wordMatchMode: "contains", action: "delete", timeoutSeconds: 600, exemptChannels: [], exemptRoles: [] } };
function validateModeration(input) {
    if (input === undefined) return JSON.parse(JSON.stringify(defaults));
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid moderation settings.");
    if (input.automod !== undefined && (!input.automod || typeof input.automod !== "object" || Array.isArray(input.automod))) throw new Error("Invalid automod settings.");
    const a = { ...defaults.automod, ...input.automod };
    const ids = value => Array.isArray(value) && value.length <= 100 && value.every(id => typeof id === "string" && /^\d{17,20}$/.test(id));
    const logChannelId = input.logChannelId ?? "";
    if (typeof logChannelId !== "string" || (logChannelId !== "" && !/^\d{17,20}$/.test(logChannelId))) throw new Error("Invalid moderation log channel.");
    const integer = (value, min, max) => Number.isInteger(value) && value >= min && value <= max;
    if ([a.enabled, a.blockInvites, a.blockSpam, a.blockLinks, a.blockEveryone, a.blockDuplicates].some(v => typeof v !== "boolean") || !integer(a.mentionLimit, 0, 50) || !["delete", "warn", "timeout"].includes(a.action) || !integer(a.timeoutSeconds, 10, 2419200)) throw new Error("Invalid automod action or limits.");
    if (!integer(a.spamMessageLimit, 3, 20) || !integer(a.spamWindowSeconds, 1, 30) || !integer(a.duplicateLimit, 2, 10) || !integer(a.capsPercent, 0, 100) || !integer(a.capsMinLength, 5, 100) || !["contains", "whole"].includes(a.wordMatchMode)) throw new Error("Invalid automod filter thresholds.");
    if (!ids(a.exemptChannels) || !ids(a.exemptRoles)) throw new Error("Invalid automod exemptions.");
    if (!Array.isArray(a.blockedWords) || a.blockedWords.length > 100 || a.blockedWords.some(w => typeof w !== "string" || !w.trim() || w.length > 64)) throw new Error("Use up to 100 blocked words, each 1–64 characters.");
    return { logChannelId, automod: { enabled: a.enabled, blockInvites: a.blockInvites, blockSpam: a.blockSpam, blockLinks: a.blockLinks, blockEveryone: a.blockEveryone, blockDuplicates: a.blockDuplicates, spamMessageLimit: a.spamMessageLimit, spamWindowSeconds: a.spamWindowSeconds, duplicateLimit: a.duplicateLimit, capsPercent: a.capsPercent, capsMinLength: a.capsMinLength, wordMatchMode: a.wordMatchMode, mentionLimit: a.mentionLimit, blockedWords: [...new Set(a.blockedWords.map(w => w.trim().toLowerCase()))], action: a.action, timeoutSeconds: a.timeoutSeconds, exemptChannels: [...new Set(a.exemptChannels)], exemptRoles: [...new Set(a.exemptRoles)] } };
}
module.exports = { defaults, validateModeration };

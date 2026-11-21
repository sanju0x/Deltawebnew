"use strict";

const MUSIC_SOURCES = [
    { value: "ytsearch", name: "YouTube" }, { value: "ytmsearch", name: "YouTube Music" },
    { value: "spsearch", name: "Spotify" }, { value: "scsearch", name: "SoundCloud" },
    { value: "amsearch", name: "Apple Music" }, { value: "dzsearch", name: "Deezer" },
    { value: "jssearch", name: "JioSaavn" }
];
// Public image hosts only: the bot never downloads arbitrary/internal URLs.
const IMAGE_HOSTS = ["cdn.discordapp.com", "media.discordapp.net", "i.imgur.com", "images.unsplash.com"];
function canManageGuild(guild) {
    if (guild?.owner === true) return true;
    try { const bits = BigInt(guild?.permissions || "0"); return (bits & BigInt(8)) !== BigInt(0) || (bits & BigInt(32)) !== BigInt(0); }
    catch { return false; }
}
function imageUrl(value) {
    if (typeof value !== "string" || value.length > 2048) throw new Error("Image URL is too long.");
    if (!value) return "";
    let url;
    try { url = new URL(value); } catch { throw new Error("Enter a valid image URL."); }
    if (url.protocol !== "https:" || !IMAGE_HOSTS.includes(url.hostname) || url.username || url.password || (url.port && url.port !== "443")) {
        throw new Error(`Use an HTTPS image link from ${IMAGE_HOSTS.join(", ")}.`);
    }
    return url.href;
}
function validateServerConfig(input, commands) {
    if (!input || typeof input !== "object" || Array.isArray(input)) throw new Error("Invalid configuration.");
    if (!MUSIC_SOURCES.some((source) => source.value === input.source)) throw new Error("Choose a supported music source.");
    if (!Array.isArray(input.disabledCommands) || input.disabledCommands.length > commands.length || input.disabledCommands.some((name) => typeof name !== "string" || !commands.includes(name))) throw new Error("Unknown command in configuration.");
    if (typeof input.customBot !== "boolean") throw new Error("Invalid custom bot setting.");
    if (typeof input.nickname !== "string" || input.nickname.length > 32) throw new Error("Nickname must be at most 32 characters.");
    if (typeof input.bio !== "string" || input.bio.length > 190) throw new Error("Bio must be at most 190 characters.");
    return { source: input.source, disabledCommands: [...new Set(input.disabledCommands)], customBot: input.customBot,
        nickname: input.nickname.trim(), bio: input.bio, avatar: imageUrl(input.avatar), banner: imageUrl(input.banner) };
}
module.exports = { MUSIC_SOURCES, IMAGE_HOSTS, canManageGuild, imageUrl, validateServerConfig };

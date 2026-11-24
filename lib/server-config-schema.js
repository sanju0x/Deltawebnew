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
    return managementRole(guild) !== null;
}
function managementRole(guild) {
    if (guild?.owner === true) return "Owner";
    try {
        const bits = BigInt(guild?.permissions || "0");
        if ((bits & BigInt(8)) !== BigInt(0)) return "Administrator";
        if ((bits & BigInt(32)) !== BigInt(0)) return "Manage Server";
    } catch { return null; }
    return null;
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
function defaultGreetings() {
    function card(message, canvasText) {
        return { enabled: false, channelId: "", message, canvas: true, canvasText,
            backgroundImage: "", backgroundColor: "#182032", textColor: "#ffffff", fontSize: 44 };
    }
    return { welcome: card("Welcome {user} to {server}!", "Welcome, {username}!"),
        goodbye: card("{username} left {server}.", "Goodbye, {username}!"), autoRole: "", botRole: "" };
}

function validateGreeting(kind, card, channels) {
    if (!card || typeof card.enabled !== "boolean" || typeof card.canvas !== "boolean") throw new Error("Invalid greeting mode.");
    if (typeof card.channelId !== "string" || ((card.enabled || card.channelId) && !channels.some(c => c.id === card.channelId)))
        throw new Error(`Choose a current channel for the ${kind} message.`);
    if (typeof card.message !== "string" || card.message.length > 2000 || (card.enabled && !card.canvas && !card.message.trim()))
        throw new Error(`Enter a ${kind} message of up to 2000 characters for text delivery.`);
    if (typeof card.canvasText !== "string" || card.canvasText.length > 600 || card.canvasText.split("\n").length > 5)
        throw new Error("Canvas text supports up to five lines and 600 characters.");
    if (![card.textColor, card.backgroundColor].every(c => typeof c === "string" && /^#[a-f0-9]{6}$/i.test(c)) ||
        !Number.isInteger(card.fontSize) || card.fontSize < 16 || card.fontSize > 80) throw new Error("Choose valid canvas colors and a font size from 16 to 80.");
    return { enabled: card.enabled, canvas: card.canvas, channelId: card.channelId, message: card.message,
        canvasText: card.canvasText, textColor: card.textColor, fontSize: card.fontSize,
        backgroundColor: card.backgroundColor, backgroundImage: imageUrl(card.backgroundImage) };
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
module.exports = { defaultGreetings, validateGreeting, MUSIC_SOURCES, IMAGE_HOSTS, canManageGuild, managementRole, imageUrl, validateServerConfig };

"use strict";
const { DisplayNameFont, DisplayNameEffect, validateDisplayNameStyle } = require("./display-name-style");

const MUSIC_SOURCES = [
    { value: "ytsearch", name: "YouTube" }, { value: "ytmsearch", name: "YouTube Music" },
    { value: "spsearch", name: "Spotify" }, { value: "scsearch", name: "SoundCloud" },
    { value: "amsearch", name: "Apple Music" }, { value: "dzsearch", name: "Deezer" },
    { value: "jssearch", name: "JioSaavn" }
];
// Public image hosts only: the bot never downloads arbitrary/internal URLs.
const IMAGE_HOSTS = ["cdn.discordapp.com", "media.discordapp.net", "i.imgur.com", "images.unsplash.com", "media.giphy.com", "i.giphy.com", "media.tenor.com"];
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
const legacyLayout = { format: "plain", avatar: false, avatarShape: "circle", avatarX: 16, avatarY: 50, textX: 50, textY: 50 };
/** @typedef {{ id: string, type: 'text' | 'separator' | 'image' | 'section' | 'canvas', text: string, url: string, description: string, divider: boolean, spacing: number }} GreetingBlock */
function defaultGreetings(saved = {}) {
    function card(message, canvasText) {
        return { ...legacyLayout, avatar: true, textX: 60, enabled: false, channelId: "", message, canvas: true, canvasText,
            blocks: /** @type {GreetingBlock[]} */ ([]), accentColor: "",
            backgroundImage: "", backgroundColor: "#182032", textColor: "#ffffff", fontSize: 44 };
    }
    const defaults = { welcome: card("Welcome {user} to {server}!", "Welcome, {username}!"),
        goodbye: card("{username} left {server}.", "Goodbye, {username}!"), autoRole: "", botRole: "" };
    for (const kind of ["welcome", "goodbye"]) {
        if (saved[kind]) defaults[kind] = { ...defaults[kind], ...legacyLayout, canvas: false, accentColor: "#5865f2", ...saved[kind] };
    }
    return { ...defaults, autoRole: saved.autoRole || "", botRole: saved.botRole || "" };
}

function validateGreeting(kind, card, channels) {
    if (!card || typeof card.enabled !== "boolean" || typeof card.canvas !== "boolean") throw new Error("Invalid greeting mode.");
    if (typeof card.channelId !== "string" || ((card.enabled || card.channelId) && !channels.some(c => c.id === card.channelId)))
        throw new Error(`Choose a current channel for the ${kind} message.`);
    if (typeof card.message !== "string" || card.message.length > 2000 || (card.enabled && !card.canvas && !card.message.trim() && !(card.format === "components" && card.blocks?.length)))
        throw new Error(`Enter a ${kind} message of up to 2000 characters for text delivery.`);
    if (typeof card.canvasText !== "string" || card.canvasText.length > 600 || card.canvasText.split("\n").length > 5)
        throw new Error("Canvas text supports up to five lines and 600 characters.");
    if (![card.textColor, card.backgroundColor].every(c => typeof c === "string" && /^#[a-f0-9]{6}$/i.test(c)) ||
        !Number.isInteger(card.fontSize) || card.fontSize < 16 || card.fontSize > 80) throw new Error("Choose valid canvas colors and a font size from 16 to 80.");
    const layout = Object.fromEntries(Object.entries(legacyLayout).map(([key, fallback]) => [key, card[key] === undefined ? fallback : card[key]]));
    if (!["plain", "components", "embed"].includes(layout.format) || typeof layout.avatar !== "boolean" ||
        !["circle", "square"].includes(layout.avatarShape)) throw new Error("Choose a valid delivery format and avatar shape.");
    if (![layout.avatarX, layout.avatarY, layout.textX, layout.textY].every(n => Number.isInteger(n) && n >= 0 && n <= 100))
        throw new Error("Canvas positions must be whole percentages from 0 to 100.");
    const accentColor = card.accentColor ?? "#5865f2";
    if (typeof accentColor !== "string" || (accentColor !== "" && !/^#[a-f0-9]{6}$/i.test(accentColor))) throw new Error("Choose a valid accent color.");
    const blocks = card.blocks ?? [];
    if (!Array.isArray(blocks) || blocks.filter(b => b?.type !== "canvas").length > 10 || blocks.filter(b => b?.type === "canvas").length > 1) throw new Error("Use up to 10 message blocks and one Generated Canvas block.");
    const ids = new Set();
    let textLength = 0;
    const cleanBlocks = blocks.map(block => {
        if (!block || typeof block.id !== "string" || !/^[\w-]{1,80}$/.test(block.id) || ids.has(block.id) ||
            !["text", "separator", "image", "section", "canvas"].includes(block.type)) throw new Error("Invalid message block.");
        ids.add(block.id);
        if (typeof block.text !== "string" || block.text.length > 2000 || typeof block.description !== "string" || block.description.length > 1024 ||
            typeof block.divider !== "boolean" || ![1, 2].includes(block.spacing)) throw new Error("Invalid message block content.");
        if (["text", "section"].includes(block.type)) {
            textLength += block.text.length;
            if (card.enabled && layout.format === "components" && !block.text.trim()) throw new Error("Text blocks need a message.");
        }
        const url = imageUrl(block.url);
        if (card.enabled && layout.format === "components" && ["image", "section"].includes(block.type) && !url) throw new Error("Add an image or GIF link to each media block.");
        return { id: block.id, type: block.type, text: block.text, url, description: block.description, divider: block.divider, spacing: block.spacing };
    });
    if (textLength > 3500) throw new Error("Keep combined block text within 3500 characters to allow room for member variables.");
    if (card.enabled && !card.canvas && layout.format === "components" && blocks.length && blocks.every(b => ["separator", "canvas"].includes(b.type))) throw new Error("Add a text or media block.");
    return { ...layout, blocks: cleanBlocks, accentColor, enabled: card.enabled, canvas: card.canvas, channelId: card.channelId, message: card.message,
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
        nickname: input.nickname.trim(), bio: input.bio, avatar: imageUrl(input.avatar), banner: imageUrl(input.banner), ...validateDisplayNameStyle(input) };
}
module.exports = { DisplayNameFont, DisplayNameEffect, defaultGreetings, validateGreeting, MUSIC_SOURCES, IMAGE_HOSTS, canManageGuild, managementRole, imageUrl, validateServerConfig };

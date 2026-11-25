"use strict";

// Keep aligned with src/functions/displayNameStyle.js; both deploy independently.
const DisplayNameFont = Object.freeze({
    UNSPECIFIED: 0, DEFAULT: 11, BANGERS: 1, BIO_RHYME: 2, CHERRY_BOMB: 3,
    CHICLE: 4, COMPAGNON: 5, MUSEO_MODERNO: 6, NEO_CASTEL: 7, PIXELIFY: 8,
    RIBES: 9, SINISTRE: 10, ZILLA_SLAB: 12, PLAYPEN_SANS: 13, ORBITRON: 14,
    NEW_ROCKER: 15, KALAM: 16, HEXAGON: 17
});
const DisplayNameEffect = Object.freeze({
    UNSPECIFIED: 0, SOLID: 1, GRADIENT: 2, NEON: 3, TOON: 4,
    POP: 5, GLOW: 6, PRISM: 7, GUMMY: 8
});

function validateDisplayNameStyle(input) {
    const { displayNameFontID = 0, displayNameEffectID = 0, displayNameColors = [] } = input;
    if (!Number.isInteger(displayNameFontID) || !Object.values(DisplayNameFont).includes(displayNameFontID))
        throw new Error("Choose a display name font ID from 0 to 17.");
    if (!Number.isInteger(displayNameEffectID) || !Object.values(DisplayNameEffect).includes(displayNameEffectID))
        throw new Error("Choose a display name effect ID from 0 to 8.");
    if (!Array.isArray(displayNameColors) || displayNameColors.length > 2 ||
        displayNameColors.some(color => !Number.isInteger(color) || color < 0 || color > 0xFFFFFF))
        throw new Error("Choose up to two colors between #000000 and #FFFFFF.");
    return { displayNameFontID, displayNameEffectID, displayNameColors: [...displayNameColors] };
}

function displayNameStylePayload(input = {}) {
    const style = validateDisplayNameStyle(input);
    return {
        display_name_font_id: style.displayNameFontID || null,
        display_name_effect_id: style.displayNameEffectID || null,
        display_name_colors: style.displayNameColors.length ? style.displayNameColors : null
    };
}

async function editDisplayNameStyle(client, guildId, style) {
    return client.requestHandler.request("PATCH", `/guilds/${guildId}/members/@me`, true,
        { ...displayNameStylePayload(style), reason: "Updated bot display name style" });
}

function parseStyle(font, effect, colors = []) {
    const resolve = (value, choices) => /^\d+$/.test(String(value)) ? Number(value) : choices[String(value).toUpperCase()];
    const displayNameFontID = resolve(font, DisplayNameFont), displayNameEffectID = resolve(effect, DisplayNameEffect);
    if (displayNameFontID === undefined || displayNameEffectID === undefined) throw new Error("Unknown font or effect. Use a listed name or numeric ID.");
    return validateDisplayNameStyle({ displayNameFontID, displayNameEffectID, displayNameColors: colors.map(color => {
        if (!/^(?:#|0x)?[a-f0-9]{6}$/i.test(color)) throw new Error("Use six-digit hex colors, for example #FFFFFF.");
        return parseInt(color.replace(/^(#|0x)/i, ""), 16);
    }) });
}

module.exports = { DisplayNameFont, DisplayNameEffect, validateDisplayNameStyle, displayNameStylePayload, editDisplayNameStyle, parseStyle };

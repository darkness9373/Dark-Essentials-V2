import { DarkActionForm } from "./util/DarkActionForm.js";
import Helper from "./util/Helper.js";

const GACHA_MARKER = "§g§a§c§h§r";
const REEL_SLOTS = 40;

const PREVIEW_ITEMS = [
    { id: "minecraft:diamond", amount: 3, chance: 1 },
    { id: "minecraft:emerald", amount: 5, chance: 1 },
    { id: "minecraft:gold_ingot", amount: 8, chance: 1 },
    { id: "minecraft:iron_ingot", amount: 16, chance: 1 },
    { id: "minecraft:netherite_scrap", amount: 2, chance: 1 },
    { id: "minecraft:lapis_lazuli", amount: 12, chance: 1 },
    { id: "minecraft:redstone", amount: 16, chance: 1 },
    { id: "minecraft:coal", amount: 16, chance: 1 },
    { id: "minecraft:bread", amount: 8, chance: 1 },
    { id: "minecraft:apple", amount: 5, chance: 1 },
    { id: "custom:baelroth", amount: 1, chance: 90 },
];

function pick(arr) {
    let total = 0;
    for (const e of arr) total += e.chance > 0 ? e.chance : 0;
    let r = Math.random() * total;
    for (const e of arr) {
        r -= e.chance > 0 ? e.chance : 0;
        if (r <= 0) return e;
    }
    return arr[arr.length - 1];
}

function entryName(entry) {
    return `${Helper.formatName(entry.id)} x${entry.amount}`;
}

/**
 * Preview gacha spin: item vanilla + custom acak, tanpa config/DP/reward.
 * Button index 0 = tombol hasil (RP claim_btn), index 1-40 = slot reel.
 * Slot kirim nama + amount + ikon aux (argumen ke-2 = ikon, tanpa callback).
 * Jangan tambah label/header/divider: merusak urutan collection form_buttons.
 * @param {import("@minecraft/server").Player} player Player yang spin.
 */
export function gachaPreview(player) {
    const LANDING = 32;
    const slots = [];
    for (let i = 0; i < REEL_SLOTS; i++) {
        slots.push(pick(PREVIEW_ITEMS));
    }
    const winnerName = entryName(slots[LANDING]);
    const form = new DarkActionForm();
    form.title(`${GACHA_MARKER}Gacha Preview`);
    form.body("Good luck!");
    form.button(`Claim: ${winnerName}`, (p) => {
        p.sendMessage(`Gacha preview: ${winnerName} (no reward).`);
    });
    for (const entry of slots) {
        form.button(entryName(entry), Helper.iconString(entry.id));
    }
    form.show(player);
}

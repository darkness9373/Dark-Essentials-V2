import Money from "./money.js";
import Rank from "./rank.js";
import Helper from "./util/Helper.js";

export const BOARD_LINES = [" Name: @PLAYER", " Rank: @RANK", " Money: @MONEY", " Ping: @PING"];
export const DIVIDER_TOKEN = "@DIVIDER";
export const PLACEHOLDERS = {
    "@PLAYER": (p) => Helper.truncate(p.name),
    "@RANK": (p) => Rank.glyph(p),
    "@MONEY": (p) => Helper.formatMoney(Money.get(p)),
    "@PING": (p) => Helper.formatPing(p.getPing()),
};

export function resolvePlaceholders(text, player) {
    let out = String(text ?? "");
    for (const k of Object.keys(PLACEHOLDERS))
        out = out.split(k).join(String(PLACEHOLDERS[k](player) ?? ""));
    return out;
}

export function buildBoard(player) {
    const lines = BOARD_LINES.map((l) => resolvePlaceholders(l, player));
    const strip = (s) => String(s).replace(/§./g, "");
    const max = Math.max(
        10,
        ...lines
            .filter((l) => !l.includes(DIVIDER_TOKEN))
            .map((l) => strip(l).length),
    );
    return lines
        .map((l) => l.split(DIVIDER_TOKEN).join("-".repeat(max)))
        .join("\n");
}

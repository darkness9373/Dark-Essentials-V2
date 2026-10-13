import { system, world } from "@minecraft/server";
import Objective from "./objective.js";
import Rank from "./rank.js";
import Helper from "./util/Helper.js";

const TYPE = "drk:float";
const TAG_ROOT = "drk_root";
const DIMS = ["overworld", "nether", "the_end"];
const TITLE_KEY = "dark:title";
const TEXT_KEY = "dark:text";
const IDX_KEY = "dark:idx";
const GAP_KEY = "dark:gap";
const KIND_KEY = "dark:kind";
const OBJ_KEY = "dark:objective";
const FORMAT_KEY = "dark:format";
const TEMPLATE_KEY = "dark:template";
const DEFAULT_GAP = 0.3;
const MAX_TEXT = 60;
const MAX_TEMPLATE = 80;
const SCORE_ROWS = 10;
const DEFAULT_TEMPLATE = "@NO. @NAME - @SCORE";
const ROW_TOKENS = ["@NO", "@NAME", "@SCORE", "@RANK"];

const boardTag = (name) => `brd_${name}`;

function roots() {
    const out = [];
    for (const d of DIMS) {
        for (const e of world.getDimension(d).getEntities({ type: TYPE, tags: [TAG_ROOT] })) {
            if (e.isValid) out.push(e);
        }
    }
    return out;
}

class Float {
    static validName(name) {
        const s = String(name ?? "").trim();
        return /^[A-Za-z0-9]{1,16}$/.test(s) ? s : null;
    }

    static validGap(value) {
        const n = Number(value);
        if (!Number.isFinite(n) || n < 0.1 || n > 1.0) return null;
        return Math.round(n * 100) / 100;
    }

    static validText(text) {
        const s = String(text ?? "").trim();
        if (!s) return null;
        return s.slice(0, MAX_TEXT);
    }

    static validTemplate(text) {
        const s = String(text ?? "").trim();
        if (!s) return null;
        if (!ROW_TOKENS.some((t) => s.includes(t))) return null;
        return s.slice(0, MAX_TEMPLATE);
    }

    static list() {
        return roots()
            .map((r) => ({
                name: Float.nameOf(r),
                kind: String(r.getDynamicProperty(KIND_KEY) ?? "text"),
                title: String(r.getDynamicProperty(TITLE_KEY) ?? ""),
                root: r,
            }))
            .filter((b) => b.name)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    static nameOf(root) {
        const t = root.getTags().find((x) => x.startsWith("brd_"));
        return t ? t.slice(4) : null;
    }

    static getRoot(name) {
        const key = String(name ?? "").toLowerCase();
        return roots().find((r) => (Float.nameOf(r) ?? "").toLowerCase() === key);
    }

    static kindOf(root) {
        return String(root.getDynamicProperty(KIND_KEY) ?? "text");
    }

    static gapOf(root) {
        const n = Number(root.getDynamicProperty(GAP_KEY));
        if (!Number.isFinite(n) || n < 0.1 || n > 1.0) return DEFAULT_GAP;
        return n;
    }

    static childrenOf(root) {
        const name = Float.nameOf(root);
        if (!name) return [];
        return root.dimension
            .getEntities({ type: TYPE, tags: [boardTag(name)], location: root.location, maxDistance: 32 })
            .filter((e) => e.isValid && e.id !== root.id && !e.getTags().includes(TAG_ROOT))
            .sort((a, b) => Float.idxOf(a) - Float.idxOf(b));
    }

    static idxOf(entity) {
        const n = Number(entity.getDynamicProperty(IDX_KEY));
        return Number.isFinite(n) ? n : 0;
    }

    static slotPos(root, gap, index) {
        const l = root.location;
        return { x: l.x, y: l.y - gap * (index + 1), z: l.z };
    }

    static spawnRow(dim, pos, name, index) {
        const e = dim.spawnEntity(TYPE, pos);
        e.addTag(boardTag(name));
        e.setDynamicProperty(IDX_KEY, index);
        return e;
    }

    static createText(admin, name, text, gap) {
        if (Float.getRoot(name)) return null;
        const dim = admin.dimension;
        const base = { x: admin.location.x, y: admin.location.y + 2, z: admin.location.z };
        const root = dim.spawnEntity(TYPE, base);
        root.addTag(TAG_ROOT);
        root.addTag(boardTag(name));
        root.setDynamicProperty(KIND_KEY, "text");
        root.setDynamicProperty(TITLE_KEY, text);
        root.setDynamicProperty(GAP_KEY, gap);
        root.nameTag = text;
        return root;
    }

    static createScore(admin, name, objective, gap, formatNumber = true, template = DEFAULT_TEMPLATE) {
        if (Float.getRoot(name)) return null;
        const dim = admin.dimension;
        const base = { x: admin.location.x, y: admin.location.y + 2, z: admin.location.z };
        const root = dim.spawnEntity(TYPE, base);
        root.addTag(TAG_ROOT);
        root.addTag(boardTag(name));
        root.setDynamicProperty(KIND_KEY, "score");
        root.setDynamicProperty(OBJ_KEY, objective);
        root.setDynamicProperty(TITLE_KEY, objective);
        root.setDynamicProperty(GAP_KEY, gap);
        root.setDynamicProperty(FORMAT_KEY, formatNumber);
        root.setDynamicProperty(TEMPLATE_KEY, template);
        for (let i = 0; i < SCORE_ROWS; i++) {
            Float.spawnRow(dim, Float.slotPos(root, gap, i), name, i);
        }
        Float.refreshScore(root);
        return root;
    }

    static formatOf(root) {
        const v = root.getDynamicProperty(FORMAT_KEY);
        if (v === undefined) return true;
        return Boolean(v);
    }

    static templateOf(root) {
        const v = root.getDynamicProperty(TEMPLATE_KEY);
        if (typeof v === "string" && v && ROW_TOKENS.some((t) => v.includes(t))) return v;
        return DEFAULT_TEMPLATE;
    }

    static setFormat(root, formatNumber) {
        root.setDynamicProperty(FORMAT_KEY, Boolean(formatNumber));
        Float.refreshScore(root);
    }

    static setTemplate(root, template) {
        root.setDynamicProperty(TEMPLATE_KEY, template);
        Float.refreshScore(root);
    }

    static rankOf(name) {
        const p = world.getAllPlayers().find((x) => x.name === name);
        if (!p) return "";
        return Rank.glyph(p);
    }

    static setTitle(root, text) {
        root.setDynamicProperty(TITLE_KEY, text);
        root.nameTag = text;
    }

    static setGap(root, gap) {
        root.setDynamicProperty(GAP_KEY, gap);
        Float.layout(root);
    }

    static layout(root) {
        const gap = Float.gapOf(root);
        const kids = Float.childrenOf(root);
        kids.forEach((k, i) => {
            k.setDynamicProperty(IDX_KEY, i);
            k.teleport(Float.slotPos(root, gap, i));
            if (Float.kindOf(root) === "text") {
                k.nameTag = String(k.getDynamicProperty(TEXT_KEY) ?? "");
            }
        });
        if (Float.kindOf(root) === "text") {
            root.nameTag = String(root.getDynamicProperty(TITLE_KEY) ?? "");
        }
    }

    static addLine(root, text) {
        const kids = Float.childrenOf(root);
        const e = Float.spawnRow(root.dimension, Float.slotPos(root, Float.gapOf(root), kids.length), Float.nameOf(root), kids.length);
        e.setDynamicProperty(TEXT_KEY, text);
        e.nameTag = text;
        Float.layout(root);
        return e;
    }

    static editLine(entity, text) {
        entity.setDynamicProperty(TEXT_KEY, text);
        entity.nameTag = text;
    }

    static moveLine(root, index, dir) {
        const kids = Float.childrenOf(root);
        const j = index + dir;
        if (index < 0 || j < 0 || index >= kids.length || j >= kids.length) return false;
        const aText = String(kids[index].getDynamicProperty(TEXT_KEY) ?? "");
        const bText = String(kids[j].getDynamicProperty(TEXT_KEY) ?? "");
        kids[index].setDynamicProperty(TEXT_KEY, bText);
        kids[j].setDynamicProperty(TEXT_KEY, aText);
        Float.layout(root);
        return true;
    }

    static deleteLine(root, index) {
        const kids = Float.childrenOf(root);
        if (index < 0 || index >= kids.length) return false;
        kids[index].remove();
        Float.layout(root);
        return true;
    }

    static moveHere(root, player) {
        const kids = Float.childrenOf(root);
        const base = { x: player.location.x, y: player.location.y + 2, z: player.location.z };
        root.teleport(base, { dimension: player.dimension });
        const gap = Float.gapOf(root);
        kids.forEach((k, i) => {
            k.teleport({ x: base.x, y: base.y - gap * (i + 1), z: base.z }, { dimension: player.dimension });
        });
    }

    static deleteBoard(name) {
        const root = Float.getRoot(name);
        if (!root) return false;
        for (const k of Float.childrenOf(root)) k.remove();
        root.remove();
        return true;
    }

    static renderRow(root, score, index) {
        const template = Float.templateOf(root);
        if (!score) return "-";
        const fullName = score.participant.displayName;
        const scoreText = Float.formatOf(root) ? Helper.formatMoney(score.score) : String(score.score);
        return template
            .split("@NO").join(String(index + 1))
            .split("@NAME").join(fullName)
            .split("@SCORE").join(scoreText)
            .split("@RANK").join(Float.rankOf(fullName));
    }

    static refreshScore(root) {
        const obj = String(root.getDynamicProperty(OBJ_KEY) ?? "");
        Objective.ensure(obj);
        const scores = world.scoreboard
            .getObjective(obj)
            .getScores()
            .sort((a, b) => b.score - a.score)
            .slice(0, SCORE_ROWS);
        root.nameTag = String(root.getDynamicProperty(TITLE_KEY) ?? obj);
        const kids = Float.childrenOf(root);
        kids.forEach((k, i) => {
            k.nameTag = Float.renderRow(root, scores[i], i);
        });
    }

    static lockTick() {
        for (const r of roots()) {
            const gap = Float.gapOf(r);
            for (const k of Float.childrenOf(r)) {
                k.teleport(Float.slotPos(r, gap, Float.idxOf(k)));
            }
        }
    }

    static scoreTick() {
        for (const r of roots()) {
            if (Float.kindOf(r) === "score" && r.isValid) Float.refreshScore(r);
        }
    }
}

system.runInterval(() => Float.lockTick(), 20);
system.runInterval(() => Float.scoreTick(), 100);

export default Float;

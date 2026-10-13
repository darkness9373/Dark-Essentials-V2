import { EnchantmentTypes, world } from "@minecraft/server";
import { MARKER } from "../config.js";
import { AUX_VERSIONS, rawOf as baseRawOf } from "../data/item_aux.js";
import { CUSTOM_BLOCK_TEXTURE, CUSTOM_ITEM_TEXTURE, CUSTOM_RAW } from "../data/custom_icons.js";

const AUX_VER_KEY = "dark:aux_version";
const CUSTOM_KEY = "dark:custom_icons";

function customOverlay() {
    const raw = world.getDynamicProperty(CUSTOM_KEY);
    if (!raw) return { raw: {}, blockTex: {}, itemTex: {} };
    const data = JSON.parse(String(raw));
    if (!data || typeof data !== "object") return { raw: {}, blockTex: {}, itemTex: {} };
    return {
        raw: data.raw && typeof data.raw === "object" ? data.raw : {},
        blockTex: data.blockTex && typeof data.blockTex === "object" ? data.blockTex : {},
        itemTex: data.itemTex && typeof data.itemTex === "object" ? data.itemTex : {},
    };
}

function customRawMap(version) {
    const ov = customOverlay().raw;
    const base = CUSTOM_RAW[version] ?? {};
    const wild = CUSTOM_RAW["*"] ?? {};
    const ovVer = ov[version] ?? {};
    const ovWild = ov["*"] ?? {};
    const merged = {};
    for (const src of [wild, base, ovWild, ovVer]) {
        for (const k of Object.keys(src)) {
            const n = Math.floor(Number(src[k]));
            if (Number.isFinite(n)) merged[String(k).trim().toLowerCase()] = n;
        }
    }
    return merged;
}

function customBlockMap() {
    const ov = customOverlay().blockTex;
    const merged = {};
    for (const src of [CUSTOM_BLOCK_TEXTURE, ov]) {
        for (const k of Object.keys(src ?? {})) {
            const p = String(src[k] ?? "").trim();
            if (p) merged[String(k).trim().toLowerCase()] = p;
        }
    }
    return merged;
}

function customItemMap() {
    const ov = customOverlay().itemTex;
    const merged = {};
    for (const src of [CUSTOM_ITEM_TEXTURE, ov]) {
        for (const k of Object.keys(src ?? {})) {
            const p = String(src[k] ?? "").trim();
            if (p) merged[String(k).trim().toLowerCase()] = p;
        }
    }
    return merged;
}

function shiftFor(baseRaw, version) {
    let shift = 0;
    for (const n of Object.values(customRawMap(version))) {
        if (n <= baseRaw) shift++;
    }
    return shift;
}



class Helper {
    static formatMoney(value) {
        const n = Number(value);
        if (!Number.isFinite(n)) return "0";
        const a = Math.abs(n);
        if (a < 1000) return String(Math.trunc(n));
        const units = [[1e12, "T"], [1e9, "B"], [1e6, "M"], [1e3, "K"]];
        for (let i = 0; i < units.length; i++) {
            const [div, suf] = units[i];
            if (a >= div) {
                let v = a / div;
                let r = Math.round(v * 10) / 10;
                if (r >= 1000 && i > 0) {
                    v = a / units[i - 1][0];
                    r = Math.round(v * 10) / 10;
                    return (n < 0 ? "-" : "") + (Number.isInteger(r) ? String(Math.trunc(r)) : r.toFixed(1)) + units[i - 1][1];
                }
                return (n < 0 ? "-" : "") + (Number.isInteger(r) ? String(Math.trunc(r)) : r.toFixed(1)) + suf;
            }
        }
        return String(Math.trunc(n));
    }
    static formatName(id) {
        return String(id ?? "").replace(/^[^:]+:/, "").split("_").filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1).toLowerCase()).join(" ");
    }
    static truncate(text, max = 12) {
        const s = String(text ?? "");
        return s.length > max ? s.slice(0, max) + "..." : s;
    }
    static isAdmin(player) {
        return (player?.playerPermissionLevel ?? 0) >= 2;
    }
    static parseDuration(text) {
        const s = String(text ?? "").trim().toLowerCase();
        if (!s || s === "0" || s === "perm" || s === "permanent") return 0;
        const m = s.match(/^(\d+)\s*([smhd])$/);
        if (!m) return null;
        const n = Number(m[1]);
        if (!Number.isFinite(n) || n <= 0) return null;
        const mult = { s: 1000, m: 60000, h: 3600000, d: 86400000 }[m[2]];
        return n * mult;
    }
    static formatLeft(ms) {
        if (ms <= 0) return "Expired";
        const s = Math.floor(ms / 1000);
        if (s < 60) return `${s}s`;
        const m = Math.floor(s / 60);
        if (m < 60) return `${m}m`;
        const h = Math.floor(m / 60);
        if (h < 24) return `${h}h`;
        return `${Math.floor(h / 24)}d`;
    }
    static formatTime(totalSeconds) {
        const s = Math.max(0, Math.floor(Number(totalSeconds) || 0));
        const h = Math.floor(s / 3600);
        const m = Math.floor((s % 3600) / 60);
        const sec = s % 60;
        const pad = (n) => String(n).padStart(2, "0");
        return `${pad(h)}:${pad(m)}:${pad(sec)}`;
    }
    /**
     * Daftar versi game tabel aux, urut lama ke baru.
     * @returns {string[]} Salinan AUX_VERSIONS.
     * @example Helper.auxVersions();
     */
    /**
     * Versi aux aktif tersimpan di world DP (dark:aux_version), fallback versi terbaru.
     * @returns {string} Versi game aktif untuk lookup aux.
     * @example Helper.auxVersion();
     */
    static auxVersion() {
        const v = world.getDynamicProperty(AUX_VER_KEY);
        if (typeof v === "string" && AUX_VERSIONS.includes(v)) return v;
        return AUX_VERSIONS[AUX_VERSIONS.length - 1];
    }
    /**
     * Simpan versi aux aktif ke world DP.
     * @param {string} version Versi dari AUX_VERSIONS.
     * @returns {boolean} True bila tersimpan.
     * @example Helper.setAuxVersion("1.26.50.4");
     */
    static setAuxVersion(version) {
        if (!AUX_VERSIONS.includes(version)) return false;
        world.setDynamicProperty(AUX_VER_KEY, version);
        return true;
    }
    static auxVersions() {
        return [...AUX_VERSIONS];
    }
    /**
     * Ambil raw_id numerik Mojang untuk string id item/block.
     * @param {string} id String id, misal "minecraft:chest".
     * @param {string} [version] Versi game; fallback versi terbaru.
     * @returns {number | null} raw_id, atau null bila tak dikenal.
     * @example Helper.rawOf("minecraft:chest", "1.26.50.4"); // 54
     */
    /**
     * Daftar custom raw aktif (merge file + overlay world DP) untuk versi game.
     * @param {string} [version] Versi game; fallback versi aktif.
     * @returns {Object<string, number>} Map id lowercase -> raw.
     * @example Helper.customRaws("1.26.30.5");
     */
    static customRaws(version) {
        return customRawMap(version ?? Helper.auxVersion());
    }
    /**
     * Texture path custom block per id.
     * @returns {Object<string, string>} Map id lowercase -> texture path.
     * @example Helper.customBlockTextures();
     */
    static customBlockTextures() {
        return customBlockMap();
    }
    /**
     * Simpan hasil probe kalibrasi ke overlay world DP (dark:custom_icons).
     * @param {string} id String id custom, misal "drk:coin".
     * @param {number} raw Raw numerik hasil probe.
     * @param {string} [version] Versi game; fallback versi aktif.
     * @returns {boolean} True bila tersimpan.
     * @example Helper.saveCustomRaw("drk:coin", 256, "1.26.30.5");
     */
    static saveCustomRaw(id, raw, version) {
        const key = String(id ?? "").trim().toLowerCase();
        const n = Math.floor(Number(raw));
        const ver = version ?? Helper.auxVersion();
        if (!key || !Number.isFinite(n)) return false;
        const ov = customOverlay();
        ov.raw[ver] = ov.raw[ver] ?? {};
        ov.raw[ver][key] = n;
        world.setDynamicProperty(CUSTOM_KEY, JSON.stringify(ov));
        return true;
    }
    /**
     * Simpan texture custom block ke overlay world DP.
     * @param {string} id String id custom block.
     * @param {string} path Texture path, misal "textures/blocks/crate".
     * @returns {boolean} True bila tersimpan.
     * @example Helper.saveCustomBlockTexture("drk:crate", "textures/blocks/crate");
     */
    static saveCustomBlockTexture(id, path) {
        const key = String(id ?? "").trim().toLowerCase();
        const p = String(path ?? "").trim();
        if (!key || !p) return false;
        const ov = customOverlay();
        ov.blockTex[key] = p;
        world.setDynamicProperty(CUSTOM_KEY, JSON.stringify(ov));
        return true;
    }
    /**
     * Sumber ikon untuk sebuah id: "custom" | "vanilla" | "block-texture" | null.
     * Custom block (texture map) selalu "block-texture" agar dirender via path.
     * @param {string} id String id.
     * @param {string} [version] Versi game.
     * @returns {string | null} Sumber ikon.
     * @example Helper.iconSource("drk:coin");
     */
    static iconSource(id, version) {
        const key = String(id ?? "").trim().toLowerCase();
        if (!key) return null;
        if (customBlockMap()[key]) return "block-texture";
        const ver = version ?? Helper.auxVersion();
        if (customRawMap(ver)[key] !== undefined) return "custom";
        if (baseRawOf(key, ver) !== null) return "vanilla";
        return null;
    }
    /**
     * Ambil raw_id numerik untuk string id item/block.
     * Custom id (file + overlay) menang duluan; vanilla DIGESER naik
     * +N = jumlah custom raw <= R pada versi itu. Custom menempati raw
     * vanilla yang ada, sehingga vanilla sesudahnya terdorong ke atas.
     * @param {string} id String id, misal "minecraft:chest".
     * @param {string} [version] Versi game; fallback versi terbaru.
     * @returns {number | null} raw_id efektif, atau null bila tak dikenal.
     * @example Helper.rawOf("minecraft:chest", "1.26.50.4"); // 54
     */
    static rawOf(id, version) {
        const ver = version ?? Helper.auxVersion();
        const key = String(id ?? "").trim().toLowerCase();
        const custom = customRawMap(ver)[key];
        if (custom !== undefined) return custom;
        const base = baseRawOf(key, ver);
        if (base === null) return null;
        return base + shiftFor(base, ver);
    }
    /**
     * Hitung aux_id renderer: (raw_id << 16) | data, glint +32768.
     * @param {string} id String id item/block.
     * @param {string} [version] Versi game; fallback versi terbaru.
     * @param {number} [data=0] Nilai data/varian.
     * @param {boolean} [glint=false] True tambah efek glint.
     * @returns {number | null} aux_id signed 32-bit, atau null bila tak dikenal.
     * @example Helper.auxOf("minecraft:chest", "1.26.50.4"); // 3538944
     */
    static auxOf(id, version, data = 0, glint = false) {
        const ver = version ?? Helper.auxVersion();
        const raw = Helper.rawOf(id, ver);
        if (raw === null) return null;
        const d = (Math.floor(Number(data) || 0) & 0xffff) | (glint ? 32768 : 0);
        return (raw << 16) | d;
    }
    /**
     * Bentuk ringkas aux_id ikon untuk binding #item_id_aux.
     * @param {string} id String id item/block.
     * @param {object} [options] Opsi ikon.
     * @param {string} [options.version] Versi game.
     * @param {number} [options.data=0] Nilai data/varian.
     * @param {boolean} [options.glint=false] True tambah efek glint.
     * @returns {number | null} aux_id, atau null bila tak dikenal.
     * @example Helper.iconOf("minecraft:diamond_sword", { glint: true });
     */
    static iconOf(id, options = {}) {
        const o = options !== null && typeof options === "object" ? options : {};
        if (typeof id === "object" && id !== null) return Helper.iconString(id);
        if (typeof id === "string" && Helper.iconTexture(id)) return null;
        return Helper.auxOf(id, o.version, o.data ?? 0, o.glint ?? false);
    }
    /**
     * Bentuk label ikon untuk dynamic_label RP: marker aux + angka aux.
     * RP render ikon via inventory_item_renderer bila teks diawali marker.
     * @param {string} id String id item/block.
     * @param {object} [options] Opsi ikon.
     * @param {string} [options.version] Versi game.
     * @param {number} [options.data=0] Nilai data/varian.
     * @param {boolean} [options.glint=false] True tambah efek glint.
     * @returns {string | null} Teks label "§a§u§x<aux>", atau null bila id tak dikenal.
     * @example Helper.auxLabel("minecraft:chest", {});
     */
    static auxLabel(id, options = {}) {
        const o = options !== null && typeof options === "object" ? options : {};
        const aux = Helper.iconOf(id, o);
        if (aux === null) return null;
        return `${MARKER.form.aux}${aux}`;
    }
    /**
     * Bentuk teks label ikon item untuk .image(): marker aux + angka aux, atau null bila bukan id item.
     * Path texture (diawali "textures" atau mengandung "/"), string kosong, dan id tak dikenal -> null
     * sehingga pemanggil jatuh ke jalur texture path biasa.
     * @param {string | number | object} src Id item, angka aux, atau {id, path?, version?, data?, glint?}.
     * @param {object} [opts] Opsi aux bila src berupa id: {version?, data?, glint?}.
     * @returns {string | null} Teks "§a§u§x<aux>" atau null.
     * @example Helper.imageLabel("minecraft:chest", {});
     */
    static imageLabel(src, opts = {}) {
        const o = opts !== null && typeof opts === "object" ? opts : {};
        if (src !== null && typeof src === "object") {
            if (Helper.iconTexture(src.id ?? src.path ?? "")) return null;
            return Helper.auxLabel(src.id ?? src.path ?? "", { ...src, ...o });
        }
        if (typeof src === "number") {
            if (!Number.isFinite(src)) return null;
            return `${MARKER.form.aux}${Math.trunc(src)}`;
        }
        if (typeof src !== "string") return null;
        const t = src.trim();
        if (!t || t.startsWith("textures") || t.includes("/")) return null;
        if (/^-?\d+$/.test(t)) return `${MARKER.form.aux}${t}`;
        if (Helper.iconTexture(Helper.normItemId(t))) return null;
        return Helper.auxLabel(Helper.normItemId(t), o);
    }
    /**
     * Texture path custom untuk sebuah id (block wajib path, item fallback flat opsional).
     * Overlay world DP menimpa file config.
     * @param {string} id String id.
     * @returns {string | null} Texture path atau null.
     * @example Helper.iconTexture("drk:crate");
     */
    static iconTexture(id) {
        const key = String(id ?? "").trim().toLowerCase();
        if (!key) return null;
        return customBlockMap()[key] ?? customItemMap()[key] ?? null;
    }
    /**
     * Resolve ikon tombol: id item -> string "§a§u§x<aux>", path texture lolos utuh.
     * Aux selalu dibungkus marker agar RP render via inventory_item_renderer
     * (pola sama seperti label yang terbukti jalan: bread tampil walau salah item).
     * String angka aux polos tetap lolos untuk kompatibilitas, tapi disarankan
     * selalu lewat id agar marker ikut terkirim.
     * @param {string | number | object} icon String id/path/angka, angka aux, atau {id, version?, data?, glint?}.
     * @returns {string} String "§a§u§x<aux>", path texture asli, atau "" bila kosong/tak dikenal.
     * @example Helper.iconString("minecraft:chest"); // "§a§u§x3538944"
     * @example Helper.iconString({ id: "minecraft:diamond_sword", glint: true });
     */
    static iconString(icon) {
        if (icon === null || icon === undefined) return "";
        if (typeof icon === "number") return Number.isFinite(icon) ? `${MARKER.form.aux}${Math.trunc(icon)}` : "";
        if (typeof icon === "object") {
            const tex = Helper.iconTexture(icon.id ?? icon.path ?? "");
            if (tex) return tex;
            const label = Helper.auxLabel(icon.id, icon);
            return label === null ? "" : label;
        }
        if (typeof icon !== "string" || !icon) return "";
        const t = icon.trim();
        if (!t) return "";
        if (t.startsWith("textures") || t.includes("/")) return icon;
        if (t.startsWith(MARKER.form.aux)) return t;
        if (/^-?\d+$/.test(t)) return `${MARKER.form.aux}${t}`;
        const key = Helper.normItemId(t);
        const tex = Helper.iconTexture(key);
        if (tex) return tex;
        const label = Helper.auxLabel(key, {});
        return label === null ? "" : label;
    }
    static normItemId(id) {
        let s = String(id ?? "").trim().toLowerCase();
        if (!s) return "";
        if (!s.includes(":")) s = "minecraft:" + s;
        return s;
    }
    static formatPing(ms) {
        const n = Math.max(0, Math.floor(Number(ms) || 0));
        const c = n < 100 ? "§a" : n < 200 ? "§e" : "§c";
        return `${c}${n}ms§r`;
    }
    static validObjectiveName(name) {
        const s = String(name ?? "").trim();
        return /^[A-Za-z0-9_]{1,16}$/.test(s) ? s : null;
    }
    static parseEnchants(text) {
        const s = String(text ?? "").trim();
        if (!s) return { ok: true, enchants: [] };
        const enchants = [];
        for (const part of s.split(",").map((x) => x.trim()).filter(Boolean)) {
            const i = part.lastIndexOf(":");
            if (i <= 0) return { ok: false, reason: `Bad enchant '${part}', use id:level` };
            let id = part.slice(0, i).trim().toLowerCase();
            if (!id.includes(":")) id = "minecraft:" + id;
            const level = Math.floor(Number(part.slice(i + 1)));
            const type = EnchantmentTypes.get(id);
            if (!type) return { ok: false, reason: `Unknown enchant '${id}'` };
            if (!Number.isFinite(level) || level < 1 || level > type.maxLevel) return { ok: false, reason: `'${id}' level 1-${type.maxLevel}` };
            enchants.push({ id: type.id, level });
        }
        return { ok: true, enchants };
    }
}

export default Helper;

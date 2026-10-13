import { ActionFormData } from "@minecraft/server-ui";
import { MARKER } from "../config";
import Helper from "./Helper.js";

/**
 * Amankan teks form dari parsing translate dan karakter khusus MC.
 * @param {string} text Teks mentah.
 * @returns {string} Teks aman untuk title/body/button.
 */
function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

/**
 * @typedef {"left" | "center" | "right"} ImageAnchor Image alignment inside the form.
 * @typedef {"very small" | "small" | "normal" | "big" | "large" | "extra"} ImageSize Preset square size: "very small" (32x32), "small" (48x48), "normal" (64x64), "big" (80x80), "large" (96x96), "extra" (112x112).
 * @callback FormCallback
 * @param {import("@minecraft/server").Player} player Player viewing the form.
 * @param {import("@minecraft/server-ui").ActionFormResponse} response Raw form response.
 * @returns {void}
 */

export class DarkActionForm extends ActionFormData {
    #titleText = "";
    #bodyText = "";
    #entries = [];
    #backEntry = null;

    /**
     * Set judul form, otomatis prefix marker tema.
     * @param {string | object} titleText String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.title("Menu");
     */
    title(titleText) {
        if (typeof titleText === "string") {
            this.#titleText = MARKER.form.base + safeText(titleText);
        } else if (titleText?.rawtext) {
            this.#titleText = {
                rawtext: [{ text: MARKER.form.base }, ...titleText.rawtext],
            };
        } else {
            this.#titleText = { rawtext: [{ text: MARKER.form.base }, titleText] };
        }
        return this;
    }
    /**
     * Set body form di atas daftar tombol.
     * @param {string | object} [bodyText=""] String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.body("Pilih fitur.");
     */
    body(bodyText = "") {
        if (typeof bodyText === "string") {
            this.#bodyText = safeText(bodyText);
        } else if (bodyText?.rawtext) {
            this.#bodyText = { rawtext: [...bodyText.rawtext] };
        } else {
            this.#bodyText = { rawtext: [bodyText] };
        }
        return this;
    }
    /**
     * Tambah header seksi abu-abu dengan garis divider opsional.
     * @param {string | object} headerText String atau RawMessage.
     * @param {boolean} [divider=true] Prefix marker garis divider bila true.
     * @returns {this} Instance untuk chaining.
     * @example form.header("Admin Menu");
     */
    header(headerText, divider = true) {
        const prefix = divider ? MARKER.form.divider : "";
        if (typeof headerText === "string") {
            this.#entries.push({ type: "header", text: prefix + safeText(headerText) });
        } else if (headerText?.rawtext) {
            this.#entries.push({
                type: "header",
                text: { rawtext: [{ text: prefix }, ...headerText.rawtext] },
            });
        } else {
            this.#entries.push({
                type: "header",
                text: { rawtext: [{ text: prefix }, headerText] },
            });
        }
        return this;
    }
    /**
     * Tambah teks statis non-klik di body form.
     * @param {string | object} labelText String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.label("Saldo: 100");
     */
    label(labelText) {
        if (typeof labelText === "string") labelText = safeText(labelText);
        this.#entries.push({ type: "label", text: labelText });
        return this;
    }
    /**
     * Tambah garis divider horizontal penuh.
     * @returns {this} Instance untuk chaining.
     * @example form.divider();
     */
    divider() {
        this.#entries.push({ type: "divider" });
        return this;
    }
    /**
     * Tampilkan gambar di body via marker anchor + size, atau ikon item via aux renderer.
     * Id item ("minecraft:chest"), angka aux mentah, atau object {id, version?, data?, glint?}
     * dirender sebagai ikon item; anchor/size hanya berlaku untuk path texture.
     * @param {string | number | object} pathOrId Path texture, id item, angka aux, atau {id, path?, version?, data?, glint?}.
     * @param {ImageAnchor} [anchor="left"] Posisi: "left", "center", "right" (texture path saja).
     * @param {ImageSize} [size="normal"] Ukuran preset (texture path saja).
     * @param {object} [opts] Opsi aux bila pathOrId berupa id: {version?, data?, glint?}.
     * @returns {this} Instance untuk chaining.
     * @example form.image("textures/items/apple", "center", "big");
     * @example form.image("minecraft:chest", "center");
     * @example form.image({ id: "minecraft:diamond_sword", glint: true });
     */
    image(pathOrId, anchor = "left", size = "normal", opts = {}) {
        const auxText = Helper.imageLabel(pathOrId, opts);
        if (auxText !== null) {
            this.#entries.push({ type: "label", text: auxText });
            return this;
        }
        let fallback = pathOrId;
        if (fallback !== null && typeof fallback === "object") fallback = fallback.path ?? fallback.id ?? "";
        const anchorMarker = MARKER.form.image.anchor[anchor] ?? MARKER.form.image.anchor.left;
        const sizeMarker = MARKER.form.image.size[size] ?? MARKER.form.image.size.normal;
        this.#entries.push({ type: "label", text: anchorMarker + sizeMarker + fallback });
        return this;
    }
    /**
     * Tambah tombol klik dengan callback opsional.
     * Ikon: path texture ("textures/..."), id item ("minecraft:chest"), angka aux mentah,
     * atau object {id, version?, data?, glint?}. Id tak dikenal -> ikon disembunyikan.
     * @param {string | object} text Label tombol.
     * @param {FormCallback | string | number | object} [onClickOrIcon] Callback klik, atau ikon (legacy path / id item / aux / object).
     * @param {string | number | object} [icon] Ikon bila argumen kedua callback.
     * @returns {this} Instance untuk chaining.
     * @example form.button("Shop", (player) => openShop(player));
     * @example form.button("Chest", "minecraft:chest");
     * @example form.button("Sword", (p) => openShop(p), { id: "minecraft:diamond_sword", glint: true });
     */
    button(text, onClickOrIcon, icon) {
        const onClick = typeof onClickOrIcon === "function" ? onClickOrIcon : undefined;
        const isIcon = typeof onClickOrIcon === "string" || typeof onClickOrIcon === "number" || (typeof onClickOrIcon === "object" && onClickOrIcon !== null);
        const iconPath = Helper.iconString(isIcon ? onClickOrIcon : (icon ?? ""));
        if (typeof text === "string") text = safeText(text);
        this.#entries.push({ type: "button", text, icon: iconPath, onClick });
        return this;
    }
    /**
     * Tambah tombol Back tetap di kiri bawah, selalu selection 0.
     * @param {FormCallback} onClick Callback terima (player, response).
     * @returns {this} Instance untuk chaining.
     * @example form.back((player) => mainMenu(player));
     */
    back(onClick) {
        this.#backEntry = { type: "button", text: MARKER.form.back + "Back", icon: "", onClick };
        return this;
    }
    /**
     * Render dan tampilkan form ke player, jalankan callback tombol terpilih.
     * @param {import("@minecraft/server").Player} player Player tujuan.
     * @returns {Promise<import("@minecraft/server-ui").ActionFormResponse>} Response mentah.
     * @example form.show(player);
     */
    show(player) {
        const form = new ActionFormData();
        form.title(this.#titleText);
        form.body(this.#bodyText);
        const clickables = [];
        if (this.#backEntry) {
            const entry = this.#backEntry;
            form.button(entry.text, entry.icon);
            clickables.push(entry);
        }
        for (const entry of this.#entries) {
            switch (entry.type) {
                case "button":
                    form.button(entry.text, entry.icon);
                    clickables.push(entry);
                    break;
                case "label":
                    form.label(entry.text);
                    break;
                case "header":
                    form.header(entry.text);
                    break;
                case "divider":
                    form.divider();
                    break;
            }
        }
        return super.show.call(form, player).then((response) => {
            if (!response.canceled && response.selection !== undefined) {
                const entry = clickables[response.selection];
                if (entry?.onClick) entry.onClick(player, response);
            }
            return response;
        });
    }
}

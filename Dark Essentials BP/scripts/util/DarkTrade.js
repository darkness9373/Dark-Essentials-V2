import { ActionFormData } from "@minecraft/server-ui";
import Helper from "./Helper";
import { MARKER } from "../config";

/**
 * Secure form text from parsing, translation, and MC special characters.
 * @param {string} text Raw text.
 * @returns {string} Text safe for title/body/button.
 */
function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

export class DarkTrade extends ActionFormData {
    #title = "";
    #body = "";
    #entries = [];

    title(text = "") {
        if (typeof text === "string") {
            this.#title = MARKER.form.base + MARKER.form.trade + safeText(text);
        } else if (text?.rawtext) {
            this.#title = {
                rawtext: [{ text: MARKER.form.base + MARKER.form.trade }, ...text.rawtext],
            };
        } else {
            this.#title = { rawtext: [{ text: MARKER.form.base + MARKER.form.trade }, text] };
        }
        return this;
    }
    body(text = "") {
        if (typeof text === "string") {
            this.#body = safeText(text);
        } else if (text?.rawtext) {
            this.#body = { rawtext: [...text.rawtext] };
        } else {
            this.#body = { rawtext: [text] };
        }
        return this;
    }
    /**
     * Add non-clickable static text in the body of the form.
     * @param {string | object} labelText String or RawMessage.
     * @returns {this} Instance for chaining.
     * @example form.label("Balance: 100");
     */
    label(labelText) {
        if (typeof labelText === "string") labelText = safeText(labelText);
        this.#entries.push({ type: "label", text: labelText });
        return this;
    }
    /**
     * Add a click button with an optional callback.
     * Icon: path texture ("textures/..."), item id ("minecraft:chest"), raw aux number,
     * or object {id, version?, data?, glint?}. Unknown id -> icon hidden.
     * @param {string | object} text Button label
     * @param {FormCallback | string | number | object} [onClickOrIcon] Click callback, or icon (legacy path / item id / aux / object).
     * @param {string | number | object} [icon] Icon when the second argument is a callback.
     * @param {object} [opts] Glint override: {glint?, version?, data?}. Object icon merges opts.
     * @param {boolean} [opts.glint] 
     * @returns {this} Instance for chaining.
     * @example form.button("Sword", (p) => {}, "minecraft:diamond_sword", { glint: true });
     * @example form.button("Plain", (p) => {}, { id: "minecraft:diamond_sword" }, { glint: false });
     */
    button(text, onClickOrIcon, icon, opts = {}) {
        const onClick = typeof onClickOrIcon === "function" ? onClickOrIcon : undefined;
        const isIcon = typeof onClickOrIcon === "string" || typeof onClickOrIcon === "number" || (typeof onClickOrIcon === "object" && onClickOrIcon !== null);
        const rawIcon = isIcon ? onClickOrIcon : (icon ?? "");
        const o = isIcon ? (icon !== null && typeof icon === "object" ? icon : opts) : opts;
        const oo = o !== null && typeof o === "object" ? o : {};
        let iconPath;
        if (rawIcon !== null && typeof rawIcon === "object") iconPath = Helper.iconString({ ...rawIcon, ...oo });
        else if (typeof rawIcon === "number" && Number.isFinite(rawIcon) && typeof oo.glint === "boolean") iconPath = `${MARKER.form.aux}${oo.glint ? Math.trunc(rawIcon) | 32768 : Math.trunc(rawIcon) & ~32768}`;
        else if (typeof rawIcon === "string" && typeof oo.glint === "boolean") {
            const t = rawIcon.trim();
            if (/^-?\d+$/.test(t)) iconPath = `${MARKER.form.aux}${oo.glint ? Math.trunc(Number(t)) | 32768 : Math.trunc(Number(t)) & ~32768}`;
            else if (!t || t.startsWith("textures") || t.includes("/") || t.startsWith(MARKER.form.aux)) iconPath = Helper.iconString(rawIcon);
            else iconPath = Helper.auxLabel(Helper.normItemId(t), oo) ?? "";
        } else iconPath = Helper.iconString(rawIcon);
        if (typeof text === "string") text = '§b§u§t§r' + safeText(text);
        this.#entries.push({ type: "button", text, icon: iconPath, onClick });
        return this;
    }
    /**
     * Render and display the form to the player, execute the selected button callback.
     * @param {import("@minecraft/server").Player} player Target player.
     * @returns {Promise<import("@minecraft/server-ui").ActionFormResponse>} Raw response.
     * @example form.show(player);
     */
    show(player) {
        const form = new ActionFormData();
        form.title(this.#title);
        form.body(this.#body);
        const clickables = [];
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

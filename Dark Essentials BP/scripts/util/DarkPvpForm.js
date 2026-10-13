import { ActionFormData } from "@minecraft/server-ui";
import Helper from "./Helper";
import { MARKER } from "../config";

function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

export class DarkPvpForm extends ActionFormData {
    #title = "";
    #body = "";
    #entries = [];

    title(text = "") {
        if (typeof text === "string") {
            this.#title = MARKER.form.base + MARKER.form.pvp + safeText(text);
        } else if (text?.rawtext) {
            this.#title = {
                rawtext: [{ text: MARKER.form.base + MARKER.form.pvp }, ...text.rawtext],
            };
        } else {
            this.#title = { rawtext: [{ text: MARKER.form.base + MARKER.form.pvp }, text] };
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
    label(labelText) {
        if (typeof labelText === "string") labelText = safeText(labelText);
        this.#entries.push({ type: "label", text: labelText });
        return this;
    }
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

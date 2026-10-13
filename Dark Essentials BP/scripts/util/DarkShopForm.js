import { ActionFormData } from "@minecraft/server-ui";
import { MARKER } from "../config";
import Helper from "./Helper.js";

function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

export class DarkShopForm extends ActionFormData {
    #titleText = "";
    #bodyText = "";
    #entries = [];

    title(titleText) {
        this.#titleText = MARKER.form.base + MARKER.form.shop + safeText(titleText);
        return this;
    }
    body(bodyText = "") {
        this.#bodyText = safeText(bodyText);
        return this;
    }
    button(text, onClick, icon) {
        if (typeof text === "string") text = safeText(text);
        this.#entries.push({ text, icon: Helper.iconString(icon ?? ""), onClick: typeof onClick === "function" ? onClick : undefined });
        return this;
    }
    category(name, onClick, opts = {}) {
        const text = MARKER.form.cat + safeText(name) + (opts.selected ? MARKER.form.shopSel : "");
        this.#entries.push({ text, icon: Helper.iconString(opts.icon ?? ""), onClick: typeof onClick === "function" ? onClick : undefined });
        return this;
    }
    list(name, onClick, icon) {
        const text = MARKER.form.list + safeText(name);
        this.#entries.push({ text, icon: Helper.iconString(icon ?? ""), onClick: typeof onClick === "function" ? onClick : undefined });
        return this;
    }
    coin(value) {
        const text = MARKER.form.coin + safeText(Helper.formatMoney(value));
        this.#entries.push({ text, icon: "", onClick: undefined });
        return this;
    }
    show(player) {
        const form = new ActionFormData();
        form.title(this.#titleText);
        form.body(this.#bodyText);
        const clickables = [];
        for (const entry of this.#entries) {
            if (entry.icon) form.button(entry.text, entry.icon);
            else form.button(entry.text);
            clickables.push(entry);
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

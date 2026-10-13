import { ActionFormData } from "@minecraft/server-ui";
import { MARKER } from "../config";
import Helper from "./Helper.js";

function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

export class DarkConfirmForm extends ActionFormData {
    #titleText = "";
    #bodyText = "";
    #entries = [];

    title(titleText) {
        this.#titleText =
            MARKER.form.base + MARKER.form.conf + safeText(titleText);
        return this;
    }
    body(bodyText = "") {
        this.#bodyText = safeText(bodyText);
        return this;
    }
    button(text, onClick, icon) {
        if (typeof text === "string") text = safeText(text);
        this.#entries.push({
            type: "button",
            text,
            icon: Helper.iconString(icon ?? ""),
            onClick: typeof onClick === "function" ? onClick : undefined,
        });
        return this;
    }
    label(labelText) {
        if (typeof labelText === "string") labelText = safeText(labelText);
        this.#entries.push({ type: "label", text: labelText });
        return this;
    }
    show(player) {
        const form = new ActionFormData();
        form.title(this.#titleText);
        form.body(this.#bodyText);
        const clickables = [];
        for (const entry of this.#entries) {
            if (entry.type === "label") {
                form.label(entry.text);
                continue;
            }
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

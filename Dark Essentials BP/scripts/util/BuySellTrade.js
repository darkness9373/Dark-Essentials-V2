import { ActionFormData } from "@minecraft/server-ui";
import Helper from "./Helper";
import { MARKER } from "../config";

function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

export class BuySellTrade extends ActionFormData {
    #title = "";
    #bodyText = "";
    #entries = [];
    title(titleText = "") {
        if (typeof titleText === "string") {
            this.#title = MARKER.form.base + MARKER.form.buysell + safeText(titleText);
        } else if (titleText?.rawtext) {
            this.#title = {
                rawtext: [{ text: MARKER.form.base + MARKER.form.buysell }, ...titleText.rawtext],
            };
        } else {
            this.#title = {
                rawtext: [{ text: MARKER.form.base + MARKER.form.buysell }, titleText],
            };
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
    preview(icon) {
        this.#entries.push({ type: "label", text: Helper.iconString(icon ?? "") });
        return this;
    }
    /**
     * Add detail text as label entry (collection) for detail panel.
     * @param {string | object} [detailText=""] String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.detail("Name: Chest");
     */
    detail(detailText = "") {
        if (typeof detailText === "string") detailText = safeText(detailText);
        this.#entries.push({ type: "label", text: detailText });
        return this;
    }
    button(text, onClick) {
        if (typeof text === "string") text = safeText(text);
        this.#entries.push({
            type: "button",
            text,
            onClick: typeof onClick === "function" ? onClick : undefined,
        });
        return this;
    }
    show(player) {
        const form = new ActionFormData();
        form.title(this.#title);
        form.body(this.#bodyText);
        const entries = [...this.#entries];
        const clickables = [];
        for (const entry of entries) {
            if (entry.type === "label") {
                form.label(entry.text);
                continue;
            }
            form.button(entry.text);
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

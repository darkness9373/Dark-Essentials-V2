import { ActionFormData } from "@minecraft/server-ui";
import Helper from "./Helper.js";

export class DarkMainForm extends ActionFormData {
    #onClicks = [];
    button(text, onClick, icon) {
        let cb;
        let ic;
        if (typeof onClick === "function") {
            cb = onClick;
            ic = icon;
        } else if (typeof icon === "function") {
            cb = icon;
            ic = onClick;
        }
        const iconStr = Helper.iconString(ic ?? "");
        if (!iconStr) super.button(text);
        else super.button(text, iconStr);
        this.#onClicks.push(cb);
        return this;
    }
    show(player) {
        return super.show(player).then((response) => {
            if (!response.canceled && response.selection !== undefined) {
                const cb = this.#onClicks[response.selection];
                if (cb) cb(player, response);
            }
            return response;
        });
    }
}

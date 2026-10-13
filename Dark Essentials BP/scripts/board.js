import { MARKER } from "./config.js";

const KEY = "dark:board";
const KEY_ON = "dark:board_on";
const DEFAULT = "black";

class Board {
    static colors() {
        return Object.keys(MARKER.board.color);
    }

    static get(player) {
        const v = player?.getDynamicProperty(KEY);
        if (typeof v === "string" && MARKER.board.color[v]) return v;
        return DEFAULT;
    }

    static marker(player) {
        return MARKER.board.color[Board.get(player)] ?? MARKER.board.color[DEFAULT];
    }

    static set(player, color) {
        if (!MARKER.board.color[color]) return false;
        player?.setDynamicProperty(KEY, color);
        return true;
    }

    static isOn(player) {
        const v = player?.getDynamicProperty(KEY_ON);
        if (v === undefined) return true;
        return Boolean(v);
    }

    static setOn(player, on) {
        player?.setDynamicProperty(KEY_ON, Boolean(on));
        return true;
    }
}

export default Board;

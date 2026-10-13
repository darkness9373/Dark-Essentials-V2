import { system, world } from "@minecraft/server";
import { RANK } from "./config.js";

const KEY = "dark:rank";
const DEFAULT = "member";

class Rank {
    static keys() {
        return Object.keys(RANK);
    }

    static get(player) {
        const v = player?.getDynamicProperty(KEY);
        if (typeof v === "string" && v in RANK) return v;
        return DEFAULT;
    }

    static glyph(player) {
        return RANK[Rank.get(player)] ?? RANK[DEFAULT];
    }

    static set(player, rank) {
        if (!(rank in RANK)) return false;
        player?.setDynamicProperty(KEY, rank);
        Rank.apply(player);
        return true;
    }

    static apply(player) {
        player.nameTag = `${Rank.glyph(player)} ${player.name}`;
    }
}

world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;
    const p = ev.player;
    if (!p) return;
    system.run(() => Rank.apply(p));
});

export default Rank;

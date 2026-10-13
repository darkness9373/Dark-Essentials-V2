import { system, world } from "@minecraft/server";
import Helper from "./util/Helper.js";

const KEY = "dark:bans";

function load() {
    const raw = world.getDynamicProperty(KEY);
    if (!raw) return {};
    const data = JSON.parse(String(raw));
    return data && typeof data === "object" ? data : {};
}

function save(data) {
    world.setDynamicProperty(KEY, JSON.stringify(data));
}

function kickName(name, message) {
    world.getDimension("overworld").runCommand(`kick "${name}" ${message}`);
}

class Ban {
    static key(name) {
        return String(name ?? "").toLowerCase();
    }

    static get(name) {
        return load()[Ban.key(name)];
    }

    static isBanned(name) {
        const e = Ban.get(name);
        if (!e) return false;
        if (!e.expiresAt) return true;
        if (Date.now() > e.expiresAt) {
            Ban.unban(name);
            return false;
        }
        return true;
    }

    static ban(name, durationMs, reason, by) {
        const clean = String(name ?? "").trim();
        if (!clean) return null;
        const data = load();
        const entry = {
            name: clean,
            expiresAt: durationMs ? Date.now() + durationMs : 0,
            reason: String(reason ?? "").slice(0, 100) || "No reason",
            by: String(by ?? "Server").slice(0, 32),
            createdAt: Date.now(),
        };
        data[Ban.key(clean)] = entry;
        save(data);
        const target = world.getAllPlayers().find((p) => p.name.toLowerCase() === Ban.key(clean));
        if (target) kickName(target.name, Ban.kickMessage(entry));
        return entry;
    }

    static unban(name) {
        const data = load();
        const k = Ban.key(name);
        if (!data[k]) return false;
        delete data[k];
        save(data);
        return true;
    }

    static list() {
        const data = load();
        const now = Date.now();
        return Object.values(data)
            .filter((e) => e && e.name)
            .filter((e) => !e.expiresAt || e.expiresAt > now)
            .sort((a, b) => a.name.localeCompare(b.name));
    }

    static kickMessage(entry) {
        const left = !entry.expiresAt ? "Permanent" : Helper.formatLeft(entry.expiresAt - Date.now());
        return `Banned: ${entry.reason} (${left})`;
    }
}

world.afterEvents.playerSpawn.subscribe((ev) => {
    if (!ev.initialSpawn) return;
    const p = ev.player;
    if (!p) return;
    system.run(() => {
        const e = Ban.get(p.name);
        if (!e) return;
        if (e.expiresAt && Date.now() > e.expiresAt) {
            Ban.unban(p.name);
            return;
        }
        kickName(p.name, Ban.kickMessage(e));
    });
});

export default Ban;

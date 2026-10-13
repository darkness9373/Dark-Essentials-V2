import { Player, world } from "@minecraft/server";
import DarkCommand from "./util/DarkCommand";
import { DarkPvpForm } from "./util/DarkPvpForm";

const KEY = "dark:pvp";

function load() {
    const raw = world.getDynamicProperty(KEY);
    if (!raw) return {};
    const data = JSON.parse(String(raw));
    return data && typeof data === "object" ? data : {};
}

function save(data) {
    world.setDynamicProperty(KEY, JSON.stringify(data));
}

export function openPvp(player) {
    const data = load();
    const pid = String(player.persistentId ?? player.id ?? "");
    data[pid] = {
        name: player.name,
        kills: data[pid]?.kills ?? 0,
        streak: data[pid]?.streak ?? 0,
        updatedAt: Date.now(),
    };
    save(data);
    const others = world.getAllPlayers().filter((p) => p.id !== player.id);
    const form = new DarkPvpForm();
    form.title("PVP");
    form.label("Challenge players");
    form.label(`§a●§r Online (${others.length})`);
    // for (const t of others) {
    //     const s = data[String(t.persistentId ?? t.id ?? "")] ?? {};
    //     form.button(`Name : ${t.name}\nStatus : Online\nTotal Kill : ${s.kills ?? 0}\nWin Streak : ${s.streak ?? 0}`, (p) => {
    //         p.sendMessage(`§aChallenged ${t.name}.`);
    //     });
    // }
    form.button("Test Button", (p) => {});
    form.button("Test Button", (p) => {});
    form.button("Test Button", (p) => {});
    form.button("Test Button", (p) => {});
    form.button("Test Button", (p) => {});
    form.show(player);
}

DarkCommand.registerCommand(
    {
        name: "drk:pvp",
        description: "Open PVP menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        openPvp(p);
    },
);

import { ItemTypes, Player, system, world } from "@minecraft/server";
import "./sidebar.js";
import "./ban.js";
import "./rank.js";
import "./float.js";
import "./trade.js";
import "./pvp.js";
import Ban from "./ban.js";
import Board from "./board.js";
import Float from "./float.js";
import { gachaPreview } from "./gacha.js";
import Money from "./money.js";
import Rank from "./rank.js";
import Redeem from "./redeem.js";
import { DarkActionForm } from "./util/DarkActionForm.js";
import { DarkModalForm } from "./util/DarkModalForm.js";
import { DarkShopForm } from "./util/DarkShopForm.js";
import { openShop } from "./shop.js";
import { openPvp } from "./pvp.js";
import DarkCommand from "./util/DarkCommand.js";
import Helper from "./util/Helper.js";
import { DarkMainForm } from "./util/DarkMainForm.js";
import Objective from "./objective.js";

DarkCommand.registerCommand(
    {
        name: "drk:menu",
        description: "Open the main menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        mainMenu(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:currency",
        description: "Open the currency menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        currencyMenu(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:ban",
        description: "Open the ban menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        banMenu(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:board",
        description: "Open the board color menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        boardMenu(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:redeem",
        description: "Open redeem code menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        redeemMenu(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:rank",
        description: "Open the rank menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        rankAdmin(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:float",
        description: "Open the floating text menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        floatAdmin(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:icon",
        description: "Look up item icon aux id",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        iconLookup(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:auxver",
        description: "Set active aux id game version",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        if (!Helper.isAdmin(p)) return;
        iconVersion(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:gacha",
        description: "Preview gacha spin",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        gachaPreview(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:shop",
        description: "Preview shop form",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        openShop(p);
    },
);
DarkCommand.registerCommand(
    {
        name: "drk:lobby",
        description: "Teleport player to the lobby",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        p.teleport(
            {
                x: 0,
                y: 0,
                z: 0,
            },
            {
                dimension: world.getDimension("drk:lobby"),
            },
        );
    },
);

DarkCommand.registerCommand(
    {
        name: "drk:overworld",
        description: "Teleport player to the overworld",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        p.teleport(
            {
                x: 0,
                y: 0,
                z: 0,
            },
            {
                dimension: world.getDimension("overworld"),
            },
        );
    },
);

system.beforeEvents.startup.subscribe((data) => {
    data.dimensionRegistry.registerCustomDimension("drk:lobby");
});

function mainMenu(player) {
    const form = new DarkMainForm();
    form.title("§d§e§s§r§m§a§i§n§rMAIN MENU");
    form.label("Tes label wok");
    form.label(`${player.name}`);
    form.label(`Role : Petani Tebu`);
    form.label(`${Helper.formatMoney(Objective.get("money", player))}`);
    form.label(`${Helper.formatMoney(Objective.get("prisma", player))}`);
    form.button("Shop", (p) => openShop(p), "textures/darkesse/shop/shop");
    form.label("Buy shop items");
    form.button("Trade", (p) => {}, "textures/darkesse/menu/trade");
    form.label("Player trade items");
    form.button("PVP", (p) => openPvp(p), "textures/darkesse/menu/pvp");
    form.label("Challenge players");
    form.button("World", (p) => {}, "textures/darkesse/menu/world");
    form.label("Explore the world");
    form.button("Quest", (p) => {}, "textures/darkesse/menu/quest");
    form.label("Complete the quest");
    form.button("Rank", (p) => {}, "textures/darkesse/menu/rank");
    form.label("View leaderboard");
    form.label("Welcome to our server!");
    form.label("Enjoy a fun gaming experience!");
    form.show(player).then((r) => {
        if (r.canceled) return;
    });
}

function rankAdmin(player, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Rank");
    form.button("Set Rank", (p) => rankSet(p, fromMenu));
    const list = world.getAllPlayers();
    if (!list.length) form.label("No players online.");
    for (const t of list) {
        form.label(`${Rank.glyph(t)} ${t.name}`);
    }
    if (fromMenu) form.back((p) => mainMenu(p));
    form.show(player);
}

function rankSet(player, fromMenu = false) {
    const list = world.getAllPlayers();
    const names = list.map((p) => p.name);
    if (!names.length) {
        player.sendMessage("No players online.");
        return;
    }
    const keys = Rank.keys();
    const form = new DarkModalForm();
    form.title("Set Rank");
    form.dropdown("Target", names, 0);
    form.dropdown("Rank", keys, Math.max(0, keys.indexOf("member")));
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            rankAdmin(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const target = list[Number(v[0])] ?? list[0];
        const rank = keys[Number(v[1])] ?? "member";
        if (!target) {
            player.sendMessage("Invalid target.");
            return;
        }
        Rank.set(target, rank);
        player.sendMessage(`Set ${target.name} to ${rank}.`);
    });
}

function redeemMenu(player, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Redeem Menu");
    form.textField("Code", "e.g. code123");
    form.submitButton("Redeem");
    form.show(player).then((r) => {
        if (r.canceled) {
            if (fromMenu) mainMenu(player);
            return;
        }
        Redeem.claim(player, r.formValues?.[0]);
    });
}

function redeemAdmin(player, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Redeem Manager");
    form.button("Create Code", (p) => redeemCreate(p, fromMenu));
    const list = Redeem.list();
    if (!list.length) form.label("No codes.");
    for (const e of list) {
        const left = !e.expiresAt
            ? "Permanent"
            : Helper.formatLeft(e.expiresAt - Date.now());
        form.button(`${e.code} (${e.uses}/${e.maxUses}, ${left})`, (p) =>
            redeemDetail(p, e.code, fromMenu),
        );
    }
    if (fromMenu) form.back((p) => mainMenu(p));
    form.show(player);
}

function redeemDetail(player, code, fromMenu = false) {
    const e = Redeem.get(code);
    if (!e) {
        player.sendMessage("§cCode not found.");
        return;
    }
    const form = new DarkActionForm();
    form.title(`Code: ${e.code}`);
    form.label(
        `Items: ${(e.rewards ?? []).length}\nObjectives: ${(e.objectives ?? []).length}\nUses: ${e.uses}/${e.maxUses}\nBy: ${e.by}`,
    );
    form.button("Delete", (p) => {
        Redeem.delete(e.code);
        p.sendMessage(`§aDeleted ${e.code}.`);
    });
    form.back((p) => redeemAdmin(p, fromMenu));
    form.show(player);
}

function redeemCreate(player, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Create Code");
    form.textField("Code (4-16 A-Z0-9)", "GIFT123");
    form.textField("Item count (0-5)", "1", "1");
    form.textField("Objective count (0-5)", "0", "0");
    form.textField("Max uses (>0)", "10", "10");
    form.textField("Duration (30s, 10m, 2h, 7d, perm)", "perm", "perm");
    form.submitButton("Next");
    form.show(player).then((res) => {
        if (res.canceled) {
            redeemAdmin(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const code = Redeem.validCode(v[0]);
        const nItem = Math.floor(Number(v[1]));
        const nObj = Math.floor(Number(v[2]));
        const maxUses = Math.floor(Number(v[3]));
        const dur = Helper.parseDuration(v[4]);
        if (!code || Redeem.get(code)) {
            player.sendMessage("§cInvalid or duplicate code.");
            return;
        }
        if (
            !Number.isFinite(nItem) ||
            nItem < 0 ||
            nItem > 5 ||
            !Number.isFinite(nObj) ||
            nObj < 0 ||
            nObj > 5 ||
            nItem + nObj < 1
        ) {
            player.sendMessage("§cCounts 0-5, at least 1 reward.");
            return;
        }
        if (!Number.isFinite(maxUses) || maxUses < 1) {
            player.sendMessage("§cMax uses must be >0.");
            return;
        }
        if (dur === null) {
            player.sendMessage("§cBad duration.");
            return;
        }
        const draft = {
            code,
            nItem,
            nObj,
            maxUses,
            durationMs: dur,
            rewards: [],
            objectives: [],
            step: 0,
            by: player.name,
            fromMenu,
        };
        redeemRewardStep(player, draft);
    });
}

function redeemRewardStep(player, draft) {
    const total = draft.nItem + draft.nObj;
    if (draft.step >= total) {
        Redeem.create(draft);
        player.sendMessage(`§aCreated ${draft.code}.`);
        return;
    }
    const isItem = draft.step < draft.nItem;
    const n = isItem ? draft.step + 1 : draft.step - draft.nItem + 1;
    const form = new DarkModalForm();
    form.title(
        isItem ? `Item ${n}/${draft.nItem}` : `Objective ${n}/${draft.nObj}`,
    );
    if (isItem) {
        form.textField("Item ID", "minecraft:diamond_sword");
        form.textField("Amount (1-64)", "1", "1");
        form.textField("Enchants (id:level, comma)", "");
    } else {
        form.textField("Objective name", "money");
        form.textField("Amount (>0)", "100", "100");
    }
    form.submitButton("Next");
    form.show(player).then((res) => {
        if (res.canceled) {
            redeemAdmin(player, draft.fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        if (isItem) {
            const id = Helper.normItemId(v[0]);
            const amount = Math.floor(Number(v[1]));
            if (!id || !ItemTypes.get(id)) {
                player.sendMessage(`§cBad item id '${v[0]}'. Skipped.`);
                draft.step++;
                system.runTimeout(() => redeemRewardStep(player, draft), 40);
                return;
            }
            if (!Number.isFinite(amount) || amount < 1 || amount > 64) {
                player.sendMessage(`§cBad amount '${v[1]}'. Skipped.`);
                draft.step++;
                system.runTimeout(() => redeemRewardStep(player, draft), 40);
                return;
            }
            const ench = Helper.parseEnchants(v[2]);
            if (!ench.ok) {
                player.sendMessage(`§c${ench.reason}. Skipped.`);
                draft.step++;
                system.runTimeout(() => redeemRewardStep(player, draft), 40);
                return;
            }
            draft.rewards.push({ id, amount, enchant: ench.enchants });
        } else {
            const name = Helper.validObjectiveName(v[0]);
            const amount = Math.floor(Number(v[1]));
            if (!name) {
                player.sendMessage(`§cBad objective '${v[0]}'. Skipped.`);
                draft.step++;
                system.runTimeout(() => redeemRewardStep(player, draft), 40);
                return;
            }
            if (!Number.isFinite(amount) || amount < 1) {
                player.sendMessage(`§cBad amount '${v[1]}'. Skipped.`);
                draft.step++;
                system.runTimeout(() => redeemRewardStep(player, draft), 40);
                return;
            }
            draft.objectives.push({ objective: name, amount });
        }
        draft.step++;
        redeemRewardStep(player, draft);
    });
}

/**
 * @param {Player} player
 * @param {boolean} fromMenu
 */
function boardMenu(player, fromMenu = false) {
    const colors = Board.colors();
    const current = Board.get(player);
    const form = new DarkModalForm();
    form.title("Board");
    form.toggle("Board On", Board.isOn(player));
    form.dropdown("Color", colors, Math.max(0, colors.indexOf(current)));
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            if (fromMenu) mainMenu(player);
            return;
        }
        const v = res.formValues ?? [];
        const color = colors[Number(v[1])] ?? current;
        const on = Boolean(v[0]);
        Board.setOn(player, on);
        Board.set(player, color);
        if (!on) {
            system.runTimeout(() => {
                player.onScreenDisplay.setTitle("§r", {
                    fadeInDuration: 0,
                    fadeOutDuration: 0,
                    stayDuration: 1,
                });
            }, 20);
        }
        player.sendMessage(`§cBoard: ${on ? "on" : "off"} (${color})`);
    });
}

function currencyMenu(player, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Currency");
    form.body(`Balance: ${Helper.formatMoney(Money.get(player))}`);
    form.button("Add", (p) => currencyForm(p, "add", fromMenu));
    form.button("Remove", (p) => currencyForm(p, "remove", fromMenu));
    form.button("Set", (p) => currencyForm(p, "set", fromMenu));
    if (fromMenu) form.back((p) => mainMenu(p));
    form.show(player);
}

function banMenu(player, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Ban");
    form.button("Ban Player", (p) => banForm(p, fromMenu));
    form.button("Ban List", (p) => banList(p, fromMenu));
    if (fromMenu) form.back((p) => mainMenu(p));
    form.show(player);
}

function banForm(player, fromMenu = false) {
    const list = world.getAllPlayers().filter((p) => !Helper.isAdmin(p));
    const names = list.map((p) => p.name);
    if (!names.length) {
        player.sendMessage("§cNo players online.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Ban Player");
    form.dropdown("Target", names, 0);
    form.textField("Duration (30s, 10m, 2h, 7d, perm)", "perm", "perm");
    form.textField("Reason", "No reason", "No reason");
    form.submitButton("Ban");
    form.show(player).then((res) => {
        if (res.canceled) {
            banMenu(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const target = list[Number(v[0])] ?? list[0];
        const dur = Helper.parseDuration(v[1]);
        if (!target || dur === null) {
            player.sendMessage("§cInvalid input.");
            return;
        }
        if (Helper.isAdmin(target)) {
            player.sendMessage("§cCannot ban admin.");
            return;
        }
        Ban.ban(target.name, dur, v[2], player.name);
        player.sendMessage(`§aBanned ${target.name}.`);
    });
}

function banList(player, fromMenu = false) {
    const list = Ban.list();
    const form = new DarkActionForm();
    form.title("Ban List");
    if (!list.length) form.label("No bans.");
    for (const e of list) {
        const left = !e.expiresAt
            ? "Permanent"
            : Helper.formatLeft(e.expiresAt - Date.now());
        form.button(`${e.name} (${left})`, (p) =>
            banDetail(p, e.name, fromMenu),
        );
    }
    form.back((p) => banMenu(p, fromMenu));
    form.show(player);
}

function banDetail(player, name, fromMenu = false) {
    const e = Ban.get(name);
    if (!e) {
        player.sendMessage("§cBan not found.");
        return;
    }
    const left = !e.expiresAt
        ? "Permanent"
        : Helper.formatLeft(e.expiresAt - Date.now());
    const countdown = !e.expiresAt
        ? "-"
        : Helper.formatTime(Math.ceil((e.expiresAt - Date.now()) / 1000));
    const form = new DarkActionForm();
    form.title(`Ban: ${e.name}`);
    form.label(
        `Reason: ${e.reason}\nLeft: ${left} (${countdown})\nBy: ${e.by}`,
    );
    form.button("Unban", (p) => {
        Ban.unban(e.name);
        p.sendMessage(`§aUnbanned ${e.name}.`);
    });
    form.back((p) => banList(p, fromMenu));
    form.show(player);
}

function currencyForm(player, mode, fromMenu = false) {
    const list = world.getAllPlayers();
    const names = list.map((p) => p.name);
    if (!names.length) {
        player.sendMessage("§cNo players online.");
        return;
    }
    const form = new DarkModalForm();
    form.title(
        mode === "add"
            ? "Add Money"
            : mode === "remove"
              ? "Remove Money"
              : "Set Money",
    );
    form.dropdown("Target", names, 0);
    form.textField("Amount", "100", "100");
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            currencyMenu(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const target = list[Number(v[0])] ?? list[0];
        const amount = Math.floor(Number(v[1]));
        if (!target || !Number.isFinite(amount)) {
            player.sendMessage("§cInvalid input.");
            return;
        }
        if (mode === "add") Money.add(target, amount);
        if (mode === "remove") Money.remove(target, amount);
        if (mode === "set") Money.set(target, amount);
        player.sendMessage(
            `§a${target.name}: ${Helper.formatMoney(Money.get(target))}`,
        );
    });
}

function floatAdmin(player, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Floating Text");
    form.button("Create Text", (p) => floatCreateText(p, fromMenu));
    form.button("Create Score", (p) => floatCreateScore(p, fromMenu));
    const list = Float.list();
    if (!list.length) form.label("No boards.");
    for (const b of list) {
        const root = b.root;
        const name = Float.nameOf(root);
        if (!name) continue;
        form.button(`${name} [${Float.kindOf(root)}]`, (p) =>
            floatDetail(p, name, fromMenu),
        );
    }
    if (fromMenu) form.back((p) => mainMenu(p));
    form.show(player);
}

function floatDetail(player, name, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const kind = Float.kindOf(root);
    const title = String(root.getDynamicProperty("dark:title") ?? "");
    const form = new DarkActionForm();
    form.title(`Float: ${name}`);
    form.label(`Kind: ${kind}\nTitle: ${title}\nGap: ${Float.gapOf(root)}`);
    if (kind === "text") {
        form.button("Edit Title", (p) => floatEditTitle(p, name, fromMenu));
        form.button("Add Line", (p) => floatAddLine(p, name, fromMenu));
        const kids = Float.childrenOf(root);
        kids.forEach((k, i) => {
            const t = String(k.getDynamicProperty("dark:text") ?? "");
            form.button(`${i + 1}. ${t || "-"}`, (p2) =>
                floatLineDetail(p2, name, i, fromMenu),
            );
        });
    } else {
        form.button("Edit Title", (p) => floatEditTitle(p, name, fromMenu));
        form.label(
            `Format: ${Float.formatOf(root) ? "1.5K" : "1500"}\nRow: ${Float.templateOf(root)}`,
        );
        form.button("Toggle Format", (p) => {
            const r = Float.getRoot(name);
            if (!r) {
                p.sendMessage("Board not found.");
                return;
            }
            Float.setFormat(r, !Float.formatOf(r));
            p.sendMessage(`Format: ${Float.formatOf(r) ? "1.5K" : "1500"}`);
        });
        form.button("Set Row", (p) => floatSetTemplate(p, name, fromMenu));
    }
    form.button("Set Gap", (p) => floatSetGap(p, name, fromMenu));
    form.button("Move Here", (p) => {
        const r = Float.getRoot(name);
        if (!r) {
            p.sendMessage("Board not found.");
            return;
        }
        Float.moveHere(r, p);
        p.sendMessage(`Moved ${name}.`);
    });
    form.button("Delete", (p) => {
        Float.deleteBoard(name);
        p.sendMessage(`Deleted ${name}.`);
    });
    form.back((p) => floatAdmin(p, fromMenu));
    form.show(player);
}

function floatCreateText(player, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Create Text");
    form.textField("Name (A-Z0-9, max 16)", "spawn");
    form.textField("Title text", "Welcome");
    form.textField("Gap (0.1-1.0)", "0.3", "0.3");
    form.submitButton("Create");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatAdmin(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const name = Float.validName(v[0]);
        const text = Float.validText(v[1]);
        const gap = Float.validGap(v[2]);
        if (!name) {
            player.sendMessage("Bad name.");
            return;
        }
        if (!text) {
            player.sendMessage("Bad text.");
            return;
        }
        if (gap === null) {
            player.sendMessage("Gap must be 0.1-1.0.");
            return;
        }
        if (!Float.createText(player, name, text, gap)) {
            player.sendMessage("Name already used.");
            return;
        }
        player.sendMessage(`Created ${name}.`);
    });
}

function floatCreateScore(player, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Create Score");
    form.textField("Name (A-Z0-9, max 16)", "topmoney");
    form.textField("Objective", "money");
    form.textField("Gap (0.1-1.0)", "0.3", "0.3");
    form.toggle("Format number (1.5K)", true);
    form.textField(
        "Row (@NO @NAME @SCORE @RANK)",
        "@NO. @NAME - @SCORE",
        "@NO. @NAME - @SCORE",
    );
    form.submitButton("Create");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatAdmin(player, fromMenu);
            return;
        }
        const v = res.formValues ?? [];
        const name = Float.validName(v[0]);
        const obj = Helper.validObjectiveName(v[1]);
        const gap = Float.validGap(v[2]);
        const template = Float.validTemplate(v[4]);
        if (!name) {
            player.sendMessage("Bad name.");
            return;
        }
        if (!obj) {
            player.sendMessage("Bad objective.");
            return;
        }
        if (gap === null) {
            player.sendMessage("Gap must be 0.1-1.0.");
            return;
        }
        if (!template) {
            player.sendMessage("Row needs @NO/@NAME/@SCORE/@RANK.");
            return;
        }
        if (
            !Float.createScore(player, name, obj, gap, Boolean(v[3]), template)
        ) {
            player.sendMessage("Name already used.");
            return;
        }
        player.sendMessage(`Created ${name}.`);
    });
}

function floatSetTemplate(player, name, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Set Row");
    form.textField(
        "Row (@NO @NAME @SCORE @RANK)",
        "@NO. @NAME - @SCORE",
        Float.templateOf(root),
    );
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatDetail(player, name, fromMenu);
            return;
        }
        const template = Float.validTemplate(res.formValues?.[0]);
        if (!template) {
            player.sendMessage("Row needs @NO/@NAME/@SCORE/@RANK.");
            return;
        }
        const r = Float.getRoot(name);
        if (!r) {
            player.sendMessage("Board not found.");
            return;
        }
        Float.setTemplate(r, template);
        player.sendMessage("Row saved.");
    });
}

function floatEditTitle(player, name, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Edit Title");
    form.textField(
        "Title",
        "",
        String(root.getDynamicProperty("dark:title") ?? ""),
    );
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatDetail(player, name, fromMenu);
            return;
        }
        const text = Float.validText(res.formValues?.[0]);
        if (!text) {
            player.sendMessage("Bad text.");
            return;
        }
        const r = Float.getRoot(name);
        if (!r) {
            player.sendMessage("Board not found.");
            return;
        }
        Float.setTitle(r, text);
        player.sendMessage("Title saved.");
    });
}

function floatAddLine(player, name, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Add Line");
    form.textField("Text", "");
    form.submitButton("Add");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatDetail(player, name, fromMenu);
            return;
        }
        const text = Float.validText(res.formValues?.[0]);
        if (!text) {
            player.sendMessage("Bad text.");
            return;
        }
        const r = Float.getRoot(name);
        if (!r) {
            player.sendMessage("Board not found.");
            return;
        }
        Float.addLine(r, text);
        player.sendMessage("Line added.");
    });
}

function floatLineDetail(player, name, index, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const kids = Float.childrenOf(root);
    if (index < 0 || index >= kids.length) {
        player.sendMessage("Line not found.");
        return;
    }
    const cur = String(kids[index].getDynamicProperty("dark:text") ?? "");
    const form = new DarkActionForm();
    form.title(`Line ${index + 1}`);
    form.label(cur || "-");
    form.button("Edit", (p) => floatEditLine(p, name, index, fromMenu));
    form.button("Move Up", (p) => {
        const r = Float.getRoot(name);
        if (!r) {
            p.sendMessage("Board not found.");
            return;
        }
        if (!Float.moveLine(r, index, -1)) {
            p.sendMessage("Already at top.");
            return;
        }
        p.sendMessage("Moved up.");
    });
    form.button("Move Down", (p) => {
        const r = Float.getRoot(name);
        if (!r) {
            p.sendMessage("Board not found.");
            return;
        }
        if (!Float.moveLine(r, index, 1)) {
            p.sendMessage("Already at bottom.");
            return;
        }
        p.sendMessage("Moved down.");
    });
    form.button("Delete", (p) => {
        const r = Float.getRoot(name);
        if (!r) {
            p.sendMessage("Board not found.");
            return;
        }
        Float.deleteLine(r, index);
        p.sendMessage("Line deleted.");
    });
    form.back((p) => floatDetail(p, name, fromMenu));
    form.show(player);
}

function floatEditLine(player, name, index, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const kids = Float.childrenOf(root);
    if (index < 0 || index >= kids.length) {
        player.sendMessage("Line not found.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Edit Line");
    form.textField(
        "Text",
        "",
        String(kids[index].getDynamicProperty("dark:text") ?? ""),
    );
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatLineDetail(player, name, index, fromMenu);
            return;
        }
        const text = Float.validText(res.formValues?.[0]);
        if (!text) {
            player.sendMessage("Bad text.");
            return;
        }
        const r = Float.getRoot(name);
        if (!r) {
            player.sendMessage("Board not found.");
            return;
        }
        const k2 = Float.childrenOf(r);
        if (index < 0 || index >= k2.length) {
            player.sendMessage("Line not found.");
            return;
        }
        Float.editLine(k2[index], text);
        player.sendMessage("Line saved.");
    });
}

function floatSetGap(player, name, fromMenu = false) {
    const root = Float.getRoot(name);
    if (!root) {
        player.sendMessage("Board not found.");
        return;
    }
    const form = new DarkModalForm();
    form.title("Set Gap");
    form.textField("Gap (0.1-1.0)", "0.3", String(Float.gapOf(root)));
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            floatDetail(player, name, fromMenu);
            return;
        }
        const gap = Float.validGap(res.formValues?.[0]);
        if (gap === null) {
            player.sendMessage("Gap must be 0.1-1.0.");
            return;
        }
        const r = Float.getRoot(name);
        if (!r) {
            player.sendMessage("Board not found.");
            return;
        }
        Float.setGap(r, gap);
        player.sendMessage(`Gap: ${gap}`);
    });
}

function iconVersion(player, fromMenu = false) {
    const versions = Helper.auxVersions();
    const form = new DarkModalForm();
    form.title("Aux Version");
    form.label(`Active: ${Helper.auxVersion()}`);
    form.dropdown(
        "Version",
        versions,
        Math.max(0, versions.indexOf(Helper.auxVersion())),
    );
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            if (fromMenu) mainMenu(player);
            return;
        }
        const version =
            versions[Number(res.formValues?.[0])] ??
            versions[versions.length - 1];
        Helper.setAuxVersion(version);
        player.sendMessage(`Aux version: ${version}`);
    });
}

function iconLookup(player, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Icon Test");
    form.label(`Version: ${Helper.auxVersion()}`);
    form.textField("Item ID", "minecraft:chest");
    form.toggle("Glint", false);
    form.textField("Data (0-65535)", "0", "0");
    form.textField("Probe raw (custom only)", "");
    form.submitButton("Test");
    form.show(player).then((res) => {
        if (res.canceled) {
            if (fromMenu) mainMenu(player);
            return;
        }
        const v = res.formValues ?? [];
        const id = Helper.normItemId(v[0]);
        const version = Helper.auxVersion();
        const data = Math.floor(Number(v[2])) || 0;
        const glint = Boolean(v[1]);
        const probeRaw = String(v[3] ?? "").trim();
        if (/^scan/i.test(probeRaw)) {
            iconScan(player, id, version, data, glint, fromMenu);
            return;
        }
        if (probeRaw !== "") {
            const n = Math.floor(Number(probeRaw));
            if (!Number.isFinite(n)) {
                player.sendMessage(`Bad probe raw '${v[3]}'.`);
                return;
            }
            const aux = (n << 16) | ((data & 0xffff) | (glint ? 32768 : 0));
            const label = `${"§a§u§x"}${aux}`;
            const result = new DarkActionForm();
            result.title("Probe Result");
            result.label(label);
            result.label(`${id} [${version}]: probe raw ${n}, aux ${aux}`);
            result.button("Save Custom Raw", (p) => {
                Helper.saveCustomRaw(id, n, version);
                p.sendMessage(`Saved ${id} raw ${n} [${version}].`);
            });
            result.button("Test Again", (p) => iconLookup(p, fromMenu));
            result.back((p) => {
                if (fromMenu) mainMenu(p);
                else iconLookup(p);
            });
            result.show(player);
            return;
        }
        const tex = Helper.iconTexture(id);
        if (tex) {
            const result = new DarkActionForm();
            result.title("Icon Result");
            result.image(tex, "center", "big");
            result.label(`${id} [${version}]: block-texture ${tex}`);
            result.button("Test Again", (p) => iconLookup(p, fromMenu));
            result.back((p) => {
                if (fromMenu) mainMenu(p);
                else iconLookup(p);
            });
            player.sendMessage(`Icon test: ${id} texture ${tex}`);
            result.show(player);
            return;
        }
        const label = Helper.auxLabel(id, { version, data, glint });
        if (label === null) {
            player.sendMessage(`Unknown id '${v[0]}'.`);
            return;
        }
        const aux = Helper.auxOf(id, version, data, glint);
        const result = new DarkActionForm();
        result.title("Icon Result");
        result.label(label);
        const src = Helper.iconSource(id, version);
        result.label(
            `${id} [${version}]: ${src} raw ${Helper.rawOf(id, version)}, aux ${aux}${glint ? " (glint)" : ""}`,
        );
        result.button("Set Block Texture", (p) =>
            iconBlockTexture(p, id, fromMenu),
        );
        result.button(`Version (${version})`, (p) => iconVersion(p, false));
        result.button("Test Again", (p) => iconLookup(p, fromMenu));
        result.back((p) => {
            if (fromMenu) mainMenu(p);
            else iconLookup(p);
        });
        player.sendMessage(`Icon test: ${id} aux ${aux}`);
        result.show(player);
    });
}

function iconBlockTexture(player, id, fromMenu = false) {
    const form = new DarkModalForm();
    form.title("Block Texture");
    form.label(id);
    form.textField("Texture path", "textures/blocks/crate");
    form.submitButton("Save");
    form.show(player).then((res) => {
        if (res.canceled) {
            iconLookup(player, fromMenu);
            return;
        }
        const p = String(res.formValues?.[0] ?? "").trim();
        if (!p) {
            player.sendMessage("Bad texture path.");
            return;
        }
        Helper.saveCustomBlockTexture(id, p);
        player.sendMessage(`Saved ${id} texture ${p}.`);
    });
}

function iconScan(player, id, version, data, glint, fromMenu = false) {
    const form = new DarkActionForm();
    form.title("Raw Scan");
    form.label(
        `${id} [${version}]: tap Next until the coin icon appears, then Save that raw.`,
    );
    for (let raw = 852; raw <= 870; raw++) {
        const aux = (raw << 16) | ((data & 0xffff) | (glint ? 32768 : 0));
        form.button(
            `raw ${raw}`,
            (p) => {
                Helper.saveCustomRaw(id, raw, version);
                p.sendMessage(`Saved ${id} raw ${raw} [${version}].`);
            },
            `${"§a§u§x"}${aux}`,
        );
    }
    form.button("Back to Test", (p) => iconLookup(p, fromMenu));
    form.back((p) => {
        if (fromMenu) mainMenu(p);
        else iconLookup(p);
    });
    form.show(player);
}

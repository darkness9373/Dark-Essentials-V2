import { EnchantmentTypes, EntityComponentTypes, ItemComponentTypes, ItemStack, ItemTypes, world } from "@minecraft/server";
import Objective from "./objective.js";

const PREFIX = "dark:redeem_";

class Redeem {
    static key(code) {
        return String(code ?? "").trim().toLowerCase();
    }

    static dpKey(code) {
        return PREFIX + Redeem.key(code);
    }

    static validCode(code) {
        const s = String(code ?? "").trim();
        return /^[A-Za-z0-9]{4,16}$/.test(s) ? s : null;
    }

    static get(code) {
        const raw = world.getDynamicProperty(Redeem.dpKey(code));
        if (!raw) return null;
        const data = JSON.parse(String(raw));
        return data && typeof data === "object" ? data : null;
    }

    static list() {
        const out = [];
        for (const id of world.getDynamicPropertyIds()) {
            if (!id.startsWith(PREFIX)) continue;
            const e = Redeem.get(id.slice(PREFIX.length));
            if (!e) continue;
            if (e.expiresAt && Date.now() > e.expiresAt) {
                world.setDynamicProperty(id);
                continue;
            }
            out.push(e);
        }
        return out.sort((a, b) => String(a.code).localeCompare(String(b.code)));
    }

    static create(draft) {
        const code = Redeem.validCode(draft.code);
        if (!code) return null;
        if (Redeem.get(code)) return null;
        const entry = {
            code,
            rewards: draft.rewards ?? [],
            objectives: draft.objectives ?? [],
            maxUses: draft.maxUses,
            uses: 0,
            claimed: [],
            expiresAt: draft.durationMs ? Date.now() + draft.durationMs : 0,
            by: String(draft.by ?? "Server").slice(0, 32),
            createdAt: Date.now(),
        };
        world.setDynamicProperty(Redeem.dpKey(code), JSON.stringify(entry));
        return entry;
    }

    static delete(code) {
        if (!Redeem.get(code)) return false;
        world.setDynamicProperty(Redeem.dpKey(code));
        return true;
    }

    static claim(player, code) {
        const e = Redeem.get(code);
        if (!e) {
            player.sendMessage("§cCode not found.");
            return;
        }
        if (e.expiresAt && Date.now() > e.expiresAt) {
            Redeem.delete(e.code);
            player.sendMessage("§cCode expired.");
            return;
        }
        if ((e.uses ?? 0) >= (e.maxUses ?? 1)) {
            player.sendMessage("§cCode already fully used.");
            return;
        }
        const who = String(player.name ?? "").toLowerCase();
        const claimed = Array.isArray(e.claimed) ? e.claimed : [];
        if (claimed.includes(who)) {
            player.sendMessage("§cYou already redeemed this code.");
            return;
        }
        const got = [];
        const skipped = [];
        for (const r of e.rewards ?? []) {
            if (Redeem.giveItem(player, r)) got.push(`${r.amount}x ${r.id}`);
            else skipped.push(r.id);
        }
        for (const o of e.objectives ?? []) {
            Objective.ensure(o.objective);
            Objective.add(o.objective, player, o.amount);
            got.push(`${o.amount}x ${o.objective}`);
        }
        e.uses = (e.uses ?? 0) + 1;
        e.claimed = [...new Set([...(Array.isArray(e.claimed) ? e.claimed : []), who])];
        world.setDynamicProperty(Redeem.dpKey(e.code), JSON.stringify(e));
        player.sendMessage(`§aRedeemed ${e.code}: ${got.join(", ") || "nothing"}`);
        if (skipped.length) player.sendMessage(`§cSkipped: ${skipped.join(", ")}`);
    }

    static giveItem(player, r) {
        const itemId = r.id;
        if (!ItemTypes.get(itemId)) return false;
        const stack = new ItemStack(itemId, Math.min(64, Math.max(1, Math.floor(r.amount) || 1)));
        const enchComp = stack.getComponent(ItemComponentTypes.Enchantable);
        if ((r.enchant ?? []).length && !enchComp) return false;
        for (const en of r.enchant ?? []) {
            const type = EnchantmentTypes.get(en.id);
            if (!type) return false;
            try {
                enchComp.addEnchantment({ type, level: en.level });
            } catch {
                return false;
            }
        }
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        const leftover = inv.container.addItem(stack);
        if (leftover) player.dimension.spawnItem(leftover, player.location);
        return true;
    }
}

export default Redeem;

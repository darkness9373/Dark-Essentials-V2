import { EnchantmentTypes, EntityComponentTypes, ItemComponentTypes, ItemStack, Potions, world } from "@minecraft/server";
import { BuySellTrade } from "./BuySellTrade";
import { DarkModalForm } from "./DarkModalForm";
import Helper from "./Helper";
import Objective from "../objective.js";

const INBOX = "tradeex:";

/** @type {Map<string, import("../trade").TradeWindow>} */
export const TradeItem = new Map();

/** @type {Map<string, import("../trade").TradeWindow>} */
export const ExpireItem = new Map();

const COIN = "coin";

class TradeManager {
    loadTradeItem() {
        const ids = world
            .getDynamicPropertyIds()
            .filter((x) => x.startsWith("trade:"));
        for (const i of ids) {
            const raw = world.getDynamicProperty(i);
            if (!raw) continue;
            /** @type {import("../trade").TradeWindow} */
            const data = JSON.parse(raw);
            TradeItem.set(data.id, data);
        }
    }
    inboxLoaded = new Set();
    inboxKey(pid) {
        return INBOX + String(pid ?? "").toLowerCase();
    }
    pidOf(player) {
        return String(player.persistentId ?? player.id ?? "").toLowerCase();
    }
    loadInbox(player) {
        const pid = this.pidOf(player);
        if (!pid || this.inboxLoaded.has(pid)) return;
        this.inboxLoaded.add(pid);
        const raw = world.getDynamicProperty(this.inboxKey(pid));
        if (!raw) return;
        const data = JSON.parse(String(raw));
        if (!Array.isArray(data)) return;
        for (const e of data) {
            if (e && e.id) ExpireItem.set(e.id, e);
        }
    }
    saveInbox(player) {
        const pid = this.pidOf(player);
        if (!pid) return;
        const list = [...ExpireItem.values()].filter((e) => String(e.persistentId ?? "").toLowerCase() === pid);
        if (!list.length) {
            world.setDynamicProperty(this.inboxKey(pid));
            return;
        }
        world.setDynamicProperty(this.inboxKey(pid), JSON.stringify(list));
    }
    myExpired(player) {
        this.loadInbox(player);
        const pid = this.pidOf(player);
        return [...ExpireItem.values()].filter((e) => String(e.persistentId ?? "").toLowerCase() === pid);
    }
    inboxPush(entry) {
        if (!entry?.id) return;
        ExpireItem.set(entry.id, entry);
        const pid = String(entry.persistentId ?? "").toLowerCase();
        if (!pid) return;
        const raw = world.getDynamicProperty(this.inboxKey(pid));
        const data = raw ? JSON.parse(String(raw)) : [];
        const list = Array.isArray(data) ? data : [];
        if (!list.some((e) => e?.id === entry.id)) list.push(entry);
        world.setDynamicProperty(this.inboxKey(pid), JSON.stringify(list));
    }
    claimAll(player) {
        const list = this.myExpired(player);
        if (!list.length) {
            player.sendMessage("§cNo expired items.");
            return;
        }
        for (const e of list) {
            this.restoreHand(player, e);
            ExpireItem.delete(e.id);
        }
        this.saveInbox(player);
        player.sendMessage(`§aClaimed ${list.length} item(s).`);
    }
    claimOne(player, id, onBack) {
        this.loadInbox(player);
        const e = ExpireItem.get(id);
        if (!e || String(e.persistentId ?? "").toLowerCase() !== this.pidOf(player)) {
            player.sendMessage("§cItem gone.");
            return;
        }
        this.restoreHand(player, e);
        ExpireItem.delete(id);
        this.saveInbox(player);
        player.sendMessage(`§aClaimed ${e.nameTag ?? Helper.formatName(e.typeId)}.`);
        if (onBack) onBack(player);
    }
    returnToSeller(data) {
        if (!data) return;
        const seller = world.getAllPlayers().find((p) => p.id === data.ownerId || String(p.persistentId ?? "").toLowerCase() === String(data.persistentId ?? "").toLowerCase());
        if (seller) {
            this.restoreHand(seller, data);
            seller.sendMessage(`§eTrade expired, item returned.`);
            return;
        }
        this.inboxPush(data);
    }
    chechExpire(now = Date.now()) {
        for (const [key, data] of TradeItem) {
            if (data && typeof data.expireAt === "number" && data.expireAt <= now) {
                TradeItem.delete(key);
                this.returnToSeller(data);
            }
        }
    }
    handSnapshot(player) {
        const equip = player.getComponent(EntityComponentTypes.Equippable);
        const hand = equip?.getEquipment("Mainhand");
        if (!hand) return null;
        const snap = { typeId: hand.typeId, amount: hand.amount, nameTag: hand.nameTag };
        const ench = hand.getComponent(ItemComponentTypes.Enchantable);
        if (ench) snap.enchants = ench.getEnchantments().map((x) => ({ type: x.type.id, level: x.level }));
        const dur = hand.getComponent(ItemComponentTypes.Durability);
        if (dur) snap.durability = { damage: dur.damage, maxDurability: dur.maxDurability, unbreakable: dur.unbreakable };
        const dye = hand.getComponent(ItemComponentTypes.Dyeable);
        if (dye?.color) snap.dye = { color: dye.color, defaultColor: dye.defaultColor };
        const lore = hand.getLore?.() ?? [];
        if (lore.length) snap.lore = [...lore];
        const book = hand.getComponent(ItemComponentTypes.Book);
        if (book) snap.book = { author: book.author, title: book.title, contents: [...book.contents], isSigned: book.isSigned, pageCount: book.pageCount };
        const pot = hand.getComponent(ItemComponentTypes.Potion);
        if (pot) snap.potion = { delivery: pot.potionDeliveryType.id, effect: pot.potionEffectType.id };
        const cd = hand.getComponent(ItemComponentTypes.Cooldown);
        if (cd) snap.cooldown = { category: cd.cooldownCategory, ticks: cd.cooldownTicks };
        const food = hand.getComponent(ItemComponentTypes.Food);
        if (food) snap.food = { nutrition: food.nutrition, saturation: food.saturationModifier, always: food.canAlwaysEat, convertsTo: food.usingConvertsTo };
        return snap;
    }
    takeHand(player) {
        const equip = player.getComponent(EntityComponentTypes.Equippable);
        const hand = equip?.getEquipment("Mainhand");
        if (!hand || !equip) return null;
        const snap = this.handSnapshot(player);
        equip.setEquipment("Mainhand");
        return snap;
    }
    restoreHand(player, snap) {
        if (!snap) return;
        const inv = player.getComponent(EntityComponentTypes.Inventory);
        if (!inv?.container) return;
        let stack = new ItemStack(snap.typeId, Math.min(64, Math.max(1, snap.amount || 1)));
        if (snap.potion?.effect && snap.potion?.delivery && Potions.getEffectType(snap.potion.effect) && Potions.getDeliveryType(snap.potion.delivery)) {
            const p = Potions.resolve(snap.potion.effect, snap.potion.delivery);
            p.amount = stack.amount;
            stack = p;
        }
        if (snap.nameTag) stack.nameTag = snap.nameTag;
        if (snap.lore?.length) stack.setLore(snap.lore);
        const enchComp = stack.getComponent(ItemComponentTypes.Enchantable);
        for (const en of snap.enchants ?? []) {
            const type = EnchantmentTypes.get(en.type);
            if (type && enchComp) try { enchComp.addEnchantment({ type, level: en.level }); } catch { }
        }
        const durComp = stack.getComponent(ItemComponentTypes.Durability);
        if (durComp && snap.durability) {
            durComp.damage = Math.min(Math.max(snap.durability.damage, 0), durComp.maxDurability);
            if (typeof snap.durability.unbreakable === "boolean") durComp.unbreakable = snap.durability.unbreakable;
        }
        const dyeComp = stack.getComponent(ItemComponentTypes.Dyeable);
        if (dyeComp && snap.dye?.color) dyeComp.color = snap.dye.color;
        const bookComp = stack.getComponent(ItemComponentTypes.Book);
        if (bookComp && Array.isArray(snap.book?.contents) && snap.book.contents.length <= 50) {
            bookComp.setContents(snap.book.contents.map((c) => typeof c === "string" ? c.slice(0, 256) : ""));
            if (snap.book.isSigned && typeof snap.book.title === "string" && typeof snap.book.author === "string" && snap.book.title.length <= 16) bookComp.signBook(snap.book.title, snap.book.author);
        }
        const leftover = inv.container.addItem(stack);
        if (leftover) player.dimension.spawnItem(leftover, player.location);
    }
    detailText(e = {}) {
        const ench = Array.isArray(e.enchants) ? e.enchants : [];
        const lore = Array.isArray(e.lore) ? e.lore : [];
        const L = [
            `Name: ${e.nameTag ?? Helper.formatName(e.typeId ?? "")}`,
            `Amount: ${e.amount ?? 1}`,
            `Price: ${e.price ?? 0}`,
            `Seller: ${e.ownerName ?? "-"}`,
            `Enchants: ${ench.length ? ench.map((x) => `${x.type} ${x.level}`).join(", ") : "-"}`,
            `Durability: ${e.durability ? `${e.durability.damage}/${e.durability.maxDurability}` : "-"}`,
            `Lore: ${lore.join("|") || "-"}`,
        ];
        if (e.dye?.color) {
            const c = e.dye.color;
            L.push(`Dye: ${c.red.toFixed(2)},${c.green.toFixed(2)},${c.blue.toFixed(2)}`);
        }
        if (e.book) L.push(`Book: ${e.book.title ?? "-"} by ${e.book.author ?? "-"}${e.book.isSigned ? " (signed)" : ""}`);
        if (e.potion) L.push(`Potion: ${e.potion.effect} (${e.potion.delivery})`);
        if (e.food) L.push(`Food: ${e.food.nutrition} +${e.food.saturation}`);
        if (e.cooldown) L.push(`Cooldown: ${e.cooldown.category} ${e.cooldown.ticks}t`);
        return L.join("\n");
    }
    sellFlow(player) {
        const snap = this.handSnapshot(player);
        if (!snap) {
            player.sendMessage("§cNo item in hand.");
            return;
        }
        const form = new DarkModalForm();
        form.title("Sell Item");
        form.textField("Price", "100", "100");
        form.textField("Timeout (max 24h, e.g. 30s/10m/2h)", "24h", "24h");
        form.submitButton("Next");
        form.show(player).then((res) => {
            if (res.canceled) return;
            const price = Math.floor(Number(res.formValues?.[0]));
            if (!Number.isFinite(price) || price < 0) {
                player.sendMessage("§cBad price.");
                return;
            }
            const durRaw = Helper.parseDuration(res.formValues?.[1]);
            if (durRaw === null || durRaw <= 0 || durRaw > 24 * 3600000) {
                player.sendMessage("§cBad timeout (max 24h, e.g. 30s/10m/2h/24h).");
                return;
            }
            const dur = durRaw;
            const entry = { ...snap, price, ownerName: player.name, expireAt: Date.now() + dur };
            new BuySellTrade().title("Sell Confirm").body(this.detailText(entry)).preview(entry.enchants?.length ? { id: entry.typeId, glint: true } : entry.typeId).button("Sell", (p) => this.doSell(p, price, snap.typeId, dur)).button("Cancel", (p) => this.sellFlow(p)).show(player);
        });
    }
    doSell(player, price, typeId, dur = 24 * 3600000) {
        const snap = this.takeHand(player);
        if (!snap || snap.typeId !== typeId) {
            if (snap) this.restoreHand(player, snap);
            player.sendMessage("§cHand changed.");
            return;
        }
        const d = Math.min(Math.max(Number(dur) || 0, 3600000), 24 * 3600000);
        const id = Date.now().toString(36) + Math.floor(Math.random() * 0xffffff).toString(36);
        TradeItem.set(id, { ...snap, id, price, ownerName: player.name, ownerId: player.id, persistentId: player.persistentId, expireAt: Date.now() + d });
        player.sendMessage("§aListed on trade.");
    }
    openBuy(player, id, onBack) {
        const entry = TradeItem.get(id);
        if (!entry) {
            player.sendMessage("§cItem gone.");
            return;
        }
        new BuySellTrade().title("Buy Confirm").body(this.detailText(entry)).preview(entry.enchants?.length ? { id: entry.typeId, glint: true } : entry.typeId).button("Buy", (p) => this.doBuy(p, id, onBack)).button("Cancel", (p) => { if (onBack) onBack(p); }).show(player);
    }
    doBuy(player, id, onBack) {
        this.chechExpire();
        const entry = TradeItem.get(id);
        if (!entry) {
            player.sendMessage("§cItem gone.");
            return;
        }
        if (entry.expireAt <= Date.now()) {
            TradeItem.delete(id);
            this.returnToSeller(entry);
            player.sendMessage("§cListing expired.");
            return;
        }
        const price = Math.floor(Number(entry.price));
        if (!Number.isFinite(price) || price < 0) {
            player.sendMessage("§cBad price.");
            return;
        }
        Objective.ensure(COIN);
        if (Objective.get(COIN, player) < price) {
            player.sendMessage("§cNot enough coin.");
            return;
        }
        Objective.remove(COIN, player, price);
        const seller = world.getAllPlayers().find((p) => p.id === entry.ownerId);
        if (seller) Objective.add(COIN, seller, price);
        TradeItem.delete(id);
        this.restoreHand(player, entry);
        player.sendMessage(`§aBought ${entry.nameTag ?? Helper.formatName(entry.typeId)}.`);
        if (onBack) onBack(player);
    }
}

const mgr = new TradeManager();

export default mgr;

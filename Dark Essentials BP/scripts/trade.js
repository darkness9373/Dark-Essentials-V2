import {
    Player,
    PotionDeliveryType,
    PotionEffectType,
    world,
} from "@minecraft/server";
import DarkCommand from "./util/DarkCommand";
import { DarkTrade } from "./util/DarkTrade";
import TradeManager, { TradeItem } from "./util/TradeManager";
import Helper from "./util/Helper";
import { BuySellTrade } from "./util/BuySellTrade";
import Objective from "./objective";

const COIN = "coin";
const PENDING = "pendingcoin:";

function pendingKey(pid) {
    return PENDING + String(pid ?? "").toLowerCase();
}

function claimPendingCoin(player) {
    const pid = String(player.persistentId ?? player.id ?? "").toLowerCase();
    if (!pid) return;
    const raw = world.getDynamicProperty(pendingKey(pid));
    const amount = Math.floor(Number(raw));
    if (!Number.isFinite(amount) || amount <= 0) return;
    Objective.ensure(COIN);
    Objective.add(COIN, player, amount);
    world.setDynamicProperty(pendingKey(pid));
    player.sendMessage(`§aClaimed ${amount} pending coin from sales.`);
}

function paySeller(entry, price) {
    const seller = world.getAllPlayers().find((p) => p.id === entry.ownerId || String(p.persistentId ?? "").toLowerCase() === String(entry.persistentId ?? "").toLowerCase());
    if (seller) {
        Objective.ensure(COIN);
        Objective.add(COIN, seller, price);
        return;
    }
    const pid = String(entry.persistentId ?? entry.ownerId ?? "").toLowerCase();
    if (!pid) return;
    const raw = world.getDynamicProperty(pendingKey(pid));
    const cur = Math.floor(Number(raw));
    world.setDynamicProperty(pendingKey(pid), (Number.isFinite(cur) ? cur : 0) + price);
}

/**
 * @typedef {Object} EnchantItem
 * @property {string} type
 * @property {number} level
 */

/**
 * @typedef {Object} DurabilityItem
 * @property {number} damage
 * @property {number} maxDurability
 */

/**
 * @typedef {Object} BookItem
 * @property {string} author
 * @property {string} title
 * @property {(string | undefined)[]} contents
 * @property {boolean} isSigned
 * @property {number} pageCount
 */

/**
 * @typedef {Object} DyeItem
 * @property {RGB} color
 * @property {RGB} defaultColor
 */

/**
 * @typedef {Object} RGB
 * @property {number} red
 * @property {number} green
 * @property {number} blue
 */

/**
 * @typedef {Object} PotionItem
 * @property {PotionDeliveryType} potionDeliveryType
 * @property {PotionEffectType} potionEffectType
 */

/**
 * @typedef {Object} TradeWindow
 * @property {string} id Item ID
 * @property {string} ownerName Owner Name
 * @property {string} persistentId Persistance player ID
 * @property {number} amount Item Amount
 * @property {EnchantItem[]} enchants
 * @property {DurabilityItem} durability
 * @property {string[]} lore
 * @property {string} nameTag
 * @property {BookItem} book
 * @property {DyeItem} dye
 * @property {number} price
 * @property {number} expireAt
 * @property {string} typeId
 */

export { TradeItem };

try {
    TradeManager.loadTradeItem();
} catch {
    world.afterEvents.worldLoad.subscribe(() => {
        TradeManager.loadTradeItem();
    });
}

DarkCommand.registerCommand(
    {
        name: "drk:trade",
        description: "Open player item trade menu",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        openTrade(p);
    },
);

DarkCommand.registerCommand(
    {
        name: "drk:sell",
        description: "Sell hand item to trade",
    },
    (origin) => {
        const p = origin.sourceEntity;
        if (!(p instanceof Player)) return;
        TradeManager.sellFlow(p);
    },
);

export function openTrade(player) {
    TradeManager.chechExpire();
    claimPendingCoin(player);
    const form = new DarkTrade();
    form.title("Trade");
    form.label("Player Trade Menu");
    form.button("Buy Items", (p) => openTradeList(p), "textures/darkesse/menu/trade");
    form.button("Sell Item", (p) => TradeManager.sellFlow(p), "textures/darkesse/menu/chest");
    form.button("Expired Items", (p) => openExpireList(p), "minecraft:chest");
    form.show(player);
}

export function openTradeList(player, menu, search = "") {
    TradeManager.chechExpire();
    const form = new DarkTrade();
    form.title("Trade");
    form.label("Buy another player's item");
    for (const x of [...TradeItem.values()].filter((x) =>
        String(x.typeId ?? "").includes(search),
    )) {
        form.button(
            `${x.nameTag ?? Helper.formatName(x.typeId)}\n§r§0Seller : §b${x.ownerName}§r§0\nAmount : ${x.amount}\nPrice : §g${x.price}`,
            (p) => openDetailTrade(p, x.id, menu, search),
            `${x.typeId}`,
            { glint: Array.isArray(x.enchants) && x.enchants?.length > 0 },
        );
    }
    form.show(player);
}

export function openExpireList(player) {
    const list = TradeManager.myExpired(player);
    const form = new DarkTrade();
    form.title("Trade");
    form.label(list.length ? "Claim your expired items" : "No expired items");
    if (list.length) form.button("Claim All", (p) => { TradeManager.claimAll(p); openExpireList(p); }, "minecraft:chest");
    for (const x of list) {
        form.button(
            `${x.nameTag ?? Helper.formatName(x.typeId)}\n§r§0Amount : ${x.amount}`,
            (p) => TradeManager.claimOne(p, x.id, (p2) => openExpireList(p2)),
            `${x.typeId}`,
            { glint: Array.isArray(x.enchants) && x.enchants?.length > 0 },
        );
    }
    form.button("Back", (p) => openTrade(p), "textures/darkesse/shop/back_btn_def");
    form.show(player);
}

function openDetailTrade(player, id, menu, search) {
    TradeManager.chechExpire();
    const entry = TradeItem.get(id);
    if (!entry) {
        player.sendMessage("§cItem is no longer valid");
        return;
    }
    const form = new BuySellTrade();
    form.title("Buy Confirm");
    form.body(TradeManager.detailText(entry));
    form.preview({
        id: entry.typeId,
        glint: Array.isArray(entry.enchants) && entry.enchants?.length > 0,
    });
    form.button("Buy", (p) => buyItem(p, id, search, menu));
    form.button("Cancel", (p) => {
        openTrade(player, menu, search);
    });
    form.show(player);
}

function buyItem(player, id, search, menu) {
    TradeManager.chechExpire();
    const entry = TradeItem.get(id);
    if (!entry) {
        player.sendMessage("§cItem is no longer valid");
        return;
    }
    if (entry.expireAt <= Date.now()) {
        TradeItem.delete(id);
        TradeManager.returnToSeller(entry);
        player.sendMessage("§cListing expired.");
        return;
    }
    if (String(entry.ownerId ?? "") === player.id || (entry.persistentId && String(entry.persistentId).toLowerCase() === String(player.persistentId ?? "").toLowerCase())) {
        player.sendMessage("§cCannot buy your own item.");
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
    paySeller(entry, price);
    TradeItem.delete(id);
    TradeManager.restoreHand(player, entry);
    player.sendMessage(`§aBought ${entry.nameTag ?? Helper.formatName(entry.typeId)} for ${price} coin.`);
    openTradeList(player, menu, search);
}

TradeItem.set("123456", {
    id: "123456",
    typeId: "minecraft:chest",
    amount: 3,
    ownerName: "Ahmad",
    nameTag: "Chest Ajaib",
    price: 1000,
    expireAt: Date.now() + 1000 * 60,
});

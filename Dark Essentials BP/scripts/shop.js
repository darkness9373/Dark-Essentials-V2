import { EntityComponentTypes, ItemStack, ItemTypes } from "@minecraft/server";
import { CATEGORIES, ITEMS } from "./data/shop.js";
import { DarkConfirmForm } from "./util/DarkConfirmForm.js";
import { DarkShopForm } from "./util/DarkShopForm.js";
import Helper from "./util/Helper.js";
import Objective from "./objective.js";

const COIN_ID = "coin";

function buyConfirm(player, sel, entry) {
    const form = new DarkConfirmForm();
    form.title("Confirm");
    form.body(`§0Your Balance : §g$${Helper.formatMoney(Objective.get('money', player))}`);
    form.button("Back", (p) => openShop(p, sel));
    form.button("Buy", (p) => buyItem(p, sel, entry), entry.id);
    form.label(`x${entry.amount}`);
    form.label(`${Helper.formatName(entry.id)}`);
    form.label(`§0Cost : §g$${entry.price}`);
    form.show(player);
}
function buyItem(player, sel, entry) {
    const price = Math.floor(Number(entry.price));
    if (!Number.isFinite(price) || price < 0) {
        player.sendMessage("§cBad price.");
        return;
    }
    if (Objective.get(COIN_ID, player) < price) {
        player.sendMessage("§cNot enough coin.");
        openShop(player, sel);
        return;
    }
    if (!ItemTypes.get(entry.id)) {
        player.sendMessage(`§cUnknown item '${entry.id}'.`);
        return;
    }
    Objective.remove(COIN_ID, player, price);
    const stack = new ItemStack(entry.id, Math.min(64, Math.max(1, Math.floor(entry.amount) || 1)));
    const inv = player.getComponent(EntityComponentTypes.Inventory);
    const leftover = inv.container.addItem(stack);
    if (leftover) player.dimension.spawnItem(leftover, player.location);
    player.sendMessage(`§aBought ${Helper.formatName(entry.id)} x${stack.amount} for ${price} coin.`);
    openShop(player, sel);
}

export function openShop(player, sel) {
    const cats = Array.isArray(CATEGORIES) ? CATEGORIES : [];
    if (!cats.length) {
        player.sendMessage("§cNo categories.");
        return;
    }
    Objective.ensure(COIN_ID);
    const active = cats.some((c) => c.id === sel) ? sel : cats[0].id;
    const form = new DarkShopForm();
    form.title("Shop");
    form.coin(Objective.get(COIN_ID, player));
    for (const c of cats) {
        form.category(c.name, (p) => openShop(p, c.id), { selected: c.id === active, icon: c.icon });
    }
    for (const e of ITEMS[active] ?? []) {
        form.list(`${Helper.formatName(e.id)} x${e.amount}\n§g$${e.price}`, (p) => buyConfirm(p, active, e), e.id);
    }
    form.show(player);
}

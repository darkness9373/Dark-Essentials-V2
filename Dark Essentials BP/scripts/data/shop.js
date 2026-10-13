export const CATEGORIES = [
    { id: "blocks", name: "Blocks", icon: "minecraft:cobblestone" },
    { id: "tools", name: "Tools", icon: "minecraft:iron_pickaxe" },
    { id: "food", name: "Food", icon: "minecraft:apple" },
];

export const ITEMS = {
    blocks: [
        { id: "minecraft:cobblestone", amount: 16, price: 10 },
        { id: "minecraft:oak_planks", amount: 16, price: 10 },
        { id: "minecraft:glass", amount: 8, price: 20 },
        { id: "minecraft:torch", amount: 16, price: 15 },
    ],
    tools: [
        { id: "minecraft:iron_pickaxe", amount: 1, price: 200 },
        { id: "minecraft:iron_sword", amount: 1, price: 150 },
        { id: "minecraft:bow", amount: 1, price: 180 },
        { id: "minecraft:shield", amount: 1, price: 120 },
        { id: "minecraft:iron_axe", amount: 1, price: 160 },
        { id: "minecraft:iron_shovel", amount: 1, price: 120 },
    ],
    food: [
        { id: "minecraft:cooked_beef", amount: 8, price: 25 },
        { id: "minecraft:bread", amount: 8, price: 15 },
        { id: "minecraft:apple", amount: 8, price: 12 },
        { id: "minecraft:golden_carrot", amount: 4, price: 40 },
        { id: "minecraft:cooked_porkchop", amount: 8, price: 25 },
        { id: "minecraft:carrot", amount: 8, price: 10 },
    ],
};

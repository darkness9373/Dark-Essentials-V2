import { world } from "@minecraft/server";
import Objective from "./objective.js";

const ID = "money";

class Money {
    static ensure() {
        Objective.ensure(ID);
    }
    static get(target) {
        return Objective.get(ID, target);
    }
    static add(target, amount) {
        return Objective.add(ID, target, amount);
    }
    static remove(target, amount) {
        return Objective.remove(ID, target, amount);
    }
    static set(target, value) {
        return Objective.set(ID, target, value);
    }
}

world.afterEvents.worldLoad.subscribe(() => {
    Money.ensure();
});

export default Money;

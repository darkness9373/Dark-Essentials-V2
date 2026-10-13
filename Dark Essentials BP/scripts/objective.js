import { world } from "@minecraft/server";

const MIN = -2147483648;
const MAX = 2147483647;

function clampInt(n) {
    n = Math.floor(Number(n));
    if (!Number.isFinite(n)) return 0;
    return Math.min(MAX, Math.max(MIN, n));
}

function objective(id) {
    return world.scoreboard.getObjective(id) ?? world.scoreboard.addObjective(id, id);
}

class Objective {
    static ensure(id) {
        objective(id);
    }
    static get(id, target) {
        try {
            return objective(id).getScore(target) ?? 0;
        } catch {
            return 0;
        }
    }
    static add(id, target, amount) {
        const n = clampInt(amount);
        try {
            return objective(id).addScore(target, n);
        } catch {
            target.runCommand(`scoreboard players add @s ${id} ${n}`);
            return Objective.get(id, target);
        }
    }
    static remove(id, target, amount) {
        const n = clampInt(amount);
        try {
            return objective(id).addScore(target, -n);
        } catch {
            target.runCommand(`scoreboard players remove @s ${id} ${n}`);
            return Objective.get(id, target);
        }
    }
    static set(id, target, value) {
        const n = clampInt(value);
        try {
            objective(id).setScore(target, n);
        } catch {
            target.runCommand(`scoreboard players set @s ${id} ${n}`);
        }
        return Objective.get(id, target);
    }
}

export default Objective;

import { CommandPermissionLevel, system } from "@minecraft/server";

const pendingCommands = [];
const pendingEnums = [];
let commandHooked = false;
let enumHooked = false;

function ensureEnumHook() {
    if (enumHooked) return;
    enumHooked = true;
    system.beforeEvents.startup.subscribe((ev) => {
        for (const { name, values } of pendingEnums) {
            ev.customCommandRegistry.registerEnum(name, values);
        }
    });
}

function ensureCommandHook() {
    if (commandHooked) return;
    commandHooked = true;
    system.beforeEvents.startup.subscribe((ev) => {
        for (const { def, execute } of pendingCommands) {
            const commandDef = {
                name: def.name,
                description: def.description,
                permissionLevel: def.permissionLevel ?? CommandPermissionLevel.Any,
            };
            if (def.cheatsRequired !== undefined) commandDef.cheatsRequired = def.cheatsRequired;
            if (def.mandatoryParameters !== undefined) commandDef.mandatoryParameters = def.mandatoryParameters;
            if (def.optionalParameters !== undefined) commandDef.optionalParameters = def.optionalParameters;
            ev.customCommandRegistry.registerCommand(commandDef, (origin, ...args) => {
                system.run(() => execute(origin, ...args));
            });
        }
    });
}

class DarkCommand {
    /**
     * Register the custom command once at top-level before world load.
     * Command entry is always via system.run, navigation between forms is direct without system.run.
     * @param {object} def Command definition.
     * @param {string} def.name Command names use namespaces, for example "drk:menu".
     * @param {string} def.description The description appears in the command line.
     * @param {import("@minecraft/server").CommandPermissionLevel} [def.permissionLevel] Default Any.
     * @param {boolean} [def.cheatsRequired] Default true of the engine if omitted.
     * @param {import("@minecraft/server").CustomCommandParameter[]} [def.mandatoryParameters] Mandatory param.
     * @param {import("@minecraft/server").CustomCommandParameter[]} [def.optionalParameters] Optional param.
     * @param {(origin: import("@minecraft/server").CustomCommandOrigin, ...args: any[]) => void} execute Callback accept origin + args.
     * @example DarkCommand.registerCommand({ name: "drk:menu", description: "Open the main menu" }, (origin) => mainMenu(origin.sourceEntity));
     */
    static registerCommand(def, execute) {
        pendingCommands.push({ def, execute });
        ensureCommandHook();
    }

    /**
     * Daftarkan enum sekali di top-level, otomatis terdaftar sebelum command.
     * @param {string} name Nama enum, misal "drk:mode".
     * @param {string[]} values Daftar nilai enum.
     * @example DarkCommand.registerEnum("drk:mode", ["a", "b"]);
     */
    static registerEnum(name, values) {
        pendingEnums.push({ name, values });
        ensureEnumHook();
    }
}

export default DarkCommand;

import { system, world } from "@minecraft/server";
import { MARKER } from "./config.js";
import Board from "./board.js";
import { buildBoard } from "./placeholders.js";

const TITLE_OPTS = { fadeInDuration: 0, stayDuration: 40, fadeOutDuration: 0 };

function render(player) {
    const body = buildBoard(player);
    player.onScreenDisplay.setTitle(
        `${MARKER.board.base}${Board.marker(player)}${MARKER.board.reset}${body}`,
        TITLE_OPTS,
    );
}

system.runInterval(() => {
    for (const p of world.getAllPlayers()) {
        if (!Board.isOn(p)) continue;
        render(p);
    }
}, 20);

export default { render };

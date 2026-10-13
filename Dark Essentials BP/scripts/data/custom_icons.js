/**
 * Registry manual untuk ikon custom (pack sendiri maupun pack lain).
 * File ini hand-edit; tools/gen_aux.py TIDAK PERNAH menyentuhnya.
 *
 * Kenapa manual: script tidak bisa membaca raw numerik custom saat runtime,
 * dan tiap kombinasi pack + versi game bisa mengubah angka custom. Catat sekali
 * per kombinasi di sini (atau via probe /drk:icon yang menyimpan ke world DP).
 *
 * Kombinasi pack saat kalibrasi: ___________________________________________
 * (isi manual: daftar pack + versi game, mis. DarkEssentials v1 + drk_items v3 @ 1.26.30.5)
 *
 * Hasil tes: custom menempati raw vanilla yang ada (mis. drk:coin = 852);
 * vanilla SESUDAH titik sisip terdorong naik +N = jumlah custom raw <= R.
 * Contoh: 3 custom di 852-854 -> apple 882 + 3 = 885. Raw aktual custom
 * HARUS diprobe via mode Scan di /drk:icon, lalu disimpan (tombol Save
 * Custom Raw atau catat di CUSTOM_RAW bawah). Helper menerapkan shift
 * otomatis via shiftFor(); file generated tetap murni tabel Mojang.
 * Custom block TIDAK bisa dirender inventory_item_renderer -> wajib texture path.
 */

/**
 * Raw eksplisit tiap custom id per versi game. Key "*" = fallback semua versi.
 * Overlay world DP (dark:custom_icons) menimpa nilai file ini.
 * @type {Object<string, Object<string, number>>}
 * @example CUSTOM_RAW["1.26.30.5"] = { "drk:coin": 256 };
 */
export const CUSTOM_RAW = {
    "*": { "custom:baelroth": 852, "custom:glacivon": 853, "custom:grayson": 854 },
};

/**
 * Texture path wajib untuk custom block (renderer aux tidak bisa render block custom).
 * Juga dibaca overlay world DP (dark:custom_icons -> blockTex).
 * @type {Object<string, string>}
 * @example CUSTOM_BLOCK_TEXTURE = { "drk:crate": "textures/blocks/crate" };
 */
export const CUSTOM_BLOCK_TEXTURE = {};

/**
 * Fallback sprite datar opsional untuk custom item (dipakai bila aux gagal
 * atau bila ingin ikon flat). Kosongkan bila selalu ingin aux renderer.
 * @type {Object<string, string>}
 */
export const CUSTOM_ITEM_TEXTURE = {};

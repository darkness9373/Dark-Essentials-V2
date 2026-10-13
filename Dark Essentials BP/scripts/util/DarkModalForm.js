import { ModalFormData } from "@minecraft/server-ui";
import { MARKER } from "../config";
import Helper from "./Helper.js";

/**
 * Amankan teks form dari parsing translate dan karakter khusus MC.
 * @param {string} text Teks mentah.
 * @returns {string} Teks aman untuk title/label/input.
 */
function safeText(text) {
    const s = text.replace(/%/g, "%%");
    return /^[-<>=+*!%&|()/]/.test(s) ? "§r" + s : s;
}

/**
 * @typedef {"left" | "center" | "right"} ImageAnchor Image alignment inside the form.
 * @typedef {"very small" | "small" | "normal" | "big" | "large" | "extra"} ImageSize Preset square size: "very small" (32x32), "small" (48x48), "normal" (64x64), "big" (80x80), "large" (96x96), "extra" (112x112).
 * @callback ModalSubmitCallback
 * @param {import("@minecraft/server").Player} player Player pengisi form.
 * @param {import("@minecraft/server-ui").ModalFormResponse} response Raw form response.
 * @param {any[]} values Nilai input tanpa undefined.
 * @returns {void}
 */

export class DarkModalForm extends ModalFormData {
    #titleText = "";
    #entries = [];
    #submitText = null;
    #submitCallback = null;

    /**
     * Set judul form, otomatis prefix marker tema.
     * @param {string | object} titleText String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.title("Add Money");
     */
    title(titleText) {
        if (typeof titleText === "string") {
            this.#titleText = MARKER.form.base + safeText(titleText);
        } else if (titleText?.rawtext) {
            this.#titleText = {
                rawtext: [{ text: MARKER.form.base }, ...titleText.rawtext],
            };
        } else {
            this.#titleText = { rawtext: [{ text: MARKER.form.base }, titleText] };
        }
        return this;
    }
    /**
     * Tambah teks statis non-input di body form.
     * @param {string | object} text String atau RawMessage.
     * @returns {this} Instance untuk chaining.
     * @example form.label("Isi nominal.");
     */
    label(text) {
        if (typeof text === "string") text = safeText(text);
        this.#entries.push({ kind: "label", args: [text] });
        return this;
    }
    /**
     * Tambah header seksi abu-abu dengan garis divider opsional.
     * @param {string | object} text String atau RawMessage.
     * @param {boolean} [divider=true] Prefix marker garis divider bila true.
     * @returns {this} Instance untuk chaining.
     * @example form.header("Target");
     */
    header(text, divider = true) {
        const prefix = divider ? MARKER.form.divider : "";
        if (typeof text === "string") {
            this.#entries.push({ kind: "header", args: [prefix + safeText(text)] });
        } else if (text?.rawtext) {
            this.#entries.push({ kind: "header", args: [{ rawtext: [{ text: prefix }, ...text.rawtext] }] });
        } else {
            this.#entries.push({ kind: "header", args: [{ rawtext: [{ text: prefix }, text] }] });
        }
        return this;
    }
    /**
     * Tampilkan gambar di body via marker anchor + size, atau ikon item via aux renderer.
     * Id item ("minecraft:chest"), angka aux mentah, atau object {id, version?, data?, glint?}
     * dirender sebagai ikon item; anchor/size hanya berlaku untuk path texture.
     * @param {string | number | object} pathOrId Path texture, id item, angka aux, atau {id, path?, version?, data?, glint?}.
     * @param {ImageAnchor} [anchor="left"] Posisi: "left", "center", "right" (texture path saja).
     * @param {ImageSize} [size="normal"] Ukuran preset (texture path saja).
     * @param {object} [opts] Opsi aux bila pathOrId berupa id: {version?, data?, glint?}.
     * @returns {this} Instance untuk chaining.
     * @example form.image("textures/items/apple", "center", "big");
     * @example form.image("minecraft:chest", "center");
     * @example form.image({ id: "minecraft:diamond_sword", glint: true });
     */
    image(pathOrId, anchor = "left", size = "normal", opts = {}) {
        const auxText = Helper.imageLabel(pathOrId, opts);
        if (auxText !== null) {
            this.#entries.push({ kind: "label", args: [auxText] });
            return this;
        }
        let fallback = pathOrId;
        if (fallback !== null && typeof fallback === "object") fallback = fallback.path ?? fallback.id ?? "";
        const anchorMarker = MARKER.form.image.anchor[anchor] ?? MARKER.form.image.anchor.left;
        const sizeMarker = MARKER.form.image.size[size] ?? MARKER.form.image.size.normal;
        this.#entries.push({ kind: "label", args: [anchorMarker + sizeMarker + fallback] });
        return this;
    }
    /**
     * Tambah garis divider horizontal penuh.
     * @returns {this} Instance untuk chaining.
     * @example form.divider();
     */
    divider() {
        this.#entries.push({ kind: "divider", args: [] });
        return this;
    }
    /**
     * Tambah dropdown pilihan.
     * @param {string | object} label Label di atas dropdown.
     * @param {Array<string | object>} items Daftar opsi.
     * @param {number | object} [options] Index default atau options ModalForm.
     * @returns {this} Instance untuk chaining.
     * @example form.dropdown("Target", ["Steve", "Alex"], 0);
     */
    dropdown(label, items, options) {
        if (typeof label === "string") label = safeText(label);
        if (Array.isArray(items)) items = items.map((i) => (typeof i === "string" ? safeText(i) : i));
        if (typeof options === "number") options = { defaultValueIndex: options };
        this.#entries.push({ kind: "dropdown", args: [label, items, ...(options === undefined ? [] : [options])] });
        return this;
    }
    /**
     * Tambah slider angka min s/d max.
     * @param {string | object} label Label di atas slider.
     * @param {number} minimumValue Nilai minimum.
     * @param {number} maximumValue Nilai maksimum.
     * @param {number | object} [stepOrOptions] Step angka atau options ModalForm.
     * @param {number} [defaultValue] Nilai default bila step berupa angka.
     * @returns {this} Instance untuk chaining.
     * @example form.slider("Amount", 1, 64, 1, 1);
     */
    slider(label, minimumValue, maximumValue, stepOrOptions, defaultValue) {
        if (typeof label === "string") label = safeText(label);
        let options = stepOrOptions;
        if (typeof options === "number") {
            options = { valueStep: options };
            if (defaultValue !== undefined) options.defaultValue = defaultValue;
        }
        this.#entries.push({ kind: "slider", args: [label, minimumValue, maximumValue, ...(options === undefined ? [] : [options])] });
        return this;
    }
    /**
     * Tambah input teks bebas.
     * @param {string | object} label Label di atas input.
     * @param {string} placeholderText Placeholder saat kosong.
     * @param {string | boolean | number | object} [defaultOrOptions] Default string atau options ModalForm.
     * @returns {this} Instance untuk chaining.
     * @example form.textField("Amount", "100", "100");
     */
    textField(label, placeholderText, defaultOrOptions) {
        if (typeof label === "string") label = safeText(label);
        if (typeof placeholderText === "string") placeholderText = safeText(placeholderText);
        let options = defaultOrOptions;
        if (typeof options === "string" || typeof options === "boolean" || typeof options === "number") {
            options = { defaultValue: options };
        }
        this.#entries.push({ kind: "textField", args: [label, placeholderText, ...(options === undefined ? [] : [options])] });
        return this;
    }
    /**
     * Tambah toggle on/off.
     * @param {string | object} label Label di samping toggle.
     * @param {boolean | object} [defaultOrOptions] Default boolean atau options ModalForm.
     * @returns {this} Instance untuk chaining.
     * @example form.toggle("Aktif", true);
     */
    toggle(label, defaultOrOptions) {
        if (typeof label === "string") label = safeText(label);
        let options = defaultOrOptions;
        if (typeof options === "boolean") options = { defaultValue: options };
        this.#entries.push({ kind: "toggle", args: [label, ...(options === undefined ? [] : [options])] });
        return this;
    }
    /**
     * Set tombol submit bawah + callback opsional terima values bersih.
     * @param {string | object} text Label tombol submit.
     * @param {ModalSubmitCallback} [onSubmit] Callback terima (player, response, values).
     * @returns {this} Instance untuk chaining.
     * @example form.submitButton("Save", (p, res, v) => save(v));
     */
    submitButton(text, onSubmit) {
        if (typeof text === "string") text = safeText(text);
        this.#submitText = text;
        this.#submitCallback = typeof onSubmit === "function" ? onSubmit : null;
        return this;
    }
    /**
     * Render dan tampilkan form ke player, jalankan callback submit bila tidak cancel.
     * @param {import("@minecraft/server").Player} player Player tujuan.
     * @returns {Promise<{canceled: boolean, cancelationReason: any, formValues: any[]}>} Response ringkas values bersih.
     * @example form.show(player);
     */
    show(player) {
        const form = new ModalFormData();
        form.title(this.#titleText);
        for (const entry of this.#entries) {
            form[entry.kind](...entry.args);
        }
        if (this.#submitText !== null) form.submitButton(this.#submitText);
        return super.show.call(form, player).then((response) => {
            const raw = response && Array.isArray(response.formValues) ? response.formValues : [];
            const values = raw.filter((v) => v !== undefined);
            if (!response.canceled && this.#submitCallback) this.#submitCallback(player, response, values);
            return { canceled: response.canceled, cancelationReason: response.cancelationReason, formValues: values };
        });
    }
}

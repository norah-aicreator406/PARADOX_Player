const fs = require("fs");
const path = require("path");

const os = require("os");

class FontService {
    constructor() {
    this.fonts = [];

    this.rootDir = __dirname;
    this.fontRoot = path.join(this.rootDir, "assets", "fonts");

    this.libraryPath = path.join(this.fontRoot, "fontLibrary.json");
    this.bundledDir = path.join(this.fontRoot, "bundled");
    this.customDir = path.join(this.fontRoot, "custom");
}

   initialize() {
    console.log("[FontService] initialize");

    this.loadBundledFonts();

    const customFonts = this.loadCustomFonts();

    this.fonts.push(...customFonts);
}

loadBundledFonts() {
    try {
        if (!fs.existsSync(this.libraryPath)) {
            console.warn("[FontService] fontLibrary.json not found");
            this.fonts = [];
            return;
        }

        const json = fs.readFileSync(this.libraryPath, "utf8");
        const fonts = JSON.parse(json);

        this.fonts = Array.isArray(fonts) ? fonts : [];

        console.log(
            `[FontService] bundled fonts loaded : ${this.fonts.length}`
        );
    } catch (err) {
        console.error("[FontService] loadBundledFonts", err);
        this.fonts = [];
    }
}

loadCustomFonts() {
    if (!fs.existsSync(this.customDir)) {
        return [];
    }

    const exts = [".ttf", ".otf", ".woff", ".woff2"];
    const fonts = [];

    const walk = (dir) => {
        for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
            const fullPath = path.join(dir, entry.name);

            if (entry.isDirectory()) {
                walk(fullPath);
                continue;
            }

            const ext = path.extname(entry.name).toLowerCase();

            if (!exts.includes(ext)) {
                continue;
            }

            fonts.push({
                family: path.basename(entry.name, ext),
                file: path.relative(this.fontRoot, fullPath).replace(/\\/g, "/"),
                type: "custom"
            });
        }
    };

    walk(this.customDir);

    console.log(`[FontService] custom fonts loaded : ${fonts.length}`);

    return fonts;
}

    getAllFonts() {
        return [...this.fonts];
    }

    setFonts(fonts) {
        this.fonts = Array.isArray(fonts)
            ? [...fonts]
            : [];
    }

    reload() {
        console.log("[FontService] reload");
        return this.fonts;
    }
}

module.exports = new FontService();
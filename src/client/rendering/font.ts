import {
    BufferKindOptions,
    Cache,
    Geometry,
    GeometryTopology,
    Matrix4,
    Mesh,
    ModelMeshEntry,
    Platform,
    Utils,
    Vector2,
    Vector3,
    Vector4
} from "../index";

export class BMFontInfo {
    public face: string;
    public size: number;
    public bold: boolean;
    public italic: boolean;
    public charset: string;
    public unicode: boolean;
    public stretchHeight: number
    public smooth: boolean;
    public antiAliasing: number;
    public padding: Vector4;
    public spacing: Vector2;
    public outline: number;
}

export class BMFontCommon {
    public lineHeight: number;
    public base: number;
    public scaleWidth: number;
    public scaleHeight: number;
    public pages: number;
    public packed: boolean;
    public alphaChannel: number;
    public redChannel: number;
    public greenChannel: number;
    public blueChannel: number;
}

export class BMFontPage {
    public id: number;
    public file: string;
}

export class BMFontChar {
    public id: number;
    public x: number;
    public y: number;
    public width: number;
    public height: number;
    public xOffset: number;
    public yOffset: number;
    public xAdvance: number;
    public page: number;
    public channel: number;
}

export class BMFontKerning {
    first: number;
    second: number;
    amount: number;
}

export class BMFont {
    public readonly info: BMFontInfo = new BMFontInfo();
    public readonly common: BMFontCommon = new BMFontCommon();
    public readonly pages: Map<number, BMFontPage> = new Map();
    public readonly chars: Map<number, BMFontChar> = new Map();
    public readonly kernings: Map<string, BMFontKerning> = new Map();
    // public readonly atlases: Map<string, Texture> = new Map();

    public static parse(data: string): BMFont {
        // define resulting font
        const font = new BMFont();
        // split into lines and loop over each
        data.split(/\r?\n/).forEach((line) => {
            const parts = line.split(" ");
            if (parts.length > 0) {
                switch (parts[0]) {
                    case "info":
                        // parse info section
                        parts.slice(1).forEach(part => {
                            if (part.trim().split("=").length > 1) {
                                const key = part.trim().split("=")[0].trim();
                                const value = part.trim().split("=")[1].trim();
                                switch (key) {
                                    case "face":
                                        font.info.face = value;
                                        break;
                                    case "size":
                                        font.info.size = parseFloat(value);
                                        break;
                                    case "bold":
                                        font.info.bold = parseFloat(value) === 1;
                                        break;
                                    case "italic":
                                        font.info.italic = parseFloat(value) === 1;
                                        break;
                                    case "charset":
                                        font.info.charset = value;
                                        break;
                                    case "unicode":
                                        font.info.unicode = parseFloat(value) === 1;
                                        break;
                                    case "stretchH":
                                        font.info.stretchHeight = parseFloat(value);
                                        break;
                                    case "smooth":
                                        font.info.smooth = parseFloat(value) === 1;
                                        break;
                                    case "aa":
                                        font.info.antiAliasing = parseFloat(value);
                                        break;
                                    case "padding":
                                        font.info.padding = new Vector4(
                                            parseFloat(value.split(",")[0]),
                                            parseFloat(value.split(",")[1]),
                                            parseFloat(value.split(",")[3]),
                                            parseFloat(value.split(",")[4])
                                        );
                                        break;
                                    case "spacing":
                                        font.info.spacing = new Vector2(
                                            parseFloat(value.split(",")[0]),
                                            parseFloat(value.split(",")[1])
                                        );
                                        break;
                                    case "outline":
                                        font.info.outline = parseFloat(value);
                                        break;
                                }
                            }
                        });
                        break;
                    case "common":
                        // parse common section
                        parts.slice(1).forEach(part => {
                            const key = part.trim().split("=")[0].trim();
                            const value = part.trim().split("=")[1].trim();
                            switch (key) {
                                case "lineHeight":
                                    font.common.lineHeight = parseFloat(value);
                                    break;
                                case "base":
                                    font.common.base = parseFloat(value);
                                    break;
                                case "scaleW":
                                    font.common.scaleWidth = parseFloat(value);
                                    break;
                                case "scaleH":
                                    font.common.scaleHeight = parseFloat(value);
                                    break;
                                case "pages":
                                    font.common.pages = parseFloat(value);
                                    break;
                                case "packed":
                                    font.common.packed = parseFloat(value) === 1.0;
                                    break;
                                case "alphaChnl":
                                    font.common.alphaChannel = parseFloat(value);
                                    break;
                                case "redChnl":
                                    font.common.redChannel = parseFloat(value);
                                    break;
                                case "greenChnl":
                                    font.common.greenChannel = parseFloat(value);
                                    break;
                                case "blueChnl":
                                    font.common.blueChannel = parseFloat(value);
                                    break;
                            }
                        });
                        break;
                    case "page": {
                        // parse page section
                        const page = new BMFontPage();
                        parts.slice(1).forEach(part => {
                            const key = part.trim().split("=")[0].trim();
                            const value = part.trim().split("=")[1].trim();
                            switch (key) {
                                case "id":
                                    page.id = parseFloat(value);
                                    break;
                                case "file":
                                    page.file = value.substring(1, value.length - 1);
                                    break;
                            }
                        });
                        font.pages.set(page.id, page);
                        break;
                    }
                    case "chars":
                        break;
                    case "char": {
                        // parse char section
                        const char = new BMFontChar();
                        parts.slice(1).forEach(part => {
                            if (part.trim().split("=").length > 1) {
                                const key = part.trim().split("=")[0].trim();
                                const value = part.trim().split("=")[1].trim();
                                switch (key) {
                                    case "id":
                                        char.id = parseFloat(value);
                                        break;
                                    case "x":
                                        char.x = parseFloat(value);
                                        break;
                                    case "y":
                                        char.y = parseFloat(value);
                                        break;
                                    case "width":
                                        char.width = parseFloat(value);
                                        break;
                                    case "height":
                                        char.height = parseFloat(value);
                                        break;
                                    case "xoffset":
                                        char.xOffset = parseFloat(value);
                                        break;
                                    case "yoffset":
                                        char.yOffset = parseFloat(value);
                                        break;
                                    case "xadvance":
                                        char.xAdvance = parseFloat(value);
                                        break;
                                    case "page":
                                        char.page = parseFloat(value);
                                        break;
                                    case "chnl":
                                        char.channel = parseFloat(value);
                                        break;
                                }
                            }
                        });
                        font.chars.set(char.id, char);
                        break;
                    }
                    case "kernings":
                        break;
                    case "kerning": {
                        // parse kerning section
                        const kerning = new BMFontKerning();
                        parts.slice(1).forEach(part => {
                            if (part.trim().split("=").length > 1) {
                                const key = part.trim().split("=")[0].trim();
                                const value = part.trim().split("=")[1].trim();
                                switch (key) {
                                    case "first":
                                        kerning.first = parseFloat(value);
                                        break;
                                    case "second":
                                        kerning.second = parseFloat(value);
                                        break;
                                    case "amount":
                                        kerning.amount = parseFloat(value);
                                        break;
                                }
                            }
                        });
                        font.kernings.set(kerning.first + "-" + kerning.second, kerning);
                        break;
                    }
                }
            }
        });
        // all done
        return font;
    }
}

export class Font {
    public readonly id: string;
    public readonly platform: Platform;
    public readonly name: string;
    private readonly handle: BMFont;
    private readonly _cache: Cache;

    constructor(platform: Platform, name: string, handle: BMFont) {
        this.id = Utils.uuid();
        this.platform = platform;
        this.name = name;
        this.handle = handle;
        this._cache = new Cache();
    }

    public static create(platform: Platform, name: string, data: string): Font {
        // parse incoming data and return new font instance
        return new Font(platform, name, BMFont.parse(data));
    }

    private renderText(text: string): Mesh {
        // create buffers
        const texels: Vector2[] = [];
        const indices: number[] = [];
        const positions: Vector3[] = [];

        // get font
        const bmf = this.handle as BMFont;

        // start offset and code
        let offset = Vector2.zero;
        let lastCode: number;

        // loop over text
        for (let i = 0; i < text.length; i++) {
            // get code
            const code = text.charCodeAt(i);
            // 
            const sw = bmf.common.scaleWidth;
            const sh = bmf.common.scaleHeight;

            // get glyph
            const glyph = bmf.chars.get(code);

            // get positions
            const x = offset.x + glyph.xOffset
            const y = offset.y + glyph.yOffset

            // get width and height
            const w = glyph.width;
            const h = glyph.height;

            const u = ((glyph.x) / sw);
            const v = 1 - ((glyph.y + glyph.height) / sh);
            const du = glyph.width / sw;
            const dv = glyph.height / sh;

            // BL / BR / TR / TL
            positions.push(new Vector3(x, y - h, 0));
            positions.push(new Vector3(x + w, y - h, 0));
            positions.push(new Vector3(x + w, y, 0));

            positions.push(new Vector3(x + w, y, 0));
            positions.push(new Vector3(x, y, 0));
            positions.push(new Vector3(x, y - h, 0));

            indices.push(indices.length);
            indices.push(indices.length);
            indices.push(indices.length);

            indices.push(indices.length);
            indices.push(indices.length);
            indices.push(indices.length);

            const flipV = false;

            // BL / BR / TR / TL
            texels.push(new Vector2(u, flipV ? (1 - v) : v));
            texels.push(new Vector2(u + du, flipV ? (1 - v) : v));
            texels.push(new Vector2(u + du, flipV ? (1 - (v + dv)) : v + dv));

            texels.push(new Vector2(u + du, flipV ? (1 - (v + dv)) : v + dv));
            texels.push(new Vector2(u, flipV ? (1 - (v + dv)) : v + dv));
            texels.push(new Vector2(u, flipV ? (1 - v) : v));

            // update offset
            offset = new Vector2(offset.x + w, offset.y);

            // check for kerning
            if (lastCode) {
                // see if kerning exists
                const pair = lastCode + "-" + code;
                if (bmf.kernings.has(pair)) {
                    const kerning = bmf.kernings.get(pair);
                    const amount = kerning.amount / bmf.common.scaleHeight;
                    offset = new Vector2(offset.x + amount, offset.y);
                }
            }
            // save for next
            lastCode = code;
        }

        // create and return mesh
        return new Mesh(this.platform, new Geometry(
            GeometryTopology.TriangleList,
            positions,
            indices,
            texels
        ));
    }

    public cacheItem(key: string, model: Matrix4, duration: number = 2000): ModelMeshEntry {

        // cache item
        return this._cache.cacheItem(key, (entry) => {
            // construct final model
            const fmodel = [].concat(model.values, model.inverse.transpose.values);
            // check if existing
            if (entry) {
                // update
                entry.duration = duration;
                // update buffer
                (entry as ModelMeshEntry).model.write(fmodel);
            }
            else
                // create font cache entry
                return new ModelMeshEntry(key, duration,
                    this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, fmodel),
                    this.renderText(key));
        }) as ModelMeshEntry;
    }
}
import {
    Vector3
} from "./vector3";

export class Color {
    public r: number;
    public g: number;
    public b: number;
    public a: number;

    constructor(r: number = 0, g: number = r, b: number = r, a: number = 1) {
        this.r = r;
        this.g = g;
        this.b = b;
        this.a = a;
    }

    public get rgb(): Vector3 {
        return new Vector3(this.r, this.g, this.b);
    }

    public static hex(c: number): Color {
        const value = Math.floor(c);
        return new Color(
            (value >> 24 & 255) / 255,
            (value >> 16 & 255) / 255,
            (value >> 8 & 255) / 255,
            (value & 255) / 255);
    }

    public static parse(value: string): Color {
        if (value.startsWith('#')) {
            return Color.hex(parseInt(value.substring(1), 16));
        }
        return Color.magenta;
    }

    public static get black(): Color {
        return new Color(0, 0, 0, 1);
    }

    public static get blue(): Color {
        return new Color(0, 0, 1, 1);
    }

    public static get clear(): Color {
        return new Color(0, 0, 0, 0);
    }

    public static get cyan(): Color {
        return new Color(0, 1, 1, 1);
    }

    public static get gray(): Color {
        return new Color(0.5, 0.5, 0.5, 1);
    }
    public static get green(): Color {
        return new Color(0, 1, 0, 1);
    }

    public static get magenta(): Color {
        return new Color(1, 0, 1, 1);
    }

    public static get red(): Color {
        return new Color(1, 0, 0, 1);
    }

    public static get white(): Color {
        return new Color(1, 1, 1, 1);
    }

    public static get orange(): Color {
        return Color.hex(0xFFA500FF);
    }

    public static get yellow(): Color {
        return new Color(1, 0.92, 0.016, 1);
    }

    public static get trBlack(): Color {
        return Color.hex(0x0C141FFF);
    }

    public static get trRed(): Color {
        return Color.hex(0xEF1B24FF);
    }

    public static get trGreen(): Color {
        return Color.hex(0x009C00FF);
    }

    public static get trBlue(): Color {
        return Color.hex(0x00ADEFFF);
    }

    public static get trOrange(): Color {
        return Color.hex(0xF7941DFF);
    }

    public static get trViolet(): Color {
        return Color.hex(0xA844FFFF);
    }

    public static get trCyan(): Color {
        return Color.hex(0x06FFFFFF);
    }

    public static get trYellow(): Color {
        return Color.hex(0xFFDE00FF);
    }

    public static get trWhite(): Color {
        return Color.hex(0xFFFFFFFF);
    }

    public static random(alpha = 1.0): Color {
        return new Color(Math.random(), Math.random(), Math.random(), alpha);
    }
}
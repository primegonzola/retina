import {
    Matrix4,
    Vector2,
    Vector3
} from "../index";

export class Vector4 {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x: number = 0, y: number = x, z: number = x, w: number = x) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public static get one(): Vector4 {
        return new Vector4(1, 1, 1, 1);
    }

    public static get zero(): Vector4 {
        return new Vector4(0, 0, 0, 0);
    }

    public static get maxValue(): Vector4 {
        return new Vector4(Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE, Number.MAX_VALUE);
    }

    public static get minValue(): Vector4 {
        return new Vector4(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    }

    public add(v: Vector4): Vector4 {
        return new Vector4(this.x + v.x, this.y + v.y, this.z + v.z, this.w + v.w);
    }

    public subtract(v: Vector4): Vector4 {
        return new Vector4(this.x - v.y, this.y - v.y, this.z - v.z, this.w - v.w);
    }

    public multiply(v: Vector4): Vector4 {
        return new Vector4(this.x * v.x, this.y * v.y, this.z * v.z, this.w * v.w);
    }

    public divide(v: Vector4): Vector4 {
        return new Vector4(this.x / v.x, this.y / v.y, this.z / v.z, this.w / v.w);
    }

    public scale(s: number): Vector4 {
        return new Vector4(this.x * s, this.y * s, this.z * s, this.w * s);
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    public normalize(): Vector4 {
        return this.scale(1.0 / (this.magnitude() || 1));
    }

    public equals(v: Vector4): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z && this.w === v.w;
    }

    public matrix(m: Matrix4): Vector4 {
        return Vector4.matrix(m, this);
    }

    public static matrix(m: Matrix4, v: Vector4): Vector4 {

        const x = v.x;
        const y = v.y;
        const z = v.z;
        const w = v.w;
        const e = m.values;

        const vx = e[0] * x + e[4] * y + e[8] * z + e[12] * w;
        const vy = e[1] * x + e[5] * y + e[9] * z + e[13] * w;
        const vz = e[2] * x + e[6] * y + e[10] * z + e[14] * w;
        const vw = e[3] * x + e[7] * y + e[11] * z + e[15] * w;

        return new Vector4(vx, vy, vz, vw);
    }

    public max(v: Vector4): Vector4 {
        return new Vector4(
            Math.max(this.x, v.x),
            Math.max(this.y, v.y),
            Math.max(this.z, v.z),
            Math.max(this.w, v.w)
        );
    }

    public static toNumbers(vs: Vector4[]): number[] {
        const numbers: number[] = [];
        for (const v of vs)
            numbers.push(v.x, v.y, v.z, v.w);
        return numbers;
    }

    public static fromNumbers(numbers: number[]): Vector4[] {
        const vs: Vector4[] = [];
        for (let i = 0; i < numbers.length; i += 4)
            vs.push(new Vector4(numbers[i], numbers[i + 1], numbers[i + 2], numbers[i + 3]));
        return vs;
    }

    public static xyz(v: Vector3, w = 1.0): Vector4 {
        return new Vector4(v.x, v.y, v.z, w);
    }

    public get xy(): Vector2 {
        return new Vector2(this.x, this.y);
    }

    public get xyz(): Vector3 {
        return new Vector3(this.x, this.y, this.z);
    }
}
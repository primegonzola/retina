
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

    public min(v: Vector4): Vector4 {
        return new Vector4(
            Math.min(this.x, v.x),
            Math.min(this.y, v.y),
            Math.min(this.z, v.z),
            Math.min(this.w, v.w)
        );
    }

    public max(v: Vector4): Vector4 {
        return new Vector4(
            Math.max(this.x, v.x),
            Math.max(this.y, v.y),
            Math.max(this.z, v.z),
            Math.max(this.w, v.w)
        );
    }

    public static fromNumbers(numbers: number[]): Vector4[] {
        const vs: Vector4[] = [];
        for (let i = 0; i < numbers.length; i += 4)
            vs.push(new Vector4(numbers[i], numbers[i + 1], numbers[i + 2], numbers[i + 3]));
        return vs;
    }

}
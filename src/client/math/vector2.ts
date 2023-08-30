export class Vector2 {
    public x: number;
    public y: number;

    constructor(x: number = 0, y: number = x) {
        this.x = x;
        this.y = y;
    }

    public static get one(): Vector2 {
        return new Vector2(1, 1);
    }

    public static get zero(): Vector2 {
        return new Vector2(0, 0);
    }

    public static get left(): Vector2 {
        return new Vector2(-1, 0);
    }

    public static get right(): Vector2 {
        return new Vector2(1, 0);
    }

    public static get up(): Vector2 {
        return new Vector2(0, 1);
    }

    public static get down(): Vector2 {
        return new Vector2(0, -1);
    }

    public static get maxValue(): Vector2 {
        return new Vector2(Number.MAX_VALUE, Number.MAX_VALUE);
    }

    public static get minValue(): Vector2 {
        return new Vector2(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    }

    public add(v: Vector2): Vector2 {
        return new Vector2(this.x + v.x, this.y + v.y);
    }

    public subtract(v: Vector2): Vector2 {
        return new Vector2(this.x - v.y, this.y - v.y);
    }

    public multiply(v: Vector2): Vector2 {
        return new Vector2(this.x * v.x, this.y * v.y);
    }

    public divide(v: Vector2): Vector2 {
        return new Vector2(this.x / v.x, this.y / v.y);
    }

    public scale(s: number): Vector2 {
        return new Vector2(this.x * s, this.y * s);
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y);
    }

    public normalize(): Vector2 {
        return this.scale(1.0 / (this.magnitude() || 1));
    }

    public dot(v: Vector2): number {
        return this.x * v.x + this.y * v.y;
    }

    public equals(v: Vector2): boolean {
        return this.x === v.x && this.y === v.y;
    }

    public min(v: Vector2): Vector2 {
        return new Vector2(
            Math.min(this.x, v.x),
            Math.min(this.y, v.y)
        );
    }

    public max(v: Vector2): Vector2 {
        return new Vector2(
            Math.max(this.x, v.x),
            Math.max(this.y, v.y)
        );
    }

    public lerp(v: Vector2, alpha: number): Vector2 {
        return new Vector2(
            this.x + (v.x - this.x) * alpha,
            this.y + (v.y - this.y) * alpha);
    }

    public static toNumbers(vs: Vector2[]): number[] {
        const numbers: number[] = [];
        for (const v of vs)
            numbers.push(v.x, v.y);
        return numbers;
    }

    public static fromNumbers(numbers: number[]): Vector2[] {
        const vs: Vector2[] = [];
        for (let i = 0; i < numbers.length; i += 2)
            vs.push(new Vector2(numbers[i], numbers[i + 1]));
        return vs;
    }

}
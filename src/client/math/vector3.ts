import {
    Bounds,
    Quaternion
} from "../index";

export class Vector3 {
    public x: number;
    public y: number;
    public z: number;

    constructor(x: number, y: number, z: number) {
        this.x = x;
        this.y = y;
        this.z = z;
    }

    public static get one(): Vector3 {
        return new Vector3(1, 1, 1);
    }

    public static get zero(): Vector3 {
        return new Vector3(0, 0, 0);
    }

    public static get forward(): Vector3 {
        return new Vector3(0, 0, -1);
    }

    public static get backward(): Vector3 {
        return new Vector3(0, 0, 1);
    }

    public static get left(): Vector3 {
        return new Vector3(-1, 0, 0);
    }

    public static get right(): Vector3 {
        return new Vector3(1, 0, 0);
    }

    public static get up(): Vector3 {
        return new Vector3(0, 1, 0);
    }

    public static get down(): Vector3 {
        return new Vector3(0, -1, 0);
    }

    public static get maxValue(): Vector3 {
        return new Vector3(Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER, Number.MAX_SAFE_INTEGER);
    }

    public static get minValue(): Vector3 {
        return new Vector3(Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER, Number.MIN_SAFE_INTEGER);
    }

    public static bounds(vs: Vector3[]): Bounds {

        // start min and max
        let min = Vector3.maxValue;
        let max = Vector3.minValue;

        // loop
        vs.forEach(v => {
            // update min/max
            min = min.min(v);
            max = max.max(v);
        });

        // all done
        return new Bounds(min, max);
    }

    public get negate(): Vector3 {
        return new Vector3(-this.x, -this.y, -this.z);
    }

    public add(v: Vector3): Vector3 {
        return new Vector3(this.x + v.x, this.y + v.y, this.z + v.z);
    }

    public subtract(v: Vector3): Vector3 {
        return new Vector3(this.x - v.x, this.y - v.y, this.z - v.z);
    }

    public multiply(v: Vector3): Vector3 {
        return new Vector3(this.x * v.x, this.y * v.y, this.z * v.z);
    }

    public divide(v: Vector3): Vector3 {
        return new Vector3(this.x / v.x, this.y / v.y, this.z / v.z);
    }

    public scale(s: number): Vector3 {
        return new Vector3(this.x * s, this.y * s, this.z * s);
    }

    public get magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z);
    }

    public get degrees(): Quaternion {
        return Quaternion.degrees(this.x, this.y, this.z);
    }

    public get radians(): Quaternion {
        return Quaternion.radians(this.x, this.y, this.z);
    }

    public normalize(): Vector3 {
        return this.scale(1.0 / (this.magnitude || 1));
    }

    public dot(v: Vector3): number {
        return this.x * v.x + this.y * v.y + this.z * v.z;
    }

    public cross(v: Vector3): Vector3 {
        return new Vector3(
            this.y * v.z - this.z * v.y,
            this.z * v.x - this.x * v.z,
            this.x * v.y - this.y * v.x);
    }

    public equals(v: Vector3): boolean {
        return this.x === v.x && this.y === v.y && this.z === v.z;
    }

    public min(v: Vector3): Vector3 {
        return new Vector3(
            Math.min(this.x, v.x),
            Math.min(this.y, v.y),
            Math.min(this.z, v.z)
        );
    }

    public max(v: Vector3): Vector3 {
        return new Vector3(
            Math.max(this.x, v.x),
            Math.max(this.y, v.y),
            Math.max(this.z, v.z)
        );
    }

    public lerp(v: Vector3, alpha: number): Vector3 {
        return new Vector3(
            this.x + (v.x - this.x) * alpha,
            this.y + (v.y - this.y) * alpha,
            this.z + (v.z - this.z) * alpha);
    }

    public static average(v: Vector3[]): Vector3 {
        let result = Vector3.zero;
        if (v && v.length > 0) {
            for (let i = 0; i < v.length; i++) {
                result = result.add(v[i]);
            }
            result = result.scale(1.0 / v.length);
        }
        return result;
    }

    public push(data: number[]) {
        Vector3.toNumbers([this]).forEach(v => data.push(v));
    }

    public static center(vs: Vector3[]): Vector3 {
        let result = Vector3.zero;
        vs.forEach(v => result = result.add(v));
        return result.scale(1.0 / vs.length);
    }

    public static toNumbers(vs: Vector3[]): number[] {
        const numbers: number[] = [];
        for (const v of vs)
            numbers.push(v.x, v.y, v.z);
        return numbers;
    }

    public static fromNumbers(numbers: number[]): Vector3[] {
        const vs: Vector3[] = [];
        for (let i = 0; i < numbers.length; i += 3)
            vs.push(new Vector3(numbers[i], numbers[i + 1], numbers[i + 2]));
        return vs;
    }
}
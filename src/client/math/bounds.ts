import {
    Vector3
} from "../index"


export class Bounds {

    public readonly minimum: Vector3;
    public readonly maximum: Vector3;

    constructor(min: Vector3, max: Vector3) {
        this.minimum = min;
        this.maximum = max;
    }

    public static get default(): Bounds {
        return new Bounds(Vector3.maxValue, Vector3.minValue);
    }

    public get delta(): Vector3 {
        return this.maximum.subtract(this.minimum);
    }

    public get center(): Vector3 {
        return Vector3.center([this.minimum, this.maximum]);
    }

    public get scale(): Vector3 {
        return this.maximum.subtract(this.minimum);
    }

    public static concat(bs: Bounds[]): Bounds {
        const result = Bounds.default;
        bs.forEach(b => {
            result.minimum.x = Math.min(result.minimum.x, b.minimum.x);
            result.minimum.y = Math.min(result.minimum.y, b.minimum.y);
            result.minimum.z = Math.min(result.minimum.z, b.minimum.z);
            result.maximum.x = Math.max(result.maximum.x, b.maximum.x);
            result.maximum.y = Math.max(result.maximum.y, b.maximum.y);
            result.maximum.z = Math.max(result.maximum.z, b.maximum.z);
        });
        return result;
    }
}
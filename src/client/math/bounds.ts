import {
    Vector3
} from "../index"


export class Bounds {

    public readonly min: Vector3;
    public readonly max: Vector3;

    constructor(min: Vector3, max: Vector3) {
        this.min = min;
        this.max = max;
    }

    public get size(): Vector3 {
        return this.max.subtract(this.min);
    }
}
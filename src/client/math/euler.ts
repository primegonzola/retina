/**
 * Describes the several euler order options.
 *
 * @export
 * @enum {number}
 */
export enum EulerOrderOptions {
    XYZ,
    YXZ,
    ZXY,
    ZYX,
    YZX,
    XZY,
}

/**
 * Encapsulates the available options and operations in dealing with Euler angles.
 *
 * @export
 * @class Euler
 */
export class Euler {
    /**
     * The X component of the Euler instance.
     *
     * @type {number}
     * @memberof Euler
     */
    public readonly x: number;
    /**
     * The Y component of the Euler instance.
     *
     * @type {number}
     * @memberof Euler
     */
    public readonly y: number;
    /**
     * The Z component of the Euler instance.
     *
     * @type {number}
     * @memberof Euler
     */
    public readonly z: number;
    /**
     * The ordering options to use.
     *
     * @type {EulerOrderOptions}
     * @memberof Euler
     */
    public readonly order: EulerOrderOptions;

    /**
     *  Creates an instance of Euler.
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {EulerOrderOptions} [order=EulerOrderOptions.ZYX] 
     * @memberof Euler
     */
    constructor(x: number, y: number, z: number, order: EulerOrderOptions = EulerOrderOptions.ZYX) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.order = order;
    }

    /**
     * Clones the current instance and return it as new one.
     *
     * @return {Euler} 
     * @memberof Euler
     */
    public clone(): Euler {
        return new Euler(this.x, this.y, this.z, this.order);
    }

    /**
     * Creates a new instance using provided angles in degrees.
     *
     * @static
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {EulerOrderOptions} [order=EulerOrderOptions.ZYX] 
     * @return {Euler} 
     * @memberof Euler
     */
    public static fromDegrees(x: number, y: number, z: number,
        order: EulerOrderOptions = EulerOrderOptions.ZYX): Euler {
        return new Euler(
            Euler.toRadians(x),
            Euler.toRadians(y),
            Euler.toRadians(z),
            order
        );
    }

    /**
     * Creates a new instance using provided angles in radians.
     *
     * @static
     * @param {number} x 
     * @param {number} y 
     * @param {number} z 
     * @param {EulerOrderOptions} [order=EulerOrderOptions.ZYX] 
     * @return {Euler} 
     * @memberof Euler
     */
    public static fromRadians(x: number, y: number, z: number,
        order: EulerOrderOptions = EulerOrderOptions.ZYX): Euler {
        return new Euler(x, y, z, order);
    }

    /**
     * Converts incoming angle from radians to degrees.
     *
     * @static
     * @param {number} angle 
     * @return {number} 
     * @memberof Euler
     */
    public static toDegrees(angle: number): number {
        return angle * (180.0 / Math.PI);
    }

    /**
     * Converts incoming angle from degrees to radians.
     *
     * @static
     * @param {number} angle 
     * @return {number} 
     * @memberof Euler
     */
    public static toRadians(angle: number): number {
        return angle * (Math.PI / 180.0);
    }
}

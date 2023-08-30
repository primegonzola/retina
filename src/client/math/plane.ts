import {
    Vector3
} from "../index"

export class Plane {
    public readonly normal: Vector3;
    public readonly point: Vector3;

    constructor(normal: Vector3, point: Vector3) {
        this.normal = normal;
        this.point = point;
    }

    public static normalize(plane: Plane): Plane {
        const length = 1.0 / plane.normal.magnitude;
        const normal = plane.normal.scale(length);
        return new Plane(normal, plane.point.scale(length));
    }

    public normalize(): Plane {
        return Plane.normalize(this);
    }

    public static distanceToPoint(plane: Plane, point: Vector3): number {
        return plane.normal.dot(point.subtract(plane.point));
    }

    public distanceToPoint(point: Vector3): number {
        return Plane.distanceToPoint(this, point);
    }
} 
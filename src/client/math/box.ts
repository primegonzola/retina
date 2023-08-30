import {
    Bounds,
    Matrix4,
    Quaternion,
    Transform,
    Vector3,
    Vector4
} from "../index"

export class Mtv {
    public readonly axis: Vector3;
    public distance: number;

    constructor(axis: Vector3, distance: number) {
        this.axis = axis;
        this.distance = distance;
    }
}

export class BoxIntersection {
    public a: Box;
    public b: Box;
    public a_in_b: boolean;
    public b_in_a: boolean;
    public distance: number;
    public axis: Vector3;
}

export class Box {
    public readonly vertices: Vector3[];
    public readonly right: Vector3;
    public readonly up: Vector3;
    public readonly forward: Vector3;
    public readonly bounds: Bounds;

    constructor(position: Readonly<Vector3>, rotation: Readonly<Quaternion>, scale: Readonly<Vector3>) {
        const max = scale.scale(0.5);
        const min = max.scale(-1);

        this.vertices = [
            position.add(rotation.rotateVector(min)),
            position.add(rotation.rotateVector(new Vector3(max.x, min.y, min.z))),
            position.add(rotation.rotateVector(new Vector3(min.x, max.y, min.z))),
            position.add(rotation.rotateVector(new Vector3(max.x, max.y, min.z))),
            position.add(rotation.rotateVector(new Vector3(min.x, min.y, max.z))),
            position.add(rotation.rotateVector(new Vector3(max.x, min.y, max.z))),
            position.add(rotation.rotateVector(new Vector3(min.x, max.y, max.z))),
            position.add(rotation.rotateVector(max))
        ];

        this.right = rotation.rotateVector(Vector3.right);
        this.up = rotation.rotateVector(Vector3.up);
        this.forward = rotation.rotateVector(Vector3.forward);
        this.bounds = Vector3.bounds(this.vertices);
    }

    public static fromTransform(transform: Transform): Box {
        return new Box(
            transform.position, transform.rotation, transform.scale
        );
    }

    private static separated(va: Readonly<Vector3[]>, vb: Readonly<Vector3[]>, axis: Readonly<Vector3>, result?: BoxIntersection): boolean {
        // ignore zero axis case
        if (axis.equals(Vector3.zero))
            return false;

        var aMin = Number.MAX_SAFE_INTEGER;
        var aMax = Number.MIN_SAFE_INTEGER;
        var bMin = Number.MAX_SAFE_INTEGER;
        var bMax = Number.MIN_SAFE_INTEGER;

        for (let i = 0; i < va.length; i++) {
            const ad = va[i].dot(axis);
            const bd = vb[i].dot(axis);
            aMin = Math.min(ad, aMin);
            aMax = Math.max(ad, aMax);
            bMin = Math.min(bd, bMin);
            bMax = Math.max(bd, bMax);
        }

        // calculate total sum of a and b projected lengths
        const sum = aMax - aMin + bMax - bMin;

        // calculate the longest possible length
        const long = Math.max(aMax, bMax) - Math.min(aMin, bMin);

        // check if seperated or not
        if (long >= sum)
            return true;

        if (aMin > bMax || aMax < bMin)
            return true

        // check if result is provided
        if (result) {
            let overlap = 0;

            if (aMin < bMin) {
                result.a_in_b = false;
                if (aMax < bMax) {
                    overlap = aMax - bMin;
                    result.b_in_a = false;
                } else {
                    const option1 = aMax - bMin;
                    const option2 = bMax - aMin;
                    overlap = option1 < option2 ? option1 : -option2;
                }
            } else {
                result.b_in_a = false
                if (aMax > bMax) {
                    overlap = aMin - bMax;
                    result.a_in_b = false;
                } else {
                    const option1 = aMax - bMin;
                    const option2 = bMax - aMin;
                    overlap = option1 < option2 ? option1 : -option2;
                }
            }

            const current_overlap = result.distance;
            const absolute_overlap = overlap < 0 ? -overlap : overlap;
            if (current_overlap === null || current_overlap > absolute_overlap) {
                const sign = overlap < 0 ? -1 : 1;
                result.distance = absolute_overlap;
                result.axis = axis.scale(sign);
            }
        }

        // no seperating found
        return false;
    }

    public static intersects(a: Readonly<Box>, b: Readonly<Box>, result?: BoxIntersection): boolean {
        const axises = [
            a.right,
            a.up,
            a.forward,
            b.right,
            b.up,
            b.forward,
            a.right.cross(b.right),
            a.right.cross(b.up),
            a.right.cross(b.forward),
            a.up.cross(b.right),
            a.up.cross(b.up),
            a.up.cross(b.forward),
            a.forward.cross(b.right),
            a.forward.cross(b.up),
            a.forward.cross(b.forward)
        ];

        // init result if needed
        if (result) {
            result.a = a;
            result.b = b;
            result.a_in_b = true;
            result.b_in_a = true;
            result.distance = null;
            result.axis = Vector3.zero;
        }

        // loop over all axises
        for (let i = 0; i < axises.length; i++) {
            // check if seperated
            if (this.separated(a.vertices, b.vertices, axises[i].normalize(), result))
                return false;
        }

        // no seperating axis found so must be colliding
        return true;
    }

    public view(view: Matrix4): Bounds {
        
        // calculate min/max in view space
        return Vector3.bounds(this.vertices.map(v => view.transform(Vector4.xyz(v, 1.0)).xyz));
    }
}
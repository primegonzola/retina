import {
    Matrix4,
    Plane,
    Quaternion,
    Range,
    Rectangle,
    Vector3,
    Vector4,
} from "../index"

enum FrustumPlaneOptions {
    Top = 0,
    Bottom = 1,
    Left = 2,
    Right = 3,
    Near = 4,
    Far = 5
}

export class Frustum {
    public readonly planes: Plane[];
    public readonly view: Matrix4;

    constructor(view: Matrix4) {
        // setup planes
        this.view = view;
        this.planes = new Array<Plane>(6);
    }

    public static perspective(view: Matrix4, area: Rectangle, range: Range): Frustum {

        // create frustum
        const frustum = new Frustum(view);

        // calculate deltas
        const dw = area.size.width / 2.0;
        const dh = area.size.height / 2.0;

        // calculate angles
        const atw = Math.atan(dw / range.minimum);
        const ath = Math.atan(dh / range.minimum);

        // create near plane (always use forward)
        frustum.planes[FrustumPlaneOptions.Near] = new Plane(Vector3.backward,
            Vector3.forward.scale(range.minimum));

        // create far plane
        frustum.planes[FrustumPlaneOptions.Far] = new Plane(Vector3.forward,
            Vector3.forward.scale(range.maximum));

        // create top plane
        frustum.planes[FrustumPlaneOptions.Top] = new Plane(
            Quaternion.radians(ath, 0, 0).rotateVector(Vector3.up),
            Vector3.forward.scale(range.minimum).add(new Vector3(0, dh, 0)));

        // create bottom plane
        frustum.planes[FrustumPlaneOptions.Bottom] = new Plane(
            Quaternion.radians(-ath, 0, 0).rotateVector(Vector3.down),
            Vector3.forward.scale(range.minimum).add(new Vector3(0, -dh, 0)));

        // create left plane
        frustum.planes[FrustumPlaneOptions.Left] = new Plane(
            Quaternion.radians(0, atw, 0).rotateVector(Vector3.left),
            Vector3.forward.scale(range.minimum).add(new Vector3(-dw, 0, 0)));

        // create right plane
        frustum.planes[FrustumPlaneOptions.Right] = new Plane(
            Quaternion.radians(0, -atw, 0).rotateVector(Vector3.right),
            Vector3.forward.scale(range.minimum).add(new Vector3(dw, 0, 0)));

        // all done
        return frustum;
    }

    public static orthographic(view: Matrix4, area: Rectangle, range: Range): Frustum {

        // create frustum
        const frustum = new Frustum(view);

        // create near plane
        frustum.planes[FrustumPlaneOptions.Near] = new Plane(Vector3.backward,
            Vector3.forward.scale(range.minimum));

        // create far plane
        frustum.planes[FrustumPlaneOptions.Far] = new Plane(Vector3.forward,
            Vector3.forward.scale(range.maximum));

        // create top plane
        frustum.planes[FrustumPlaneOptions.Top] = new Plane(Vector3.up,
            Vector3.up.scale(area.top));

        // create bottom plane
        frustum.planes[FrustumPlaneOptions.Bottom] = new Plane(Vector3.down,
            Vector3.up.scale(area.bottom));

        // create left plane
        frustum.planes[FrustumPlaneOptions.Left] = new Plane(Vector3.left,
            Vector3.right.scale(area.left));

        // create right plane
        frustum.planes[FrustumPlaneOptions.Right] = new Plane(Vector3.right,
            Vector3.right.scale(area.right));

        // all done
        return frustum;
    }

    public wp(position: Vector3): boolean {
        //
        // we first check if given point is inside or on all planes
        // if so it means we have a point inside the frustum
        //

        // convert to view space
        const vp = this.view.transform(Vector4.xyz(position, 1.0)).xyz;

        // assume not inside
        let count = 0;

        // loop over each plane
        for (let pi = 0; pi < this.planes.length; pi++) {

            // get plane
            const plane = this.planes[pi];

            // calculate distance an if smaller then inside
            count = count + (plane.distanceToPoint(vp) <= 0 ? 1 : 0);
        }

        // see if fully inside if so bail out early
        return count === this.planes.length;
    }

    public wbox(position: Vector3, rotation: Quaternion, scale: Vector3): boolean {
        // turn the incoming into a box of 8 points
        const max = scale.scale(0.5);
        const min = max.scale(-1);

        const positions = [
            position.add(rotation.rotateVector(min)),

            position.add(rotation.rotateVector(new Vector3(max.x, min.y, min.z))),
            position.add(rotation.rotateVector(new Vector3(min.x, max.y, min.z))),
            position.add(rotation.rotateVector(new Vector3(max.x, max.y, min.z))),

            position.add(rotation.rotateVector(new Vector3(min.x, min.y, max.z))),
            position.add(rotation.rotateVector(new Vector3(max.x, min.y, max.z))),
            position.add(rotation.rotateVector(new Vector3(min.x, max.y, max.z))),

            position.add(rotation.rotateVector(max))
        ];

        // map them into view space of frustum
        const vps = positions.map(p => this.view.transform(Vector4.xyz(p, 1.0)).xyz);

        //
        // we first check if any of the given poinst is inside or on all planes
        // if so it means we have a point inside the frustum
        //
        for (let p = 0; p < vps.length; p++) {

            // transform into local view space
            const vp = vps[p];

            // assume not inside
            let count = 0;

            // loop over each plane
            for (let pi = 0; pi < this.planes.length; pi++) {

                // get plane
                const plane = this.planes[pi];

                // calculate distance an if smaller then inside
                count = count + (plane.distanceToPoint(vp) <= 0 ? 1 : 0);
            }

            // see if fully inside if so bail out early
            if (count === this.planes.length)
                return true;
        }

        // secondly we check if any plane is being crossed
        // we can do this by checking if all points have the same sign in distance to plane
        // if all a same sign against a give plane the plane does not cross
        // if sign is negative all points are inside
        // if sign is positive all points are outside

        // handy helper to check if all points are outside
        const outside = (plane: Plane, pss: Vector3[]) => {
            let count = 0;
            pss.forEach(p => count = count + (plane.distanceToPoint(p) > 0 ? 1 : 0));
            return count === pss.length;
        }

        // see if any is fully outside top, bottom, left, right, near, far
        let ot = outside(this.planes[FrustumPlaneOptions.Top], vps);
        let ob = outside(this.planes[FrustumPlaneOptions.Bottom], vps);
        let ol = outside(this.planes[FrustumPlaneOptions.Left], vps);
        let or = outside(this.planes[FrustumPlaneOptions.Right], vps);
        let nf = outside(this.planes[FrustumPlaneOptions.Near], vps);
        let ff = outside(this.planes[FrustumPlaneOptions.Far], vps);

        // if any all outside then we are outside
        return !(ol || or || ot || ob || nf || ff)
    }
}

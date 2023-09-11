import {
    Bounds,
    Box,
    Frustum,
    Matrix4,
    Quaternion,
    Range,
    Rectangle,
    Size,
    Transform,
    Vector2,
    Vector3,
    Vector4,
} from "../index";

export enum CameraKindOptions {
    Orthographic,
    Perspective
}

export class Camera {

    public readonly transform: Transform;
    public readonly kind: CameraKindOptions;
    public readonly area: Rectangle;
    public readonly range: Range;

    constructor(kind: CameraKindOptions, transform: Transform, area: Rectangle, range: Range) {
        this.transform = transform;
        this.kind = kind;
        this.area = area;
        this.range = range;
    }

    public static screen(aspect: number = 1.0): Camera {
        return new Camera(
            CameraKindOptions.Orthographic,
            new Transform(Vector3.backward, Quaternion.identity, Vector3.one),
            new Rectangle(new Vector2(-0.5, -0.5 / aspect), new Size(aspect, 1.0 / aspect)),
            new Range(0, 1));
    }

    public static directional(bounds: Bounds[], rotation: Quaternion): Camera {

        //
        // calculate main bounds of all visible sectors
        // in the end we will have a bounding box surrounding all visible sectors
        //
        const wb = Bounds.concat(bounds);

        //
        // create view with same scale but centered and rotated with directional
        // basically we put the view in the center of the world box and rotate it
        //
        const view = Matrix4.construct(
            wb.center, rotation, Vector3.one).inverse;

        //
        // calculate bounding box of all world bounds 
        // but transformed into given view
        //
        const vb = new Box(
            wb.center, Quaternion.identity, wb.scale).view(view);

        // create world box transform
        const wbtf = new Transform(
            wb.center, Quaternion.identity, wb.scale);

        // create view box transform
        const vbtf = new Transform(
            wb.center, rotation, vb.scale);

        // create shadow box transform
        const sbtf = new Transform(
            wb.center, rotation, vb.scale);
            
        //
        // calculate camera position 
        // basically pointing at back of view box
        //
        const cp = wb.center.subtract(
            rotation.direction.scale((0.5 * vb.scale.z)));

        //
        // calculate camera area
        // we take the scale in x and y
        //
        const ca = Rectangle.construct(
            -0.5 * vb.scale.x, 0.5 * vb.scale.x, 0.5 * vb.scale.y, -0.5 * vb.scale.y);

        //
        // calculate camera range
        // we take as a minus the scale x so we get a 1/1 ratio fov
        // far side we use full size of view box
        //
        const cr = new Range(-vb.scale.x, vb.scale.z);

        // construct camera using above created data
        return new Camera(
            CameraKindOptions.Orthographic,
            new Transform(cp, rotation, Vector3.one),
            ca, cr);
    }

    public get wcs(): Vector4[] {

        // final result
        const css = new Array<Vector4>();

        // calculate inverse of projection * view
        const pvi = this.projection.multiply(this.view).inverse;

        // build ndc
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {

                    // push the corner transformed by inverse
                    // this gives the coordinates back in world space
                    const cs = new Vector4(
                        2.0 * x - 1.0,
                        2.0 * y - 1.0,
                        2.0 * z - 1.0,
                        1.0
                    ).matrix(pvi);

                    // normalize and push 
                    css.push(cs.scale(1.0 / cs.w));
                }
            }
        }
        // all done
        return css;
    }

    public get wbs(): Bounds {
        return Vector3.bounds(this.wcs.map(v => v.xyz))
    }

    public get frustum(): Frustum {
        switch (this.kind) {
            case CameraKindOptions.Orthographic:
                return Frustum.orthographic(this.view, this.area, this.range);
            case CameraKindOptions.Perspective:
                return Frustum.perspective(this.view, this.area, this.range);
            default:
                throw Error("invalid-camera-kind");
        }
    }

    public get view(): Matrix4 {
        return this.transform.model.inverse;
    }

    public get projection(): Matrix4 {
        switch (this.kind) {
            case CameraKindOptions.Orthographic:
                return Matrix4.orthographic(
                    this.area.left,
                    this.area.right,
                    this.area.top,
                    this.area.bottom,
                    this.range.minimum,
                    this.range.maximum);
            case CameraKindOptions.Perspective:
                return Matrix4.perspective(
                    this.area.left,
                    this.area.right,
                    this.area.top,
                    this.area.bottom,
                    this.range.minimum,
                    this.range.maximum);
            default:
                throw Error("invalid-camera-kind");
        }
    }

    public aspect(aspect: number): void {
        this.area.set(new Vector2(-0.5, -0.5 / aspect), new Size(1.0, 1.0 / aspect));
    }
}
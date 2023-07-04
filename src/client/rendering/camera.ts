import {
    Matrix4,
    Platform,
    Quaternion,
    Range,
    Rectangle,
    Size,
    Transform,
    Utils,
    Vector2,
    Vector3,
} from "../index";

export enum CameraKindOptions {
    Orthographic,
    Perspective
}

export class Camera {
    public readonly id: string;
    public readonly kind: CameraKindOptions;
    public readonly transform: Transform;
    public readonly area: Rectangle;
    public readonly range: Range;
    public readonly platform: Platform;

    constructor(platform: Platform, kind: CameraKindOptions, transform: Transform, area: Rectangle, range: Range) {
        // initialize camera
        this.id = Utils.uuid();
        this.kind = kind;
        this.transform = transform;
        this.area = area;
        this.range = range;
        this.platform = platform;
    }

    public static screen(platform: Platform, aspect: number): Camera {
        return new Camera(
            platform,
            CameraKindOptions.Orthographic,
            new Transform(Vector3.backward, Quaternion.identity, Vector3.one),
            new Rectangle(new Vector2(-0.5, -0.5 / aspect), new Size(aspect, 1.0 / aspect)),
            new Range(0, 1));
    }

    public get view(): Matrix4 {
        // inverse of the camera transform
        return this.transform.world.inverse;
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

    public update(): void {
        // get aspect
        const aspect = this.platform.graphics.aspect;

        // update camera with proper aspect
        this.area.set(
            new Vector2(-0.5, -0.5 / aspect), new Size(1.0, 1.0 / aspect));
    }
}
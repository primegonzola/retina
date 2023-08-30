import {
    Color,
    IBuffer,
    ITexture,
    Matrix4,
    Range,
    Rectangle,
    Transform,
} from "../index";

export enum LightKindOptions {
    Directional = 1,
    Spot = 2,
    Point = 3,
    Area = 4
}

export type LightRenderData = {
    model: IBuffer;
    textures: ITexture[];
}

export type LightOptions = {
    area?: Rectangle;
    range?: Range;
    radius?: number;
    constant?: number;
    linear?: number;
    quadratic?: number;
}

export class Light {

    public readonly kind: LightKindOptions;
    public readonly transform: Transform;
    public readonly color: Color;
    public readonly intensity: number;
    public readonly options?: LightOptions;

    constructor(kind: LightKindOptions, transform: Transform, color: Color, intensity: number, options?: LightOptions) {
        // init
        this.kind = kind;
        this.color = color;
        this.intensity = intensity;
        this.transform = transform;
        this.options = options;
    }

    public static createDirectional(transform: Transform, color: Color, intensity: number,
        area: Rectangle, range: Range): Light {
        return new Light(LightKindOptions.Directional, transform, color, intensity, {
            area: area,
            range: range
        });
    }


    public static createPoint(transform: Transform, color: Color, intensity: number,
        radius: number, constant: number, linear: number, quadratic: number, range: Range): Light {
        return new Light(LightKindOptions.Point, transform, color, intensity, {
            area: Rectangle.screen,
            radius: radius,
            constant: constant,
            linear: linear,
            quadratic: quadratic,
            range: range
        });
    }

    public get view(): Matrix4 {
        return this.transform.model.inverse;
    }

    public get projection(): Matrix4 {
        switch (this.kind) {
            case LightKindOptions.Area:
            case LightKindOptions.Directional:
                return Matrix4.orthographic(
                    this.options?.area.left,
                    this.options?.area.right,
                    this.options?.area.top,
                    this.options?.area.bottom,
                    this.options?.range.minimum,
                    this.options?.range.maximum);
            case LightKindOptions.Spot:
            case LightKindOptions.Point:
                return Matrix4.perspective(
                    this.options?.area.left,
                    this.options?.area.right,
                    this.options?.area.top,
                    this.options?.area.bottom,
                    this.options?.range.minimum,
                    this.options?.range.maximum);
            default:
                throw Error("invalid-camera-kind");
        }
    }
}
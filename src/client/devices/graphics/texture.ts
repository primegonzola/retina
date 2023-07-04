import {
    GraphicsDevice,
    Size,
    Utils
} from "../../index"

export enum TextureKindOptions {
    Flat = "flat",
    Cube = "cube",
    Depth = "depth",
}

export interface ITexture {
    get id(): string;
    get kind(): TextureKindOptions;
    get size(): Size;
    get handle(): unknown;
    get device(): GraphicsDevice;
    destroy(): void;
}

export class Texture<T> implements ITexture {

    public readonly id: string;
    public readonly kind: TextureKindOptions;
    public readonly device: GraphicsDevice;
    public readonly name: string;
    public readonly size: Size;
    public readonly handle: T;

    constructor(device: GraphicsDevice, kind: TextureKindOptions, size: Size, handle: T) {
        // initialize the texture
        this.id = Utils.uuid();
        this.kind = kind;
        this.size = size;
        this.handle = handle;
        this.device = device;
    }

    public destroy(): void {
        // destroy
        (this.handle as GPUTexture)?.destroy();
    }
}
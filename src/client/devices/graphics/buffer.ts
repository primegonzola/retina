import {
    GraphicsDevice,
    Utils
} from "../../index";

export enum BufferKindOptions {
    Index,
    Vertex,
    Uniform
}

export interface IBuffer {
    get id(): string;
    get kind(): BufferKindOptions;
    get device(): GraphicsDevice;
    get handle(): unknown;
    get count(): number;
    get _stride(): number;
    write(data: number[]): void;
    destroy(): void;
}

export class Buffer<T> implements IBuffer {

    public readonly id: string;
    public readonly device: GraphicsDevice;
    public readonly kind: BufferKindOptions;
    public readonly handle: T;
    public readonly count: number;
    public readonly _stride: number;

    constructor(device: GraphicsDevice, kind: BufferKindOptions, count: number, stride: number, handle: T) {
        // init
        this.id = Utils.uuid();
        this.device = device;
        this.kind = kind;
        this.handle = handle;
        this.count = count;
        this._stride = stride;
    }

    public write(data: number[]): void {
        switch (this.kind) {
            case BufferKindOptions.Index: {
                const source = new Uint32Array(data);
                // write to buffer
                this.device.handle.queue.writeBuffer(
                    this.handle as GPUBuffer, 0, source, 0, source.length
                );
                break;
            }
            case BufferKindOptions.Vertex:
            case BufferKindOptions.Uniform: {
                const source = new Float32Array(data);
                // write to buffer
                this.device.handle.queue.writeBuffer(
                    this.handle as GPUBuffer, 0, source, 0, source.length
                );
                break;
            }
            default:
                throw new Error("Invalid buffer kind");
        }
    }

    public destroy(): void {
        // destroy underlying buffer
        (this.handle as GPUBuffer)?.destroy();
    }
}
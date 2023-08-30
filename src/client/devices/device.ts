export enum DeviceKind {
    Graphics = "graphics",
    Input = "input",
}

export interface IDevice {
    get kind(): DeviceKind;
    get handle(): unknown;
    update(): void;
    destroy(): void;
}

export abstract class Device<T> implements IDevice {
    public readonly kind: DeviceKind;
    public readonly handle: T;

    constructor(kind: DeviceKind, handle?: T) {
        // init
        this.kind = kind;
        this.handle = handle;
    }

    public abstract update(): void;
    public abstract destroy(): void;
}
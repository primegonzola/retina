export enum SamplerKindOptions {
    Albedo,
    Depth,
    Stencil
}

export interface ISampler {
    get handle(): unknown;
}

export class Sampler implements ISampler {
    public readonly kind: SamplerKindOptions;
    public readonly handle: unknown;

    constructor(kind: SamplerKindOptions, handle: unknown) {
        // init
        this.kind = kind;
        this.handle = handle;
    }
}
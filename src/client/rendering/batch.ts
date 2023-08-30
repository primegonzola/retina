import {
    IBuffer,
    IShader
} from "../index"

export class RenderShaderBatch {
    public readonly shader: IShader;
    public readonly uniforms: Map<string, IBuffer>;

    constructor(shader: IShader) {
        this.shader = shader;
        this.uniforms = new Map<string, IBuffer>();
    }
}

export class RenderBatch {
    public readonly shaders : Map<string, RenderShaderBatch>;

    constructor() {
        this.shaders = new Map<string, RenderShaderBatch>();
    }
}
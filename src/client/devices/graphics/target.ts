import {
    IBuffer,
    IShader,
    ShaderData,
} from "../../index";

export class RenderData {
    public readonly id: string;
    public readonly shader: IShader;
    public readonly groups: Map<string, Map<string, ShaderData>>;
    public readonly buffers: Map<string, IBuffer>;

    constructor(id: string, shader: IShader) {
        // init
        this.id = id;
        this.shader = shader;
        this.groups = new Map<string, Map<string, ShaderData>>();
        this.buffers = new Map<string, IBuffer>();
    }
}
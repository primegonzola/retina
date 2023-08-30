import {
    IBuffer,
    IShader,
    ShaderData,
    ShaderGroupBindingKindOptions,
} from "../../index";

export class RenderData {
    public readonly shader: IShader;
    public readonly model: IBuffer;
    public readonly groups: Map<string, Map<string, ShaderData>>;
    public readonly buffers: Map<string, IBuffer>;

    constructor(model: IBuffer, shader: IShader, buffers?: Map<string, IBuffer>, groups?: Map<string, Map<string, ShaderData>>) {
        this.shader = shader;
        this.model = model;
        this.buffers = buffers || new Map<string, IBuffer>();
        this.groups = groups || new Map<string, Map<string, ShaderData>>();

        // set model
        this.groups.set("model", new Map<string, ShaderData>());
        this.groups.get("model").set("model", {
            name: "model",
            kind: ShaderGroupBindingKindOptions.Uniform,
            value: this.model,
        });
    }
}
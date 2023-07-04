import {
    IBuffer,
    IShader,
    ITexture,
} from "../../index";

export enum RenderDataDestroyOptions {
    None = 0,
    Buffers = 1,
    Uniforms = 2,
    Textures = 4,
    All = None | Buffers | Uniforms | Textures,
}

export class RenderData {
    public readonly id: string;
    public readonly shader: IShader;
    public readonly buffers: Map<string, IBuffer>;
    public readonly uniforms: Map<string, IBuffer>;
    public readonly textures: Map<string, ITexture>;

    constructor(id: string, shader: IShader) {
        // init
        this.id = id;
        this.shader = shader;
        this.buffers = new Map<string, IBuffer>();
        this.uniforms = new Map<string, IBuffer>();
        this.textures = new Map<string, ITexture>();
    }

    public destroy(options: RenderDataDestroyOptions = RenderDataDestroyOptions.All): void {

        // check if we need to destroy
        if ((options & RenderDataDestroyOptions.Buffers) === RenderDataDestroyOptions.Buffers) {
            this.buffers.forEach(buffer => buffer.destroy());
        }

        // clear buffers
        this.buffers.clear();

        // check if we need to destroy
        if ((options & RenderDataDestroyOptions.Uniforms) === RenderDataDestroyOptions.Uniforms) {
            this.uniforms.forEach(uniform => uniform.destroy());
        }

        // clear uniforms
        this.uniforms.clear();

        // check if we need to destroy
        if ((options & RenderDataDestroyOptions.Textures) === RenderDataDestroyOptions.Textures) {
            this.textures.forEach(texture => texture.destroy());
        }

        // clear textures
        this.textures.clear();
    }
}
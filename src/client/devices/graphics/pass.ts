import { IBuffer, ISampler, IShader, ITexture } from "../../index";


export interface IRenderPass {
    get handle(): unknown;
    bindIndices(buffer: IBuffer): void;
    bindBuffer(shader: IShader, name: string, buffer: IBuffer): void;
    bindUniform(shader: IShader, name: string, uniform: IBuffer): void;
    bindTexture(shader: IShader, name: string, texture: ITexture, sampler: ISampler): void;
    draw(vertexCount: number): void;
    drawIndexed(indexCount: number): void;
    end(): void;
    viewport(x: number, y: number, width: number, height: number, minDepth?: number, maxDepth?: number): void;
}

export class RenderPass implements IRenderPass {
    public readonly handle: unknown;

    constructor(handle: unknown) {
        // init
        this.handle = handle;
    }

    public bindIndices(buffer: IBuffer): void {
        // delegate
        (this.handle as GPURenderPassEncoder).setIndexBuffer(buffer.handle as GPUBuffer, "uint32");
    }

    public draw(vertexCount: number): void {
        // delegate
        (this.handle as GPURenderPassEncoder).draw(vertexCount);
    }


    public drawIndexed(indexCount: number): void {
        // delegate
        (this.handle as GPURenderPassEncoder).drawIndexed(indexCount);
    }

    public bindBuffer(shader: IShader, name: string, buffer: IBuffer): void {
        // delegate
        shader.bindBuffer(this, name, buffer);
    }

    public bindUniform(shader: IShader, name: string, uniform: IBuffer): void {
        // delegate
        shader.bindUniform(this, name, uniform);
    }

    public bindTexture(shader: IShader, name: string, texture: ITexture, sampler: ISampler): void {
        // delegate
        shader.bindTexture(this, name, texture, sampler);
    }

    public viewport(x: number, y: number, width: number, height: number, minDepth: number, maxDepth: number): void {
        // delegate
        (this.handle as GPURenderPassEncoder).setViewport(
            x, y, width, height, minDepth, maxDepth
        );
    }

    public end(): void {
        // delegate
        (this.handle as GPURenderPassEncoder).end();
    }
}
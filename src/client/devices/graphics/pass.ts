import {
    IBuffer,
    IShader,
    ShaderData
} from "../../index";

export interface IRenderPass {
    get handle(): unknown;
    bindBuffer(shader: IShader, name: string, buffer: IBuffer): void;
    bindData(shader: IShader, name: string, data: Iterable<ShaderData>): void;
    bindIndices(buffer: IBuffer): void;
    draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void;
    drawIndexed(indexCount: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void;
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

    public draw(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void {
        // delegate
        (this.handle as GPURenderPassEncoder).draw(vertexCount, instanceCount, firstVertex, firstInstance);
    }

    public drawIndexed(indexCount: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void {
        // delegate
        (this.handle as GPURenderPassEncoder).drawIndexed(indexCount, firstIndex, baseVertex, firstInstance);
    }

    public bindBuffer(shader: IShader, name: string, buffer: IBuffer): void {
        // delegate
        shader.bindBuffer(this, name, buffer);
    }

    public bindData(shader: IShader, name: string, data: Iterable<ShaderData>): void {
        // delegate
        shader.bindData(this, name, data);
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
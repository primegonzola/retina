import {
    Color,
    IBuffer,
    IRenderPass,
    ISampler,
    ITexture,
    Platform,
    RenderPass,
    SamplerKindOptions,
    RenderData,
    Size,
    TextureKindOptions,
} from "../index";

export type RenderTargetBufffer = {
    albedo: ITexture;
    depth: ITexture;
}

export class RenderTarget {

    public readonly platform: Platform;
    public readonly size: Size;

    private _depthTexture?: ITexture;
    private _albedoTexture?: ITexture;
    private _depthSampler?: ISampler;
    private _albedoSampler?: ISampler;
    private _commandEncoder?: GPUCommandEncoder;
    private _renderPass?: IRenderPass;
    private _transparent: boolean = true;
    private _depth: boolean = true;

    constructor(platform: Platform, size: Size) {

        // init
        this.platform = platform;
        this.size = size;

        // initialize
        this._initialize();
    }

    public get buffers(): RenderTargetBufffer[] {
        return [{
            albedo: this._albedoTexture,
            depth: this._depthTexture
        }];
    }

    public capture(direct: boolean, color: Color, depth: number, action: () => void) {
        // create render pass descriptor
        // console.log(this._albedoTexture.size);
        // console.log(this._depthTexture.size);
        const rpd: GPURenderPassDescriptor = {
            colorAttachments: [
                {
                    clearValue: { r: color.r, g: color.g, b: color.b, a: color.a },
                    loadOp: "clear",
                    storeOp: "store",
                    view: direct ?
                        this.platform.graphics.context.getCurrentTexture().createView() :
                        (this._albedoTexture.handle as GPUTexture).createView(),
                },
            ],
            depthStencilAttachment: {
                view: (this._depthTexture.handle as GPUTexture).createView(),
                depthClearValue: depth,
                depthLoadOp: "clear",
                depthStoreOp: "store",
            }
        };

        // create encoder
        this._commandEncoder = this.platform.graphics.handle.createCommandEncoder();

        // create render pass
        this._renderPass = new RenderPass(this._commandEncoder.beginRenderPass(rpd));

        // set viewport
        this._renderPass.viewport(0, 0, this.size.width, this.size.height, 0, 1);

        // execute action if any
        if (action) action();

        // end pass
        this._renderPass.end();

        // submit commands to GPU
        this.platform.graphics.handle.queue.submit([this._commandEncoder.finish()]);
    }

    public destroy() {

        // destroy color texture 
        this._albedoTexture?.destroy();

        // destroy depth texture
        this._depthTexture?.destroy();
    }

    private _initialize(): void {

        // destroy color texture
        this._albedoTexture?.destroy();

        // destroy depth texture
        this._depthTexture?.destroy();

        // create color texture
        this._albedoTexture = this.platform.graphics.createTexture(TextureKindOptions.Flat, this.size);

        // matching sampler
        this._albedoSampler = this.platform.graphics.createSampler(SamplerKindOptions.Albedo);

        // create depth texture
        this._depthTexture = this.platform.graphics.createTexture(TextureKindOptions.Depth, this.size);

        // matching sampler
        this._depthSampler = this.platform.graphics.createSampler(SamplerKindOptions.Depth);
    }

    public pipeline(transparent: boolean, depth: boolean): void {
        // save
        this._depth = depth;
        this._transparent = transparent;
    }

    public render(camera: IBuffer, items: Iterable<RenderData>) {

        // loop over shapes
        for (const item of items) {

            // bind pipeline with proper transparency
            item.shader.bindPipeline(this._renderPass, this._transparent, this._depth);

            // bind camera
            item.shader.bindUniform(this._renderPass, "camera", camera);

            // bind buffers
            item.buffers.forEach((buffer, name) =>
                item.shader.bindBuffer(this._renderPass, name, buffer));

            // bind uniforms
            item.uniforms.forEach((buffer, name) =>
                item.shader.bindUniform(this._renderPass, name, buffer));

            // bind textures
            item.textures.forEach((texture, name) =>
                item.shader.bindTexture(this._renderPass, name, texture, this._albedoSampler));

            // see if indices are there
            if (item.buffers.has("indices")) {

                // set indices
                this._renderPass.bindIndices(item.buffers.get("indices"));

                // draw indexed
                this._renderPass.drawIndexed(item.buffers.get("indices").count);
            }
            else {
                // draw non-indexed
                this._renderPass.draw(item.buffers.get("positions").count);
            }
        }
    }

    public resize(size: Size) {

        // sanity check
        if (!this.size.equals(size)) {

            // update size
            this.size.set(size);

            // reinitialize
            this._initialize();
        }
    }
}
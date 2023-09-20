import {
    Color,
    IBuffer,
    IRenderPass,
    ITexture,
    Platform,
    RenderPass,
    SamplerKindOptions,
    RenderData,
    Size,
    TextureKindOptions,
    ShaderGroupBindingKindOptions,
    IShader,
    ShaderData,
    LightRenderData,
    Matrix4,
    BufferKindOptions,
    Vector4,
    TextureDimensionOptions,
    ISampler,
} from "../index";

export type RenderTargetBuffer = {
    attachments: ITexture[];
    depth: ITexture;
}

export type RenderTargetAttachmentDescriptor = {
    color: Color;
    texture: {
        dimension: TextureDimensionOptions;
        layers: number;
        samples?: number;
    }
}

export type RenderTargetDepthDescriptor = {
    stencil: boolean;
    value: number;
    texture: {
        dimension: TextureDimensionOptions;
        layers: number;
    }
}

export class RenderTarget {

    public readonly platform: Platform;
    public readonly offline: boolean;
    public readonly attachments: RenderTargetAttachmentDescriptor[];
    public readonly depth: RenderTargetDepthDescriptor;
    public readonly size: Size;

    private _attachmentTextures?: ITexture[];
    private _depthTexture?: ITexture;
    private _commandEncoder?: GPUCommandEncoder;
    private _renderPass?: IRenderPass;
    private _transparent: boolean = true;
    private _depth: boolean = true;
    private _camera?: IBuffer;

    constructor(platform: Platform, size: Size, offline: boolean,
        attachments: RenderTargetAttachmentDescriptor[], depth: RenderTargetDepthDescriptor) {

        // init
        this.platform = platform;
        this.offline = offline;
        this.size = size;
        this.attachments = attachments;
        this.depth = depth;

        // initialize
        this._initialize();
    }

    public get buffers(): RenderTargetBuffer[] {
        return [{
            attachments: this._attachmentTextures,
            depth: this._depthTexture
        }];
    }

    public capture(view: Matrix4, projection: Matrix4, skip: number, take: number, action: () => void) {

        // create render pass descriptor
        const rpd: GPURenderPassDescriptor = {
            colorAttachments: this.attachments ? this.attachments.map((attachment, index) => {
                return {
                    clearValue: { r: attachment.color.r, g: attachment.color.g, b: attachment.color.b, a: attachment.color.a },
                    loadOp: "clear",
                    storeOp: "store",
                    resolveTarget: undefined,
                    view: this.offline ?
                        (this._attachmentTextures[index].handle as GPUTexture).createView({
                            baseArrayLayer: skip,
                            arrayLayerCount: take,
                        }) :
                        this.platform.graphics.context.getCurrentTexture().createView()
                }
            }) : undefined,
            depthStencilAttachment: {
                view: this.depth ?
                    (this._depthTexture.handle as GPUTexture).createView({
                        baseArrayLayer: skip,
                        arrayLayerCount: take,
                    }) :
                    undefined,
                depthClearValue: this.depth ? this.depth.value : undefined,
                depthLoadOp: "clear",
                depthStoreOp: "store",
                stencilClearValue: this.depth && this.depth.stencil ? 0 : undefined,
                stencilLoadOp: this.depth && this.depth.stencil ? 'clear' : undefined,
                stencilStoreOp: this.depth && this.depth.stencil ? 'store' : undefined,
            }
        };

        // init camera buffer if needed
        if (view && projection) {
            this._camera = this.platform.graphics.createF32Buffer(
                BufferKindOptions.Uniform, [].concat(
                    Vector4.toNumbers([Vector4.xyz(view.inverse.position, 0)]),
                    view.values, projection.values));
        }

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

        // destroy camera
        this._camera?.destroy();

        // clear for next run
        this._camera = undefined;
    }

    public destroy() {

        // destroy attachment textures
        this._attachmentTextures?.forEach(texture => texture.destroy());

        // destroy depth texture
        this._depthTexture?.destroy();
    }

    private _initialize(): void {

        // destroy attachment textures
        this._attachmentTextures?.forEach(texture => texture.destroy());

        // destroy depth texture
        this._depthTexture?.destroy();

        // create attachment textures
        this._attachmentTextures = this.attachments?.map(
            attachment => this.platform.graphics.createTexture(
                TextureKindOptions.Albedo, attachment.texture.dimension, this.size,
                attachment.texture.layers, attachment.texture.samples));

        // create depth texture using first attachment as reference
        this._depthTexture = this.platform.graphics.createTexture(
            this.depth && this.depth.stencil ? TextureKindOptions.Stencil : TextureKindOptions.Depth,
            TextureDimensionOptions.Two, this.size, this.attachments[0].texture.layers, 1);
    }

    private _bindCamera(camera: IBuffer, shader: IShader) {
        // bind camera 
        shader.bindData(this._renderPass, "camera", [{
            name: "camera",
            kind: ShaderGroupBindingKindOptions.Uniform,
            value: camera || this._camera,
        }]);
    }

    private _bindLight(shader: IShader, light: LightRenderData) {
        // bind light if there
        if (light !== undefined && light !== null) {
            shader.bindData(this._renderPass, "lighting", [{
                name: "info",
                kind: ShaderGroupBindingKindOptions.Uniform,
                value: light.model,
            },
            {
                name: "shadow-sampler",
                kind: ShaderGroupBindingKindOptions.DepthSampler,
                value: this.platform.graphics.createSampler(SamplerKindOptions.Depth),
            },
            {
                name: "shadow-directional-atlas",
                kind: ShaderGroupBindingKindOptions.DepthTextureArray,
                value: light.textures[0],
            },
            {
                name: "shadow-point-atlas",
                kind: ShaderGroupBindingKindOptions.DepthTextureCubeArray,
                value: light.textures[1],
            }]);
        }
    }

    public bindData(shader: IShader, group: string, data: ShaderData[]) {
        // bind buffer
        shader.bindData(this._renderPass, group, data);
    }

    public bindUniform(shader: IShader, group: string, name: string, uniform: IBuffer, offset?: number, size?: number) {
        // bind buffer
        shader.bindData(
            this._renderPass, group, [{
                name: name,
                kind: ShaderGroupBindingKindOptions.Uniform,
                value: uniform,
                offset: offset,
                size: size,
            }]);
    }

    public bindTextures(shader: IShader, sampler: ISampler, textures: ITexture[]) {
        // // bind buffer
        // shader.bindData(
        //     this._renderPass, group, [{
        //         name: name,
        //         kind: ShaderGroupBindingKindOptions.Uniform,
        //         value: uniform,
        //     }]);
    }

    public bindBuffers(shader: IShader, buffers: Map<string, IBuffer>) {
        // bind buffers
        buffers.forEach((buffer, name) =>
            shader.bindBuffer(this._renderPass, name, buffer));
    }

    private _bindModel(shader: IShader, model: IBuffer) {
        // bind model
        shader.bindData(
            this._renderPass, "model", [{
                name: "model",
                kind: ShaderGroupBindingKindOptions.Uniform,
                value: model,
            }]);
    }

    private _bindGroups(shader: IShader, groups: Map<string, Map<string, ShaderData>>) {
        // bind groups if there
        groups?.forEach((group, name) =>
            shader.bindData(this._renderPass, name, Array.from(group.values())));
    }

    public bindCamera(shader: IShader) {
        // delegate to native one
        this._bindCamera(this._camera, shader);
    }

    public bindPipeline(shader: IShader, transparent?: boolean, depth?: boolean) {

        // override if needed
        this._transparent = transparent !== undefined ? transparent : this._transparent;
        this._depth = depth !== undefined ? depth : this._depth;

        // bind pipeline
        shader.bindPipeline(this._renderPass,
            this._transparent, this._depth, this._depth && this.depth.stencil);
    }

    private _bindPipeline(shader: IShader, transparent: boolean, depth: boolean) {
        // bind pipeline
        shader.bindPipeline(this._renderPass, transparent, depth, this.depth && this.depth.stencil);
    }

    private _drawDirect(vertexCount: number, instanceCount?: number, firstVertex?: number, firstInstance?: number): void {
        // draw non-indexed
        this._renderPass.draw(vertexCount, instanceCount, firstVertex, firstInstance);
    }

    private _drawIndexed(indexCount: number, firstIndex?: number, baseVertex?: number, firstInstance?: number): void {
        // draw non-indexed
        this._renderPass.drawIndexed(indexCount, firstIndex, baseVertex, firstInstance);
    }

    public _bindIndices(indices: IBuffer): void {
        // draw non-indexed
        this._renderPass.bindIndices(indices);
    }

    public draw(buffers: Map<string, IBuffer>) {

        // check if buffers is there
        if (buffers) {

            // see if indices are there
            if (buffers.has("indices")) {

                // set indices
                this._bindIndices(buffers.get("indices"));

                // draw indexed
                this._drawIndexed(buffers.get("indices").count);
            }
            else if (buffers.has("positions")) {

                // draw non-indexed
                this._drawDirect(buffers.get("positions").count);
            }
        }
    }

    private _drawBuffers(shader: IShader, item: RenderData) {

        // bind buffers
        item.buffers.forEach((buffer, name) =>
            shader.bindBuffer(this._renderPass, name, buffer));

        // see if indices are there
        if (item.buffers.has("indices")) {

            // set indices
            this._renderPass.bindIndices(item.buffers.get("indices"));

            // draw indexed
            this._renderPass.drawIndexed(item.buffers.get("indices").count);
        }
        else if (item.buffers.has("positions")) {

            // draw non-indexed
            this._renderPass.draw(item.buffers.get("positions").count);
        }
    }

    private _group(items: Iterable<RenderData>): Map<string, RenderData[]> {
        // result
        const grouped = new Map<string, RenderData[]>();

        // loop over items and group by shader
        for (const item of items) {
            // see if group exists
            if (!grouped.has(item.shader.id))
                // create group
                grouped.set(item.shader.id, [item]);
            else
                // add to group
                grouped.get(item.shader.id)?.push(item);
        }

        // done
        return grouped;
    }

    public pipeline(transparent: boolean, depth: boolean): void {
        // save
        this._depth = depth;
        this._transparent = transparent;
    }

    public offscreen(camera: IBuffer, shader: IShader, set: Map<string, Map<string, ShaderData>>[], item: RenderData) {

        // bind pipeline with proper transparency
        this._bindPipeline(shader, this._transparent, this._depth);

        // bind camera 
        this._bindCamera(camera, shader);

        // bind groups
        set.forEach(groups => this._bindGroups(shader, groups));

        // bind model
        this._bindModel(shader, item.model);

        // draw buffers
        this._drawBuffers(shader, item);
    }

    public single(shader: IShader, set: Map<string, Map<string, ShaderData>>[], item: RenderData) {

        // bind pipeline with proper transparency
        this._bindPipeline(shader, this._transparent, this._depth);

        // bind camera 
        this._bindCamera(this._camera, shader);

        // bind groups
        set.forEach(groups => this._bindGroups(shader, groups));

        // bind model
        this._bindModel(shader, item.model);

        // draw buffers
        this._drawBuffers(shader, item);
    }

    public bulk(shader: IShader, set: Map<string, Map<string, ShaderData>>[], items: Iterable<RenderData>) {

        // bind pipeline with proper transparency
        this._bindPipeline(shader, this._transparent, this._depth);

        // bind camera 
        this._bindCamera(this._camera, shader);

        // bind groups
        set.forEach(groups => this._bindGroups(shader, groups));

        // loop over items
        for (const item of items) {

            // bind model
            this._bindModel(shader, item.model);

            // draw buffers
            this._drawBuffers(shader, item);
        }
    }

    public render(light: LightRenderData, items: Iterable<RenderData>) {
        // group items by shader
        const grouped = this._group(items);

        // loop over grouped items
        for (const [id, items] of grouped) {

            // get shader
            const shader = items[0].shader;

            // bind pipeline with proper transparency
            this._bindPipeline(shader, this._transparent, this._depth);

            // bind camera 
            this._bindCamera(this._camera, shader);

            // bind light
            this._bindLight(shader, light);

            // loop over items
            for (const item of items) {

                // bind groups
                this._bindGroups(shader, item.groups);

                // draw buffers
                this._drawBuffers(shader, item);
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
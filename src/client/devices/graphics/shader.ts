import {
    GraphicsDevice,
    IBuffer,
    IRenderPass,
    ISampler,
    ITexture,
    ShaderDataKindOptions,
    ShaderDefinition,
    Utils
} from "../../index";

export type BindingGroupLayout = {
    binding: number;
    layout: GPUBindGroupLayout;
}

export enum ShaderStageOptions {
    Compute = "compute",
    Fragment = "fragment",
    Vertex = "vertex",
}

export type ShaderUniform = {
    name: string;
    binding: number;
    layout: GPUBindGroupLayout;
}

export type ShaderTexture = {
    name: string;
    binding: number;
    layout: GPUBindGroupLayout;
}

export type ShaderBuffer = {
    name: string;
    location: number;
    layout: GPUVertexBufferLayout;
}

export interface IShader {
    get id(): string;
    bindPipeline(pass: IRenderPass, transparent: boolean, depth: boolean): void;
    bindBuffer(pass: IRenderPass, name: string, buffer: IBuffer): void;
    bindUniform(pass: IRenderPass, name: string, buffer: IBuffer): void;
    bindTexture(pass: IRenderPass, name: string, texture: ITexture, sampler: ISampler): void;
}

export class Shader implements IShader {

    public readonly id: string;
    public readonly device: GraphicsDevice;
    public readonly uniforms: Map<string, ShaderUniform>;
    public readonly textures: Map<string, ShaderTexture>;
    public readonly buffers: Map<string, ShaderBuffer>;
    public readonly handle?: GPUShaderModule;

    constructor(device: GraphicsDevice, handle: GPUShaderModule) {
        // init
        this.id = Utils.uuid();
        this.device = device;
        this.handle = handle;
        this.uniforms = new Map<string, ShaderUniform>();
        this.textures = new Map<string, ShaderTexture>();
        this.buffers = new Map<string, ShaderBuffer>();
    }

    public static create(graphics: GraphicsDevice, definition: ShaderDefinition): Shader {
        // create shader modiule
        const shader = graphics.createShader(definition.code);

        // create uniforms
        definition.uniforms?.forEach(uniform => {
            let visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
            // resolve visibility
            switch (uniform.visibility) {
                case ShaderStageOptions.Vertex:
                    visibility = GPUShaderStage.VERTEX;
                    break;
                case ShaderStageOptions.Fragment:
                    visibility = GPUShaderStage.FRAGMENT;
                    break;
                default: throw new Error(`Unknown shader uniform visibility: ${uniform.visibility}`);
            }
            shader.uniforms.set(uniform.name, {
                name: uniform.name,
                binding: uniform.binding,
                layout: graphics.handle.createBindGroupLayout({
                    entries: [{
                        binding: 0,
                        visibility: visibility,
                        buffer: {
                            type: "uniform"
                        }
                    }]
                })
            });
        });

        // create textures
        definition.textures?.forEach(texture => {
            let visibility = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
            // resolve visibility
            switch (texture.visibility) {
                case ShaderStageOptions.Vertex:
                    visibility = GPUShaderStage.VERTEX;
                    break;
                case ShaderStageOptions.Fragment:
                    visibility = GPUShaderStage.FRAGMENT;
                    break;
                default: throw new Error(`Unknown shader texture visibility: ${texture.visibility}`);
            }
            shader.textures.set(texture.name, {
                name: texture.name,
                binding: texture.binding,
                layout: graphics.handle.createBindGroupLayout({
                    entries: [{
                        binding: 0,
                        visibility: visibility,
                        texture: {
                            multisampled: false,
                            sampleType: "float",
                            viewDimension: "2d"
                        }
                    }, {
                        binding: 1,
                        visibility: visibility,
                        sampler: {
                            type: "filtering"
                        }
                    }]
                })
            });
        });

        // create buffers
        definition.buffers?.forEach(buffer => {
            // loop over layouts
            let stride = 0;
            let format: GPUVertexFormat = "float32";
            switch (buffer.kind) {
                case ShaderDataKindOptions.Color:
                    stride = (4 * 4);
                    format = "float32x4";
                    break;
                case ShaderDataKindOptions.Float:
                    stride = (1 * 4);
                    format = "float32";
                    break;
                case ShaderDataKindOptions.Integer:
                    stride = (1 * 4);
                    format = "sint32";
                    break;
                case ShaderDataKindOptions.Vector2:
                    stride = (4 * 2);
                    format = "float32x2";
                    break;
                case ShaderDataKindOptions.Vector3:
                    stride = (4 * 3);
                    format = "float32x3";
                    break;
                case ShaderDataKindOptions.Vector4:
                    stride = (4 * 4);
                    format = "float32x4";
                    break;
                default:
                    throw new Error(`Unknown shader buffer kind: ${buffer.kind}`);
            }
            shader.buffers.set(buffer.name, {
                name: buffer.name,
                location: buffer.location,
                layout: {
                    attributes: [{
                        shaderLocation: buffer.location,
                        offset: 0,
                        format: format,
                    }],
                    arrayStride: stride,
                    stepMode: "vertex",
                },
            });
        });

        // all done
        return shader;
    }

    private createPipeline(transparent: boolean, depth: boolean): GPURenderPipeline {
        // create pipeline
        const pd: GPURenderPipelineDescriptor = {
            layout: this.device.handle.createPipelineLayout({
                bindGroupLayouts: [].concat(
                    Array.from(this.uniforms.values()).map(uniform => uniform.layout),
                    Array.from(this.textures.values()).map(texture => texture.layout)),
            }),
            vertex: {
                module: this.handle,
                entryPoint: "vertex_main",
                buffers: Array.from(this.buffers.values()).map(buffer => buffer.layout),
            },
            fragment: {
                module: this.handle,
                entryPoint: "fragment_main",
                targets: [
                    {
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: transparent ? {
                            alpha: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                            color: {
                                srcFactor: "src-alpha",
                                dstFactor: "one-minus-src-alpha",
                                operation: "add",
                            },
                        } : undefined
                    },
                ],
            },
            primitive: {
                topology: "triangle-list",
            },
            depthStencil: {
                format: "depth32float",
                depthCompare: depth ? "less-equal" : "always",
                depthWriteEnabled: true,
            }
        };

        // create pipeline
        return this.device.handle.createRenderPipeline(pd);
    }

    public bindPipeline(pass: IRenderPass, transparent: boolean, depth: boolean): void {
        // delegate
        (pass.handle as GPURenderPassEncoder)?.setPipeline(
            this.createPipeline(transparent, depth));
    }

    public bindBuffer(pass: IRenderPass, name: string, buffer: IBuffer): void {
        // bind
        if (this.buffers.has(name))
            (pass.handle as GPURenderPassEncoder).setVertexBuffer(
                this.buffers.get(name).location, buffer.handle as GPUBuffer);
    }

    public bindUniform(pass: IRenderPass, name: string, buffer: IBuffer): void {
        const ubg = this.device.handle.createBindGroup({
            layout: this.uniforms.get(name).layout,
            entries: [{
                binding: 0,
                resource: {
                    buffer: buffer.handle as GPUBuffer,
                }
            }]
        });
        // bind
        (pass.handle as GPURenderPassEncoder).setBindGroup(this.uniforms.get(name).binding, ubg);
    }

    public bindTexture(pass: IRenderPass, name: string, texture: ITexture, sampler: ISampler): void {
        const ubg = this.device.handle.createBindGroup({
            layout: this.textures.get(name).layout,
            entries: [{
                binding: 0,
                resource: (texture.handle as GPUTexture).createView()
            }, {
                binding: 1,
                resource: sampler.handle as GPUSampler
            }]
        });
        // bind
        (pass.handle as GPURenderPassEncoder).setBindGroup(this.textures.get(name).binding, ubg);
    }
}

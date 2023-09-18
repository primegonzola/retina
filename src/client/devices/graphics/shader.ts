import {
    GraphicsDevice,
    IBuffer,
    IRenderPass,
    ISampler,
    ITexture,
    ShaderDefinition,
    Utils
} from "../../index";

export type BindingGroupLayout = {
    binding: number;
    layout: GPUBindGroupLayout;
}

export enum ShaderStageOptions {
    Both = "both",
    Compute = "compute",
    Fragment = "fragment",
    Vertex = "vertex",
}

export type ShaderUniform = {
    name: string;
    binding: number;
    layout: GPUBindGroupLayout;
}

export enum ShaderDataKindOptions {
    Color = "color",
    Matrix = "matrix",
    Float = "float",
    Integer = "integer",
    Vector2 = "vector2",
    Vector3 = "vector3",
    Vector4 = "vector4",
}

export enum ShaderUniformKindOptions {
    Boolean = "boolean",
    Color = "color",
    Float = "float",
    Integer = "integer",
    Matrix4x4 = "matrix4x4",
    Vector2 = "vector2",
    Vector3 = "vector3",
    Vector4 = "vector4"
}

export enum ShaderGroupBindingKindOptions {
    AlbedoSampler = "albedo-sampler",
    AlbedoTexture = "albedo-texture",
    AlbedoTextureArray = "albedo-texture-array",
    DepthSampler = "depth-sampler",
    DepthTexture = "depth-texture",
    DepthTextureArray = "depth-texture-array",
    DepthTextureCubeArray = "depth-texture-cube-array",
    StencilSampler = "stencil-sampler",
    StencilTexture = "stencil-texture",
    Uniform = "uniform"
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

export type ShaderData = {
    readonly name: string;
    readonly value: unknown;
    readonly kind: ShaderGroupBindingKindOptions;
    readonly offset?: number;
    readonly size?: number;
}

export interface IShader {
    get id(): string;
    bindBuffer(pass: IRenderPass, name: string, buffer: IBuffer): void;
    bindData(pass: IRenderPass, group: string, data: Iterable<ShaderData>): void;
    bindPipeline(pass: IRenderPass, transparent: boolean, depth: boolean, stencil: boolean): void;
}

export class ShaderGroupBinding {
    public readonly name: string;
    public readonly kind: ShaderGroupBindingKindOptions;
    public readonly index: number;

    constructor(name: string, kind: ShaderGroupBindingKindOptions, index: number) {
        this.name = name;
        this.kind = kind;
        this.index = index;
    }
}

export class ShaderGroup {
    public readonly name: string;
    public readonly index: number;
    public readonly visibility: ShaderStageOptions;
    public readonly bindings: Map<string, ShaderGroupBinding>;
    public readonly handle: GPUBindGroupLayout;

    constructor(graphics: GraphicsDevice, name: string, index: number, visibility: ShaderStageOptions, bindings: Iterable<ShaderGroupBinding>) {
        this.name = name;
        this.index = index;
        this.visibility = visibility;
        this.bindings = new Map<string, ShaderGroupBinding>();

        // loop over bindings
        for (const binding of bindings)
            this.bindings.set(binding.name, binding);

        // define entries
        let entries: GPUBindGroupLayoutEntry[] = [];

        // loop over bindings
        for (const binding of this.bindings.values()) {

            let fvis = undefined;
            // resolve visibility
            switch (visibility) {
                case ShaderStageOptions.Both:
                    fvis = GPUShaderStage.VERTEX | GPUShaderStage.FRAGMENT;
                    break;
                case ShaderStageOptions.Fragment:
                    fvis = GPUShaderStage.FRAGMENT;
                    break;
                case ShaderStageOptions.Vertex:
                    fvis = GPUShaderStage.VERTEX;
                    break;
                default: throw new Error(`Unknown shader uniform visibility: ${visibility}`);
            }

            switch (binding.kind) {
                case ShaderGroupBindingKindOptions.DepthSampler:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        sampler: {
                            type: "comparison",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.DepthTexture:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            sampleType: "depth",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.StencilSampler:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        sampler: {
                            type: "comparison",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.StencilTexture:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            sampleType: "depth",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.DepthTextureArray:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            sampleType: "depth",
                            viewDimension: "2d-array",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.DepthTextureCubeArray:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            sampleType: "depth",
                            viewDimension: "cube-array",
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.AlbedoSampler:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        sampler: {
                            type: "filtering"
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.AlbedoTexture:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            multisampled: false,
                            sampleType: "float",
                            viewDimension: "2d"
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.AlbedoTextureArray:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        texture: {
                            multisampled: false,
                            sampleType: "float",
                            viewDimension: "2d-array"
                        }
                    });
                    break;
                case ShaderGroupBindingKindOptions.Uniform:
                    entries.push({
                        binding: binding.index,
                        visibility: fvis,
                        buffer: {
                            type: "uniform"
                        }
                    });
                    break;
                default:
                    throw new Error(`Unknown shader group binding kind: ${binding.kind}`);
            }
            // create final group layout
            this.handle = graphics.handle.createBindGroupLayout({
                entries: entries
            });
        }
    }
}

export class Shader implements IShader {

    public readonly id: string;
    public readonly device: GraphicsDevice;
    public readonly groups: Map<string, ShaderGroup>;
    public readonly buffers: Map<string, ShaderBuffer>;
    public readonly handle?: GPUShaderModule;

    constructor(device: GraphicsDevice, handle: GPUShaderModule) {
        // init
        this.id = Utils.uuid();
        this.device = device;
        this.handle = handle;
        this.groups = new Map<string, ShaderGroup>();
        this.buffers = new Map<string, ShaderBuffer>();
    }

    public static create(graphics: GraphicsDevice, definition: ShaderDefinition): Shader {

        // create shader modiule
        const shader = graphics.createShader(definition.code);

        // loop over groups and copy binding
        Array.from(definition.groups).forEach(group => {
            shader.groups.set(group.name,
                new ShaderGroup(graphics, group.name, group.index, group.visibility,
                    Array.from(group.bindings).map(binding =>
                        new ShaderGroupBinding(binding.name, binding.kind, binding.index))));
        });

        // create buffers
        Array.from(definition.buffers).forEach(buffer => {
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

    private _createPipeline(transparent: boolean, depth: boolean, stencil: boolean): GPURenderPipeline {
        // create pipeline
        const pd: GPURenderPipelineDescriptor = {
            layout: this.device.handle.createPipelineLayout({
                bindGroupLayouts: Array
                    .from(this.groups.values())
                    .sort((a, b) => a.index - b.index)
                    .map(group => group.handle),
            }),
            vertex: {
                module: this.handle,
                entryPoint: "vertex_main",
                buffers: Array
                    .from(this.buffers.values())
                    .map(buffer => buffer.layout),
            },
            fragment: {
                module: this.handle,
                entryPoint: "fragment_main",
                targets: [
                    {
                        format: navigator.gpu.getPreferredCanvasFormat(),
                        blend: transparent ? {
                            alpha: {
                                srcFactor: "zero",
                                dstFactor: "one",
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
                format: stencil ? "depth24plus-stencil8" : "depth32float",
                depthCompare: depth ? "less-equal" : "always",
                depthWriteEnabled: true,
            },
            multisample: {
                count: 1,
            }
        };

        // console.log(pd);

        // create pipeline
        return this.device.handle.createRenderPipeline(pd);
    }

    public bindBuffer(pass: IRenderPass, name: string, buffer: IBuffer): void {
        // bind
        if (this.buffers.has(name))
            (pass.handle as GPURenderPassEncoder).setVertexBuffer(
                this.buffers.get(name).location, buffer.handle as GPUBuffer);
    }

    public bindData(pass: IRenderPass, group: string, data: Iterable<ShaderData>): void {
        // look up group
        const target = this.groups.get(group);

        // check if target is valid
        if (target !== undefined) {

            // create entries
            let entries: GPUBindGroupEntry[] = [];

            // loop over data
            for (const bd of data) {

                // look up binding
                const binding = target.bindings.get(bd.name);

                if (binding !== undefined) {
                    // check kind
                    switch (binding.kind) {
                        case ShaderGroupBindingKindOptions.StencilSampler:
                            entries.push({
                                binding: binding.index,
                                resource: (bd.value as ISampler).handle as GPUSampler
                            });
                            break;
                        case ShaderGroupBindingKindOptions.StencilTexture:
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView()
                            });
                            break;
                        case ShaderGroupBindingKindOptions.DepthSampler:
                            entries.push({
                                binding: binding.index,
                                resource: (bd.value as ISampler).handle as GPUSampler
                            });
                            break;
                        case ShaderGroupBindingKindOptions.DepthTexture:
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView({
                                    dimension: "2d",
                                    baseArrayLayer: 0,
                                    arrayLayerCount: 1,
                                })
                            });
                            break;
                        case ShaderGroupBindingKindOptions.DepthTextureArray:
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView({
                                    dimension: "2d-array",
                                    baseArrayLayer: 0,
                                    arrayLayerCount: ((bd.value as ITexture).handle as GPUTexture).depthOrArrayLayers,
                                })
                            });
                            break;
                        case ShaderGroupBindingKindOptions.DepthTextureCubeArray:
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView({
                                    dimension: "cube-array",
                                    baseArrayLayer: 0,
                                    arrayLayerCount: ((bd.value as ITexture).handle as GPUTexture).depthOrArrayLayers,
                                })
                            });
                            break;
                        case ShaderGroupBindingKindOptions.AlbedoSampler:
                            entries.push({
                                binding: binding.index,
                                resource: (bd.value as ISampler).handle as GPUSampler
                            });
                            break;
                        case ShaderGroupBindingKindOptions.AlbedoTextureArray: {
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView({
                                    dimension: "2d-array",
                                    baseArrayLayer: 0,
                                    arrayLayerCount: ((bd.value as ITexture).handle as GPUTexture).depthOrArrayLayers,
                                })
                            });
                            break;
                        }
                        case ShaderGroupBindingKindOptions.AlbedoTexture: {
                            entries.push({
                                binding: binding.index,
                                resource: ((bd.value as ITexture).handle as GPUTexture).createView({
                                    dimension: "2d",
                                    baseArrayLayer: 0,
                                    arrayLayerCount: 1,
                                })
                            });
                            break;
                        }
                        case ShaderGroupBindingKindOptions.Uniform:
                            entries.push({
                                binding: binding.index,
                                resource: {
                                    buffer: (bd.value as IBuffer).handle as GPUBuffer,
                                    offset: bd.offset,
                                    size: bd.size,
                                }
                            });
                            break;
                        default:
                            throw new Error(`Unknown shader group binding kind: ${binding.kind}`);
                    }
                }
            }
            // create bind group
            const bg = this.device.handle.createBindGroup({
                layout: target.handle,
                entries: entries.sort((a, b) => a.binding - b.binding),
            });
            // bind group to final location
            (pass.handle as GPURenderPassEncoder).setBindGroup(target.index, bg);
        }
    }

    public bindPipeline(pass: IRenderPass, transparent: boolean, depth: boolean, stencil: boolean): void {
        // delegate
        (pass.handle as GPURenderPassEncoder)?.setPipeline(
            this._createPipeline(transparent, depth, stencil));
    }
}

import {
    IBuffer,
    Buffer,
    BufferKindOptions,
    Device,
    DeviceKind,
    IDevice,
    ISampler,
    ITexture,
    Sampler,
    SamplerKindOptions,
    Shader,
    Size,
    Texture,
    TextureKindOptions,
    Color,
    TextureDimensionOptions
} from "../../index";

export interface IGraphicsDevice extends IDevice {
    get aspect(): number;
    get size(): Size;
    createF32Buffer(kind: BufferKindOptions, data: number[]): IBuffer;
    createSampler(kind: SamplerKindOptions): ISampler;
    createTexture(kind: TextureKindOptions, dimension: TextureDimensionOptions,
        size: Size, layers: number, samples: number, data?: Color[]): ITexture;
}

export class GraphicsDevice extends Device<GPUDevice> implements IGraphicsDevice {
    public readonly context: GPUCanvasContext;

    constructor(handle: GPUDevice, context: GPUCanvasContext) {
        super(DeviceKind.Graphics, handle);
        // initialize
        this.context = context;
    }

    public get aspect(): number {
        return this.context.getCurrentTexture().width / this.context.getCurrentTexture().height;
    }

    public get size(): Size {
        return new Size(this.context.getCurrentTexture().width,
            this.context.getCurrentTexture().height);
    }

    private static preferredCanvasFormat(): GPUTextureFormat {
        return navigator.gpu.getPreferredCanvasFormat();
    }

    public createShader(code: string): Shader {
        const shader = new Shader(this, this.handle.createShaderModule({
            code: code
        }));
        return shader;
    }

    public static async create(id: string): Promise<GraphicsDevice> {
        // get canvas
        const canvas = document.querySelector("#" + id) as HTMLCanvasElement;

        // get context
        const context = canvas.getContext("webgpu") as GPUCanvasContext;

        // get adapter
        const adapter = await navigator.gpu.requestAdapter();

        // get device
        const device = await adapter.requestDevice();

        // configure context
        context.configure({
            device: device,
            format: GraphicsDevice.preferredCanvasFormat(),
            alphaMode: "premultiplied",
        });

        // create device
        return new GraphicsDevice(device, context);
    }

    public update(): void {

    }

    public destroy(): void {
        // destroy device
        this.handle.destroy();
    }

    public createF32Buffer(kind: BufferKindOptions, data: number[]): IBuffer {
        let usage = 0;
        switch (kind) {
            case BufferKindOptions.Index:
                usage = GPUBufferUsage.INDEX | GPUBufferUsage.COPY_DST;
                break;
            case BufferKindOptions.Vertex:
                usage = GPUBufferUsage.VERTEX | GPUBufferUsage.COPY_DST;
                break;
            case BufferKindOptions.Uniform:
                usage = GPUBufferUsage.UNIFORM | GPUBufferUsage.COPY_DST;
                break;
            default:
                throw new Error("Invalid buffer kind");
        }

        const wrap = 16;
        const stride = 4
        const length = data.length * stride;
        const size = length + ((length % wrap) === 0 ? 0 : wrap - (length % wrap));

        // create proper buffer
        const buffer = new Buffer(this, kind, data.length, size,
            this.handle.createBuffer({
                size: size,
                usage: usage
            }));

        // write data
        buffer.write(data);

        // all done
        return buffer;
    }

    public createSampler(kind: SamplerKindOptions): ISampler {
        // check kind
        switch (kind) {
            case SamplerKindOptions.Albedo:
                return new Sampler(kind, this.handle.createSampler({
                    addressModeU: "repeat",
                    addressModeV: "repeat",
                    addressModeW: "repeat",
                    magFilter: "linear",
                    minFilter: "nearest",
                    mipmapFilter: "nearest"
                }));
            case SamplerKindOptions.Depth:
                return new Sampler(kind, this.handle.createSampler({
                    compare: "less",
                    minFilter: "nearest",
                    magFilter: "nearest",
                    addressModeU: "clamp-to-edge",
                    addressModeV: "clamp-to-edge",
                    addressModeW: "clamp-to-edge",
                }));
            case SamplerKindOptions.Stencil:
                return new Sampler(kind, this.handle.createSampler({
                    compare: "less",
                }));
            default:
                throw new Error("Invalid sampler kind.");
        }
    }

    private static textureDimension(dimension: TextureDimensionOptions): GPUTextureDimension {
        switch (dimension) {
            case TextureDimensionOptions.One:
                return "1d";
            case TextureDimensionOptions.Two:
                return "2d";
            case TextureDimensionOptions.Three:
                return "3d";
            default:
                throw new Error("Invalid texture dimension.");
        }
    }

    public createTexture(kind: TextureKindOptions, dimension: TextureDimensionOptions,
        size: Size, layers: number, samples: number, data?: Color[]): ITexture {
        switch (kind) {
            case TextureKindOptions.Albedo: {
                let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST | GPUTextureUsage.COPY_SRC;
                usage = !data ? usage | GPUTextureUsage.RENDER_ATTACHMENT : usage;
                const texture = new Texture(this, kind, size,
                    this.handle.createTexture({
                        format: "bgra8unorm",
                        usage: usage,
                        dimension: GraphicsDevice.textureDimension(dimension),
                        mipLevelCount: 1,
                        sampleCount: samples,
                        size: {
                            width: size.width,
                            height: size.height,
                            depthOrArrayLayers: layers
                        },
                    }));
                // see if to write data
                if (data) {
                    const bytes: number[] = [];
                    data.forEach(color => {
                        bytes.push(color.b * 255);
                        bytes.push(color.g * 255);
                        bytes.push(color.r * 255);
                        bytes.push(color.a * 255);
                    });
                    this.handle.queue.writeTexture(
                        {
                            texture: texture.handle,
                        },
                        new Uint8Array(bytes),
                        {
                            bytesPerRow: size.width * 4,
                        },
                        {
                            width: size.width,
                            height: size.height,
                        }
                    );
                }
                return texture;
            }
            case TextureKindOptions.Depth:
                return new Texture(this, kind, size,
                    this.handle.createTexture({
                        format: "depth32float",
                        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_SRC,
                        size: {
                            width: size.width,
                            height: size.height,
                            depthOrArrayLayers: layers
                        },
                    }));
            case TextureKindOptions.Stencil:
                return new Texture(this, kind, size,
                    this.handle.createTexture({
                        format: "depth24plus-stencil8",
                        usage: GPUTextureUsage.RENDER_ATTACHMENT,
                        size: {
                            width: size.width,
                            height: size.height,
                            depthOrArrayLayers: layers
                        },
                    }));
            default:
                throw new Error("Invalid texture kind.");
        }
    }
}
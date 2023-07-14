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
    Color
} from "../../index";

export interface IGraphicsDevice extends IDevice {
    get aspect(): number;
    get size(): Size;
    createF32Buffer(kind: BufferKindOptions, data: number[]): IBuffer;
    createSampler(kind: SamplerKindOptions): ISampler;
    createTexture(kind: TextureKindOptions, size: Size, data?: Color[]): ITexture;
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

        const stride = 4
        const length = data.length * stride;
        const size = length + ((length % 32) === 0 ? 0 : 32 - (length % 32));
        const buffer = new Buffer(this, kind, data.length, stride,
            this.handle.createBuffer({
                size: size,
                usage: usage
            }));
        buffer.write(data);
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
                    addressModeU: "clamp-to-edge",
                    addressModeV: "clamp-to-edge",
                    addressModeW: "clamp-to-edge",
                    magFilter: "linear",
                    minFilter: "linear",
                    mipmapFilter: "nearest",
                    compare: "less-equal",
                    lodMinClamp: 0,
                    lodMaxClamp: 100
                }));
            default:
                throw new Error("Invalid sampler kind.");
        }
    }

    public createTexture(kind: TextureKindOptions, size: Size, data?: Color[]): ITexture {
        switch (kind) {
            case TextureKindOptions.Flat: {
                let usage = GPUTextureUsage.TEXTURE_BINDING | GPUTextureUsage.COPY_DST;
                usage = !data ? usage | GPUTextureUsage.RENDER_ATTACHMENT : usage;
                const texture = new Texture(this, kind, size,
                    this.handle.createTexture({
                        format: "bgra8unorm",
                        usage: usage,
                        dimension: "2d",
                        mipLevelCount: 1,
                        sampleCount: 1,
                        size: {
                            width: size.width,
                            height: size.height,
                            depthOrArrayLayers: 1
                        },
                    }));
                // see if to write data
                if (data) {
                    const bytes: number[] = [];
                    data.forEach((color, index) => {
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
                        usage: GPUTextureUsage.RENDER_ATTACHMENT | GPUTextureUsage.TEXTURE_BINDING,
                        dimension: "2d",
                        mipLevelCount: 1,
                        sampleCount: 1,
                        size: {
                            width: size.width,
                            height: size.height,
                            depthOrArrayLayers: 1
                        },
                    }));
            default:
                throw new Error("Invalid texture kind.");
        }
    }
}
import {
    BufferKindOptions,
    Color,
    HashMap,
    IBuffer,
    IShader,
    ITexture,
    Matrix4,
    Platform,
    SamplerKindOptions,
    ShaderData,
    ShaderGroupBindingKindOptions,
    Utils,
    Vector2,
    Vector3,
    Vector4
} from "../index";

export enum MaterialPropertyKindOptions {
    Boolean = "boolean",
    Color = "color",
    Float = "float",
    Integer = "integer",
    Matrix4 = "matrix4",
    Vector2 = "vector2",
    Vector3 = "vector3",
    Vector4 = "vector4",
}

export type MaterialProperty = {
    readonly name: string;
    readonly kind: MaterialPropertyKindOptions;
    readonly index: number;
    value: unknown;
}

export class MaterialTexture {
    readonly name: string;
    public key: ITexture;
    public offset?: Vector2;
    public scale?: Vector2;
}

export enum MaterialModeOptions {
    Opaque = "opaque",
    Transparent = "transparent",
}

export class Material {
    public readonly id: string;
    public readonly platform: Platform;
    public readonly name: string;
    public readonly shader: IShader;
    public readonly mode: MaterialModeOptions;
    public readonly properties: HashMap<string, MaterialProperty>;
    public readonly textures: HashMap<string, MaterialTexture>;
    public readonly groups: Map<string, Map<string, ShaderData>>;

    constructor(platform: Platform, name: string, shader: IShader, mode: MaterialModeOptions,
        properties?: Iterable<MaterialProperty>, textures?: Iterable<MaterialTexture>) {
        this.id = Utils.uuid();
        this.platform = platform;
        this.name = name;
        this.shader = shader;
        this.mode = mode;
        this.groups = new Map<string, Map<string, ShaderData>>();
        this.properties = new HashMap<string, MaterialProperty>();
        this.textures = new HashMap<string, MaterialTexture>();

        // copy incoming properties if any
        if (properties !== undefined)
            for (const property of properties)
                this.properties.set(property.name, property);

        // copy incoming textures if any
        if (textures != undefined)
            for (const texture of textures)
                this.textures.set(texture.name, texture);

        // setup
        this.properties.notify((kind: string, key: string, value: MaterialProperty) =>
            this.synchronize());

        // setup
        this.textures.notify((kind: string, key: string, value: MaterialTexture) =>
            this.synchronize());

        // sync
        this.synchronize();
    }

    private synchronize(): void {
        // check if we have properties
        if (this.groups.has("material")) {
            // loop and delete entries
            this.groups.get("material").forEach((value, key) => {
                if (value.kind === ShaderGroupBindingKindOptions.Uniform)
                    (value.value as IBuffer).destroy();
            });
            this.groups.delete("material");
        }

        // create new 
        this.groups.set("material", new Map<string, ShaderData>());

        // sort properties ascending
        const sorted = Array.from(this.properties.values()).sort((a, b) => a.index - b.index);

        // empty sourc
        let source: number[] = [];

        // loop and create buffer
        sorted.forEach(prop => {

            // check kind
            switch (prop.kind) {
                case MaterialPropertyKindOptions.Boolean:
                    source = source.concat(prop.value ? 1 : 0);
                    break;
                case MaterialPropertyKindOptions.Color:
                    source = source.concat((prop.value as Color).r, (prop.value as Color).g, (prop.value as Color).b, (prop.value as Color).a);
                    break;
                case MaterialPropertyKindOptions.Integer:
                    source = source.concat(prop.value as number);
                    break;
                case MaterialPropertyKindOptions.Float:
                    source = source.concat(prop.value as number);
                    break;
                case MaterialPropertyKindOptions.Matrix4:
                    source = source.concat((prop.value as Matrix4).values);
                    break;
                case MaterialPropertyKindOptions.Vector2:
                    source = source.concat((prop.value as Vector2).x, (prop.value as Vector2).y);
                    break;
                case MaterialPropertyKindOptions.Vector3:
                    source = source.concat((prop.value as Vector3).x, (prop.value as Vector3).y, (prop.value as Vector3).z);
                    break;
                case MaterialPropertyKindOptions.Vector4:
                    source = source.concat((prop.value as Vector4).x, (prop.value as Vector4).y, (prop.value as Vector4).z, (prop.value as Vector4).w);
                    break;
                default:
                    throw new Error(`Unsupported material property kind ${prop.kind}`);
            }
        });

        // set properties buffer
        this.groups.get("material").set("properties", {
            name: "properties",
            kind: ShaderGroupBindingKindOptions.Uniform,
            value: this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, source)
        });

        // loop over textures
        this.textures.forEach((value, key) => {
            // get offset and scale
            const offset = value.offset !== undefined ? value.offset : Vector2.zero;
            const scale = value.scale !== undefined ? value.scale : Vector2.one;

            this.groups.get("material").set(`${key}-map`, {
                name: `${key}-map`,
                kind: ShaderGroupBindingKindOptions.Uniform,
                value: this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                    [offset.x, offset.y, scale.x, scale.y])
            });
            this.groups.get("material").set(`${key}-texture`, {
                name: `${key}-texture`,
                kind: ShaderGroupBindingKindOptions.AlbedoTexture,
                value: value.key
            });
            this.groups.get("material").set(`${key}-sampler`, {
                name: `${key}-sampler`,
                kind: ShaderGroupBindingKindOptions.AlbedoSampler,
                value: this.platform.graphics.createSampler(SamplerKindOptions.Albedo)
            });
        });
    }

    public clone(): Material {
        return new Material(
            this.platform,
            this.name,
            this.shader,
            this.mode,
            Array.from(this.properties.values()).map(property => {
                return {
                    name: property.name,
                    kind: property.kind,
                    index: property.index,
                    value: property.value
                };
            }),
            Array.from(this.textures.values()).map(texture => {
                return {
                    name: texture.name,
                    key: texture.key,
                    offset: texture.offset,
                    scale: texture.scale
                };
            }));
    }
}

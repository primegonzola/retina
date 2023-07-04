import {
    BufferKindOptions,
    Color,
    HashMap,
    IBuffer,
    IShader,
    ITexture,
    Matrix4,
    Platform,
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
    readonly binding: number;
    value: unknown;
}

export class MaterialTexture {
    readonly name: string;
    readonly key: ITexture;
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
    public readonly textures: Map<string, MaterialTexture>;
    public readonly uniforms: Map<string, IBuffer>;

    constructor(platform: Platform, name: string, shader: IShader, mode: MaterialModeOptions,
        properties?: Iterable<MaterialProperty>, textures?: Iterable<MaterialTexture>) {
        this.id = Utils.uuid();
        this.platform = platform;
        this.name = name;
        this.shader = shader;
        this.mode = mode;
        this.uniforms = new Map<string, IBuffer>();
        this.properties = new HashMap<string, MaterialProperty>();
        this.textures = new Map<string, MaterialTexture>();

        // copy incoming properties if any
        if (properties !== undefined)
            for (const property of properties)
                this.properties.set(property.name, property);

        // copy incoming textures if any
        if (textures != undefined)
            for (const texture of textures)
                this.textures.set(texture.name, texture);

        // set properties
        this.uniforms.set("properties",
            this.extractProperties(Array.from(this.properties.values())));

        // setup
        this.properties.notify((kind: string, key: string, value: MaterialProperty) => {
            // check kind
            switch (kind) {
                case "set":
                case "clear": {
                    // check if properties is already present or not
                    if (this.uniforms.has("properties"))
                        this.uniforms.get("properties").destroy();
                    // recreate properties buffer
                    this.uniforms.set("properties",
                        this.extractProperties(Array.from(this.properties.values())));
                    break;
                }
                default:
                    throw new Error(`Unsupported material property kind ${kind}`);
            }
        });
    }

    private extractProperties(properties: MaterialProperty[]): IBuffer {

        // sort ascending
        const sorted = properties.sort((a, b) => a.binding - b.binding);

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

        // create buffer
        return this.platform.graphics.createF32Buffer(
            BufferKindOptions.Uniform, source);
    }
}
import {
    Color,
    Font,
    IShader,
    ITexture,
    Material,
    MaterialDefinition,
    MaterialProperty,
    MaterialPropertyKindOptions,
    MaterialTexture,
    Mesh,
    Platform,
    Shader,
    ShaderDefinition,
    Size,
    Texture,
    TextureKindOptions,
    Utils,
    Vector2,
    Vector3,
    Vector4
} from "./index";

export class Resources {

    public readonly platform: Platform;
    private readonly _shaders: Map<string, Map<string, Shader>>;
    private readonly _meshes: Map<string, Map<string, Mesh>>;
    private readonly _materials: Map<string, Map<string, Material>>;
    private readonly _textures: Map<string, Map<string, ITexture>>;
    private readonly _fonts: Map<string, Map<string, Font>>;

    constructor(platform: Platform) {
        // init
        this.platform = platform;
        this._shaders = new Map<string, Map<string, Shader>>();
        this._materials = new Map<string, Map<string, Material>>();
        this._meshes = new Map<string, Map<string, Mesh>>();
        this._textures = new Map<string, Map<string, ITexture>>();
        this._fonts = new Map<string, Map<string, Font>>();
    }

    public getShader(domain: string, name: string): Shader {
        if (this._shaders.has(domain))
            return this._shaders.get(domain).get(name);
        return undefined;
    }

    public async registerShader(domain: string, name: string, shader: Shader): Promise<void> {
        if (!this._shaders.has(domain))
            this._shaders.set(domain, new Map<string, Shader>());
        this._shaders.get(domain).set(name, shader);
    }

    public async registerShaderByUri(domain: string, name: string, uri: string): Promise<IShader> {
        // download code
        const data = await Utils.downloadText(uri);

        // parse definition
        const definition = JSON.parse(data) as ShaderDefinition;

        // download the code
        definition.code = await Utils.downloadText(definition.code);

        // create the shader
        const shader = Shader.create(this.platform.graphics, definition)

        // add shader to resources
        await this.registerShader(domain, name, shader);

        // all done
        return shader;
    }

    public getMaterial(domain: string, name: string): Material {
        if (this._materials.has(domain))
            return this._materials.get(domain).get(name);
        return undefined;
    }

    public async registerMaterial(domain: string, name: string, material: Material): Promise<void> {
        if (!this._materials.has(domain))
            this._materials.set(domain, new Map<string, Material>());
        this._materials.get(domain).set(name, material);
    }

    public async registerMaterialByUri(domain: string, name: string, uri: string): Promise<Material> {
        // download uri
        const data = await Utils.downloadText(uri);

        // parse definition
        const definition = JSON.parse(data) as MaterialDefinition;
        const base = this.platform.resources.getMaterial(domain, definition.base);

        // properties to use for material
        const properties = new Map<string, MaterialProperty>();
        // copy all base as starting point
        if (base)
            Array.from(base.properties.values()).forEach(
                property => properties.set(property.name, property));

        // loop over all properties
        if (definition.properties)
            Array.from(definition.properties).forEach((property) => {
                // get base property
                let value: unknown = undefined;
                const bprop = properties.get(property.name);
                const kind = bprop ? bprop.kind : property.kind;
                switch (kind) {
                    case MaterialPropertyKindOptions.Boolean:
                    case MaterialPropertyKindOptions.Float:
                    case MaterialPropertyKindOptions.Integer:
                        value = property.value;
                        break;
                    case MaterialPropertyKindOptions.Color:
                        value = Color.parse(property.value as string);
                        break;
                    case MaterialPropertyKindOptions.Vector2:
                        value = Vector2.fromNumbers((property.value as Array<number>))[0];
                        break;
                    case MaterialPropertyKindOptions.Vector3:
                        value = Vector3.fromNumbers((property.value as Array<number>))[0];
                        break;
                    case MaterialPropertyKindOptions.Vector4:
                        value = Vector4.fromNumbers((property.value as Array<number>))[0];
                        break;
                    default:
                        throw new Error(`Unknown material property kind '${property.kind}'.`);
                };

                // set
                properties.set(property.name, {
                    name: property.name,
                    kind: bprop ? bprop.kind : property.kind,
                    binding: bprop ? bprop.binding : property.binding,
                    value: value
                });
            });

        // textures to use for material
        const textures = new Map<string, MaterialTexture>();
        // copy all base as starting point
        if (base)
            base.textures.forEach((texture, name) => textures.set(name, texture));

        // loop over all textures
        if (definition.textures)
            Array.from(definition.textures).forEach((texture) => {
                textures.set(texture.name, {
                    name: texture.name,
                    key: this.platform.resources.getTexture(domain, texture.key)
                });
            });

        // create the material
        const material = new Material(this.platform,
            definition.name,
            (base && !definition.shader) ? base.shader : this.platform.resources.getShader(domain, definition.shader),
            (base && !definition.mode) ? base.mode : definition.mode,
            Array.from(properties.values()),
            Array.from(textures.values()));

        // all done
        await this.registerMaterial(domain, name, material);

        // all done
        return material;
    }

    public getFont(domain: string, name: string): Font {
        if (this._fonts.has(domain))
            return this._fonts.get(domain).get(name);
        return undefined;
    }

    public async registerFont(domain: string, name: string, font: Font): Promise<void> {
        if (!this._fonts.has(domain))
            this._fonts.set(domain, new Map<string, Font>());
        this._fonts.get(domain).set(name, font);
    }

    public async registerFontByUri(domain: string, name: string, uri: string): Promise<Font> {
        // download uri
        const data = await Utils.downloadText(uri);

        // create font
        const font = Font.create(this.platform, name, data);

        // register font
        await this.registerFont(domain, name, font);

        // all done
        return font;
    }

    public getMesh(domain: string, name: string): Mesh {
        if (this._meshes.has(domain))
            return this._meshes.get(domain).get(name);
        return undefined;
    }

    public async registerMesh(domain: string, name: string, mesh: Mesh): Promise<void> {
        if (!this._meshes.has(domain))
            this._meshes.set(domain, new Map<string, Mesh>());
        this._meshes.get(domain).set(name, mesh);
    }

    public getTexture(domain: string, name: string): ITexture {
        if (this._textures.has(domain))
            return this._textures.get(domain).get(name);
        return undefined;
    }

    public async registerTexture(domain: string, name: string, texture: ITexture): Promise<void> {
        if (!this._textures.has(domain))
            this._textures.set(domain, new Map<string, ITexture>());
        this._textures.get(domain).set(name, texture);
    }

    public async registerTextureByUri(domain: string, name: string, uri: string): Promise<GPUTexture> {
        // download code
        const source = await Utils.downloadImage(uri);

        // create texture
        const texture = this.platform.graphics.handle.createTexture({
            label: name,
            format: 'rgba8unorm',
            size: [source.width, source.height, 1],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        // copy source into texture
        this.platform.graphics.handle.queue.copyExternalImageToTexture(
            { source, flipY: true },
            { texture },
            { width: source.width, height: source.height },
        );

        // register shader
        await this.registerTexture(domain, name,
            new Texture(
                this.platform.graphics,
                TextureKindOptions.Flat,
                new Size(source.width, source.height),
                texture));

        // all done
        return texture;
    }
}
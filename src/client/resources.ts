import {
    Color,
    Font,
    Geometry,
    IShader,
    ITexture,
    LevelDefinition,
    Material,
    MaterialDefinition,
    MaterialProperty,
    MaterialPropertyKindOptions,
    MaterialTexture,
    Mesh,
    Platform,
    Settings,
    Shader,
    ShaderDefinition,
    Size,
    Texture,
    TextureDimensionOptions,
    TextureKindOptions,
    Utils,
    Vector2,
    Vector3,
    Vector4
} from "./index";

import YAML = require('js-yaml');

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

    public async loadResources(domain: string, uri: string): Promise<void> {
        // download
        const data = await Utils.downloadText(uri);

        // parse definition
        const definition = uri.endsWith(".json") ?
            JSON.parse(data) as LevelDefinition : YAML.load(data) as LevelDefinition;

        // loop over resources and register
        for (const color of definition.resources.colors)
            await this.registerTextureByColor(domain, color.name, Color.parse(color.value));

        for (const shader of definition.resources.shaders)
            await this.registerShaderByUri(domain, shader.name, shader.uri as string);

        for (const texture of definition.resources.textures) {
            if (typeof texture.uri === "string")
                await this.registerTextureByUri(domain, texture.name, [texture.uri]);
            else {
                await this.registerTextureByUri(domain, texture.name, texture.uri);
            }
        }

        for (const material of definition.resources.materials) {
            if (material.uri)
                await this.registerMaterialByUri(domain, material.name, material.uri as string);
            else {
                await this.registerMaterial(domain, material.name, this.parseMaterial(domain, material));
            }
        }

        for (const font of definition.resources.fonts)
            await this.registerFontByUri(domain, font.name, font.uri as string);

        // defaults
        // register panel mesh
        await this.registerMesh("platform",
            "panel", new Mesh(this.platform, Geometry.quad()));

        // register blit mesh
        await this.registerMesh("platform",
            "blit", new Mesh(this.platform, Geometry.quad()));

        // register quad mesh
        await this.registerMesh("platform",
            "quad", new Mesh(this.platform, Geometry.quad()));

        // register cube mesh
        await this.registerMesh("platform",
            "cube", new Mesh(this.platform, Geometry.cube()));

        // register cube mesh
        await this.registerMesh("platform",
            "wedge", new Mesh(this.platform, Geometry.wedge()));

        // register cube mesh
        await this.registerMesh("platform",
            "shadow", new Mesh(this.platform, Geometry.cube()));

        // register player mesh
        await this.registerMesh("platform",
            "player", new Mesh(this.platform, Geometry.cube()));

        // register grid mesh
        await this.registerMesh("platform",
            "grid", new Mesh(this.platform, Geometry.grid(1, 1)));
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
        const definition = uri.endsWith(".json") ?
            JSON.parse(data) as ShaderDefinition : YAML.load(data) as ShaderDefinition;

        // download the code
        definition.code = await Utils.downloadText(definition.code);

        // update code
        definition.code = definition.code.replace(/RETINA_MAX_DIRECTIONAL_LIGHT_COUNT/g
            , Settings.MaxDirectionalLightCount.toString());
        definition.code = definition.code.replace(/RETINA_MAX_SPOT_LIGHT_COUNT/g
            , Settings.MaxSpotLightCount.toString());
        definition.code = definition.code.replace(/RETINA_MAX_POINT_LIGHT_COUNT/g
            , Settings.MaxPointLightCount.toString());
        definition.code = definition.code.replace(/RETINA_MAX_AREA_LIGHT_COUNT/g
            , Settings.MaxAreaLightCount.toString());

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

    private parseMaterial(domain: string, definition: MaterialDefinition): Material {

        const base = this.platform.resources.getMaterial(domain, definition.base);

        // properties to use for material
        const properties = new Map<string, MaterialProperty>();

        // copy all base as starting point
        if (base)
            Array.from(base.properties.values()).forEach(
                property => properties.set(property.name, property));

        // loop over all properties
        if (definition.properties)
            Array.from(definition.properties).forEach((property, i) => {
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
                    index: bprop ? bprop.index : i,
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
        return new Material(this.platform,
            definition.name,
            (base && !definition.shader) ? base.shader : this.platform.resources.getShader(domain, definition.shader),
            (base && !definition.mode) ? base.mode : definition.mode,
            Array.from(properties.values()),
            Array.from(textures.values()));
    }

    public async registerMaterialByUri(domain: string, name: string, uri: string): Promise<void> {
        // download uri
        const data = await Utils.downloadText(uri);

        // parse definition
        const definition = JSON.parse(data) as MaterialDefinition;

        // all done
        await this.registerMaterial(domain, name, this.parseMaterial(domain, definition));
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

    public async registerTextureByColor(domain: string, name: string, color: Color): Promise<void> {
        // create texture
        await this.registerTexture(domain, name, this.platform.graphics.createTexture(
            TextureKindOptions.Albedo, TextureDimensionOptions.Two, Size.one, 1, 1, [color]));
    }

    public async registerTextureByUri(domain: string, name: string, uris: string[]): Promise<GPUTexture> {

        // load all images in parallel
        const images = await Promise.all(uris.map(uri => Utils.downloadImage(uri)));

        // create texture
        const texture = this.platform.graphics.handle.createTexture({
            label: name,
            format: 'rgba8unorm',
            size: [images[0].width, images[0].height, images.length],
            usage: GPUTextureUsage.TEXTURE_BINDING |
                GPUTextureUsage.COPY_DST |
                GPUTextureUsage.RENDER_ATTACHMENT,
        });

        // loop and copy
        images.forEach((image, i) => {
            // copy source into texture at proper layer
            this.platform.graphics.handle.queue.copyExternalImageToTexture(
                { source: image, flipY: true },
                { texture: texture, origin: [0, 0, i] },
                { width: image.width, height: image.height },
            );
        });

        // register texture
        await this.registerTexture(domain, name,
            new Texture(
                this.platform.graphics,
                TextureKindOptions.Albedo,
                new Size(images[0].width, images[0].height),
                texture));

        // all done
        return texture;
    }

    public async loadTestByUri(uri: string): Promise<void> {
        // console.log(YAML.load(await Utils.downloadText(uri)));
    }
}
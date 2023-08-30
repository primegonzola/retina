import {
    BufferKindOptions,
    Cache,
    Camera,
    CameraKindOptions,
    Color,
    IBuffer,
    Light,
    LightKindOptions,
    MaterialModeOptions,
    Matrix4,
    ModelMeshEntry,
    Platform,
    Quaternion,
    Rectangle,
    RenderData,
    RenderTarget,
    Settings,
    Shape,
    Size,
    TextureDimensionOptions,
    Transform,
    Vector3,
    Vector4,
} from "../index";

type LightBufferInfo = {
    info: Vector4;
    color: Vector4;
    position: Vector4,
    direction: Vector4
    view: Matrix4,
    projection: Matrix4,
    components: Vector4;
    lighting: Vector4;
    shadowing: Vector4;
    sampling: Vector4;
}


type DirectionalLightBufferInfo = {
    color: Vector4;
    position: Vector4,
    direction: Vector4
    view: Matrix4,
    projection: Matrix4,
}

// point light template
type PointLightBufferInfo = {
    color: Vector4
    position: Vector4,
    normal: Vector4,
    radius: number,
    intensity: number,
    direction: number,
    constant: number,
    linear: number,
    quadratic: number,
    near_plane: number,
    far_plane: number,
};

export class Renderer {
    public platform: Platform;
    public readonly offline: boolean = true;
    public readonly offlineSize = new Size(1024, 1024);
    public readonly color: Color;
    public readonly depth: number;

    private _size: Size

    // render targets 
    private _target?: RenderTarget;
    private _swap?: RenderTarget;
    private _extract?: RenderTarget;

    // buffers
    private _screen?: IBuffer;
    private _lights?: IBuffer;

    // shadow atlases and sizes
    private _shadowAreaAtlas?: RenderTarget;
    private _shadowSpotAtlas?: RenderTarget;
    private _shadowPointAtlas?: RenderTarget;
    private _shadowDirectionalAtlas?: RenderTarget;

    private _shadowAreaSize = new Size(256, 256);
    private _shadowSpotSize = new Size(256, 256);
    private _shadowPointSize = new Size(256, 256);
    private _shadowDirectionalSize = new Size(1024, 1024);

    private _screenLines?: string[];

    public displayPointMap = false;
    public displayPointMapIndex = 0;
    public displayDirectionalMap = false;

    private static readonly SCREEN_LINES_COUNT = 20;

    public get aspect(): number {
        return this._size.width / this._size.height;
    }

    constructor(platform: Platform, color: Color, depth: number) {

        // initialize renderer
        this.color = color;
        this.depth = depth;
        this.platform = platform;
        this._size = Size.zero;
        this._screenLines = new Array(Renderer.SCREEN_LINES_COUNT).fill("");
    }

    private _ensureInitialized() {

        // check screen size changed
        if (!this._size.equals(this.platform.graphics.size)) {

            // update new size
            this._size = this.platform.graphics.size;

            // destroy screen buffer
            this._screen?.destroy();

            // destroy lights buffer
            this._lights?.destroy();

            // destroy main target 
            this._target?.destroy();

            // destroy swap target
            this._swap?.destroy();

            // destroy extract target
            this._extract?.destroy();

            // destroy area shadow atlas
            this._shadowAreaAtlas?.destroy();

            // destroy spot shadow atlas
            this._shadowSpotAtlas?.destroy();

            // destroy point shadow atlas
            this._shadowPointAtlas?.destroy();

            // destroy directional shadow 
            this._shadowDirectionalAtlas?.destroy();

            // init screen camera for text rendering
            this._screen = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(
                    Vector4.toNumbers([Vector4.xyz(Camera.screen().view.inverse.position, 1)]),
                    Camera.screen().view.values, Camera.screen().projection.values));

            // init light info
            this._lights = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                this._collectLights());

            // create main target which is can be offline/online and stencil
            this._target = new RenderTarget(this.platform, this.offline ? this.offlineSize : this._size, this.offline,
                [{
                    color: this.color,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                        samples: 1,
                    }
                }],
                {
                    value: this.depth,
                    stencil: true,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                    }
                });

            // create shadow point atlas which is always offline and no stencil
            this._shadowPointAtlas = new RenderTarget(this.platform,
                this._shadowPointSize, true,
                [{
                    color: Color.black,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 6 * Settings.MaxPointShadowCount,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 6 * Settings.MaxPointShadowCount,
                    }
                });

            // create directional atlas which is always offline and no stencil
            this._shadowDirectionalAtlas = new RenderTarget(this.platform,
                this._shadowDirectionalSize, true,
                [{
                    color: Color.white,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxDirectionalShadowCount,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxDirectionalShadowCount,
                    }
                });

            // create spot atlas which is always offline and no stencil
            this._shadowSpotAtlas = new RenderTarget(this.platform,
                this._shadowSpotSize, true,
                [{
                    color: Color.white,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxSpotShadowCount,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxSpotShadowCount,
                    }
                });

            // create area atlas which is always offline and no stencil
            this._shadowAreaAtlas = new RenderTarget(this.platform,
                this._shadowAreaSize, true,
                [{
                    color: Color.white,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxAreaShadowCount,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: Settings.MaxAreaShadowCount,
                    }
                });

            // create swap target with screen size which is always online and no stencil
            this._swap = new RenderTarget(this.platform, this._size, false,
                [{
                    color: Color.yellow,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                    }
                });

            // create extract target which is always offline and no stencil
            this._extract = new RenderTarget(this.platform, this._size, true,
                [{
                    color: Color.yellow,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 1,
                    }
                });
        }
    }

    private _collectLights(lights?: Light[]): number[] {
        // get directionals
        let directionals = lights?.filter(light => light.kind === LightKindOptions.Directional);
        directionals = directionals?.slice(0, Math.min(directionals.length, Settings.MaxDirectionalLightCount));

        // get spots
        let spots = lights?.filter(light => light.kind === LightKindOptions.Spot);
        spots = spots?.slice(0, Math.min(spots.length, Settings.MaxSpotLightCount));

        // get points
        let points = lights?.filter(light => light.kind === LightKindOptions.Point);
        points = points?.slice(0, Math.min(points.length, Settings.MaxPointLightCount));

        // get areas
        let areas = lights?.filter(light => light.kind === LightKindOptions.Area);
        areas = areas?.slice(0, Math.min(areas.length, Settings.MaxAreaLightCount));

        const serializeLight = (light: Light, index: number) => {
            // populate
            let lbi: LightBufferInfo = {
                info: light ? new Vector4(light.kind, light.intensity, 0, 0) : Vector4.zero,
                color: light ? Vector4.xyz(light.color.rgb, 0) : Vector4.zero,
                position: light ? Vector4.xyz(light.transform.position, 0) : Vector4.zero,
                direction: light ? Vector4.xyz(light.transform.rotation.direction, 0) : Vector4.zero,
                view: light?.view || Matrix4.identity,
                projection: light?.projection || Matrix4.identity,
                components: new Vector4(0, 0, 0, 0),
                lighting: new Vector4(0, 0, 0, 0),
                shadowing: new Vector4(0, 0, 0, 0),
                sampling: new Vector4(index, 1, 2, 0.007),
            };

            // init
            let buffer: number[] = [];

            // add all fields
            buffer = buffer.concat(
                Vector4.toNumbers([
                    lbi.info, lbi.color, lbi.position, lbi.direction
                ]),
                lbi.view.values,
                lbi.projection.values,
                Vector4.toNumbers([
                    lbi.components, lbi.lighting, lbi.shadowing, lbi.sampling
                ])
            );

            // all done
            return buffer;
        };

        const serializeLights = (lights: Light[], max: number) => {
            // init
            let buffer: number[] = [];
            // loop 
            for (let i = 0; i < max; i++) {

                // get light
                const light = lights && i < lights.length ? lights[i] : undefined;

                // serialize and add to buffer
                buffer = buffer.concat(serializeLight(light, i));
            }

            // done
            return buffer;
        }

        // final buffer
        let buffer: number[] = [];

        // add light counts
        buffer = buffer.concat([
            directionals?.length || 0,
            spots?.length || 0,
            points?.length || 0,
            areas?.length || 0
        ]);

        // add shadow max counts
        buffer = buffer.concat([
            Settings.MaxDirectionalShadowCount,
            Settings.MaxSpotLightCount,
            Settings.MaxPointShadowCount,
            Settings.MaxAreaShadowCount
        ]);

        // serialize directionals
        buffer = buffer.concat(
            serializeLights(directionals, Settings.MaxDirectionalLightCount));

        // serialize spots
        buffer = buffer.concat(
            serializeLights(spots, Settings.MaxSpotLightCount));

        // serialize points
        buffer = buffer.concat(
            serializeLights(points, Settings.MaxPointLightCount));

        // serialize areas
        buffer = buffer.concat(
            serializeLights(areas, Settings.MaxAreaLightCount));

        // all done
        return buffer;
    }

    private _blit(): void {

        // create model
        const model = Matrix4.construct(Vector3.zero, Quaternion.identity, Vector3.one);

        // cache item
        const entry = Cache.instance.cacheItem("blit", (entry) => {

            // construct final model
            const fmodel = [].concat(model.values, model.inverse.transpose.values);

            // check if existing
            if (entry) {
                // update buffer
                (entry as ModelMeshEntry).model.write(fmodel);
            }
            else
                // create font cache entry
                return new ModelMeshEntry("blit", 2000,
                    this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, fmodel),
                    this.platform.resources.getMesh("platform", "blit"));
        }) as ModelMeshEntry;

        // get blit material
        const bm = this.platform.resources.getMaterial("platform", "blit");

        // get extract material
        const em = this.platform.resources.getMaterial("platform", "extract");

        // init shape
        const bs = new Shape(entry.model, model, entry.mesh, bm);

        // override pipelines
        this._swap.pipeline(true, false);

        // check for special case
        if (!this.displayDirectionalMap && this.displayPointMap) {

            // set index property
            em.properties.get("options").value = new Vector4(
                1.0, this.displayPointMapIndex, 0, 0);

            // override texture buffer
            em.textures.set("albedo", {
                name: "albedo",
                key: this._shadowPointAtlas.buffers[0].attachments[0],
            });

            // set proper pipeline
            this._extract.pipeline(true, false);

            // shape to use for outputting
            const es = new Shape(entry.model, model, entry.mesh, em);

            // extract first
            this._extract?.capture(Camera.screen().view, Camera.screen().projection, 0, 1,
                () => this._extract.single(em.shader, [em.groups], es));

            // override texture buffer
            bm.textures.set("albedo", {
                name: "albedo",
                key: this._extract?.buffers[0].attachments[0],
            });

            // delegate to blit
            this._swap?.capture(Camera.screen().view, Camera.screen().projection, 0, 1,
                () => this._swap.single(bm.shader, [bm.groups], bs));
        }
        else {
            // override texture buffer
            bm.textures.set("albedo", {
                name: "albedo",
                key: this.displayDirectionalMap ?
                    this._shadowDirectionalAtlas?.buffers[0].attachments[0] :
                    this._target?.buffers[0].attachments[0],
            });

            // delegate to blit
            this._swap?.capture(Camera.screen().view, Camera.screen().projection, 0, 1,
                () => this._swap.single(bm.shader, [bm.groups], bs));
        }
    }

    public lights(lights: Light[]): void {

        // get all lights that are point lights
        const points = lights.filter(
            light => light.kind === LightKindOptions.Point);

        // get all lights that are spot lights
        const spots = lights.filter(
            light => light.kind === LightKindOptions.Spot);

        // get all lights that are directional lights
        const directionals = lights.filter(
            light => light.kind === LightKindOptions.Directional);
    }

    public shadows(lights: Light[], shapes: Shape[]): void {

        // ensure initialized
        this._ensureInitialized();

        // get material
        const material = this.platform.resources.getMaterial("platform", "shadow");

        // remap shapes
        const shadows = shapes.map(shadow =>
            new RenderData(shadow.model, material.shader, shadow.buffers, material.groups));

        // get all point lights up to maximum allowed
        const points = lights.filter(light => light.kind === LightKindOptions.Point)
            .slice(0, Math.min(lights.length, Settings.MaxPointLightCount));

        // different normals to use for each face
        // The order of the array layers is [+X, -X, +Y, -Y, +Z, -Z]
        const directions: Vector3[] = [
            Vector3.right,
            Vector3.left,
            Vector3.up,
            Vector3.down,
            Vector3.backward,
            Vector3.forward,
        ];

        const angles: Vector3[] = [
            new Vector3(0, -90, 0),
            new Vector3(0, 90, 0),
            new Vector3(90, 0, 0),
            new Vector3(-90, 0, 0),
            new Vector3(0, 180, 0),
            new Vector3(0, 0, 0),
        ];

        // override pipeline
        this._shadowPointAtlas?.pipeline(false, true);

        // loop over lights
        for (let j = 0; j < points.length; j++) {

            // get point
            const point = points[j];

            // loop over angles
            for (let i = 0; i < angles.length; i++) {

                // create directional camera 
                const camera = new Camera(
                    CameraKindOptions.Perspective,
                    new Transform(
                        point.transform.position,
                        Quaternion.degrees(angles[i].x, angles[i].y, angles[i].z),
                        Vector3.one),
                    Rectangle.screen, point.options.range,
                );

                // capture target
                this._shadowPointAtlas?.capture(camera.view, camera.projection, (j * angles.length) + i, 1, () => {

                    // render shapes
                    this._shadowPointAtlas?.bulk(material.shader, [material.groups], shadows);
                });
            }
        }
    }

    public shadowing(lights: Light[], shapes: Shape[]): void {

        // ensure initialized
        this._ensureInitialized();

        // get directional lights
        let directionals = lights?.filter(light => light.kind === LightKindOptions.Directional);
        directionals = directionals?.slice(0, Math.min(directionals.length, Settings.MaxDirectionalLightCount));

        // get material
        const material = this.platform.resources.getMaterial("platform", "shadow");

        // remap shapes
        const shadows = shapes.map(shadow =>
            new RenderData(shadow.model, material.shader, shadow.buffers, material.groups));

        // override pipeline
        this._shadowDirectionalAtlas?.pipeline(false, true);

        // loop over directional lights
        for (let i = 0; i < directionals.length; i++) {
            // capture
            this._shadowDirectionalAtlas?.capture(directionals[i].view, directionals[i].projection, i, 1, () => {
                this._shadowDirectionalAtlas?.bulk(material.shader, [material.groups], shadows);
            });
        }
    }

    public shadow(camera: Camera, shapes: Shape[]): void {

        // ensure initialized
        this._ensureInitialized();

        // override pipeline
        this._shadowDirectionalAtlas?.pipeline(false, true);

        // capture target
        this._shadowDirectionalAtlas?.capture(camera.view, camera.projection, 0, 1, () => {

            // get material
            const material = this.platform.resources.getMaterial("platform", "shadow");

            // remap shapes
            const shadows = shapes.map(shadow =>
                new RenderData(shadow.model, material.shader, shadow.buffers, material.groups));

            // render shapes
            this._shadowDirectionalAtlas?.bulk(material.shader, [material.groups], shadows);
        });
    }

    public capture(camera: Camera, color: Color, depth: number, action: () => void): void {

        // ensure initialized
        this._ensureInitialized();

        // override pipeline
        this._target.pipeline(true, true);

        // delegate to target
        this._target?.capture(camera.view, camera.projection, 0, 1, action);

        // blit to screen if required
        if (this.offline) this._blit();
    }

    public shapes(lights: Light[], shapes: Shape[]): void {

        // update light
        this._lights.write(this._collectLights(lights));

        // get all shapes that are opaque
        const opaques = shapes.filter(
            shape => shape.material.mode === MaterialModeOptions.Opaque);

        // get all shapes that are transparent sorted according to z
        const transparents = shapes.filter(
            shape => shape.material.mode === MaterialModeOptions.Transparent).sort(
                (a, b) => a.world.position.z - b.world.position.z);

        // set pipeline disable transparency, enable depth
        this._target?.pipeline(false, true);

        // render opaques shapes attach depth texture
        this._target?.render({
            model: this._lights,
            textures: [].concat([this._shadowDirectionalAtlas?.buffers[0].depth, this._shadowPointAtlas.buffers[0].depth]),
        }, opaques);

        // set pipeline enable transparency, enable depth
        this._target?.pipeline(true, true);

        // render opaques shapes attach depth texture
        this._target?.render({
            model: this._lights,
            textures: [].concat([this._shadowDirectionalAtlas?.buffers[0].depth, this._shadowPointAtlas.buffers[0].depth]),
        }, transparents);
    }

    public writeLine(index: number, text: string): void {

        // add it to the screen lines if it fits total lines
        if (index >= 0 && index < this._screenLines.length)
            this._screenLines[index] = text;
    }

    private line(name: string, model: Matrix4, line: string): void {

        // get font
        const font = this.platform.resources.getFont("platform", name);

        // get mesh
        const entry = font.cacheItem(line, model, 5000);

        // get material
        const material = this.platform.resources.getMaterial("platform", name)

        // init shape
        const text = new Shape(entry.model, model, entry.mesh, material);

        // override pipeline, enable transparency, ignore depth
        this._target.pipeline(true, false);

        // delegate to target
        this._target?.offscreen(this._screen, material.shader, [material.groups], text);
    }

    public lines(): void {
        // define size
        const scale = 2.0;
        const size = 0.0025 * 0.25 * scale;
        const height = 0.025 * scale;
        const aspect = this.platform.graphics.aspect;

        // loop over lines
        this._screenLines?.forEach((line, index) => {

            // check if anything to do
            if (line.length > 0) {
                // define model
                const model = Matrix4.construct(
                    Vector3.zero.add(new Vector3(-0.5, 0.5 - index * height * aspect, 0.5)),
                    Quaternion.identity, new Vector3(size, size * aspect, 1.0));

                // render line
                this.line("arial-32", model, line);
            }
        });
    }

    public destroy(): void {

        // destroy screen buffer
        this._screen?.destroy();

        // destroy lights buffer
        this._lights?.destroy();

        // destroy main target
        this._target?.destroy();

        // destroy swap target
        this._swap?.destroy();

        // destroy extract target
        this._extract?.destroy();

        // destroy area shadow atlas
        this._shadowAreaAtlas?.destroy();

        // destroy spot shadow atlas
        this._shadowSpotAtlas?.destroy();

        // destroy point shadow atlas
        this._shadowPointAtlas?.destroy();

        // destroy directional shadow 
        this._shadowDirectionalAtlas?.destroy();
    }
}
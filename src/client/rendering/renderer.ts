import {
    BufferKindOptions,
    Cache,
    Camera,
    CameraKindOptions,
    Color,
    Frustum,
    Hull,
    HullCapabilityOptions,
    IBuffer,
    Light,
    LightKindOptions,
    Matrix4,
    ModelMeshEntry,
    Platform,
    Quaternion,
    Range,
    Rectangle,
    RenderTarget,
    SamplerKindOptions,
    Settings,
    ShaderGroupBindingKindOptions,
    Shape,
    Size,
    TextureDimensionOptions,
    Transform,
    Utils,
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
    private _cube?: RenderTarget;


    // buffers
    private _screen?: IBuffer;
    private _lighting?: IBuffer;

    private _screenLines?: string[];
    private _cubeSize = new Size(1024, 1024);

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

            // destroy cube target 
            this._cube?.destroy();

            // destroy main target 
            this._target?.destroy();

            // destroy swap target
            this._swap?.destroy();

            // init screen camera for text rendering
            this._screen = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(
                    Vector4.toNumbers([Vector4.xyz(Camera.screen().view.inverse.position, 1)]),
                    Camera.screen().view.values, Camera.screen().projection.values));

            // init lighting buffer
            this._lighting = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                Utils.pad(this._collectLighting()));

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

            // create swap target with screen size which is always online and no stencil
            this._swap = new RenderTarget(this.platform, this._size, false,
                [{
                    color: Color.black,
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

            // create shadow point atlas which is always offline and no stencil
            this._cube = new RenderTarget(this.platform,
                this._cubeSize, true,
                [{
                    color: Color.black,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 6,
                    }
                }],
                {
                    value: 1.0,
                    stencil: false,
                    texture: {
                        dimension: TextureDimensionOptions.Two,
                        layers: 6,
                    }
                });
        }
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

        // init shape
        const bs = new Shape(entry.model, model, entry.mesh, bm);

        // override pipelines
        this._swap.pipeline(true, false);

        // override texture buffer
        bm.textures.set("albedo", {
            name: "albedo",
            key: this._target?.buffers[0].attachments[0],
        });

        // delegate to blit
        this._swap?.capture(Camera.screen().view, Camera.screen().projection, 0, 1,
            () => this._swap.single(bm.shader, [bm.groups], bs));
    }

    private _collectLighting(lights?: Light[]): number[] {
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

    public capture(camera: Camera, color: Color, depth: number, action: () => void): void {

        // ensure initialized
        this._ensureInitialized();

        // override pipeline
        this._target.pipeline(true, true);

        // delegate to target
        this._target?.capture(camera.view, camera.projection, 0, 1, () => {

            // execute action
            action();

            // handle lines
            this.lines();
        });


        // blit to screen if required
        if (this.offline) this._blit();

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

        // destroy cube target
        this._cube?.destroy();

        // destroy main target
        this._target?.destroy();

        // destroy swap target
        this._swap?.destroy();
    }

    private _hull(target: RenderTarget, frustum: Frustum, hull: Hull, clip = true) {

        // check if valid
        if (hull.shader &&
            hull.buffers && hull.buffers.size &&
            hull.uniforms && hull.uniforms.size &&
            hull.uniforms.has("model") && hull.uniforms.has("properties")) {

            // cache graph
            const graph = hull.graph;

            // check if intersecting
            if (!clip || frustum.wbox(graph.position, graph.rotation, graph.scale)) {

                // get shader
                const shader = hull.shader;

                // check if shader
                if (shader) {

                    // bind pipeline
                    target?.bindPipeline(shader, (hull.capabilities & HullCapabilityOptions.Transparent) !== 0, true);

                    // bind camera
                    target?.bindCamera(shader);

                    // check to bind lights
                    if (this?._lighting)
                        target?.bindUniform(shader, "lighting", "lighting", this._lighting);

                    // check to bind buffers
                    if (hull?.buffers)
                        target?.bindBuffers(shader, hull.buffers);

                    // check to bind model
                    if (hull?.uniforms?.has("model"))
                        target?.bindUniform(shader, "model", "model",
                            hull.uniforms.get("model").buffer, hull.uniforms.get("model").offset, hull.uniforms.get("model").size);

                    // check to bind properties only
                    if ((hull.capabilities & HullCapabilityOptions.Properties) !== 0 &&
                        (hull.capabilities & HullCapabilityOptions.Texture) === 0) {
                        target?.bindUniform(shader, "material", "properties",
                            hull.uniforms.get("properties").buffer, hull.uniforms.get("properties").offset, hull.uniforms.get("properties").size);
                    }
                    if ((hull.capabilities & HullCapabilityOptions.Properties) !== 0 &&
                        (hull.capabilities & HullCapabilityOptions.Texture) !== 0) {
                        // bind 
                        target?.bindData(shader, "material", [{
                            name: "properties",
                            kind: ShaderGroupBindingKindOptions.Uniform,
                            value: hull.uniforms.get("properties").buffer,
                            offset: hull.uniforms.get("properties").offset,
                            size: hull.uniforms.get("properties").size,
                        }, {
                            name: "albedo-atlas",
                            kind: ShaderGroupBindingKindOptions.AlbedoTexture,
                            value: hull.textures.get("atlas"),
                        }, {
                            name: "albedo-atlas-sampler",
                            kind: ShaderGroupBindingKindOptions.AlbedoSampler,
                            value: this.platform.graphics.createSampler(SamplerKindOptions.Albedo),
                        }]);
                    }
                    // draw hull
                    if (hull?.buffers)
                        target?.draw(hull?.buffers);
                }
            }
        }
    }

    private _render(target: RenderTarget, frustum: Frustum, hulls: Hull[], clip = true): void {

        // ensure initialized
        this._ensureInitialized();

        // split into opaque and transparent
        const opaques = hulls.filter(hull => (hull.capabilities & HullCapabilityOptions.Transparent) === 0);

        // get view and projection
        const pvm = frustum.projection.multiply(frustum.view);

        // get transparents using projected z value to sort
        const transparents = hulls.filter(hull => (hull.capabilities & HullCapabilityOptions.Transparent) !== 0)
            .sort((a, b) => {
                const pva = pvm.multiplyVector(Vector4.xyz(a.graph.position, 1.0));
                const pvb = pvm.multiplyVector(Vector4.xyz(a.graph.position, 1.0));
                return pva.z - pvb.z;
            });

        // render opaques
        opaques.forEach(hull => this._hull(target, frustum, hull, clip));

        // render transparents
        transparents.forEach(hull => this._hull(target, frustum, hull, clip));
    }

    public render(frustum: Frustum, lights: Light[], hulls: Hull[], clip = true): void {

        // collect the lights
        this._lighting?.write(this._collectLighting(lights));

        // delegate
        this._render(this._target, frustum, hulls, clip);
    }

    public cube(position: Vector3, range: Range, lights: Light[], hulls: Hull[], clip = true): void {

        // angles to use
        const angles: Vector3[] = [
            new Vector3(0, -90, 0),
            new Vector3(0, 90, 0),
            new Vector3(90, 0, 0),
            new Vector3(-90, 0, 0),
            new Vector3(0, 180, 0),
            new Vector3(0, 0, 0),
        ];

        // collect the lights
        this._lighting?.write(this._collectLighting(lights));

        // loop over angles
        for (let i = 0; i < angles.length; i++) {

            // create directional camera 
            const camera = new Camera(
                CameraKindOptions.Perspective,
                new Transform(
                    position, Quaternion.degrees(angles[i].x, angles[i].y, angles[i].z), Vector3.one),
                Rectangle.screen, range,
            );

            // render all into cube
            this._cube?.capture(camera.view, camera.projection, i, 1, () =>
                this._render(this._cube, camera.frustum, hulls, clip));
        }
    }
}
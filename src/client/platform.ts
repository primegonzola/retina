import {
    Bounds,
    Box,
    BufferKindOptions,
    BufferLocation,
    Camera,
    CameraController,
    CameraKindOptions,
    Color,
    Frustum,
    GraphicsDevice,
    Hull,
    IBuffer,
    InputDevice,
    Light,
    Octree,
    Quaternion,
    Range,
    Rectangle,
    Renderer,
    Resources,
    SimulationTimer,
    Transform,
    Utils,
    Vector3,
} from "./index";

export class Platform {

    public readonly camera: Camera;
    public readonly graphics: GraphicsDevice
    public readonly input: InputDevice
    public readonly renderer: Renderer;
    public readonly resources: Resources;
    public readonly timer: SimulationTimer;
    public readonly controller: CameraController;
    public readonly lights: Light[];
    public readonly hulls: Hull[];
    private _octree: Octree;
    private _statics: IBuffer;

    protected constructor(graphics: GraphicsDevice, input: InputDevice) {
        // init
        this.input = input;
        this.graphics = graphics;
        this.timer = new SimulationTimer();
        this.resources = new Resources(this);

        // to start with
        this.hulls = [];
        this.lights = [];

        // main render
        this.renderer = new Renderer(this, Color.trBlack, 1.0);

        // main camera
        this.camera = new Camera(
            CameraKindOptions.Perspective,
            Transform.identity,
            Rectangle.screen, new Range(1.0, 256));

        // init controller
        this.controller = new CameraController(this, this.camera);
    }

    public static async create(id: string): Promise<Platform> {

        // create the graphics device
        const graphics = await GraphicsDevice.create(id);

        // create the input device
        const input = await InputDevice.create(id);

        // create platform
        const platform = new Platform(graphics, input);

        // register world
        await platform.resources.loadResources(
            "platform", "resources/data/platform.yaml");

        // reset
        platform.reset();

        // all done
        return platform;
    }

    private _createContent(): void {

        // get mesh
        const mesh = this.resources.getMesh("platform", "cube");

        // get material
        const material = this.resources.getMaterial("platform", "hull-concrete");
        const dimensions = Vector3.one.scale(12);
        const outer = Vector3.one.scale(4);
        const inner = Vector3.one.scale(2);

        for (let z = 0; z < dimensions.z; z++) {
            for (let y = 0; y < dimensions.y; y++) {
                for (let x = 0; x < dimensions.x; x++) {

                    // calculate position
                    const position = (outer.multiply(new Vector3(x, y, z)))
                        .subtract((outer.multiply(dimensions)).scale(0.5))
                        .add(outer.scale(0.5));

                    // create hull
                    const hull = new Hull(null,
                        new Transform(position, Quaternion.identity, inner),
                        material.shader, mesh.buffers);

                    // add 
                    this.hulls.push(hull);
                }
            }
        }

        // start with empty buffer
        let data: number[] = [];

        // loop over hulls 
        this.hulls.forEach(hull => {

            // extract model
            const model = hull.transform.extract();

            // override color
            if (material?.properties?.has("color"))
                material.properties.get("color").value = Color.cyan;// Color.random(Math.random());

            // extract properties
            const properties = material.extract();

            // add to buffer
            data = data.concat(Utils.pad(model, 256), Utils.pad(properties, 256))
        });

        // create buffer
        const buffer = this.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // loop over hulls 
        this.hulls.forEach((hull, index) => {

            // extract model
            const model = hull.transform.extract();

            // extract properties
            const properties = material.extract();

            // set uniforms
            hull.uniforms.set("model", new BufferLocation(buffer, model.length, (2 * index) + 0));
            hull.uniforms.set("properties", new BufferLocation(buffer, properties.length, (2 * index) + 1));
        });

        // save buffer
        this._statics = buffer;

        // add a directional lighht
        this.lights.push(Light.createDirectional(
            new Transform(Vector3.zero, Quaternion.degrees(-45, 45, 0), Vector3.one),
            Color.white,
            1.0,
            this.camera.area,
            this.camera.range,
        ));

        // init octree
        this._octree = new Octree(this.hulls.map(hull =>
            new Box(hull.graph.position, hull.graph.rotation, hull.graph.scale).bounds
        ), 3);

        // optimize octree
        this._octree.optimize();

        console.log(this._octree);
    }

    private _destroyContent(): void {

        // clean up statics
        this._statics?.destroy();

        // clean up hulls
        this.hulls.length = 0;
    }

    public async destroy(): Promise<void> {

        // wait to get rid of async warning
        await Utils.delay(0);

        // destroy content
        this._destroyContent();

        // destroy renderer
        this.renderer?.destroy();
    }

    public reset(): void {

        // reset controller
        this.controller?.reset(Vector3.zero, new Vector3(-45, 0, 0), 24 * 3);

        // destroy content
        this._destroyContent();

        // create content
        this._createContent();
    }

    private _vhulls(frustum: Frustum): Hull[] {
        // check if octree is valid
        // if (this._octree) {
        //     this._octree?.collect(frustum).map(index => this.hulls[index]);
        // }
        const vhulls = this.hulls.filter(hull =>
            frustum.wbox(hull.graph.position, hull.graph.rotation, hull.graph.scale));
        return vhulls;
    }

    public async update(): Promise<void> {

        // wait to get rid of async warning
        await Utils.delay(0);

        // update timer
        this.timer?.update();

        // update controller
        this.controller?.update();

        // update input
        this.input?.update();

        // update graphics
        this.graphics?.update();

        // update camera aspect
        this.camera?.aspect(this.graphics.aspect);

        // render
        this.render();
    }

    private render(): void {

        // filter hulls
        const vh1 = window.performance.now();
        const vhulls = this._vhulls(this.camera.frustum);
        const vh2 = window.performance.now();
        const oh1 = window.performance.now();
        const ohulls = [...new Set(this._octree?.collect(this.camera.frustum)).entries()]
            .map(e => this.hulls[e[1]]);
        const oh2 = window.performance.now();
        // start rendering with background color and depth
        this.renderer.capture(this.camera, Color.black, 1.0, () => {

            // render hulls
            this.renderer?.render(this.camera.frustum, this.lights, vhulls, false);

            // output diagnostics
            this.renderer.writeLine(0, `FPS: ${Math.round(this.timer.fps)} - APS: ${Math.round(this.timer.aps)}`);
            this.renderer.writeLine(1, `Hulls: ${this.hulls.length} - Lights: ${this.lights.length}`);
            this.renderer.writeLine(2, `vHulls: ${vhulls.length} - oHulls: ${ohulls.length}`);
            this.renderer.writeLine(3, `vms: ${(vh2 - vh1).toFixed(4)} - oms: ${(oh2 - oh1).toFixed(4)}`);
        });
    }
}
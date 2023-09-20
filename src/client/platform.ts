import {
    BufferKindOptions,
    BufferLocation,
    Camera,
    CameraController,
    CameraKindOptions,
    Color,
    Galaxy,
    GraphicsDevice,
    Hull,
    HullCapabilityOptions,
    IBuffer,
    InputDevice,
    Light,
    Material,
    MaterialModeOptions,
    ModelNode,
    Quaternion,
    Range,
    Rectangle,
    Renderer,
    Resources,
    SimulationTimer,
    TextureDimensionOptions,
    TextureKindOptions,
    Transform,
    Universe,
    Utils,
    Vector3,
    World,
} from "./index";

export class Platform {

    public readonly camera: Camera;
    public readonly graphics: GraphicsDevice
    public readonly input: InputDevice
    public readonly renderer: Renderer;
    public readonly resources: Resources;
    public readonly timer: SimulationTimer;
    public readonly controller: CameraController;
    public readonly world: World;
    public readonly universe: Universe;
    private _skyboxBuffer: IBuffer;
    private _skyboxHull: Hull;

    protected constructor(graphics: GraphicsDevice, input: InputDevice) {
        // init
        this.input = input;
        this.graphics = graphics;
        this.timer = new SimulationTimer();
        this.resources = new Resources(this);
        this.world = new World(this, Transform.identity);
        this.universe = new Universe(this);

        // main render
        this.renderer = new Renderer(this, Color.trBlack, 1.0);

        // main camera
        this.camera = new Camera(
            CameraKindOptions.Perspective,
            Transform.identity,
            Rectangle.screen, new Range(1.0, 4 * 256));

        // init controller
        this.controller = new CameraController(this, this.camera, new Range(0, 4), 0);
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

        // generate universe
        this.universe.generate();

        // generate the world
        this.world.create();

        // add a directional lighht
        this.world.lights.push(Light.createDirectional(
            new Transform(Vector3.zero, Quaternion.degrees(-45, 45, 0), Vector3.one),
            Color.white,
            1.0,
            this.camera.area,
            this.camera.range,
        ));

        const mesh = this.resources.getMesh("platform", "skybox");
        const material = this.resources.getMaterial("platform", "hull-skybox").clone();
        const capabilities = HullCapabilityOptions.Properties | HullCapabilityOptions.Texture |
            (material.mode === MaterialModeOptions.Transparent ? HullCapabilityOptions.Transparent : HullCapabilityOptions.None);

        // create the skybox hull
        this._skyboxHull = new Hull(null,
            new Transform(Vector3.zero, Quaternion.identity, Vector3.one.scale(1024)),
            capabilities, material.shader, mesh.buffers);

        // save material
        this._skyboxHull.attributes.set("material", material);

        // start with empty buffer
        let data: number[] = [];

        data = data.concat(
            Utils.pad(Transform.matrix(this._skyboxHull.graph).extract(), 256),
            Utils.pad((this._skyboxHull.attributes.get("material") as Material).extract(), 256))

        // create buffer
        const buffer = this.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // set uniforms
        this._skyboxHull.uniforms.set("model",
            new BufferLocation(buffer, Transform.matrix(this._skyboxHull.graph).extract().length, 0));
        this._skyboxHull.uniforms.set("properties",
            new BufferLocation(buffer, (this._skyboxHull.attributes.get("material") as Material).extract().length, 1));

        // save buffer
        this._skyboxBuffer = buffer;
    }

    private _destroyContent(): void {

        // clean up statics
        this.world?.destroy();
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
        this.controller?.reset(ModelNode.none(this), new Vector3(-45, 0, 0), 12 * 1);

        // destroy content
        this._destroyContent();

        // create content
        this._createContent();
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

        // update world
        this.world?.update();

        // update graphics
        this.graphics?.update();

        // update camera aspect
        this.camera?.aspect(this.graphics.aspect);

        // render
        this.render();
    }

    private render(): void {

        // get all visible nodes
        const vchunks = this.world.chunks.filter(node =>
            this.camera.frustum.wbox(node.graph.position, node.graph.rotation, node.graph.scale));

        // collect each of the child hulls
        let vhulls = vchunks.map(vchunk => vchunk.nodes.map(n => n.hull)).flat();

        // // add player
        // vhulls.push(this.world.player.hull);

        // generate 
        this.renderer.skybox(Vector3.zero, new Range(1, 1024), this.world.lights, vhulls);

        // add the skybox hull
        vhulls = [this._skyboxHull];

        // start rendering with background color and depth
        this.renderer.capture(this.camera, Color.black, 1.0, () => {

            // set textures
            this._skyboxHull.textures.set("atlas", this.renderer.skyboxTexture);

            // check level
            // switch (this.controller.level) {
            //     case 0: {

            //         // get all visible galaxies
            //         const galaxies = this.universe.galaxies.filter<Galaxy>(galaxy =>
            //             this.camera.frustum.wbox(galaxy.graph.position, galaxy.graph.rotation, galaxy.graph.scale));

            //         // collect galaxy hulls
            //         const ghulls = galaxies.map(galaxy => galaxy.hull);

            //         // loop over galaxies and collect star hulls
            //         const shulls = galaxies.map<Hull[]>(galaxy =>
            //             (galaxy as Galaxy).stars.map(star => star.hull)).flat();

            //         // combine
            //         const hulls = [].concat(shulls);

            //         // render
            //         this.renderer?.render(this.camera.frustum, this.world.lights, hulls, false);

            //         break;
            //     }
            // }
            // render hulls
            this.renderer?.render(this.camera.frustum, this.world.lights, vhulls, false);

            // output diagnostics
            this.renderer.writeLine(0, `FPS: ${Math.round(this.timer.fps)} - APS: ${Math.round(this.timer.aps)}`);
            this.renderer.writeLine(1, `Level: ${this.controller.level}`);
            // this.renderer.writeLine(2, `Chunks: ${vchunks.length} - Hulls: ${vhulls.length}`);
        });
    }
}
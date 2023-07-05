
import {
    Camera,
    CameraKindOptions,
    Color,
    Geometry,
    GraphicsDevice,
    InputDevice,
    Material,
    MaterialModeOptions,
    MaterialPropertyKindOptions,
    Mesh,
    Panel,
    Quaternion,
    Range,
    Rectangle,
    Renderer,
    Resources,
    Transform,
    Vector3,
    World,
    Utils,
    Vector2,
    Size,
    SimulationTimer,
    Matrix4
} from "./index";

export class Platform {

    public readonly graphics: GraphicsDevice
    public readonly input: InputDevice
    public readonly resources: Resources;
    public readonly renderer: Renderer;
    public readonly camera: Camera;
    public readonly world: World;
    public readonly degrees: Vector3;
    public readonly timer: SimulationTimer;
    public readonly rootPanel: Panel;

    protected constructor(graphics: GraphicsDevice, input: InputDevice) {
        // init
        this.graphics = graphics;
        this.input = input;
        this.resources = new Resources(this);
        this.renderer = new Renderer(this);
        this.degrees = Vector3.zero;
        this.camera = new Camera(
            this,
            CameraKindOptions.Perspective,
            new Transform(new Vector3(0, 0, 4), Quaternion.identity, Vector3.one),
            Rectangle.screen,
            new Range(1.0, 256.0)
        );
        this.world = World.create(this, "World");
        this.timer = new SimulationTimer();
        this.rootPanel = new Panel();
    }

    public static async create(id: string): Promise<Platform> {

        // create the graphics device
        const graphics = await GraphicsDevice.create(id);

        // create the input device
        const input = await InputDevice.create(id);

        // create platform
        const platform = new Platform(graphics, input);

        // register textures
        await platform.resources.registerTextureByUri("platform",
            "panel-albedo", "resources/textures/panel-albedo.png");

        await platform.resources.registerTextureByUri("platform",
            "smiley", "resources/textures/smiley.png");

        // register shaders
        await platform.resources.registerShaderByUri("platform",
            "panel", "resources/shaders/panel.json");

            await platform.resources.registerShaderByUri("platform",
            "blit", "resources/shaders/blit.json");

        await platform.resources.registerShaderByUri("platform",
            "standard", "resources/shaders/standard.json");

        await platform.resources.registerShaderByUri("platform",
            "font", "resources/shaders/font.json");

        await platform.resources.registerMaterial("platform", "blit",
            new Material(platform, "blit", platform.resources.getShader("platform", "blit"),
                MaterialModeOptions.Opaque, [{
                    name: "color",
                    kind: MaterialPropertyKindOptions.Color,
                    binding: 0,
                    value: Color.white
                }, {
                    name: "opacity",
                    kind: MaterialPropertyKindOptions.Float,
                    binding: 1,
                    value: 1.0
                }]));

        // register materials
        await platform.resources.registerMaterialByUri("platform",
            "standard", "resources/materials/standard.json");
            
        await platform.resources.registerMaterialByUri("platform",
            "red", "resources/materials/red.json");

        await platform.resources.registerMaterialByUri("platform",
            "green", "resources/materials/green.json");

        await platform.resources.registerMaterialByUri("platform",
            "blue", "resources/materials/blue.json");

        await platform.resources.registerMaterial("platform", "orange",
            new Material(platform, "orange",
                platform.resources.getShader("platform", "standard"),
                MaterialModeOptions.Opaque, [{
                    name: "color",
                    kind: MaterialPropertyKindOptions.Color,
                    binding: 0,
                    value: Color.trOrange
                }, {
                    name: "opacity",
                    kind: MaterialPropertyKindOptions.Float,
                    binding: 1,
                    value: 1.0
                }], [{
                    name: "albedo",
                    key: platform.resources.getTexture("platform", "panel-albedo")
                }]));

        await platform.resources.registerMaterial("platform", "orange-panel",
            new Material(platform, "orange-panel",
                platform.resources.getShader("platform", "panel"),
                MaterialModeOptions.Opaque, [{
                    name: "color",
                    kind: MaterialPropertyKindOptions.Color,
                    binding: 0,
                    value: Color.trOrange
                }, {
                    name: "opacity",
                    kind: MaterialPropertyKindOptions.Float,
                    binding: 1,
                    value: 1
                }]));

        await platform.resources.registerMaterial("platform", "yellow",
            new Material(platform, "yellow",
                platform.resources.getShader("platform", "standard"),
                MaterialModeOptions.Opaque, [{
                    name: "color",
                    kind: MaterialPropertyKindOptions.Color,
                    binding: 0,
                    value: Color.trYellow
                }, {
                    name: "opacity",
                    kind: MaterialPropertyKindOptions.Float,
                    binding: 1,
                    value: 1.0
                }], [{
                    name: "albedo",
                    key: platform.resources.getTexture("platform", "panel-albedo")
                }]));


        // register panel mesh
        await platform.resources.registerMesh("platform",
            "panel", new Mesh(platform, Geometry.quad()));

        // register blit mesh
        await platform.resources.registerMesh("platform",
            "blit", new Mesh(platform, Geometry.quad()));

        // register quad mesh
        await platform.resources.registerMesh("platform",
            "quad", new Mesh(platform, Geometry.quad()));

        // register cube mesh
        await platform.resources.registerMesh("platform",
            "cube", new Mesh(platform, Geometry.cube()));

        // register font texture
        await platform.resources.registerTextureByUri("platform",
            "arial-32", "resources/fonts/arial-32_0.png");

        // register font material
        await platform.resources.registerMaterialByUri("platform",
            "arial-32", "resources/fonts/arial-32.json");

        // register font 
        await platform.resources.registerFontByUri("platform",
            "arial-32", "resources/fonts/arial-32.fnt");

        // add panels
        platform.rootPanel.children.push(new Panel(
            new Rectangle(new Vector2(0, 0.0), new Size(1.0, 0.05)),
            platform.resources.getMaterial("platform", "orange-panel")));

        platform.rootPanel.children.push(new Panel(
            new Rectangle(new Vector2(0, 0.95), new Size(1.0, 0.05)),
            platform.resources.getMaterial("platform", "orange-panel")));

        // generate world
        await platform.world.generate();

        // all done
        return platform;
    }

    public async destroy(): Promise<void> {
        // wait to get rid of async warning
        await Utils.delay(0);

        // destroy renderer
        this.renderer?.destroy();
    }

    public async update(): Promise<void> {

        // wait to get rid of async warning
        await Utils.delay(0);

        // update timer
        this.timer.update();

        // update camera
        this.camera.update();

        // extract shapes from world
        const shapes = this.world.extractShapes(this, this.camera, []);

        // start rendering with background color and depth
        this.renderer.capture(Color.trBlack, 1.0, () => {

            // render extracted shapes
            // this.renderer.render(this.camera, shapes);

            // render text
            this.renderer.writeLine(0, `FPS:${Math.round(this.timer.fps)} - APS:${Math.round(this.timer.aps)}`);
            this.renderer.writeLine(2, "The brown fox jumps over the lazy dog!");

            // render panel
            this.renderer.renderPanel(this.rootPanel);

            // render lines
            this.renderer.renderLines();
        });
    }
}
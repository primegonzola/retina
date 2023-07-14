
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
    Utils,
    Vector2,
    Size,
    SimulationTimer,
    Matrix4,
    TextureKindOptions,
    Shape,
    ShaderData,
    BufferKindOptions
} from "./index";

export class Platform {

    public readonly graphics: GraphicsDevice
    public readonly input: InputDevice
    public readonly resources: Resources;
    public readonly renderer: Renderer;
    public readonly camera: Camera;
    public readonly degrees: Vector3;
    public readonly timer: SimulationTimer;
    public readonly rootPanel: Panel;
    public readonly leftAxis: Vector2;
    public readonly shapes: Shape[] = [];

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
        this.timer = new SimulationTimer();
        this.rootPanel = new Panel();
        this.leftAxis = Vector2.zero;
    }

    private static createBorderedTexture(size: Size, color: Color, borderColor: Color, borderSize: number): Color[] {
        // create colors
        const colors: Color[] = new Array<Color>(size.width * size.height);
        // loop
        for (let y = 0; y < size.height; y++) {
            for (let x = 0; x < size.width; x++) {
                if (y < borderSize || y > size.height - 1 - borderSize)
                    colors[y * size.width + x] = borderColor;
                else if (x < borderSize || x > size.width - 1 - borderSize)
                    colors[y * size.width + x] = borderColor;
                else
                    colors[y * size.width + x] = color;
            }
        }
        return colors;
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
            "platform", "resources/data/platform.json");

        // register textures
        await platform.resources.registerTexture("platform",
            "purple", platform.graphics.createTexture(
                TextureKindOptions.Flat,
                new Size(64, 64),
                Platform.createBorderedTexture(new Size(64, 64), Color.white, Color.red, 2)
            ));

        // register input 
        await platform.resources.registerInputByUri(
            "standard", "resources/inputs/standard.json");

        // create shape
        const shape = new Shape(
            Utils.uuid(),
            Matrix4.identity,
            platform.resources.getMesh("platform", "cube"),
            platform.resources.getMaterial("platform", "green")
        );

        // add model group
        shape.groups.set("model", new Map<string, ShaderData>());
        shape.groups.get("model").set("model", {
            name: "model",
            value: graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(shape.world.values, shape.world.inverse.transpose.values))
        });

        // add shape
        platform.shapes.push(shape);

        // all done
        return platform;
    }

    public async destroy(): Promise<void> {
        // wait to get rid of async warning
        await Utils.delay(0);

        // destroy renderer
        this.renderer?.destroy();
    }

    public processInput(): void {
        if (this.input.isKeyDown("a")) {
            this.leftAxis.x = -1;
        }
        if (this.input.isKeyDown("d")) {
            this.leftAxis.x = 1;
        }
        if (!this.input.isKeyDown("a") && !this.input.isKeyDown("d")) {
            this.leftAxis.x = 0;
        }
        if (this.input.isKeyDown("w")) {
            this.leftAxis.y = 1;
        }
        if (this.input.isKeyDown("s")) {
            this.leftAxis.y = -1;
        }
        if (!this.input.isKeyDown("w") && !this.input.isKeyDown("s")) {
            this.leftAxis.y = 0;
        }

        // update camera
        const cameraSpeed = 0.05;
        this.camera.transform.position.x += cameraSpeed * this.leftAxis.x;
        this.camera.transform.position.y += cameraSpeed * this.leftAxis.y;
    }

    public async update(): Promise<void> {

        // wait to get rid of async warning
        await Utils.delay(0);

        // update timer
        this.timer.update();

        // handle input
        this.processInput();

        // update input
        this.input.update();

        // update graphics
        this.graphics.update();

        // update camera
        this.camera.update();

        // start rendering with background color and depth
        this.renderer.capture(Color.trBlack, 1.0, () => {

            // render extracted shapes
            this.renderer.render(this.camera, this.shapes);

            // // render text
            // this.renderer.writeLine(0, `FPS:${Math.round(this.timer.fps)} - APS:${Math.round(this.timer.aps)}`);
            // this.renderer.writeLine(2, "The brown fox jumps over the lazy dog!");

            // // render panel
            // this.renderer.renderPanel(this.rootPanel);

            // // render lines
            // this.renderer.renderLines();
        });
    }
}
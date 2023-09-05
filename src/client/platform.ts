import {
    Camera,
    CameraKindOptions,
    Color,
    GraphicsDevice,
    InputDevice,
    Quaternion,
    Range,
    Rectangle,
    Renderer,
    Resources,
    Shape,
    SimulationTimer,
    Transform,
    Utils,
    Vector2,
    Vector3,
} from "./index";

export class Platform {

    public readonly camera: Camera;
    public readonly graphics: GraphicsDevice
    public readonly input: InputDevice
    public readonly leftAxis: Vector2;
    public readonly rightAxis: Vector2;
    public readonly renderer: Renderer;
    public readonly resources: Resources;
    public readonly timer: SimulationTimer;

    private _editing: boolean = true;
    private _cameraDistance: number = 24;
    private _cameraDegrees: Vector3 = new Vector3(-45, 0, 0);
    private _cameraTarget: Vector3 = Vector3.zero;
    private _displayFrustum = false;

    protected constructor(graphics: GraphicsDevice, input: InputDevice) {
        // init
        this.input = input;
        this.graphics = graphics;
        this.timer = new SimulationTimer();
        this.resources = new Resources(this);

        // main render
        this.renderer = new Renderer(this, Color.trBlack, 1.0);

        // main camera
        this.camera = new Camera(
            CameraKindOptions.Perspective,
            Transform.identity,
            Rectangle.screen, new Range(1.0, 256));

        // init axises
        this.leftAxis = Vector2.zero;
        this.rightAxis = Vector2.zero;
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

    public async destroy(): Promise<void> {
        
        // wait to get rid of async warning
        await Utils.delay(0);

        // destroy renderer
        this.renderer?.destroy();
    }

    public reset(): void {
        if (this._editing) {
            this._cameraDistance = 32;
            this._cameraDegrees = new Vector3(-45, 0, 0);
            this._cameraTarget = Vector3.zero;
        }
    }

    public processInput(): void {

        // check modifier
        const modifierOne = this.input.isKey("AltLeft");

        // reset axis
        this.leftAxis.x = 0;
        this.leftAxis.y = 0;
        this.rightAxis.x = 0;
        this.rightAxis.y = 0;

        if (this.input.isKey("KeyA")) {
            this.leftAxis.x = -1;
        }
        if (this.input.isKey("KeyD")) {
            this.leftAxis.x = 1;
        }
        if (this.input.isKey("KeyW")) {
            this.leftAxis.y = 1;
        }
        if (this.input.isKey("KeyS")) {
            this.leftAxis.y = -1;
        }
        if (this.input.isKey("ArrowLeft")) {
            this.rightAxis.x = -1;
        }
        if (this.input.isKey("ArrowRight")) {
            this.rightAxis.x = 1;
        }
        if (this.input.isKey("ArrowUp")) {
            this.rightAxis.y = 1;
        }
        if (this.input.isKey("ArrowDown")) {
            this.rightAxis.y = -1;
        }

        if (this.input.isKeyDown("F2")) {
            this._editing = !this._editing;
            this.reset();
        }

        if (this.input.isKeyDown("F3")) {
            this._displayFrustum = !this._displayFrustum;
            this.reset();
        }

        if (this.input.isKeyDown("F4")) {
            this.renderer.displayDirectionalMap = !this.renderer.displayDirectionalMap;
        }

        if (this.input.isKeyDown("F5")) {
            this.renderer.displayPointMap = !this.renderer.displayPointMap;
        }

        if (this.input.isKeyDown("F6")) {
            this.renderer.displayPointMapIndex = ++this.renderer.displayPointMapIndex % 6;
        }

        // speed to use
        const sd = this.timer.delta;

        if (this._editing) {
            const speed = 100.0 / 120;

            // allow camera distance update if modifier is active
            if (modifierOne) {
                this._cameraDistance = this._cameraDistance - (0.5 * 1 * speed * this.rightAxis.y);
                this._cameraDistance = Math.max(Math.min(this._cameraDistance, 2 * 128.0), 4.0)
            }
            else {
                // update
                this._cameraDegrees.x = Utils.wrap(this._cameraDegrees.x - (speed * this.rightAxis.y), 360);
                this._cameraDegrees.y = Utils.wrap(this._cameraDegrees.y + (speed * this.rightAxis.x), 360);
            }

            this._cameraTarget = this._cameraTarget.add(
                Quaternion.degrees(0, this._cameraDegrees.y, 0).rotateVector(Vector3.forward).scale(0.5 * speed * this.leftAxis.y));
            this._cameraTarget = this._cameraTarget.add(
                Quaternion.degrees(0, this._cameraDegrees.y, 0).rotateVector(Vector3.right).scale(0.5 * speed * this.leftAxis.x));

            const rotation = Quaternion.degrees(
                this._cameraDegrees.x, this._cameraDegrees.y, this._cameraDegrees.z).normalize();

            const position = this._cameraTarget.subtract(
                rotation.direction.scale(this._cameraDistance));

            // update camera with final position and rotation
            this.camera.transform.update(position, rotation, Vector3.one);
        }
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

        // update camera aspect
        this.camera.aspect(this.graphics.aspect);

        // render
        this.render();
    }

    private render(): void {

        // start rendering with background color and depth
        this.renderer.capture(this.camera, Color.black, 1.0, () => {


            // output diagnostics
            this.renderer.writeLine(0, `FPS:${Math.round(this.timer.fps)} - APS:${Math.round(this.timer.aps)}`);
            this.renderer.writeLine(1, `Editing: ${this._editing}`);
        });
    }
}
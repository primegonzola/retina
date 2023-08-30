import {
    Block,
    Box,
    BoxIntersection,
    BufferKindOptions,
    Camera,
    CameraKindOptions,
    Color,
    GraphicsDevice,
    InputDevice,
    Light,
    ModelKindOptions,
    Quaternion,
    Range,
    Rectangle,
    Renderer,
    Resources,
    Sector,
    Shape,
    SimulationTimer,
    Transform,
    Utils,
    Vector2,
    Vector3,
    World,
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
    public readonly world: World;

    public _shapes: Map<string, Shape> = new Map<string, Shape>();
    private _editing: boolean = true;
    private _cameraDistance: number = 24;
    private _cameraDegrees: Vector3 = new Vector3(-45, 0, 0);
    private _cameraTarget: Vector3 = Vector3.zero;
    private _currentModel: Block;
    private _displayFrustum = false;

    protected constructor(graphics: GraphicsDevice, input: InputDevice) {
        // init
        this.graphics = graphics;
        this.input = input;
        this.timer = new SimulationTimer();
        this.resources = new Resources(this);
        this.renderer = new Renderer(this, Color.trBlack, 1.0);
        this.world = new World(this);

        this.camera = new Camera(
            CameraKindOptions.Perspective,
            Transform.identity,
            Rectangle.screen, new Range(1.0, 256));

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

        // load test yaml
        await platform.resources.loadTestByUri(
            "resources/test.yaml");

        // generate world
        await platform.world.generate();

        // reset
        platform.reset();

        const uniformBufferSize =
            4 * 4 * 4 + // modelViewProjectionMatrix : mat4x4<f32>
            3 * 4 + // right : vec3<f32>
            4 + // padding
            3 * 4 + // up : vec3<f32>
            4 + // padding
            0;

        const gtf = new Transform(
            Vector3.zero,
            Quaternion.identity,
            Vector3.one.scale(12));
        // add shapes
        platform._shapes.set("grid", new Shape(
            platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(gtf.model.values, gtf.model.inverse.transpose.values)),
            Transform.identity.model,
            platform.resources.getMesh("platform", "grid"),
            platform.resources.getMaterial("platform", "grid")));

        platform._shapes.set("shape1", new Shape(
            platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(Transform.identity.model.values, Transform.identity.model.inverse.transpose.values)),
            Transform.identity.model,
            platform.resources.getMesh("platform", "cube"),
            platform.resources.getMaterial("platform", "red")));

        platform._shapes.set("shape2", new Shape(
            platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(Transform.identity.model.values, Transform.identity.model.inverse.transpose.values)),
            Transform.identity.model,
            platform.resources.getMesh("platform", "cube"),
            platform.resources.getMaterial("platform", "green")));

        platform._shapes.set("shape3", new Shape(
            platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(Transform.identity.model.values, Transform.identity.model.inverse.transpose.values)),
            Transform.identity.model,
            platform.resources.getMesh("platform", "cube"),
            platform.resources.getMaterial("platform", "blue")));

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
            this._cameraTarget = this.world.player.transform.position;
        }
        else {
            this._cameraDistance = 16;
            this._cameraDegrees = new Vector3(-90, 0, 0);
            this._cameraTarget = Vector3.zero;
        }
    }

    public processInput(): void {
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
        else {
            const speed = 1.0 / 8;

            // get player transform
            const ptf = Transform.matrix(this.world.player.graph);

            // get current position & rotation
            let position = ptf.position;
            let rotation = ptf.rotation;

            // get normalized move direction
            const npos = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

            // update position
            position = ptf.position.add(
                new Vector3(speed * npos.x, 0, -speed * npos.z));

            // create normalized target otation
            const direction = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

            // rotate into move drection if any rotation
            if (!Vector3.zero.equals(direction)) {
                // update rotation
                rotation = rotation.slerp(
                    Quaternion.lookRotation(direction),
                    2 * speed);
            }

            // slerp etc
            position = position.lerp(position, 2 * sd);

            // camera distances
            let cd = 24;
            let minc = 16;
            let maxc = 32;

            // get current sector
            const sector = this.world.sector;

            // see if valid
            if (sector !== null) {

                // get sector graph
                const sg = Transform.matrix(sector.graph);

                // scale to total area
                const area = new Vector3(sg.scale.x, 0, sg.scale.z).magnitude;

                // get distance from center
                const distance = position.subtract(sg.position).magnitude;

                // calculate cd
                if (distance !== 0)
                    cd = maxc - ((maxc - minc) * (distance / area));

                // start with current block
                let targetModel: Block = undefined;

                // check if intersecting
                for (let i = 0; i < sector.models.count; i++) {

                    // get block
                    const block = sector.models.item(i) as Block;

                    // get block transform
                    const btf = Transform.matrix(block.graph);
                    let result = new BoxIntersection();

                    // check intersection with player
                    if (Box.intersects(
                        new Box(position, rotation, ptf.scale),
                        new Box(btf.position, btf.rotation, btf.scale),
                        result)) {

                        // update postion
                        if (block.kind !== ModelKindOptions.Transparent &&
                            block.kind !== ModelKindOptions.Gate) {

                            // update postion
                            position = position.subtract(result.axis.scale(result.distance))
                        }

                        // set as target
                        targetModel = block;

                        // done
                        break;
                    }
                }

                // trigger leave when not found or different one
                if (this._currentModel && (!targetModel || this._currentModel.id !== targetModel.id))
                    this._currentModel.trigger("leave");

                // update block and trigger
                if (!(this._currentModel && targetModel && this._currentModel.id === targetModel.id)) {
                    this._currentModel = targetModel;
                    if (this._currentModel && this._currentModel.kind == ModelKindOptions.Gate)
                        this._currentModel.trigger("enter");
                }
            }

            // final cd
            cd = Math.max(Math.min(cd, maxc), minc);

            // new camera position
            let ncpos = this.world.player.transform.position.add(new Vector3(0, cd, 0));
            let cpos = this.camera.transform.position.lerp(ncpos, 0.25 * speed);

            // update player transform
            this.world.player.transform.update(position, rotation, ptf.scale);

            // set camera
            this.camera.transform.update(
                new Vector3(ptf.position.x, cpos.y, ptf.position.z),
                Quaternion.degrees(-90, 0, 0),
                this.camera.transform.scale
            );
        }
    }

    public async update(): Promise<void> {

        // wait to get rid of async warning
        await Utils.delay(0);

        // update timer
        this.timer.update();

        // update world
        this.world.update();

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

    private sectors(camera: Camera, sectors: Sector[], clip = true): Sector[] {

        // early exit
        if (!clip) return sectors.slice();

        // sectors found intersecting with frustum
        const found: Sector[] = [];

        // create frustum
        const frustum = camera.frustum;

        // loop over sectors
        sectors.forEach(sector => {

            // cache graph
            const graph = sector.graph;

            // check if inside frustum
            if (frustum.wbox(graph.position, graph.rotation, graph.scale))
                found.push(sector);
        });

        // all done 
        return found;
    }

    private render(): void {

        // handy extractor
        const extract = (sectors: Sector[]): Shape[] => {
            const shapes: Shape[] = [];
            sectors.forEach(sector => shapes.push(...sector.extract([])));
            return shapes;
        };

        // lights to use for rendering
        let lights: Light[] = [];

        // get visible sectors with clipping enabled
        const vsectors = this.sectors(
            this.camera, this.world.sectors.children as Sector[], true);

        // assure all have a light for debugging purposes
        vsectors.forEach(sector => {
            // check if center light is there
            if (!sector.lights.has("center")) {
                const gtf = Transform.matrix(sector.graph);
                // create center light in world coordinates 4 units above center of sector
                sector.lights.set("center", Light.createPoint(
                    new Transform(
                        gtf.position.add(new Vector3(0, 4, 0)), Quaternion.identity, Vector3.one),
                    Color.random(),
                    4.0,
                    0.0,
                    1.0,
                    0.09,
                    0.032, new Range(1, 4)));
            }
        });

        // get all lights that are visible in the sectors
        let plights = vsectors.map(sector => sector.lights.get("center"));

        // check visible ones
        plights = plights.filter(light => {
            // calculate direction
            const ld = light.transform.position.subtract(
                this.camera.transform.position).normalize();
            const cd = this.camera.transform.rotation.direction;
            // check dot
            return cd.dot(ld) > 0;
        });

        // sort by distance
        plights = plights.sort((a, b) =>
            a.transform.position.subtract(this.camera.transform.position).magnitude -
            b.transform.position.subtract(this.camera.transform.position).magnitude);

        // calculate main bounds of all visible sectors
        // in the end we will have a bounding box surrounding all visible sectors
        const wbs = vsectors.map(sector => new Box(sector.graph.position, sector.graph.rotation, sector.graph.scale).bounds);

        // get directional camera using current camera and the rotation of the light
        const camera = Camera.directional(wbs, this.world.directional.degrees);

        // construct light from camera
        const directional = Light.createDirectional(
            camera.transform, Color.white, 1.0, camera.area, camera.range,
        );

        // get shadow sectors using provided camera
        const ssectors = this.sectors(
            camera, this.world.sectors.children as Sector[], true);

        // extract shadows using directional light camera
        // this.renderer.shadow(camera, extract(ssectors));
        this.renderer.shadow(camera, extract(ssectors));

        // update grid size & scale
        const gtf = new Transform(
            Vector3.zero,
            Quaternion.identity,
            Vector3.one.multiply(new Vector3(512, 1, 512)));

        this._shapes.get("grid").model.write(
            [].concat(
                gtf.model.values,
                gtf.model.inverse.transpose.values)
        );

        // loop over sectors and extract shapes using main camera
        let shapes: Shape[] = extract(vsectors);

        // add shapes
        if (this._displayFrustum) {
            shapes.push(this._shapes.get("shape1"));
            // shapes.push(this._shapes.get("shape2"));
            shapes.push(this._shapes.get("shape3"));
        }

        // add grid
        shapes.push(this._shapes.get("grid"));

        // push directional light && point lights
        lights = lights.concat(directional, plights);

        // start rendering with background color and depth
        this.renderer.capture(this.camera, Color.black, 1.0, () => {

            // render extracted shapes on main camera
            this.renderer.shapes(lights, shapes);

            // render text
            this.renderer.writeLine(0, `FPS:${Math.round(this.timer.fps)} - APS:${Math.round(this.timer.aps)}`);
            this.renderer.writeLine(1, `Shapes: ${shapes.length}`);
            this.renderer.writeLine(2, `Lights: ${lights.length}`);
            this.renderer.writeLine(3, `Point Map: ${this.renderer.displayPointMapIndex}`);
            this.renderer.writeLine(4, `Editing: ${this._editing}`);

            // render lines
            this.renderer.lines();
        });
    }
}
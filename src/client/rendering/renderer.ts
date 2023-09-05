import {
    BufferKindOptions,
    Cache,
    Camera,
    Color,
    Frustum,
    Hull,
    IBuffer,
    Matrix4,
    ModelMeshEntry,
    Platform,
    Quaternion,
    RenderTarget,
    Shape,
    Size,
    TextureDimensionOptions,
    Vector3,
    Vector4,
} from "../index";

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

    // buffers
    private _screen?: IBuffer;

    private _screenLines?: string[];
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

            // destroy main target 
            this._target?.destroy();

            // destroy swap target
            this._swap?.destroy();

            // init screen camera for text rendering
            this._screen = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(
                    Vector4.toNumbers([Vector4.xyz(Camera.screen().view.inverse.position, 1)]),
                    Camera.screen().view.values, Camera.screen().projection.values));

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

        // destroy main target
        this._target?.destroy();

        // destroy swap target
        this._swap?.destroy();
    }

    private _draw(hull: Hull) {

        // check if buffers is there
        if (hull?.buffers) {

            // see if indices are there
            if (hull.buffers.has("indices")) {

                // set indices
                this._target?.bindIndices(hull.buffers.get("indices"));

                // draw indexed
                this._target?.drawIndexed(hull.buffers.get("indices").count);
            }
            else if (hull.buffers.has("positions")) {

                // draw non-indexed
                this._target?.draw(hull.buffers.get("positions").count);
            }
        }
    }

    public render(frustum: Frustum, hulls: Iterable<Hull>): void {

        // ensure initialized
        this._ensureInitialized();

        // loop over hulls
        for (const hull of hulls) {

            // cache graph
            const graph = hull.graph;

            // check if intersecting
            if (frustum.wbox(graph.position, graph.rotation, graph.scale)) {

                // get shader
                const shader = hull.shader;

                // check if shader
                if (shader) {

                    // bind camera
                    this._target?.bindCamera(shader);

                    // bind pipeline
                    this._target?.bindPipeline(shader, true, true);

                    // check to bind buffers
                    if (hull?.buffers)
                        this._target?.bindBuffers(shader, hull.buffers);

                    // check to bind model
                    if (hull?.model)
                        this._target?.bindUniform(shader, "model", "model", hull.model);

                    // check to bind properties
                    if (hull?.properties)
                        this._target?.bindUniform(shader, "material", "properties", hull.properties);

                    // bind textures
                    if (hull?.textures)
                        this._target?.bindTextures(shader, null, hull.textures);

                    // // render the hull
                    this._draw(hull);
                }
            }
        }
    }
}
import {
    BufferKindOptions,
    Cache,
    Camera,
    Color,
    Font,
    IBuffer,
    Matrix4,
    Platform,
    Quaternion,
    RenderTarget,
    RenderDataDestroyOptions,
    Shape,
    Size,
    Vector3,
    Utils,
    RenderData,
    ModelMeshEntry,
} from "../index";
import { Panel } from "./panel";

export class Renderer {
    public platform: Platform;
    private _size: Size
    private _target?: RenderTarget;
    private _swap?: RenderTarget;
    private _screenCamera?: IBuffer;
    private _renderCamera?: IBuffer;
    private _screenLines?: string[];
    private _direct: boolean = false;
    private _internalSize = new Size(2048, 2048);
    private _panelCache: Cache;

    private static readonly SCREEN_LINES_COUNT = 10;

    public get aspect(): number {
        return this._size.width / this._size.height;
    }

    constructor(platform: Platform) {

        // initialize renderer
        this.platform = platform;
        this._size = Size.zero;
        this._panelCache = new Cache();
        this._screenLines = new Array(Renderer.SCREEN_LINES_COUNT).fill("");
    }

    private ensureInitialized() {

        // check screen size changed
        if (!this._size.equals(this.platform.graphics.size)) {

            // update new size
            this._size = this.platform.graphics.size;

            // destroy camera
            this._screenCamera?.destroy();

            // destroy camera
            this._renderCamera?.destroy();

            // destroy target 
            this._target?.destroy();

            // destroy blit
            this._swap?.destroy();

            // init camera
            this._screenCamera = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(Matrix4.identity.values, Matrix4.identity.inverse.transpose.values));

            // init camera
            this._renderCamera = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
                [].concat(Matrix4.identity.values, Matrix4.identity.inverse.transpose.values));

            // create new targets
            this._target = new RenderTarget(this.platform,
                this._direct ? this._size : this._internalSize);

            // create swap target
            this._swap = new RenderTarget(this.platform, this._size);
        }
    }

    public capture(color: Color, depth: number, action: () => void): void {

        // ensure initialized
        this.ensureInitialized();

        // delegate to target
        this._target?.capture(this._direct, color, depth, action);

        // blit to screen if required
        if (!this._direct) this._blit();
    }

    private _blit(): void {

        // create camera 
        const camera = Camera.screen(this.platform, 1.0);

        // update camera
        this._screenCamera.write(
            [].concat(camera.view.values, camera.projection.values));

        // init
        const blit = new Shape(
            Utils.uuid(),
            Matrix4.construct(Vector3.zero, Quaternion.identity, Vector3.one),
            this.platform.resources.getMesh("platform", "blit"),
            this.platform.resources.getMaterial("platform", "blit"));

        // extract shape info
        this.extractShape(blit, true);

        // override texture buffer
        blit.textures.set("albedo", this._target?.buffers[0].albedo);

        // override pipeline
        this._swap.pipeline(true, false);

        // delegate to blit
        this._swap?.capture(!this._direct, Color.red, 1.0,
            () => this._swap.render(this._screenCamera, [blit]));

        // clean up shape
        blit.destroy(RenderDataDestroyOptions.None);
    }

    private extractModel(model: Matrix4): IBuffer {
        return this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform,
            [].concat(model.values, model.inverse.transpose.values));
    }

    private extractShape(shape: Shape, extractModel: boolean): void {

        // copy mesh buffers into shape
        shape.mesh.buffers.forEach((value, key) =>
            shape.buffers.set(key, value));

        // check if model is already present or not
        if (!shape.uniforms.has("model") && extractModel) {
            shape.uniforms.set("model",
                this.extractModel(shape.world));
        }

        // copy material properties into shape
        shape.uniforms.set("properties",
            shape.material.uniforms.get("properties"));

        //  copy material textures into shape
        shape.material.textures.forEach((value, key) =>
            shape.textures.set(key, value.key));
    }

    public render(camera: Camera, shapes: Shape[]): void {

        // override pipeline
        this._target.pipeline(true, true);

        // update camera
        this._renderCamera.write(
            [].concat(camera.view.values, camera.projection.values));

        // extract shape info
        shapes.forEach(shape => this.extractShape(shape, true));

        // render shapes
        this._target?.render(this._renderCamera, shapes);
    }

    public writeLine(index: number, text: string): void {

        // add it to the screen lines
        if (index < this._screenLines.length)
            this._screenLines[index] = text;
    }

    private renderLine(name: string, model: Matrix4, line: string): void {

        // get font
        const font = this.platform.resources.getFont("platform", name);

        // get mesh
        const entry = font.cacheItem(line, model, 5000);

        // create camera 
        const camera = Camera.screen(this.platform, 1.0);

        // update camera
        this._screenCamera.write(
            [].concat(camera.view.values, camera.projection.values));

        // init shape
        const text = new Shape(
            Utils.uuid(),
            model,
            entry.mesh,
            this.platform.resources.getMaterial("platform", name));

        // extract shape info
        this.extractShape(text, false);

        // override mode
        text.uniforms.set("model", entry.model);

        // override texture buffer
        text.textures.set("albedo",
            this.platform.resources.getTexture("platform", name));

        // override pipeline, enable transparency, ignore depth
        this._target.pipeline(true, false);

        // delegate to target
        this._target?.render(this._screenCamera, [text]);

        // clean up shape
        text.destroy(RenderDataDestroyOptions.None);
    }

    public renderLines(): void {
        // define size
        const size = 0.0025 * 0.25;
        const height = 0.025;
        const aspect = this.platform.graphics.aspect;

        // loop over lines
        this._screenLines?.forEach((line, index) => {

            // define model
            const model = Matrix4.construct(
                Vector3.zero.add(new Vector3(-0.5, 0.5 - index * height * aspect, 0.5)),
                Quaternion.identity, new Vector3(size, size * aspect, 1.0));

            // render line
            this.renderLine("arial-32", model, line);
        });
    }

    public destroy(): void {

        // destroy camera
        this._renderCamera?.destroy();

        // destroy target
        this._target?.destroy();

        // destroy blit
        this._swap?.destroy();
    }

    public renderPanel(panel: Panel) {
        // draw if material is present
        if (panel.material)
            this.drawPanel(panel);

        // loop over children and render each one
        panel.children.forEach(child => this.renderPanel(child));
    }

    private drawPanel(panel: Panel) {

        // default duration
        const duration = 5000;

        // create camera 
        const camera = Camera.screen(this.platform, 1.0);

        // get panel model
        const model = panel.model();

        // cache entry
        const entry = this._panelCache.cacheItem(panel.id, (entry) => {

            // construct final model
            const fmodel = [].concat(model.values, model.inverse.transpose.values);

            // check if existing
            if (entry) {
                // update
                entry.duration = duration;
                // update buffer
                (entry as ModelMeshEntry).model.write(fmodel);
            }
            else
                // create cache entry
                return new ModelMeshEntry(panel.id, duration,
                    this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, fmodel),
                    this.platform.resources.getMesh("platform", "panel"));
        }) as ModelMeshEntry;

        // update camera
        this._screenCamera.write(
            [].concat(camera.view.values, camera.projection.values));

        // init shape
        const shape = new Shape(
            Utils.uuid(),
            model,
            entry.mesh,
            panel.material);

        // extract shape info
        this.extractShape(shape, false);

        // override model
        shape.uniforms.set("model", entry.model);

        // override pipeline, enable transparency, ignore depth
        this._target.pipeline(false, false);

        // delegate to target
        this._target?.render(this._screenCamera, [shape]);

        // clean up shape
        shape.destroy(RenderDataDestroyOptions.None);
    }
}
import {
    BufferKindOptions,
    IBuffer,
    Matrix4,
    Platform,
    Transform,
    Utils
} from "./index";

export class SimulationTimer {
    private _started: number;
    private _last: number;
    private _delta: number;
    private _frames: number;
    private _fps: number;
    private _total: number;
    private _interval: number;

    constructor() {
        this._started = performance.now();
        this._last = this._started;
        this._frames = 0;
        this._delta = 0;
        this._fps = 0;
        this._interval = 240
        this._total = 1;
    }

    public get delta(): number {
        return this._delta;
    }

    public get aps(): number {
        return 1000 * this._frames / (performance.now() - this._started);
    }

    public get rps(): number {
        return 1000 / this._delta;
    }

    public get fps(): number {
        return this._fps;
    }

    public update(): void {
        // get current time
        const now = performance.now();

        // calculate delta
        this._delta = now - this._last;

        // increment
        this._total = this._total + this._delta;

        // update frames
        this._frames = this._frames + 1;

        // check
        if (this._frames % this._interval === 0) {
            // calculate fps
            this._fps = 1000 * this._interval / this._total;
            // reset total
            this._total = 0;
        }

        // update last
        this._last = now;
    }
}


export abstract class SimulationObject<T> {
    public readonly id: string;
    public readonly platform: Platform;
    public readonly transform: Transform;
    public readonly parent: SimulationObject<T> | undefined;
    public readonly children: SimulationObject<T>[];
    private _model: IBuffer | undefined;

    constructor(platform: Platform, parent: SimulationObject<T>) {
        // init
        this.id = Utils.uuid();
        this.parent = parent;
        this.platform = platform;
        this.transform = Transform.identity;
        this.children = [];

        // add change handler
        this.transform.notify(() => {
            // cache graph
            const graph = this.graph;

            // get data
            const data = [].concat(graph.values, graph.inverse.transpose.values);

            // create if needed or update
            if (this._model === undefined)
                this._model = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, data);
            else
                this._model.write(data);

        });

        // init
        this.transform.update();
    }

    public child(index: number): T {
        return this.children[index] as T;
    }

    public get model(): IBuffer | undefined {
        return this._model;
    }

    public get graph(): Matrix4 {
        return this.parent ?
            this.parent.graph.multiply(this.transform.model) : Matrix4.identity.multiply(this.transform.model);
    }

    public update(): void {
        // collect updates
        for (let i = 0; i < this.children.length; i++)
            this.children[i].update();
    }

    public destroy(): void {
        // destroy children
        for (let i = 0; i < this.children.length; i++)
            this.children[i].destroy();

        // all done
        this.children.length = 0;

        // destroy self
        if (this._model !== undefined)
            this._model.destroy();

        // all done
        this._model = undefined;
    }
}

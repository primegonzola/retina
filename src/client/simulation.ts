import {
    BufferKindOptions,
    IBuffer,
    Matrix4,
    Platform,
    Transform
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


export abstract class SimulationObject {
    public readonly platform: Platform;
    public readonly transform: Transform;
    public readonly name: string;
    public readonly parent: SimulationObject | undefined;
    public readonly children: SimulationObjectCollection;
    public readonly uniforms: Map<string, IBuffer>;

    constructor(platform: Platform, parent: SimulationObject, name: string) {
        // init
        this.parent = parent;
        this.platform = platform;
        this.name = name;
        this.uniforms = new Map<string, IBuffer>();
        this.transform = Transform.identity;
        this.children = new SimulationObjectCollection(this.platform, this, "children");

        // add change handler
        this.transform.notify(() => {

            // see if already there and destroy
            if (this.uniforms.has("model"))
                this.uniforms.get("model").destroy();

            // create new one
            this.uniforms.set("model",
                this.platform.graphics.createF32Buffer(
                    BufferKindOptions.Uniform,
                    [].concat(this.worldGraph, this.worldGraph.inverse.transpose.values)
                ));
        });
    }

    public get worldGraph(): Matrix4 {
        return this.parent ?
            this.parent.worldGraph.multiply(this.transform.world) :
            Matrix4.identity.multiply(this.transform.world);
    }

    public async update(): Promise<void> {
        // create a list of updates
        const updates = new Array<Promise<void>>();

        // collect updates
        for (let i = 0; i < this.children.count; i++)
            updates.push(this.children.get(i).update());

        // execute all updates
        await Promise.all(updates);
    }
}

export class SimulationObjectCollection extends SimulationObject {
    private readonly _objects: SimulationObject[];

    constructor(platform: Platform, parent: SimulationObject, name: string) {
        super(platform, parent, name);
        this._objects = [];
    }

    public get count(): number {
        return this._objects.length;
    }

    public get(index: number): SimulationObject {
        return this._objects[index];
    }

    public add(object: SimulationObject): void {
        this._objects.push(object);
    }

    public remove(object: SimulationObject): void {
        const index = this._objects.indexOf(object);
        if (index >= 0) {
            this._objects.splice(index, 1);
        }
    }

    public clear(): void {
        this._objects.length = 0;
    }
}
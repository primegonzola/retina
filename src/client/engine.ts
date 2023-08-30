import {
    Logger,
    Platform
} from "./index";

export enum EngineStatusOptions {
    Idle = "idle",
    Running = "running",
}

export type EngineRunOptions = {
    graphics: string;
}

export class Engine {
    private _platform?: Platform;
    private _status: EngineStatusOptions = EngineStatusOptions.Idle;
    private _options: EngineRunOptions;

    constructor(options: EngineRunOptions) {
        // init
        this._options = options;
    }

    public get platform(): Platform | undefined {
        return this._platform;
    }

    public get status(): EngineStatusOptions | undefined {
        return this._status;
    }

    public static async run(options: EngineRunOptions): Promise<void> {

        // create new engine
        const engine = new Engine(options);

        // start engine
        await engine.start();
    }

    public async start(): Promise<void> {

        // log
        Logger.verbose("starting engine");

        // create the platform
        this._platform = await Platform.create(this._options.graphics);

        // all went fine
        this._status = EngineStatusOptions.Running;

        // log
        Logger.verbose("engine started");

        // start the cycle
        await this.update();
    }

    private async update(): Promise<void> {

        // set proper size of graphics 
        const graphics = document.getElementById(this._options.graphics) as HTMLCanvasElement;

        // maximize canvas
        graphics.width = window.innerWidth;
        graphics.height = window.innerHeight;

        // check if running
        if (this.status === EngineStatusOptions.Running) {

            // request new animation frame
            window.requestAnimationFrame(async (_dt) => {

                // update kernel
                await this._platform?.update();

                // execute next cycle
                await this.update();
            });
        }
    }

    public async stop(): Promise<void> {
        // log3
        Logger.verbose("stopping engine");

        // destroy platform
        await this._platform?.destroy();

        // all went fine
        this._status = EngineStatusOptions.Idle;

        // log
        Logger.verbose("engine stopped");
    }
}
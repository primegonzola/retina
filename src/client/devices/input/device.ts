export type InputKeyState = {
    key: string;
    code: string;
    state: boolean;
    up: boolean;
    down: boolean;
}

export class InputDevice {

    private readonly _handle?: HTMLCanvasElement;
    private readonly _keys: Map<string, InputKeyState>;

    constructor(handle: HTMLCanvasElement) {

        // init
        this._handle = handle;
        this._keys = new Map<string, InputKeyState>();

        // attach handlers
        document.addEventListener("keydown", evt => this.processEvent("keydown", evt));
        document.addEventListener("keyup", evt => this.processEvent("keyup", evt));
        window.addEventListener('mousemove', evt => this.processEvent("mousemove", evt));
        window.addEventListener('mousedown', evt => this.processEvent("mousedown", evt));
        window.addEventListener('mouseup', evt => this.processEvent("mouseup", evt));
        // window.addEventListener("gamepadconnected", evt => this.processEvent("gamepadconnected", evt));
        window.addEventListener("gamepaddisconnected", evt => this.processEvent("gamepaddisconnected", evt));
        window.addEventListener("gamepadconnected", (e) => {
            console.log(
                "Gamepad connected at index %d: %s. %d buttons, %d axes.",
                e.gamepad.index,
                e.gamepad.id,
                e.gamepad.buttons.length,
                e.gamepad.axes.length
            );
        });
    }

    public static async create(id: string): Promise<InputDevice> {
        // get canvas
        const canvas = document.querySelector("#" + id) as HTMLCanvasElement;

        // create device
        return new InputDevice(canvas);
    }

    private processEvent(name: string, evt: unknown): void {
        // check name
        switch (name) {
            case "keydown": {
                const tevt = evt as KeyboardEvent;
                if (!this._keys.has(tevt.code))
                    this._keys.set(tevt.code, {
                        key: tevt.key,
                        code: tevt.code,
                        up: false,
                        down: true,
                        state: true
                    });
                else {
                    this._keys.get(tevt.code).up = false;
                    this._keys.get(tevt.code).down = true;
                    this._keys.get(tevt.code).state = true;
                }
                break;
            }
            case "keyup": {
                const tevt = evt as KeyboardEvent;
                if (!this._keys.has(tevt.code))
                    this._keys.set(tevt.code, {
                        key: tevt.code,
                        code: tevt.code,
                        up: true,
                        down: false,
                        state: false
                    });
                else {
                    this._keys.get(tevt.code).up = true;
                    this._keys.get(tevt.code).down = false;
                    this._keys.get(tevt.code).state = false;
                }
                break;
            }
        }
    }

    public async update(): Promise<void> {
        // loop through keys and reset
        Array.from(this._keys.values()).forEach(key => {
            key.up = false;
            key.down = false;
        });
    }

    public destroy(): void {

    }

    public isKey(key: string): boolean {
        return this._keys.has(key) && this._keys.get(key).state;
    }

    public isKeyUp(key: string): boolean {
        return this._keys.has(key) && this._keys.get(key).up;
    }

    public isKeyDown(key: string): boolean {
        return this._keys.has(key) && this._keys.get(key).down;
    }
}
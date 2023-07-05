import {
    Vector2
} from "../../index";

export enum InputDeviceKindOptions {
    Keyboard = "keyboard",
    Gamepad = "gamepad",
    Mouse = "mouse"
}

export enum InputControlKindOptions {
    Axis = "axis",
    Tap = "tap"
}

// https://w3c.github.io/gamepad/#dom-gamepad-mapping
export enum InputGamepadButtonOptions {
    BRC = 0,  // buttons[0]     Bottom button in right cluster
    RRC = 1,  // buttons[1]	    Right button in right cluster
    LRC = 2,  // buttons[2]	    Left button in right cluster
    TRC = 3,  // buttons[3]	    Top button in right cluster
    TLF = 4,  // buttons[4]	    Top left front button
    TRF = 5,  // buttons[5]	    Top right front button
    BLF = 6,  // buttons[6]	    Bottom left front button
    BRF = 7,  // buttons[7]	    Bottom right front button
    LCC = 8,  // buttons[8]	    Left button in center cluster
    RCC = 9,  // buttons[9]	    Right button in center cluster
    LSP = 10, // buttons[10]	Left stick pressed button
    RSP = 11, // buttons[11]	Right stick pressed button
    TLC = 12, // buttons[12]	Top button in left cluster
    BLC = 13, // buttons[13]	Bottom button in left cluster
    LLC = 14, // buttons[14]	Left button in left cluster
    RLC = 15, // buttons[15]	Right button in left cluster
    CCC = 16, // buttons[16]	Center button in center cluster    
}

export enum InputGamepadAxisOptions {
    LHA = 0, // axes[0]	Horizontal axis for left stick (negative left/positive right)
    LVA = 1, // axes[1]	Vertical axis for left stick (negative up/positive down)
    RHA = 2, // axes[2]	Horizontal axis for right stick (negative left/positive right)
    RVA = 3, // axes[3]	Vertical axis for right stick (negative up/positive down)
}

type InputKeyboardState = {
    keys: Map<string, boolean>;
};

type InputMouseState = {
    position: Vector2;
    buttons: Map<number, boolean>;
};

type InputGamepadState = {
    id: unknown;
    axises: Map<InputGamepadAxisOptions, number>;
    buttons: Map<InputGamepadButtonOptions, number>;
};

type InputState = {
    deviceType: InputDeviceKindOptions;
    previous?: InputKeyboardState | InputMouseState | InputGamepadState;
    current?: InputKeyboardState | InputMouseState | InputGamepadState;
};

export class InputDeviceMapActionBinding {
    readonly device: InputDeviceKindOptions;
    readonly values: Array<Array<string>>;

    constructor(device: InputDeviceKindOptions, values: Array<Array<string>>) {
        // init
        this.device = device;
        this.values = values;
    }
}

export class InputDeviceMapAction {
    public readonly name: string;
    public readonly kind: InputControlKindOptions;
    public readonly bindings: Map<InputDeviceKindOptions, InputDeviceMapActionBinding>;

    constructor(name: string, kind: InputControlKindOptions) {
        // init
        this.name = name;
        this.kind = kind;
        this.bindings = new Map<InputDeviceKindOptions, InputDeviceMapActionBinding>();
    }
}

export class InputDeviceMap {
    public readonly name: string;
    public readonly actions: Map<string, InputDeviceMapAction>;

    constructor(name: string) {
        // init
        this.name = name;
        this.actions = new Map<string, InputDeviceMapAction>();
    }
}


export class InputDevice {

    private readonly _handle?: HTMLCanvasElement;
    private readonly states: Map<InputDeviceKindOptions, InputState>;
    public readonly maps: Map<string, InputDeviceMap>;

    constructor(handle: HTMLCanvasElement) {

        // init
        this._handle = handle;
        this.states = new Map<InputDeviceKindOptions, InputState>();
        this.maps = new Map<string, InputDeviceMap>();

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
        // console.log(`${name}: ${evt}`);
    }

    public async update(): Promise<void> {
        // get available gamepads
        const gps = navigator.getGamepads();
        // iterate over gamepads
        for (let i = 0; i < gps.length; i++) {
            if (gps[i] !== null) {
                console.log(gps[i]);
            }
        }
    }

    public destroy(): void {

    }
}
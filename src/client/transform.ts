import {
    Matrix4,
    Quaternion,
    Vector3
} from "./index";


export class Transform {
    public readonly position: Vector3;
    public readonly rotation: Quaternion;
    public readonly scale: Vector3;
    private readonly handlers: Array<() => void> = [];

    constructor(position: Vector3, rotation: Quaternion, scale: Vector3) {
        this.position = new Proxy(position, {
            set: (target, property, value) => {
                this.notifyHandlers();
                return Reflect.set(target, property, value);
            }
        });
        this.rotation = new Proxy(rotation, {
            set: (target, property, value) => {
                this.notifyHandlers();
                return Reflect.set(target, property, value);
            }
        });
        this.scale = new Proxy(scale, {
            set: (target, property, value) => {
                this.notifyHandlers();
                return Reflect.set(target, property, value);
            }
        });
    }

    private notifyHandlers(): void {
        this.handlers.forEach(handler => handler());
    }

    public notify(handler: () => void): void {
        this.handlers.push(handler);
    }

    public get world(): Matrix4 {
        // convert
        return Matrix4.construct(this.position, this.rotation, this.scale);
    }

    public static get identity(): Transform {
        return new Transform(
            Vector3.zero,
            Quaternion.identity,
            Vector3.one
        );
    }

    public static fromMatrix(world: Matrix4): Transform {
        return new Transform(
            world.deconstructPosition(),
            world.deconstructRotation(),
            world.deconstructScale());
    }
}
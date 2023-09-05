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
    private _notificationsEnabled: boolean = true;

    constructor(position: Vector3, rotation: Quaternion, scale: Vector3) {
        this.position = position;
        this.rotation = rotation;
        this.scale = scale;
    }

    private enableNotifications(enable: boolean): void {
        this._notificationsEnabled = enable;
        this.notifyHandlers();
    }

    private notifyHandlers(): void {
        if (this._notificationsEnabled)
            this.handlers.forEach(handler => handler());
    }

    public notify(handler: () => void): void {
        this.handlers.push(handler);
    }

    public local(transform: Transform): Transform {
        // calculate local transform 
        // GL = GP * WL
        // GP - 1 * GL = GP - 1 * GP * WL
        // GP - 1 * GL = WL
        return Transform.matrix(transform.model.inverse.multiply(
            Matrix4.construct(this.position, this.rotation, this.scale)));
    }

    public get model(): Matrix4 {
        return Matrix4.construct(this.position, this.rotation, this.scale);
    }

    public static get identity(): Transform {
        return new Transform(
            Vector3.zero,
            Quaternion.identity,
            Vector3.one
        );
    }

    public extract(): number[] {
        return [].concat(this.model.values, this.model.inverse.transpose.values);
    }

    public static matrix(world: Matrix4): Transform {
        return new Transform(world.position, world.rotation, world.scale);
    }

    public static construct(position: Vector3, rotation: Quaternion, scale: Vector3): Transform {
        return new Transform(position, rotation, scale);
    }

    public replace(transform: Transform): void {

        // delegate
        this.update(transform.position, transform.rotation, transform.scale);
    }

    public update(position?: Vector3, rotation?: Quaternion, scale?: Vector3): void {

        // disable notifications
        this.enableNotifications(true);

        // init
        position = position || this.position;
        rotation = rotation || this.rotation;
        scale = scale || this.scale;

        // update position
        this.position.x = position.x;
        this.position.y = position.y;
        this.position.z = position.z;

        // update rotation
        this.rotation.x = rotation.x;
        this.rotation.y = rotation.y;
        this.rotation.z = rotation.z;
        this.rotation.w = rotation.w;

        // update scale
        this.scale.x = scale.x;
        this.scale.y = scale.y;
        this.scale.z = scale.z;

        // enable notifications
        this.enableNotifications(true);
    }
}
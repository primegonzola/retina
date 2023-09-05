import {
    Camera,
    Platform,
    Quaternion,
    Utils,
    Vector2,
    Vector3
} from "../index";


export class CameraController {

    public readonly platform: Platform;
    public readonly leftAxis: Vector2;
    public readonly rightAxis: Vector2;
    public readonly camera: Camera;

    public distance: number = 24;
    public degrees: Vector3 = Vector3.zero;
    public target: Vector3 = Vector3.zero;

    constructor(platform: Platform, camera: Camera) {

        // init
        this.platform = platform;
        this.leftAxis = Vector2.zero;
        this.rightAxis = Vector2.zero;
        this.camera = camera;
    }

    public reset(target: Vector3, degrees: Vector3, distance: number): void {
        this.target = target;
        this.distance = distance;
        this.degrees = degrees;
    }

    public update(): void {

        // check modifier
        const modifierOne = this.platform.input.isKey("AltLeft");

        // reset axis
        this.leftAxis.x = 0;
        this.leftAxis.y = 0;
        this.rightAxis.x = 0;
        this.rightAxis.y = 0;

        if (this.platform.input.isKey("KeyA")) {
            this.leftAxis.x = -1;
        }
        if (this.platform.input.isKey("KeyD")) {
            this.leftAxis.x = 1;
        }
        if (this.platform.input.isKey("KeyW")) {
            this.leftAxis.y = 1;
        }
        if (this.platform.input.isKey("KeyS")) {
            this.leftAxis.y = -1;
        }
        if (this.platform.input.isKey("ArrowLeft")) {
            this.rightAxis.x = -1;
        }
        if (this.platform.input.isKey("ArrowRight")) {
            this.rightAxis.x = 1;
        }
        if (this.platform.input.isKey("ArrowUp")) {
            this.rightAxis.y = 1;
        }
        if (this.platform.input.isKey("ArrowDown")) {
            this.rightAxis.y = -1;
        }

        // speed to use
        const sd = this.platform.timer.delta;

        const speed = 100.0 / 120;

        // allow camera distance update if modifier is active
        if (modifierOne) {
            this.distance = this.distance - (0.5 * 1 * speed * this.rightAxis.y);
            this.distance = Math.max(Math.min(this.distance, 2 * 128.0), 4.0)
        }
        else {
            // update
            this.degrees.x = Utils.wrap(this.degrees.x - (speed * this.rightAxis.y), 360);
            this.degrees.y = Utils.wrap(this.degrees.y + (speed * this.rightAxis.x), 360);
        }

        this.target = this.target.add(
            Quaternion.degrees(0, this.degrees.y, 0).rotateVector(Vector3.forward).scale(0.5 * speed * this.leftAxis.y));
        this.target = this.target.add(
            Quaternion.degrees(0, this.degrees.y, 0).rotateVector(Vector3.right).scale(0.5 * speed * this.leftAxis.x));

        const rotation = Quaternion.degrees(
            this.degrees.x, this.degrees.y, this.degrees.z).normalize();

        const position = this.target.subtract(
            rotation.direction.scale(this.distance));

        // update camera with final position and rotation
        this.camera.transform.update(position, rotation, Vector3.one);
    }
}
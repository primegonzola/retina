import {
    Transform
} from "../index";

export class AnimationController {

}

export class Animation {
    public readonly target: Transform;
    public readonly from: Transform;
    public readonly to: Transform;
    public readonly duration: number;

    constructor(target: Transform, from: Transform, to: Transform, duration: number) {
        this.target = target;
        this.from = from;
        this.to = to;
        this.duration = duration;
    }

    public update(dt: number, forward: boolean = true) {
        // update target
        if (forward){
            this.target.update(
                this.from.position.lerp(this.to.position, dt),
                this.from.rotation.slerp(this.to.rotation, dt),
                this.from.scale.lerp(this.to.scale, dt)
            )
        }
        else {
            this.target.update(
                this.to.position.lerp(this.from.position, dt),
                this.to.rotation.slerp(this.from.rotation, dt),
                this.to.scale.lerp(this.from.scale, dt)
            )
        }
    }
}
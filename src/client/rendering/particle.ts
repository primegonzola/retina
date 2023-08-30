import {
    Transform
} from "../index";

export class Particle {
    public readonly transform: Transform;

    public constructor(transform: Transform) {
        // init
        this.transform = transform;
    }
}
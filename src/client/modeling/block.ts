import {
    Camera,
    Material,
    Mesh,
    Model,
    Platform,
    Shape,
    Transform
} from "../index";

export class Block extends Model {

    private readonly shape: Shape;
    private readonly mesh: Mesh;
    private readonly material: Material;

    constructor(parent: Model, name: string, transform: Transform, mesh?: Mesh, material?: Material) {
        super(parent, name, transform);
        // init
        this.mesh = mesh;
        this.material = material;
        this.shape = new Shape(this.id, this.worldGraph, this.mesh, this.material);
    }

    public override extractShapes(platform: Platform, camera: Camera, shapes: Shape[]): Shape[] {
        // assure if valid
        if (!this.mesh || !this.material)
            return shapes;

        // update world of shape
        this.shape.world.copy(this.worldGraph);

        // add shape
        shapes.push(this.shape);

        // all done
        return shapes;
    }
}
import {
    Material,
    Mesh,
    Model,
    ModelKindOptions,
    Platform,
    Shape
} from "../index";


export class Player extends Model {
    public readonly mesh: Mesh;
    public readonly material: Material;
    public readonly shape: Shape;

    constructor(platform: Platform, parent: Model, mesh: Mesh, material: Material) {
        super(platform, parent, ModelKindOptions.Player);
        // init
        this.mesh = mesh;
        this.material = material;
        this.shape = new Shape(this.model, this.transform.model, this.mesh, this.material);
    }

    public extract(shapes: Shape[]): Shape[] {
        // add shape
        shapes.push(this.shape);
        // extract
        return shapes;
    }
}
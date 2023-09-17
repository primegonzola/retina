import {
    Hull,
    Material,
    Mesh,
    Platform,
    Transform,
} from "../index";

export class Model {

    public readonly transform: Transform;
    public readonly platform: Platform;

    constructor(platform: Platform, transform: Transform) {
        // init
        this.transform = transform;
        this.platform = platform;
    }
}

export class Node extends Model {

    public readonly mesh: Mesh;
    public readonly material: Material;
    public readonly nodes: Model[];
    public readonly hull: Hull;

    constructor(platform: Platform, transform: Transform, mesh: Mesh, material: Material, hull: Hull) {
        super(platform, transform);
        // init
        this.mesh = mesh;
        this.material = material;
        this.nodes = [];
        this.hull = hull;
    }
}
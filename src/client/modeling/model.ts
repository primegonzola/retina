import {
    Hull,
    Material,
    Matrix4,
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

    public create(): void {

    }

    public update(): void {

    }

    public destroy(): void {

    }
}

export enum ModelNodeKindOptions {
    Collection,
    None,
    Block,
    Chunk,
    Door,
    Player,
    Universe,
    Galaxy,
    Star,
    Planet,
    Moon
}

export class ModelNode extends Model {

    public readonly mesh: Mesh;
    public readonly material: Material;
    public readonly nodes: ModelNode[];
    public readonly hull: Hull;
    public readonly kind: ModelNodeKindOptions;
    public readonly parent: ModelNode;

    constructor(platform: Platform, parent: ModelNode, kind: ModelNodeKindOptions,
        transform: Transform, mesh?: Mesh, material?: Material, hull?: Hull) {
        super(platform, transform);
        // init
        this.mesh = mesh;
        this.material = material;
        this.nodes = [];
        this.hull = hull;
        this.parent = parent;
    }

    public static none(platform: Platform, parent?: ModelNode): ModelNode {
        return new ModelNode(platform, parent, ModelNodeKindOptions.None, Transform.identity);
    }

    public get graph(): Matrix4 {
        return this.parent ?
            this.parent.graph.multiply(this.transform.model) :
            Matrix4.identity.multiply(this.transform.model);
    }
}

export class ModelNodeCollection extends ModelNode {
    constructor(platform: Platform, parent: ModelNode) {
        super(platform, parent, ModelNodeKindOptions.Collection, Transform.identity);
    }

    public forEach<T>(action: (node: T, index: number) => void): void {
        this.nodes.forEach((node, index) => action(node as T, index));
    }

    public filter<T>(action: (node: ModelNode, index: number) => unknown): T[] {
        return this.nodes.filter(action) as T[];
    }

    public map<T>(action: (node: ModelNode, index: number) => unknown): T[] {
        return this.nodes.map(action) as T[];
    }

    public add(node: ModelNode): void {
        this.nodes.push(node);
    }

    public clear(): void {
        this.nodes.length = 0;
    }
}
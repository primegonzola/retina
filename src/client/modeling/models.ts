import {
    Animation,
    Material,
    Mesh,
    Model,
    ModelKindOptions,
    Platform,
    Quaternion,
    Shape,
    Transform,
    Vector3
} from "../index";

export class Block extends Model {
    public readonly mesh: Mesh;
    public readonly material: Material;
    public readonly shape: Shape;
    public readonly animation: Animation;

    constructor(platform: Platform, parent: Model, kind: ModelKindOptions,
        mesh: Mesh, material: Material, animation?: Animation) {
        super(platform, parent, kind);
        // init
        this.mesh = mesh;
        this.material = material;
        this.animation = animation;
        this.shape = new Shape(this.model, this.transform.model, this.mesh, this.material);
    }

    public override update(): void {
        // call animation
        this.animation?.update(20);
    }

    public extract(shapes: Shape[]): Shape[] {

        // add shape
        shapes.push(this.shape);
        // extract
        return shapes;
    }
}

export class Gate extends Model {
    public readonly mesh: Mesh;
    public readonly material: Material;

    constructor(platform: Platform, parent: Model, kind: ModelKindOptions, mesh: Mesh, material: Material) {
        super(platform, parent, kind);
        // init
        this.mesh = mesh;
        this.material = material;
    }

    public override trigger(name: string): void {

        // call base
        super.trigger(name);

        // check 
        switch (name) {
            case "create": {

                // add gate parts
                this.children.push(
                    new Block(this.platform, this, ModelKindOptions.Solid, this.mesh, this.material));

                this.children.push(
                    new Block(this.platform, this, ModelKindOptions.Solid, this.mesh, this.material));

                // get gate parts
                const left = this.children[0] as Model;
                const right = this.children[1] as Model;
                const ctf = Transform.matrix(this.graph);

                // update gate parts
                left.transform.update(
                    new Vector3(-0.5 * 0.5 * ctf.scale.x, 0, 0).divide(ctf.scale), Quaternion.identity,
                    new Vector3(0.5 * ctf.scale.x, ctf.scale.y, ctf.scale.z).divide(ctf.scale));

                right.transform.update(
                    new Vector3(0.5 * 0.5 * ctf.scale.x, 0, 0).divide(ctf.scale), Quaternion.identity,
                    new Vector3(0.5 * ctf.scale.x, ctf.scale.y, ctf.scale.z).divide(ctf.scale));
            }
        }
    }
}
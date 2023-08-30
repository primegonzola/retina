import {
    Camera,
    CameraKindOptions,
    Platform,
    Quaternion,
    Shape,
    SimulationObject,
    Transform,
    Vector3
} from "../index";

export enum ModelKindOptions {
    None,
    Collection,
    Solid,
    Sector,
    Gate,
    Shadow,
    Base,
    Concrete,
    Transparent,
    World,
    Player,
}

export class Model extends SimulationObject<Model> {
    public readonly kind: ModelKindOptions;

    constructor(platform: Platform, parent: Model, kind: ModelKindOptions) {
        super(platform, parent);
        this.kind = kind;
    }

    public trigger(name: string): void {
        // console.log(`trigger: ${name} : ${this.id}`);
    }

    public extract(shapes: Shape[]): Shape[] {

        // loop over children
        this.children.forEach((_child, index) => {
            // continue with extraction
            shapes = this.child(index).extract(shapes);
        });

        // all done
        return shapes;
    }
}

export class ModelCollection extends Model {
    
    constructor(platform: Platform, parent: Model) {
        // base
        super(platform, parent, ModelKindOptions.Collection);
        // add ourselves
        parent.children.push(this);
    }

    public get count(): number {
        return this.children.length;
    }

    public item(index: number): Model {
        return this.children[index] as Model;
    }

    public add(model: Model): void {
        // add
        this.children.push(model);
    }

    public remove(model: Model): void {
        // get index
        const index = this.children.indexOf(model);

        // get child
        const child = this.children[index];

        // remove from collection
        this.children.splice(index, 1);

        // destroy child
        child.destroy();
    }
}
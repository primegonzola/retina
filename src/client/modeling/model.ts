import {
    Camera,
    Matrix4,
    Platform,
    Shape,
    Transform,
    Utils
} from "../index";


export class Model {

    public readonly id: string;
    public readonly name: string;
    public readonly parent?: Model;
    public readonly transform: Transform;

    constructor(parent: Model, name: string, transform: Transform) {
        // init
        this.id = Utils.uuid();
        this.parent = parent;
        this.name = name;
        this.transform = transform;

        // add handler
        this.transform.notify(() => {
            console.log("transform changed");
        });
    }

    public get worldGraph(): Matrix4 {
        return this.parent ?
            this.parent.worldGraph.multiply(this.transform.world) :
            Matrix4.identity.multiply(this.transform.world);
    }

    public extractShapes(platform: Platform, camera: Camera, shapes: Shape[]): Shape[] {
        return shapes;
    }
}

export class ModelCollection<T> extends Model {

    public readonly models: T[];

    constructor(parent: Model, name: string) {
        super(parent, name, Transform.identity);
        // init
        this.models = [];
    }

    public add(model: T): T {
        this.models.push(model);
        return model;
    }

    public clear(): void {
        // reset
        this.models.length = 0;
    }    
}

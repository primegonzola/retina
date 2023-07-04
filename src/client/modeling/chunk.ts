import {
    Block,
    Camera,
    Model,
    ModelCollection,
    Platform,
    Shape,
    Transform
} from "../index";

export class Chunk extends Model {
    public readonly blocks: ModelCollection<Block>;

    constructor(parent: Model, name: string, transform: Transform) {
        super(parent, name, transform);

        // init
        this.blocks = new ModelCollection(this, "blocks");
    }

    public override extractShapes(platform: Platform, camera: Camera, shapes: Shape[]): Shape[] {
        // loop over blocks and extract shapes
        for (const block of this.blocks.models)
            shapes = block.extractShapes(platform, camera, shapes);
        // all done
        return shapes;
    }
}

import {
    Block,
    Camera,
    Chunk,
    Model,
    ModelCollection,
    Platform,
    Quaternion,
    Shape,
    Transform,
    Vector3
} from "../index";

export class World extends Model {
    public readonly platform: Platform;
    public readonly chunks: ModelCollection<Chunk>;

    constructor(platform: Platform, name: string) {
        super(null, name, Transform.identity);

        // init
        this.platform = platform;
        this.chunks = new ModelCollection(this, "chunks");
    }

    public static create(platform: Platform, name: string): World {
        // create new world
        const world = new World(platform, name);
        // all done
        return world;
    }

    public async generate(): Promise<void> {

        // create and add chunk
        const chunk = this.chunks.add(
            new Chunk(this.chunks, "chunk", new Transform(
                Vector3.zero,
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(16, 16, 16)))));

        // add a block
        const orange = chunk.blocks.add(
            new Block(chunk.blocks, "block", new Transform(
                new Vector3(-1, 0, 0).divide(chunk.transform.scale),
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(0.25, 0.25, 0.25).divide(chunk.transform.scale))),
                this.platform.resources.getMesh("platform", "cube"),
                this.platform.resources.getMaterial("platform", "orange")));

        const red = chunk.blocks.add(
            new Block(chunk.blocks, "block", new Transform(
                new Vector3(0, 0, 0).divide(chunk.transform.scale),
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(0.25, 0.25, 0.25).divide(chunk.transform.scale))),
                this.platform.resources.getMesh("platform", "cube"),
                this.platform.resources.getMaterial("platform", "red")));

        const blue = chunk.blocks.add(
            new Block(chunk.blocks, "block", new Transform(
                new Vector3(1, 0, 0).divide(chunk.transform.scale),
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(0.25, 0.25, 0.25).divide(chunk.transform.scale))),
                this.platform.resources.getMesh("platform", "cube"),
                this.platform.resources.getMaterial("platform", "blue")));

        const green = chunk.blocks.add(
            new Block(chunk.blocks, "block", new Transform(
                new Vector3(0, 1, 0).divide(chunk.transform.scale),
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(0.25, 0.25, 0.25).divide(chunk.transform.scale))),
                this.platform.resources.getMesh("platform", "cube"),
                this.platform.resources.getMaterial("platform", "green")));

        const yellow = chunk.blocks.add(
            new Block(chunk.blocks, "block", new Transform(
                new Vector3(0, -1, 0).divide(chunk.transform.scale),
                Quaternion.identity,
                Vector3.one.multiply(new Vector3(0.25, 0.25, 0.25).divide(chunk.transform.scale))),
                this.platform.resources.getMesh("platform", "cube"),
                this.platform.resources.getMaterial("platform", "yellow")));
    }

    public override extractShapes(platform: Platform, camera: Camera, shapes: Shape[]): Shape[] {
        // loop over chunks and extract shapes 
        for (const chunk of this.chunks.models)
            shapes = chunk.extractShapes(platform, camera, shapes);
        // all done
        return shapes;
    }
}
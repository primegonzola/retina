import {
    Hull,
    Material,
    Mesh,
    Model,
    ModelNode,
    Platform,
    Transform,
    Maze,
    IBuffer,
    MazeNodeKindOptions,
    MazeNode,
    ModelNodeKindOptions,
    Utils,
    MaterialModeOptions,
    BufferKindOptions,
    BufferLocation,
    Octree,
    Box,
    Light,
    Vector3,
    Quaternion,
} from "../index";

export class Player extends ModelNode {

    constructor(platform: Platform, parent: ModelNode, transform: Transform, mesh: Mesh, material: Material, hull: Hull) {
        // call super
        super(platform, parent, ModelNodeKindOptions.Player, transform, mesh, material, hull);
    }
}

export class World extends Model {

    public readonly chunks: ModelNode[];
    public readonly lights: Light[];

    private _octree: Octree;
    private _hulls: IBuffer;
    private _players: IBuffer;
    private _player: Player;

    constructor(platform: Platform, transform: Transform) {
        super(platform, transform);

        // init
        this.chunks = [];
        this.lights = [];
    }

    public get octree(): Octree {
        return this._octree;
    }

    public get hulls(): IBuffer {
        return this._hulls;
    }

    public get player(): Player {
        return this._player;
    }

    private _materialFromNode(node: MazeNode): Material {
        // default
        let material = this.platform.resources.getMaterial("platform", "hull-concrete");
        let dms = ["hull-red-door", "hull-green-door", "hull-blue-door"];

        // check kind
        switch (node.kind) {
            case MazeNodeKindOptions.Foundation:
                material = this.platform.resources.getMaterial("platform", "hull-foundation");
                break;
            case MazeNodeKindOptions.Floor:
                material = this.platform.resources.getMaterial("platform", "hull-floor");
                break;
            case MazeNodeKindOptions.Wall:
                material = this.platform.resources.getMaterial("platform", "hull-wall");
                break;
            case MazeNodeKindOptions.Ceiling:
                material = this.platform.resources.getMaterial("platform", "hull-ceiling");
                break;
            case MazeNodeKindOptions.Building:
                material = this.platform.resources.getMaterial("platform", "hull-building");
                break;
            case MazeNodeKindOptions.Transparent:
                // check 
                if (Math.random() > 0.5) {
                    // add transparent
                    material = this.platform.resources.getMaterial("platform", "hull-transparent");
                }
                else {
                    material = this.platform.resources.getMaterial("platform", dms[Utils.random(0, dms.length - 1, true)]);
                }
                break;
        }

        // done
        return material;
    }

    private _createTestContent(): void {
        // // get material
        // const dimensions = Vector3.one.scale(12);
        // const outer = Vector3.one.scale(4);
        // const inner = Vector3.one.scale(2);

        // for (let z = 0; z < dimensions.z; z++) {
        //     for (let y = 0; y < dimensions.y; y++) {
        //         for (let x = 0; x < dimensions.x; x++) {

        //             // calculate position
        //             const position = (outer.multiply(new Vector3(x, y, z)))
        //                 .subtract((outer.multiply(dimensions)).scale(0.5))
        //                 .add(outer.scale(0.5));

        //             // create hull
        //             const hull = new Hull(null,
        //                 new Transform(position, Quaternion.identity, inner),
        //                 material.shader, mesh.buffers);

        //             // add 
        //             this.hulls.push(hull);
        //         }
        //     }
        // }
    }

    private _createPlayer(): void {

        // destroy existing
        this._players?.destroy();

        // get mesh
        const mesh = this.platform.resources.getMesh("platform", "cube");

        // get material
        const material = this.platform.resources.getMaterial("platform", "hull-player").clone();

        // create hull
        const hull = new Hull(null, new Transform(
            new Vector3(0, 2, 0),
            Quaternion.identity,
            Vector3.one.scale(2)), false, material.shader, mesh.buffers);

        // add as attribute
        hull.attributes.set("material", material);

        // start with empty buffer
        let data: number[] = [];

        // add player data, model and properties
        data = data.concat(
            Utils.pad(hull.transform.extract(), 256),
            Utils.pad(material.extract(), 256))

        // create buffer
        const buffer = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // create player
        this._player = new Player(this.platform, null, hull.transform, mesh, material, hull);

        // set uniforms
        hull.uniforms.set("model", new BufferLocation(buffer, hull.transform.extract().length, 0));
        hull.uniforms.set("properties", new BufferLocation(buffer, material.extract().length, 1));
    }

    private _generateChunks(): void {
        // clear existing
        this._hulls?.destroy();

        // clear existing
        this.chunks.length = 0;

        // get mesh
        const mesh = this.platform.resources.getMesh("platform", "cube");

        // generate maze
        const maze = Maze.generate();

        // init with no hulls
        const chulls: Hull[] = [];

        // loop over generated nodes
        maze.children.forEach(node => {

            // create hull
            const hull = new Hull(null, node.transform);

            // resolve material 
            const material = this._materialFromNode(node).clone();

            // add as attribute
            hull.attributes.set("material", material);

            // add to hulls
            chulls.push(hull);

            // create chunk
            const chunk = new ModelNode(this.platform, null, ModelNodeKindOptions.Chunk,
                node.transform, mesh, material, hull);

            // add 
            this.chunks.push(chunk);

            // loop over children
            node.children.forEach(cn => {

                // resolve material 
                const cm = this._materialFromNode(cn).clone();

                // check if transparent
                const transparent = cm.mode === MaterialModeOptions.Transparent;

                // nudge the scale a bit in case of transparency
                const ctf = new Transform(
                    cn.transform.position,
                    cn.transform.rotation,
                    cn.transform.scale.scale(transparent ? 0.9999 : 1.0));

                // add
                const ch = hull.add(new Hull(hull, ctf,
                    transparent, cm.shader, mesh.buffers));

                // add as attribute
                ch.attributes.set("material", cm);

                // create block node
                const bn = new ModelNode(this.platform, chunk, ModelNodeKindOptions.Block,
                    cn.transform, mesh, cm, ch);

                // add to nodes
                chunk.nodes.push(bn);
            });
        });

        // start with empty buffer
        let data: number[] = [];

        // get all hulls
        let hulls = chulls.map(hull => hull.children).flat();

        // loop over hulls 
        hulls.forEach(hull => {

            // extract model
            const model = Transform.matrix(hull.graph).extract();

            // get the attached material
            const material = hull.attributes.get("material") as Material;

            // extract properties
            const properties = material.extract();

            // set data
            data = data.concat(
                Utils.pad(model, 256),
                Utils.pad(properties, 256))
        });

        // create buffer
        const buffer = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // loop over hulls 
        hulls.forEach((hull, index) => {

            // extract model
            const model = Transform.matrix(hull.graph).extract();

            // clone the attached material
            const material = hull.attributes.get("material") as Material;

            // extract properties
            const properties = material.extract();

            // set uniforms
            hull.uniforms.set("model", new BufferLocation(buffer, model.length, (2 * index) + 0));
            hull.uniforms.set("properties", new BufferLocation(buffer, properties.length, (2 * index) + 1));
        });

        // save buffer
        this._hulls = buffer;

        // init octree
        this._octree = new Octree(hulls.map(hull =>
            new Box(hull.graph.position, hull.graph.rotation, hull.graph.scale).bounds
        ), 3);

        // optimize octree
        this._octree.optimize();
    }

    public override create(): void {

        // base first
        super.create();

        // generate chunks
        this._generateChunks();

        // create player
        this._createPlayer();
    }

    public override destroy(): void {

        // base first
        super.destroy();

        // destroy existing
        this._hulls?.destroy();

        // destroy existing
        this._players?.destroy();
    }
}


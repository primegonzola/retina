import {
    Block,
    Gate,
    Light,
    Material,
    MazeNode,
    MazeNodeKindOptions,
    Model,
    ModelCollection,
    ModelKindOptions,
    Platform,
    Transform,
    Vector2,
    Vector3
} from "../index";

export class Sector extends Model {
    public static readonly SECTOR_MINIMUM_SIZE = new Vector3(8, 16, 8);
    public static readonly SECTOR_MAXIMUM_SIZE = new Vector3(16, 16, 16);
    public static readonly WALL_MINIMUM_SIZE = new Vector3(16, 2, 1);
    public static readonly FLOOR_MINIMUM_SIZE = new Vector3(16, 1, 16);
    public static readonly DOOR_MINIMUM_SIZE = new Vector3(4, 2, 1);
    public static readonly PORTAL_MINIMUM_SIZE = new Vector3(4, 2, 1);

    public readonly models: ModelCollection;
    public readonly lights: Map<string, Light> = new Map<string, Light>();

    constructor(platform: Platform, parent: Model) {
        super(platform, parent, ModelKindOptions.Sector);
        // init
        this.models = new ModelCollection(platform, this);
    }

    public addModel(node: MazeNode, kind: MazeNodeKindOptions, transform: Transform, root = false): Model {

        // create block
        const model = this.createModel(node, kind, transform);

        // add block
        this.models.add(model);

        // populate
        model.trigger("create");

        // all done
        return model;
    }

    public createModel(node: MazeNode, kind: MazeNodeKindOptions, transform: Transform): Model {

        // defaults
        let bk: ModelKindOptions = undefined;
        let bm: Material = undefined;
        let model: Model = undefined;

        // get mesh
        let mesh = this.platform.resources.getMesh("platform", "cube")

        switch (kind) {
            case MazeNodeKindOptions.Base:
                bk = ModelKindOptions.Base;
                bm = this.platform.resources.getMaterial("platform", "base");
                break;
            case MazeNodeKindOptions.Concrete:
                bk = ModelKindOptions.Concrete;
                bm = this.platform.resources.getMaterial("platform", "concrete");
                if (node.kind === MazeNodeKindOptions.Root) {
                    bm = bm.clone();
                    bm.textures.set("albedo", {
                        name: bm.textures.get("albedo").name,
                        key: this.platform.resources.getTexture("platform", "panel"),
                        offset: new Vector2(0, 0),
                        scale: new Vector2(node.transform.scale.x, node.transform.scale.z).scale(0.5),
                    });
                }
                break;
            case MazeNodeKindOptions.Gate:
                bk = ModelKindOptions.Gate;
                const mat = Math.random() > 0.5 ? "red-door" : (Math.random() > 0.5 ? "green-door" : "yellow-door");
                bm = this.platform.resources.getMaterial("platform", mat);
                break;
            case MazeNodeKindOptions.Shadow:
                bk = ModelKindOptions.Shadow;
                bm = this.platform.resources.getMaterial("platform", "black");
                break;
            case MazeNodeKindOptions.Solid:
                bk = ModelKindOptions.Solid;
                bm = this.platform.resources.getMaterial("platform", "solid");
                break;
            case MazeNodeKindOptions.Test:
                bk = ModelKindOptions.Solid;
                bm = this.platform.resources.getMaterial("platform", "solid");
                break;
            case MazeNodeKindOptions.Transparent:
                bk = ModelKindOptions.Transparent;
                bm = this.platform.resources.getMaterial("platform", "transparent-door");
                break;
            case MazeNodeKindOptions.Wedge:
                bk = ModelKindOptions.Transparent;
                bm = this.platform.resources.getMaterial("platform", "concrete");
                mesh = this.platform.resources.getMesh("platform", "wedge");
                break;
            default:
                throw new Error("invalid maze node kind");
        }
        // check if gate
        if (kind === MazeNodeKindOptions.Gate) {
            // create gate
            model = new Gate(this.platform, this, bk, mesh, bm);
        }
        else {
            // create block
            model = new Block(this.platform, this, bk, mesh, bm);
        }

        // update transform
        model.transform.replace(transform);

        // all done
        return model;
    }
}
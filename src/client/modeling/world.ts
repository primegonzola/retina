import {
    Box,
    Maze,
    MazeNodeKindOptions,
    Model,
    ModelCollection,
    ModelKindOptions,
    Platform,
    Player,
    Quaternion,
    Sector,
    Transform,
    Vector3,
} from "../index";

export class World extends Model {

    public readonly maze: Maze;
    public readonly sectors: ModelCollection;
    public readonly players: ModelCollection;
    public readonly directional: Vector3;

    constructor(platform: Platform) {
        super(platform, null, ModelKindOptions.World);

        // init
        this.maze = Maze.generate();
        this.sectors = new ModelCollection(platform, this);
        this.players = new ModelCollection(platform, this);
        this.directional = new Vector3(-45, 45, 0);
    }

    public get player(): Player {
        return this.players.item(0) as Player;
    }

    public get sector(): Sector {

        // get player transform
        const ptf = this.player.transform;

        // loop over sectors
        for (let i = 0; i < this.sectors.count; i++) {

            // get sector
            let sector = this.sectors.item(i) as Sector;

            // get sector transform world
            let sg = Transform.matrix(sector.graph);

            // see if intersection 
            if (Box.intersects(
                new Box(sg.position, sg.rotation, sg.scale),
                new Box(ptf.position, ptf.rotation, ptf.scale)))
                return sector;
        }
        // not found
        return null;
    }

    public createPlayer(transform: Transform): Player {

        // create player
        const player = new Player(this.platform, this,
            this.platform.resources.getMesh("platform", "player"),
            this.platform.resources.getMaterial("platform", "player"));

        // update transform
        player.transform.replace(transform);

        // all done
        return player;
    }

    public async generate(): Promise<void> {

        // loop over maze nodes
        for (let i = 0; i < this.maze.children.length; i++) {

            // get node
            const node = this.maze.children[i];

            // create sector
            const sector = new Sector(this.platform, this);

            // update transform
            sector.transform.replace(node.transform);

            // add sector
            this.sectors.add(sector);

            // loop over children
            for (let j = 0; j < node.children.length; j++) {

                // get edge
                const child = node.children[j];
                const chance = Math.random();
                const kind = child.kind !== MazeNodeKindOptions.Transparent ?
                    child.kind : chance < 0.5 ? MazeNodeKindOptions.Gate : child.kind;

                // add
                if (kind !== MazeNodeKindOptions.Transparent)
                    sector.addModel(node, kind, child.transform);
            }

            // add dummies
            sector.addModel(node, MazeNodeKindOptions.Test, new Transform(
                new Vector3(-3, 2, -3).divide(sector.transform.scale), Quaternion.identity, Vector3.one.scale(2).divide(sector.transform.scale)
            ));
            sector.addModel(node, MazeNodeKindOptions.Test, new Transform(
                new Vector3(3, 2, -3).divide(sector.transform.scale), Quaternion.identity, Vector3.one.scale(2).divide(sector.transform.scale)
            ));
            sector.addModel(node, MazeNodeKindOptions.Test, new Transform(
                new Vector3(-3, 2, 3).divide(sector.transform.scale), Quaternion.identity, Vector3.one.scale(2).divide(sector.transform.scale)
            ));
            sector.addModel(node, MazeNodeKindOptions.Test, new Transform(
                new Vector3(3, 2, 3).divide(sector.transform.scale), Quaternion.identity, Vector3.one.scale(2).divide(sector.transform.scale)
            ));
        }

        // add player
        const player = this.createPlayer(
            new Transform(
                new Vector3(0, 1.5, 0),
                Quaternion.identity,
                Vector3.one
            )
        );

        // add
        this.players.add(player);
    }
}
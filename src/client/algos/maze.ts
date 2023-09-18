import {
    Box,
    Euler,
    Logger,
    Matrix4,
    Quaternion,
    Transform,
    Utils,
    Vector3,
} from "../index";

export enum MazeNodeKindOptions {
    Base = "base",
    Challenge = "challenge",
    Concrete = "concrete",
    Corridor = "corridor",
    Maze = "maze",
    None = "none",
    Room = "room",
    Root = "root",
    Round = "round",
    Shadow = "shadow",
    Solid = "solid",
    Transparent = "transparent",
    Wedge = "wedge",
}

export class MazeNode {
    public readonly parent: MazeNode;
    public readonly transform: Transform;
    public readonly children: MazeNode[];
    public readonly properties: Map<string, unknown>;
    private _kind: MazeNodeKindOptions;

    constructor(parent: MazeNode, kind: MazeNodeKindOptions, transform?: Transform) {
        // init
        this.parent = parent;
        this._kind = kind;
        this.transform = transform || Transform.identity;
        this.children = [];
        this.properties = new Map<string, unknown>();
    }

    public static get averageSize(): Vector3 {
        return new Vector3(
            Utils.even(Utils.random(Maze.NODE_MAXIMUM_SIZE.x, Maze.NODE_MAXIMUM_SIZE.x, false)),
            Utils.even(Utils.random(Maze.NODE_MAXIMUM_SIZE.y, Maze.NODE_MAXIMUM_SIZE.y, false)),
            Utils.even(Utils.random(Maze.NODE_MAXIMUM_SIZE.z, Maze.NODE_MAXIMUM_SIZE.z, false)),
        ).multiply(new Vector3(2, 1, 2));
    }

    public static get randomSize(): Vector3 {
        return new Vector3(
            Utils.even(Utils.random(Maze.NODE_MINIMUM_SIZE.x, Maze.NODE_MAXIMUM_SIZE.x, false)),
            Utils.even(Utils.random(Maze.NODE_MINIMUM_SIZE.y, Maze.NODE_MAXIMUM_SIZE.y, false)),
            Utils.even(Utils.random(Maze.NODE_MINIMUM_SIZE.z, Maze.NODE_MAXIMUM_SIZE.z, false)),
        );
    }

    public get kind(): MazeNodeKindOptions {
        return this._kind
    }

    public get world(): Matrix4 {
        return this.parent ?
            this.parent.world.multiply(this.transform.model) :
            Matrix4.identity.multiply(this.transform.model);
    }

    public changeKind(kind: MazeNodeKindOptions): void {
        this._kind = kind;
    }

    public intersects(node: MazeNode): boolean {
        // get world transforms
        const self = Transform.matrix(this.world);
        const other = Transform.matrix(node.world);
        return Box.intersects(
            new Box(self.position, self.rotation, self.scale),
            new Box(other.position, other.rotation, other.scale),
        );
    }

    public addNode(kind: MazeNodeKindOptions,
        position: Vector3, rotation: Quaternion, scale: Vector3, world: boolean): MazeNode {

        // create node
        const node = this.createNode(kind, position, rotation, scale, world)

        // add node
        this.children.push(node);

        // all done
        return node;
    }

    public createNode(kind: MazeNodeKindOptions,
        position: Vector3, rotation: Quaternion, scale: Vector3, world: boolean): MazeNode {

        // create transform
        let transform = new Transform(position, rotation, scale);

        // check if world and transform to local
        if (world)
            transform = transform.local(this.transform);

        // create instance
        return new MazeNode(this, kind, transform);
    }

    public static generate(parent: MazeNode, kind: MazeNodeKindOptions, transform: Transform): MazeNode {

        // create node
        const node = new MazeNode(parent, kind, transform);

        // check kind
        switch (node.kind) {
            case MazeNodeKindOptions.Challenge: {
                node.populateDynamicNode([
                    MazeNodeKindOptions.Solid,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Solid,
                    MazeNodeKindOptions.Transparent
                ]);
                break;
            }
            case MazeNodeKindOptions.Corridor: {
                node.populateDynamicNode([
                    MazeNodeKindOptions.Solid,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Solid,
                    MazeNodeKindOptions.Transparent
                ]);
                break;
            }
            case MazeNodeKindOptions.Room: {
                node.populateDynamicNode([
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent
                ]);
                break;
            }
            case MazeNodeKindOptions.Root: {
                node.populateDynamicNode([
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent,
                    MazeNodeKindOptions.Transparent
                ]);
                break;
            }
            case MazeNodeKindOptions.Round: {
                // calculate rounds
                const rounds = Utils.random(3, 8, true);
                const kinds = new Array<MazeNodeKindOptions>(rounds);
                // populate kinds
                for (let i = 0; i < rounds; i++)
                    kinds[i] = MazeNodeKindOptions.Transparent;
                // populate
                node.populateRoundNode(kinds);
                break;
            }
            default:
                throw new Error(`Unknown node kind ${kind}`);
        }

        // all done
        return node;
    }

    private addBase(position: Vector3, rotation: Quaternion, scale: Vector3, wedged: boolean): void {

        // add floor
        this.addNode(
            wedged ? MazeNodeKindOptions.Wedge : MazeNodeKindOptions.Concrete, position, rotation, scale, true);

        // calculate size
        const size = (0.5 * this.transform.scale.y) - (this.transform.position.y - position.y);

        // see if anything left
        if (size > 0 && !wedged) {
            // add solid to down
            this.addNode(MazeNodeKindOptions.Base,
                position
                    .subtract(new Vector3(0, 0.5 * scale.y, 0))
                    .subtract(new Vector3(0, 0.5 * size, 0)),
                rotation, new Vector3(scale.x, size, scale.z), true);
        }
    }

    private populateRoundNode(kinds: MazeNodeKindOptions[]): void {

        // // create base 
        // this.addBase(
        //     this.transform.position,
        //     this.transform.rotation.multiply(Quaternion.degrees(-180, 0, 0)),
        //     new Vector3(this.transform.scale.x, Maze.BASE_SIZE.y, this.transform.scale.z),
        //     false
        // )

        // loop over kinds
        for (let i = 0; i < kinds.length; i++) {

            // get kind
            const kind = kinds[i];

            // calculate current and next angle rotation around y axis
            const da = (360 / kinds.length);
            const dda = 0.5 * da;
            const ca = ((i + 0) % kinds.length) * da;
            const dar = Euler.toRadians(da);

            // console.log(`da: ${da}, pa: ${pa}, ca: ${ca}, na: ${na}, dar: ${dar}`);
            // calculate previous rotation around y axis
            const prev_rotation = this.transform.rotation.multiply(
                Quaternion.degrees(0, ca - dda, 0));

            // calculate current rotation around y axis
            const world_rotation = this.transform.rotation.multiply(
                Quaternion.degrees(0, ca, 0));

            // calculate next rotation around y axis
            const next_rotation = this.transform.rotation.multiply(
                Quaternion.degrees(0, ca + dda, 0));

            // calculate distance from center
            // const world_distance =
            //     new Vector3(0.5 * this.transform.scale.x, 0, 0.5 * this.transform.scale.z).magnitude;
            const distance = (0.5 * this.transform.scale.z) - (Maze.SOLID_SIZE.z);
            const ppos = prev_rotation.direction.scale(distance);
            const npos = next_rotation.direction.scale(distance);

            // calculate world scale
            const world_scale = npos.subtract(ppos).magnitude;
            const direction = npos.subtract(ppos).normalize();
            const inner_distance = ppos.add(direction.scale(0.5 * world_scale)).magnitude;

            // calculate world distance
            const world_distance = inner_distance + (0.5 * Maze.SOLID_SIZE.z);

            // calculate length direction
            const ld = Quaternion.degrees(0, 90, 0)
                .rotateVector(world_rotation.direction)
                .normalize();

            // create outer base 
            this.addBase(
                world_rotation.direction.scale(world_distance),
                world_rotation,
                new Vector3(world_scale, Maze.BASE_SIZE.y, Maze.SOLID_SIZE.z),
                false
            )

            // create inner base 
            this.addBase(
                world_rotation.direction.scale(0.5 * inner_distance),
                world_rotation,
                new Vector3(world_scale, Maze.BASE_SIZE.y, inner_distance),
                true
            )

            // portal and wall y positions
            const py = (0.5 * Maze.BASE_SIZE.z) + (0.5 * Maze.TRANSPARENT_SIZE.y);
            const wy = (0.5 * Maze.BASE_SIZE.z) + (0.5 * Maze.SOLID_SIZE.y);

            // check if door or portal
            if (kind === MazeNodeKindOptions.Transparent) {

                // calculate scale
                const ps = Maze.TRANSPARENT_SIZE;

                // calculate different wall lengths
                const wl1 = Utils.random(1.0, 0.5 * (world_scale - ps.x), true);
                const wl2 = world_scale - ps.x - wl1;

                // calculate portal position
                const pp = new Vector3(0, py, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((-0.5 * world_scale) + wl1 + (0.5 * ps.x)));

                // add node
                this.addNode(
                    MazeNodeKindOptions.Transparent,
                    pp, world_rotation, ps, true);

                // calculate scale
                const ws1 = new Vector3(
                    wl1,
                    Maze.SOLID_SIZE.y,
                    Maze.SOLID_SIZE.z);

                // calculate position
                const wsp1 = new Vector3(0, wy, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((-0.5 * world_scale) + (0.5 * wl1)));

                // create node
                this.addNode(
                    MazeNodeKindOptions.Solid,
                    wsp1, world_rotation, ws1, true);

                // calculate scale
                const ws2 = new Vector3(
                    wl2,
                    Maze.SOLID_SIZE.y,
                    Maze.SOLID_SIZE.z);

                // calculate position
                const wsp2 = new Vector3(0, wy, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((0.5 * world_scale) - (0.5 * wl2)));

                // add node
                this.addNode(
                    MazeNodeKindOptions.Solid,
                    wsp2, world_rotation, ws2, true);
            }
            else {

                // calculate position
                const wp = new Vector3(0, py, 0)
                    .add(world_rotation.direction.scale(world_distance));

                // calculate scale
                const ws = new Vector3(
                    world_scale, Maze.SOLID_SIZE.y, Maze.SOLID_SIZE.z);

                // add 
                this.addNode(MazeNodeKindOptions.Solid,
                    wp, world_rotation, ws, true);
            }
        }
    }

    private populateDynamicNode(kinds: MazeNodeKindOptions[]): void {

        // create base 
        this.addBase(
            this.transform.position,
            this.transform.rotation.multiply(Quaternion.degrees(-180, 0, 0)),
            new Vector3(this.transform.scale.x, Maze.BASE_SIZE.y, this.transform.scale.z),
            false
        )
        // loop over kinds
        for (let i = 0; i < kinds.length; i++) {

            // get kind
            const kind = kinds[i];

            // calculate rotation around y axis
            const world_rotation = this.transform.rotation.multiply(Quaternion.degrees(0, -90 * i, 0));

            // calculate distance from center
            const world_distance = (i % 2) ?
                (0.5 * this.transform.scale.x) - (0.5 * Maze.TRANSPARENT_SIZE.z) :
                (0.5 * this.transform.scale.z) - (0.5 * Maze.TRANSPARENT_SIZE.z);

            // calculate wall length
            const world_scale = (i % 2) ?
                this.transform.scale.z - (2 * Maze.SOLID_BORDER_SIZE.z) :
                this.transform.scale.x - (2 * Maze.SOLID_BORDER_SIZE.z);

            // calculate length direction
            const ld = Quaternion.degrees(0, 90, 0)
                .rotateVector(world_rotation.direction)
                .normalize();

            // portal and wall y positions
            const py = (0.5 * Maze.BASE_SIZE.z) + (0.5 * Maze.TRANSPARENT_SIZE.y);
            const wy = (0.5 * Maze.BASE_SIZE.z) + (0.5 * Maze.SOLID_SIZE.y);

            // pillar position
            const wpp = new Vector3(0, py, 0)
                .add(world_rotation.direction.scale(world_distance))
                .add(ld.scale((-0.5 * world_scale - 0.5 * Maze.SOLID_BORDER_SIZE.z)));

            // calculate pillar scale
            const wsp = new Vector3(
                Maze.SOLID_BORDER_SIZE.x, Maze.SOLID_SIZE.y, Maze.SOLID_BORDER_SIZE.z);

            // add pillar
            this.addNode(MazeNodeKindOptions.Solid,
                wpp, world_rotation, wsp, true);

            // check if door or portal
            if (kind === MazeNodeKindOptions.Transparent) {

                // calculate scale
                const ps = Maze.TRANSPARENT_SIZE;

                // calculate different wall lengths
                const wl1 = Utils.random(1.0, 0.5 * (world_scale - ps.x), true);
                const wl2 = world_scale - ps.x - wl1;

                // calculate portal position
                const pp = new Vector3(0, py, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((-0.5 * world_scale) + wl1 + (0.5 * ps.x)));

                // add node
                this.addNode(
                    MazeNodeKindOptions.Transparent,
                    pp, world_rotation, ps, true);

                // calculate scale
                const ws1 = new Vector3(
                    wl1,
                    Maze.SOLID_SIZE.y,
                    Maze.SOLID_SIZE.z);

                // calculate position
                const wsp1 = new Vector3(0, wy, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((-0.5 * world_scale) + (0.5 * wl1)));

                // create node
                this.addNode(
                    MazeNodeKindOptions.Solid,
                    wsp1, world_rotation, ws1, true);

                // calculate scale
                const ws2 = new Vector3(
                    wl2,
                    Maze.SOLID_SIZE.y,
                    Maze.SOLID_SIZE.z);

                // calculate position
                const wsp2 = new Vector3(0, wy, 0)
                    .add(world_rotation.direction.scale(world_distance))
                    .add(ld.scale((0.5 * world_scale) - (0.5 * wl2)));

                // add node
                this.addNode(
                    MazeNodeKindOptions.Solid,
                    wsp2, world_rotation, ws2, true);

            } else if (kind === MazeNodeKindOptions.Solid) {

                // calculate position
                const wp = new Vector3(0, py, 0)
                    .add(world_rotation.direction.scale(world_distance));

                // calculate scale
                const ws = new Vector3(
                    world_scale, Maze.SOLID_SIZE.y, Maze.SOLID_SIZE.z);

                // add 
                this.addNode(MazeNodeKindOptions.Solid,
                    wp, world_rotation, ws, true);
            }
        }
    }

    public populate(nodes: MazeNode[], depth: number): MazeNode[] {
        return nodes;
    }

    public filter(kinds: MazeNodeKindOptions[]): MazeNode[] {
        return this.children.filter((node) => kinds.includes(node.kind));
    }
}

export class Maze extends MazeNode {

    public static readonly NODE_MINIMUM_SIZE = new Vector3(16, 16, 16);
    public static readonly NODE_MAXIMUM_SIZE = new Vector3(16, 16, 16);
    public static readonly BASE_SIZE = new Vector3(1, 1, 1);
    public static readonly SOLID_SIZE = new Vector3(1, 4, 1);
    public static readonly SOLID_BORDER_SIZE = new Vector3(1, 1, 1);
    public static readonly TRANSPARENT_SIZE = new Vector3(4, 4, 1);

    constructor() {
        super(null, MazeNodeKindOptions.Maze);
    }

    public static generate(): Maze {

        // create instance
        const maze = new Maze();

        // collection of nodes to use
        let fnodes: MazeNode[] = [];
        let qnodes: MazeNode[] = [];

        // define parent for this run
        const parent = maze;

        // create root node
        const root = MazeNode.generate(parent, MazeNodeKindOptions.Root,
            new Transform(Vector3.zero, Quaternion.identity, MazeNode.averageSize));

        // add to queue
        qnodes.push(root);

        // start at depth 0
        let depth = 0;
        const max = 4; // 32; //128 / 4;
        let current = 0;
        const debug = true;
        // generate nodes
        while (qnodes.length > 0 && current < max - 1) {

            // get node
            const node = qnodes.shift();

            // node tranform in world coordinates
            const nwtf = Transform.matrix(node.world);

            // define handy filter
            const isAvailableFilter = (node: MazeNode) =>
                node.kind === MazeNodeKindOptions.Transparent &&
                (!node.properties.has("is-available") || node.properties.get("is-available") === true)

            // define intersects handler
            const intersects = (target: MazeNode, nodes: Iterable<MazeNode>) => {
                // loop over nodes
                for (const node of nodes) {
                    // check if same node
                    if (node != target) {
                        // check if intersects
                        if (target.intersects(node)) {
                            return node;
                        }
                    }
                }
                // not found
                return null;
            };

            // get available slots
            const transparents = node.children.filter(isAvailableFilter);

            // check always if no space is left
            if (transparents.length === 0) {
                //
                // nothing left to do
                // add to final nodes
                //
                fnodes.push(node);
            }
            else {
                // get random transparent one
                const transparent = false ?
                    transparents[0] :
                    transparents[Utils.random(0, transparents.length - 1, true)];

                // set count
                transparent.properties.set("available-count",
                    transparent.properties.has("available-count") ?
                        transparent.properties.get("available-count") as number + 1 : 0);

                // add back to queue
                qnodes.push(node);

                // get transform of transparent in world coordinates
                const trwtf = Transform.matrix(transparent.world);

                // generate prototype definitions
                const rs = MazeNode.randomSize;
                const rb = Math.random() > 0.8 && node.kind !== MazeNodeKindOptions.Round;
                const cb = Math.random() > 0.8;
                const chb = Math.random() > 0.9 && node.kind !== MazeNodeKindOptions.Corridor;

                let ps = rs;
                const rk = rb ? MazeNodeKindOptions.Round : MazeNodeKindOptions.Room;
                const pk = (cb && rk === MazeNodeKindOptions.Room ? MazeNodeKindOptions.Corridor :
                    (chb ? MazeNodeKindOptions.Challenge : rk));

                // check how to scale
                switch (pk) {
                    case MazeNodeKindOptions.Challenge:
                        ps = new Vector3(64, rs.y, 64);
                        break;
                    case MazeNodeKindOptions.Round:
                        ps = new Vector3(Math.max(rs.x, 16), rs.y, Math.max(rs.x, 16));
                        break;
                    case MazeNodeKindOptions.Corridor:
                        ps = new Vector3(rs.x, rs.y, 8);
                        break;
                }

                // generate prototype, don't add as me might not need it
                const proto = MazeNode.generate(parent, pk,
                    new Transform(Vector3.zero, Quaternion.identity, ps));

                // calulate proto transform in world coordinates
                const prwtf = Transform.matrix(proto.world);

                // get available ones from proto
                const availables = proto.children.filter(isAvailableFilter);

                // check if any
                if (availables.length > 0) {

                    // get random one
                    const available = debug ?
                        availables[1] :
                        availables[Utils.random(0, availables.length - 1, true)];

                    // get transform of available in world coordinates
                    const avwtf = Transform.matrix(available.world);

                    // target rotation is transparent rotation plus 180 rotation minus available rotation 
                    const rotation = trwtf.rotation
                        .multiply(Quaternion.degrees(0, 180, 0))
                        .multiply(avwtf.rotation.inverse);

                    // calculate distance  between available and proto position
                    const distance = avwtf.position.subtract(prwtf.position).magnitude;

                    // calculate direction between available and proto position and rotate it with target rotation
                    const direction = rotation.rotateVector(
                        avwtf.position.subtract(prwtf.position).normalize()).normalize();

                    // final position is world position of transparent 
                    // plus transparent depth by its direction
                    // minus direction scaled by distance of proto 
                    const position = trwtf.position
                        .add(trwtf.rotation.direction.scale(Maze.TRANSPARENT_SIZE.z))
                        .subtract(direction.scale(distance));

                    // new transform with scale not changed
                    const transform = new Transform(position, rotation, proto.transform.scale);

                    // update transform in world coordinates
                    proto.transform.replace(transform);

                    // get intersection checks
                    const pin = intersects(proto, [].concat(fnodes, qnodes));

                    // check if intersects with any other node
                    if (!pin || pin == node) {

                        // mark transparent as linked
                        transparent.properties.set("is-available", false);

                        // mark available as linked
                        available.properties.set("is-available", false);

                        // link proto to transparent
                        transparent.properties.set("target-link", proto);

                        // link node to available
                        available.properties.set("target-link", node);

                        // add proto to queue
                        qnodes.push(proto);

                        // increase current
                        current = current + 1;
                    }
                    else {
                        // depending on already passed
                        if (transparent.properties.get("available-count") as number > 10) {

                            // mark transparent as linked
                            transparent.properties.set("is-available", false);

                            // change type to solid
                            transparent.changeKind(MazeNodeKindOptions.Solid);
                        }
                    }
                }
            }
        }

        // transfer final nodes to maze
        while (fnodes.length > 0) maze.children.push(fnodes.shift());

        // move remaining queued ones to final nodes
        while (qnodes.length > 0) maze.children.push(qnodes.shift());

        // loop maze nodes
        for (const node of maze.children) {
            // loop over children
            for (const child of node.children) {
                // check if transparent
                if (child.kind === MazeNodeKindOptions.Transparent) {
                    // check if available
                    if (!child.properties.has("target-link")) {
                        // change to solid
                        child.changeKind(MazeNodeKindOptions.Solid);
                    }
                }
            }
        }

        // diagnostics
        // Logger.info(`Maze generated with ${maze.children.length} nodes`);

        // all done
        return maze;
    }
}
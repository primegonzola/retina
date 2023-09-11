import {
    Bounds, Box, Frustum, Quaternion, Vector3
} from '../index';

export type OctreeNode = {
    parent: OctreeNode;
    bounds: Bounds;
    depth: number;
    nodes: OctreeNode[];
    indices: number[];
}

export class Octree {

    public readonly depth: number;
    public readonly bounds: Bounds[];
    public readonly root: OctreeNode;

    constructor(bounds: Bounds[], depth: number) {
        this.bounds = bounds;
        this.depth = depth;
        this.root = {
            parent: null,
            bounds: Bounds.concat(bounds),
            depth: 0,
            nodes: [],
            indices: []
        };
    }

    public static create(bounds: Bounds[], depth: number): Octree {
        return new Octree(bounds, depth);
    }

    public optimize(): void {

        // clean current
        this.root.nodes.length = 0;

        // subdivide
        this._subdivide(this.root);
    }

    private _subdivide(node: OctreeNode) {
        // init node
        node.nodes = [];
        node.indices = [];
        // cache unit
        const unit = node.bounds.delta.scale(0.5);
        // divide
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {

                    // calculate bounds of current node
                    const nb = new Bounds(
                        new Vector3(
                            node.bounds.minimum.x + unit.x * x,
                            node.bounds.minimum.y + unit.y * y,
                            node.bounds.minimum.z + unit.z * z),
                        new Vector3(
                            node.bounds.minimum.x + unit.x * (x + 1),
                            node.bounds.minimum.y + unit.y * (y + 1),
                            node.bounds.minimum.z + unit.z * (z + 1))
                    );

                    // add node
                    node.nodes.push({
                        parent: node,
                        depth: node.depth + 1,
                        bounds: nb,
                        indices: [],
                        nodes: []
                    });

                    // loop over bounds
                    this.bounds.forEach((b, i) => {
                        // check if intersecting
                        if (Box.intersects(
                            new Box(b.center, Quaternion.identity, b.delta),
                            new Box(nb.center, Quaternion.identity, nb.delta),
                        )) {
                            // add index
                            node.nodes[node.nodes.length - 1].indices.push(i);
                        }
                    });

                    // check if anything left to do
                    if (node.depth < this.depth) {

                        // subdivide node
                        this._subdivide(node.nodes[node.nodes.length - 1]);
                    }
                }
            }
        }
    }

    public collect(frustum: Frustum): number[] {
        return [];
    }
}
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
        this.root.indices.length = 0;

        // subdivide
        this._subdivide(this.root);
    }

    private _subdivide(root: OctreeNode) {
        // cache unit
        const unit = root.bounds.delta.scale(0.5);
        // divide
        for (let z = 0; z < 2; z++) {
            for (let y = 0; y < 2; y++) {
                for (let x = 0; x < 2; x++) {

                    // calculate bounds of current node
                    const nb = new Bounds(
                        new Vector3(
                            root.bounds.minimum.x + unit.x * x,
                            root.bounds.minimum.y + unit.y * y,
                            root.bounds.minimum.z + unit.z * z),
                        new Vector3(
                            root.bounds.minimum.x + unit.x * (x + 1),
                            root.bounds.minimum.y + unit.y * (y + 1),
                            root.bounds.minimum.z + unit.z * (z + 1))
                    );

                    // start with no indices
                    let indices: number[] = [];

                    // loop over bounds
                    this.bounds.forEach((b, i) => {
                        // check if intersecting
                        if (Box.intersects(
                            new Box(b.center, Quaternion.identity, b.delta),
                            new Box(nb.center, Quaternion.identity, nb.delta),
                        )) {
                            // add index
                            indices.push(i);
                        }
                    });

                    // check if anything found
                    if (indices.length > 0) {

                        // create node
                        const node: OctreeNode = {
                            parent: root,
                            depth: root.depth + 1,
                            bounds: nb,
                            indices: [],
                            nodes: []
                        };

                        // push node
                        root.nodes.push(node);

                        // check if anything left to do
                        if (node.depth < this.depth) {
                            
                            // subdivide node
                            this._subdivide(node);
                        }
                        else {
                            
                            // update indices
                            node.indices = indices;
                        }
                    }
                }
            }
        }
    }

    private _collect(root: OctreeNode, frustum: Frustum): number[] {
        // check if any childrent
        if (root.nodes.length === 0) {
            // return indices
            return root.indices;
        }
        // loop over nodes and collect indices
        let indices: number[] = [];

        // loop
        root.nodes.forEach(node => {
            // check if intersect and if so collect and add
            if (frustum.wbox(node.bounds.center, Quaternion.identity, node.bounds.delta))
                indices = indices.concat(this._collect(node, frustum));
        });

        // return indices
        return indices;
    }


    public collect(frustum: Frustum): number[] {
        // check if intersection and collect
        if (frustum.wbox(
            this.root.bounds.center, Quaternion.identity, this.root.bounds.delta)) {
            // collect
            return this._collect(this.root, frustum);
        }
        // nothing found
        return [];
    }
}
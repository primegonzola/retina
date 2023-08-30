import {
    Vector3,
} from "../index";

export class OctreeNode {
    public readonly parent: OctreeNode;
    public readonly chidren: OctreeNode[] = [];

   constructor(parent: OctreeNode) {
        // init
        this.parent = parent;
        this.chidren = new Array<OctreeNode>(8);
        this.chidren.fill(null);
    }

    public subdivide(): void {
        
    }
}

export class Octree extends OctreeNode {
    constructor() {
        super(null);
    }
}
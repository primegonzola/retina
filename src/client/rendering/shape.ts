import {
    Material,
    Matrix4,
    Mesh,
    RenderData,
} from "../index";

export class Shape extends RenderData {
    public readonly world: Matrix4;
    public readonly mesh: Mesh;
    public readonly material: Material;

    constructor(id: string, world: Matrix4, mesh: Mesh, material: Material) {
        super(id, material.shader, mesh.buffers, material.groups);
        // init
        this.world = world;
        this.mesh = mesh;
        this.material = material;
    }
}
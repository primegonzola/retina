import {
    IBuffer,
    Material,
    Matrix4,
    Mesh,
    RenderData,
} from "../index";

export class Shape extends RenderData {
    public readonly mesh: Mesh;
    public readonly material: Material;
    public readonly world: Matrix4;

    constructor(model: IBuffer, world: Matrix4, mesh: Mesh, material: Material) {
        super(model, material.shader);

        // init
        this.mesh = mesh;
        this.material = material;
        this.world = world;

        // copy buffers
        mesh.buffers.forEach((buffer, name) => this.buffers.set(name, buffer));

        // copy groups
        material.groups.forEach((group, name) => this.groups.set(name, group));
    }
}
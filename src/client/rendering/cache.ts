import {
    CacheEntry,
    IBuffer,
    Mesh
} from "../index";

export class ModelMeshEntry extends CacheEntry {
    public readonly model: IBuffer;
    public readonly mesh: Mesh;

    constructor(key: string, duration: number, model: IBuffer, mesh: Mesh) {
        super(key, duration);
        // init
        this.model = model;
        this.mesh = mesh;
    }

    public destroy(): void {
        // clean up
        this.model?.destroy();
        this.mesh?.destroy();
    }
}

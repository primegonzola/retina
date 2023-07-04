import {
    BufferKindOptions,
    Geometry,
    IBuffer,
    Platform,
    Utils,
    Vector2,
    Vector3,
} from '../index';

export class Mesh {
    public readonly id: string;
    public readonly platform: Platform;
    public readonly geometry: Geometry;
    public readonly buffers: Map<string, IBuffer>;
    constructor(platform: Platform, geometry: Geometry) {
        // init
        this.id = Utils.uuid();
        this.platform = platform;
        this.geometry = geometry;
        // this.buffers = new Map<string, IBuffer>();
        this.buffers = this.extractBuffers(this);
    }

    private extractBuffers(mesh: Mesh): Map<string, IBuffer> {
        const buffers = new Map<string, IBuffer>();
        if (mesh.geometry.positions) {
            buffers.set("positions", this.platform.graphics.createF32Buffer(
                BufferKindOptions.Vertex, Vector3.toNumbers(mesh.geometry.positions)));
        }
        if (mesh.geometry.texels) {
            buffers.set("texels", this.platform.graphics.createF32Buffer(
                BufferKindOptions.Vertex, Vector2.toNumbers(mesh.geometry.texels)));
        }
        if (mesh.geometry.normals) {
            buffers.set("normals", this.platform.graphics.createF32Buffer(
                BufferKindOptions.Vertex, Vector3.toNumbers(mesh.geometry.normals)));
        }
        if (mesh.geometry.tangents) {
            buffers.set("tangents", this.platform.graphics.createF32Buffer(
                BufferKindOptions.Vertex, Vector3.toNumbers(mesh.geometry.tangents)));
        }
        if (mesh.geometry.indices) {
            buffers.set("indices", this.platform.graphics.createF32Buffer(
                BufferKindOptions.Index, mesh.geometry.indices));
        }
        // all done
        return buffers;
    }

    public destroy(): void {

        // loop over all buffers and destroy
        for (const buffer of this.buffers.values())
            buffer.destroy();

        // clear
        this.buffers.clear();
    }
}


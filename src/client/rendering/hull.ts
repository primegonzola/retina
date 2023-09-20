import {
    Frustum,
    Geometry,
    IBuffer,
    IShader,
    ITexture,
    Matrix4,
    Transform,
    Utils
} from "../index";

// export class GeometryBuffer {

//     public readonly buffers: Map<string, IBuffer>;
//     public readonly stride: number;

//     constructor(buffers: Map<string, IBuffer>, index:number, size: number) {
//         // init
//         this.buffers = buffers;
//         this.stride = stride;
//     }
// }

export class BufferLocation {

    public readonly buffer: IBuffer;
    public readonly offset: number
    public readonly count: number
    public readonly size: number;

    constructor(buffer: IBuffer, count: number, offset: number) {
        // init
        this.buffer = buffer;
        this.count = count;
        this.offset = 256 * offset * buffer.stride;
        this.size = count * buffer.stride;
    }
}

export enum HullCapabilityOptions {
    None = 1 << 0,
    Model = 1 << 1,
    Properties = 1 << 2,
    Texture = 1 << 3,
    Transparent = 1 << 4,
};

export class Hull {

    public readonly id: string;
    public readonly transform: Transform;
    public readonly parent: Hull;
    public readonly capabilities: HullCapabilityOptions;
    public readonly shader: IShader;
    public readonly uniforms: Map<string, BufferLocation>;
    public readonly textures: Map<string, ITexture>;
    public readonly attributes: Map<string, unknown>;
    public readonly buffers: Map<string, IBuffer>;
    public readonly children: Hull[];

    constructor(parent: Hull, transform: Transform, capabilities: HullCapabilityOptions,
        shader?: IShader, buffers?: Map<string, IBuffer>) {

        // init
        this.id = Utils.uuid();
        this.parent = parent;
        this.capabilities = capabilities;
        this.transform = transform || Transform.identity;
        this.shader = shader;
        this.uniforms = new Map<string, BufferLocation>();
        this.buffers = buffers || new Map<string, IBuffer>();
        this.attributes = new Map<string, unknown>();
        this.textures = new Map<string, ITexture>();
        this.children = [];
    }

    public get model(): BufferLocation {
        return this.uniforms.get("model");
    }

    public get properties(): BufferLocation {
        return this.uniforms.get("properties");
    }

    public get graph(): Matrix4 {
        return this.parent ?
            this.parent.graph.multiply(this.transform.model) :
            Matrix4.identity.multiply(this.transform.model);
    }

    public add(hull: Hull): Hull {
        this.children.push(hull);
        return hull;
    }

    public extract(frustum: Frustum, depth?: number): Hull[] {

        // final result
        const found = Array<Hull>();

        // check if depth is reached
        if (depth === undefined || depth >= 0) {

            // cache graph
            const graph = this.graph;

            // check if we are in the frustum
            if (frustum.wbox(graph.position, graph.rotation, graph.scale)) {

                // add ourselves
                found.push(this);

                // loop over children
                this.children.forEach(child => {

                    // continue with extraction
                    found.push(...child.extract(frustum,
                        depth === undefined ? undefined : depth - 1));
                });
            }
        }

        // all done
        return found;
    }
}
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
    public readonly index: number
    public readonly size: number;

    constructor(buffer: IBuffer, index: number, size: number) {
        // init
        this.buffer = buffer;
        this.index = index;
        this.size = size;
    }
}

export class Hull {

    public readonly id: string;
    public readonly transform: Transform;
    public readonly parent: Hull;
    public readonly shader: IShader;
    public readonly model: IBuffer;
    public readonly buffers: Map<string, IBuffer>;
    public readonly properties: IBuffer;
    public readonly textures: ITexture[];
    public readonly children: Hull[];

    constructor(parent: Hull, transform: Transform,
        model?: IBuffer, buffers?: Map<string, IBuffer>, shader?: IShader, properties?: IBuffer, textures?: ITexture[]) {

        // init
        this.id = Utils.uuid();
        this.parent = parent;
        this.transform = transform || Transform.identity;
        this.shader = shader;
        this.model = model;
        this.buffers = buffers;
        this.properties = properties;
        this.textures = textures;
        this.children = [];
    }

    public get graph(): Matrix4 {
        return this.parent ?
            this.parent.graph.multiply(this.transform.model) :
            Matrix4.identity.multiply(this.transform.model);
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
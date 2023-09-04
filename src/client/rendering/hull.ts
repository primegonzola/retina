import {
    Frustum,
    IBuffer,
    IShader,
    ITexture,
    Matrix4,
    Transform,
    Utils
} from "../index";

export interface IHullRenderer {
    bindModel(shader: IShader, model: IBuffer): void;
    bindProperties(shader: IShader, properties: IBuffer): void;
    bindTextures(shader: IShader, textures: ITexture[]): void;
    bindBuffers(shader: IShader, buffers: Map<string, IBuffer>): void;
    bindIndices(indices: IBuffer): void;
    draw(count: number): void;
    drawIndexed(count: number): void;
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

    constructor(parent?: Hull, transform?: Transform, shader?: IShader,
        buffers?: Map<string, IBuffer>, model?: IBuffer, properties?: IBuffer, textures?: ITexture[]) {

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

    private _draw(renderer: IHullRenderer): void {

        // check if shader is there
        if (this.shader) {

            // check for buffers are available
            if (this.buffers)
                renderer.bindBuffers(this.shader, this.buffers);

            // check if model is available
            if (this.model)
                renderer.bindModel(this.shader, this.model);

            // check if properties are available
            if (this.properties)
                renderer.bindProperties(this.shader, this.properties);

            // bind textures
            if (this.textures)
                renderer.bindTextures(this.shader, this.textures);

            // see if indices are there
            if (this.buffers.has("indices")) {

                // set indices
                renderer.bindIndices(this.buffers.get("indices"));

                // draw indexed
                renderer.drawIndexed(this.buffers.get("indices").count);
            }
            else if (this.buffers.has("positions")) {

                // draw non-indexed
                renderer.draw(this.buffers.get("positions").count);
            }
        }
    }

    public extract(frustum: Frustum, depth: number): Hull[] {

        // final result
        const found = Array<Hull>();

        // check if depth is reached
        if (depth >= 0) {

            // cache graph
            const graph = this.graph;

            // check if we are in the frustum
            if (frustum.wbox(graph.position, graph.rotation, graph.scale)) {

                // add ourselves
                found.push(this);

                // loop over children
                this.children.forEach(child => {

                    // continue with extraction
                    found.push(...child.extract(frustum, depth - 1));
                });
            }
        }

        // all done
        return found;
    }

    public render(renderer: IHullRenderer): void {

        // render children first
        this.children.forEach(child => child.render(renderer));

        // draw current hull
        this._draw(renderer);
    }
}
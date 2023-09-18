import {
    ModelNode,
    ModelNodeKindOptions,
    ModelNodeCollection,
    Platform,
    Quaternion,
    Transform,
    Vector3,
    Material,
    Mesh,
    Hull,
    IBuffer,
    Utils,
    MaterialModeOptions,
    BufferKindOptions,
    BufferLocation,
} from "../index";

export class Moon extends ModelNode {
    constructor(platform: Platform, parent: ModelNode, transform: Transform) {
        super(platform, parent, ModelNodeKindOptions.Moon, transform);

    }
}

export class Planet extends ModelNode {
    public readonly moons: ModelNodeCollection;
    constructor(platform: Platform, parent: ModelNode, transform: Transform) {
        super(platform, parent, ModelNodeKindOptions.Planet, transform);
        // init
        this.moons = new ModelNodeCollection(this.platform, this);
    }
}

export class Star extends ModelNode {
    public readonly planets: ModelNodeCollection;

    constructor(platform: Platform, parent: ModelNode, transform: Transform,
        mesh: Mesh, material: Material, hull: Hull) {
        super(platform, parent, ModelNodeKindOptions.Star, transform,
            mesh, material, hull);

        // init
        this.planets = new ModelNodeCollection(this.platform, this);
    }
}

export class Galaxy extends ModelNode {
    public readonly stars: ModelNodeCollection;

    private _uniforms: IBuffer;

    constructor(platform: Platform, parent: ModelNode, transform: Transform,
        mesh: Mesh, material: Material, hull: Hull) {
        super(platform, parent, ModelNodeKindOptions.Galaxy, transform,
            mesh, material, hull);

        // init
        this.stars = new ModelNodeCollection(this.platform, this);

        // precalculate delta
        const delta = transform.scale.scale(0.5);

        // loop over galaxy and add stars
        for (let z = 0; z < transform.scale.z; z++) {
            for (let y = 0; y < transform.scale.y; y++) {
                for (let x = 0; x < transform.scale.x; x++) {

                    // get mesh
                    const mesh = this.platform.resources.getMesh("platform", "cube");

                    // get material
                    const material = this.platform.resources.getMaterial("platform", "hull-star").clone();

                    // create the hull
                    const shull = new Hull(hull, new Transform(
                        new Vector3(x, y, z).subtract(delta).add(Vector3.one.scale(0.5)),
                        Quaternion.identity, Vector3.one.scale(0.25)
                    ), material.mode === MaterialModeOptions.Transparent, material.shader, mesh.buffers);

                    // add to root
                    hull.children.push(shull);

                    // save material
                    shull.attributes.set("material", material);

                    // add star
                    this.stars.add(new Star(this.platform, this, shull.transform, mesh, material, shull));
                }
            }
        }

        // start with empty buffer
        let data: number[] = [];

        // loop over stars
        this.stars.forEach<Star>(star => {
            // add  model and properties
            data = data.concat(
                Utils.pad(star.transform.extract(), 256),
                Utils.pad((star.hull.attributes.get("material") as Material).extract(), 256))
        });

        // create buffer
        const buffer = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // loop over galaxies
        this.stars.forEach<Star>(star => {
            // set uniforms
            star.hull.uniforms.set("model", new BufferLocation(buffer, hull.transform.extract().length, 0));
            star.hull.uniforms.set("properties", new BufferLocation(buffer, (star.hull.attributes.get("material") as Material).extract().length, 1));
        });

        // save
        this._uniforms = buffer;

    }

    public get uniforms(): IBuffer {
        return this._uniforms;
    }
}

export class Universe extends ModelNode {
    public readonly galaxies: ModelNodeCollection;
    private _uniforms: IBuffer;

    constructor(platform: Platform) {
        super(platform, null, ModelNodeKindOptions.Universe, Transform.identity);
        // init
        this.galaxies = new ModelNodeCollection(this.platform, this);
    }

    public get uniforms(): IBuffer {
        return this._uniforms;
    }

    public generate(): void {
        // clean up
        this._uniforms?.destroy();

        // clean up
        this.galaxies.clear();

        // get mesh
        const mesh = this.platform.resources.getMesh("platform", "cube");

        // get material
        const material = this.platform.resources.getMaterial("platform", "hull-galaxy").clone();

        // create hull
        const hull = new Hull(null, Transform.identity, material.mode === MaterialModeOptions.Transparent,
            material.shader, mesh.buffers);

        // save material
        hull.attributes.set("material", material);

        // add galaxy
        this.galaxies.add(new Galaxy(this.platform, this.galaxies,
            new Transform(Vector3.zero, Quaternion.identity, Vector3.one.scale(4)),
            mesh, material, hull));

        // start with empty buffer
        let data: number[] = [];

        // loop over galaxies
        this.galaxies.forEach<Galaxy>(galaxy => {
            // add  model and properties
            data = data.concat(
                Utils.pad(galaxy.transform.extract(), 256),
                Utils.pad((galaxy.hull.attributes.get("material") as Material).extract(), 256))
        });

        // create buffer
        const buffer = this.platform.graphics.createF32Buffer(BufferKindOptions.Uniform, data);

        // loop over galaxies
        this.galaxies.forEach<Galaxy>(galaxy => {
            // set uniforms
            galaxy.hull.uniforms.set("model", new BufferLocation(buffer, hull.transform.extract().length, 0));
            galaxy.hull.uniforms.set("properties", new BufferLocation(buffer, (galaxy.hull.attributes.get("material") as Material).extract().length, 1));
        });

        // save
        this._uniforms = buffer;
    }
}
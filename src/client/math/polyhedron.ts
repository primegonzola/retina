import {
    Vector2,
    Vector3
} from "../index";

export type PolyhedronConfig = {
    vertices?: number[];
    indices?: number[];
    radius?: number;
    subdivisions?: number;
}

export type PolyhedronData = {
    vertices?: number[];
    indices?: number[];
    texels?: number[];
    normals?: number[];
}

export class Polyhedron {
    public readonly kind: string;
    public readonly config: PolyhedronConfig;
    public readonly data: PolyhedronData;

    constructor(kind: string, config: PolyhedronConfig) {
        // save
        this.kind = kind;

        // apply the config
        this.config = this.apply(config);

        // process the config
        this.data = this.generate();
    }

    private generate(): PolyhedronData {

        // subdivide
        const vertices = this.subdivide(this.config.subdivisions);

        // apply radius
        this.applyRadius(vertices, this.config.radius);

        // generate indices
        const indices = this.generateIndices(vertices);

        // generate texels
        const texels = this.generateTexels(vertices);

        // generate normals
        const normals = this.generateNormals(vertices, indices);

        // all done
        return {
            vertices: vertices,
            indices: indices,
            texels: texels,
            normals: normals
        };
    }

    private apply(config: PolyhedronConfig): PolyhedronConfig {
        const cfg: PolyhedronConfig = {
            vertices: [],
            indices: [],
            radius: 1.0,
            subdivisions: 0
        };

        cfg.vertices = config && config.vertices ? config.vertices : cfg.vertices;
        cfg.indices = config && config.indices ? config.indices : cfg.indices;
        cfg.radius = config && config.radius ? config.radius : cfg.radius;
        cfg.subdivisions = config && config.subdivisions ? config.subdivisions : cfg.subdivisions;

        // all done
        return cfg;
    }

    private applyRadius(vertices: number[], radius: number) {
        // iterate over vertices
        for (let i = 0; i < vertices.length; i += 3) {
            const v = new Vector3(
                vertices[i + 0],
                vertices[i + 1],
                vertices[i + 2]).scale(radius);
            vertices[i + 0] = v.x;
            vertices[i + 1] = v.y;
            vertices[i + 2] = v.z;
        }
    }

    private vertexFromIndex(vertices: number[], index: number): Vector3 {
        return new Vector3(
            vertices[(3 * index) + 0],
            vertices[(3 * index) + 1],
            vertices[(3 * index) + 2],
        );
    }

    private subdivide(subdivisions: number, vertices: number[] = []): number[] {

        // go over the different faces and subdivide
        for (let i = 0; i < this.config.indices.length; i += 3) {

            // get the vertices of the face
            const a = this.vertexFromIndex(this.config.vertices, this.config.indices[i + 0]);
            const b = this.vertexFromIndex(this.config.vertices, this.config.indices[i + 1]);
            const c = this.vertexFromIndex(this.config.vertices, this.config.indices[i + 2]);

            // const center = Vector3.average([a, b, c]);

            // push vertices
            // a.normalize().push(vertices);
            // b.normalize().push(vertices);
            // c.normalize().push(vertices);

            // const ab = Vector3.average([a, b]);
            // const bc = Vector3.average([b, c]);
            // const ca = Vector3.average([c, a]);

            // a.normalize().push(vertices);
            // ab.normalize().push(vertices);
            // ca.normalize().push(vertices);

            // ab.normalize().push(vertices);
            // b.normalize().push(vertices);
            // bc.normalize().push(vertices);

            // c.normalize().push(vertices);
            // ca.normalize().push(vertices);
            // bc.normalize().push(vertices);

            // ab.normalize().push(vertices);
            // bc.normalize().push(vertices);
            // ca.normalize().push(vertices);

            // do the actual subdivision
            this.subdivideSurface(vertices, a, b, c, subdivisions);
        }

        // all done
        return vertices;
    }

    private subdivideSurface(vertices: number[], a: Vector3, b: Vector3, c: Vector3, subdivisions: number) {

        const cols = subdivisions + 1;

        // we use this multidimensional array as a data structure for creating the subdivision
        const v: Vector3[][] = [];

        // construct all of the vertices for this subdivision
        for (let i = 0; i <= cols; i++) {
            v[i] = [];
            const aj = new Vector3(a.x, a.y, a.z).lerp(c, i / cols);
            const bj = new Vector3(b.x, b.y, b.z).lerp(c, i / cols);
            const rows = cols - i;
            for (let j = 0; j <= rows; j++) {
                if (j === 0 && i === cols) {
                    v[i][j] = new Vector3(aj.x, aj.y, aj.z);
                } else {
                    v[i][j] = new Vector3(aj.x, aj.y, aj.z).lerp(bj, j / rows);
                }
            }
        }

        // construct all of the faces
        for (let i = 0; i < cols; i++) {
            for (let j = 0; j < 2 * (cols - i) - 1; j++) {
                const k = Math.floor(j / 2);
                if (j % 2 === 0) {
                    v[i][k + 1].normalize().push(vertices);
                    v[i + 1][k].normalize().push(vertices);
                    v[i][k].normalize().push(vertices);
                } else {
                    v[i][k + 1].normalize().push(vertices);
                    v[i + 1][k + 1].normalize().push(vertices);
                    v[i + 1][k].normalize().push(vertices);
                }
            }
        }
    }

    private generateIndices(vertices: number[], indices: number[] = []): number[] {
        const vs = Vector3.fromNumbers(vertices);
        for (let i = 0; i < vs.length / 3; i++) {
            indices.push((3 * i) + 0);
            indices.push((3 * i) + 1);
            indices.push((3 * i) + 2);
        }
        return indices;
    }

    private generateNormals(vertices: number[], indices: number[], normals: number[] = []): number[] {
        const vs = Vector3.fromNumbers(vertices);
        for (let i = 0; i < indices.length / 3; i++) {
            const a = vs[indices[(3 * i) + 0]];
            const b = vs[indices[(3 * i) + 1]];
            const c = vs[indices[(3 * i) + 2]];
            // get normal and push t
            // const normal = Vector3.normalize(Vector3.cross(
            //     Vector3.subtract(b, a), Vector3.subtract(c, a)));
            const normal = b.subtract(a).cross(c.subtract(a)).normalize();
            
            normal.push(normals);
            normal.push(normals);
            normal.push(normals);
        }
        return normals;
    }

    private generateTexels(vertices: number[], texels: number[] = []): number[] {
        const vertex = Vector3.zero;
        for (let i = 0; i < vertices.length; i += 3) {
            vertex.x = vertices[i + 0];
            vertex.y = vertices[i + 1];
            vertex.z = vertices[i + 2];
            const u = this.azimuth(vertex) / 2 / Math.PI + 0.5;
            const v = this.inclination(vertex) / Math.PI + 0.5;
            texels.push(u, 1 - v);
        }

        this.correctUVs(vertices, texels);

        this.correctSeam(texels);

        // done
        return texels;
    }

    private correctSeam(texels: number[]) {
        // handle case when face straddles the seam, see #3269
        for (let i = 0; i < texels.length; i += 6) {
            // uv data of a single face
            const x0 = texels[i + 0];
            const x1 = texels[i + 2];
            const x2 = texels[i + 4];

            const max = Math.max(x0, x1, x2);
            const min = Math.min(x0, x1, x2);

            // 0.9 is somewhat arbitrary
            if (max > 0.9 && min < 0.1) {
                if (x0 < 0.2) texels[i + 0] += 1;
                if (x1 < 0.2) texels[i + 2] += 1;
                if (x2 < 0.2) texels[i + 4] += 1;
            }
        }
    }

    private correctUVs(vertices: number[], texels: number[]) {
        const centroid = Vector3.zero;
        for (let i = 0, j = 0; i < vertices.length; i += 9, j += 6) {

            const a = new Vector3(vertices[i + 0], vertices[i + 1], vertices[i + 2]);
            const b = new Vector3(vertices[i + 3], vertices[i + 4], vertices[i + 5]);
            const c = new Vector3(vertices[i + 6], vertices[i + 7], vertices[i + 8]);

            const uvA = new Vector2(texels[j + 0], texels[j + 1]);
            const uvB = new Vector2(texels[j + 2], texels[j + 3]);
            const uvC = new Vector2(texels[j + 4], texels[j + 5]);

            const centroid = Vector3.average([a, b, c]);
            const azi = this.azimuth(centroid);

            this.correctUV(texels, uvA, j + 0, a, azi);
            this.correctUV(texels, uvB, j + 2, b, azi);
            this.correctUV(texels, uvC, j + 4, c, azi);
        }

    }

    private correctUV(texels: number[], uv: Vector2, stride: number, vector: Vector3, azimuth: number) {
        if ((azimuth < 0) && (uv.x === 1)) {
            texels[stride] = uv.x - 1;
        }

        if ((vector.x === 0) && (vector.z === 0)) {
            texels[stride] = azimuth / 2 / Math.PI + 0.5;
        }
    }

    // Angle around the Y axis, counter-clockwise when looking from above.
    private azimuth(v: Vector3) {
        return Math.atan2(v.z, - v.x);
    }

    // Angle above the XZ plane.
    private inclination(v: Vector3) {
        return Math.atan2(- v.y, Math.sqrt((v.x * v.x) + (v.z * v.z)));
    }
}

export class Icosahedron extends Polyhedron {
    constructor(radius: number, subdivisions: number = 0) {
        const t = (1 + Math.sqrt(5)) / 2;
        const vertices = [
            -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t, 0,
            0, -1, t, 0, 1, t, 0, -1, -t, 0, 1, -t,
            t, 0, -1, t, 0, 1, -t, 0, -1, -t, 0, 1
        ];

        const indices = [
            0, 11, 5, 0, 5, 1, 0, 1, 7, 0, 7, 10, 0, 10, 11,
            1, 5, 9, 5, 11, 4, 11, 10, 2, 10, 7, 6, 7, 1, 8,
            3, 9, 4, 3, 4, 2, 3, 2, 6, 3, 6, 8, 3, 8, 9,
            4, 9, 5, 2, 4, 11, 6, 2, 10, 8, 6, 7, 9, 8, 1
        ];

        super("icosahedron", {
            vertices: vertices,
            indices: indices,
            radius: radius,
            subdivisions: subdivisions
        });
    }
}
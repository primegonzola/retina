import {
    Bounds,
    Vector2,
    Vector3
} from "../index";

export class Geometry {
    public readonly positions: Vector3[];
    public readonly indices: number[] | undefined;
    public readonly texels: Vector2[] | undefined;
    public readonly normals: Vector3[] | undefined;
    public readonly tangents: Vector3[] | undefined;
    public readonly bounds: Bounds;

    constructor(positions: Vector3[], indices?: number[], texels?: Vector2[], normals?: Vector3[], tangents?: Vector3[]) {
        this.positions = positions;
        this.indices = indices;
        this.texels = texels;
        this.normals = normals || Geometry.calculateNormals(positions, indices);
        this.tangents = tangents || Geometry.calculateTangents(positions, texels, indices);
        this.bounds = Geometry.calculateBounds(positions);
    }

    private static calculateBounds(positions: Vector3[]): Bounds {
        // define start
        let min = Vector3.maxValue
        let max = Vector3.minValue
        // loop over posisionts and update
        for (const position of positions) {
            min = min.min(position);
            max = max.max(position);
        }
        return new Bounds(min, max);
    }

    private static calculateNormals(positions: Vector3[], indices: number[]): Vector3[] {
        // define normals
        const normals: Vector3[] = new Array<Vector3>(positions.length);
        // calculate normals
        for (let i = 0; i < (indices.length / 3); i++) {
            const i0 = indices[(3 * i) + 0];
            const i1 = indices[(3 * i) + 1];
            const i2 = indices[(3 * i) + 2];

            const a = positions[i0];
            const b = positions[i1];
            const c = positions[i2];

            const dea = b.subtract(a);
            const deb = c.subtract(a);
            const normal = dea.cross(deb).normalize();

            // save
            normals[i0] = normal;
            normals[i1] = normal;
            normals[i2] = normal;
        }
        // done
        return normals;
    }

    private static calculateTangents(positions: Vector3[], texels: Vector2[], indices: number[]): Vector3[] {
        // check format
        // define normals
        const tangents: Vector3[] = new Array<Vector3>(texels.length);
        // calculate normals
        for (let i = 0; i < (indices.length / 3); i++) {
            const i0 = indices[(3 * i) + 0];
            const i1 = indices[(3 * i) + 1];
            const i2 = indices[(3 * i) + 2];

            const a = positions[i0];
            const b = positions[i1];
            const c = positions[i2];

            const dea = b.subtract(a);
            const deb = c.subtract(a);

            const uv1 = texels[i0];
            const uv2 = texels[i1];
            const uv3 = texels[i2];

            const duv1 = uv2.subtract(uv1);
            const duv2 = uv3.subtract(uv1);

            const f = 1.0 / (duv1.x * duv2.y - duv2.x * duv1.y);
            const tangent = new Vector3(
                f * (duv2.y * dea.x - duv1.y * deb.x),
                f * (duv2.y * dea.y - duv1.y * deb.y),
                f * (duv2.y * dea.z - duv1.y * deb.z));
            const bitangent = new Vector3(
                f * (-duv2.x * dea.x + duv1.x * deb.x),
                f * (-duv2.x * dea.y + duv1.x * deb.y),
                f * (-duv2.x * dea.z + duv1.x * deb.z));

            tangents[i0] = tangent;
            tangents[i1] = tangent;
            tangents[i2] = tangent;
        }
        // done
        return tangents;
    }

    public static cube(): Geometry {
        const positions = [
            // front
            0.5, -0.5, -0.5,
            -0.5, -0.5, -0.5,
            -0.5, 0.5, -0.5,
            0.5, 0.5, -0.5,
            // back
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,
            // top
            -0.5, 0.5, 0.5,
            0.5, 0.5, 0.5,
            0.5, 0.5, -0.5,
            -0.5, 0.5, -0.5,
            // bottom
            -0.5, -0.5, -0.5,
            0.5, -0.5, -0.5,
            0.5, -0.5, 0.5,
            -0.5, -0.5, 0.5,
            // left
            -0.5, -0.5, -0.5,
            -0.5, -0.5, 0.5,
            -0.5, 0.5, 0.5,
            -0.5, 0.5, -0.5,
            // right
            0.5, -0.5, 0.5,
            0.5, -0.5, -0.5,
            0.5, 0.5, -0.5,
            0.5, 0.5, 0.5,
        ];

        const texels = [
            // front
            0, 0, 1, 0, 1, 1, 0, 1,
            // back
            0, 0, 1, 0, 1, 1, 0, 1,
            // top
            0, 0, 1, 0, 1, 1, 0, 1,
            // bottom
            0, 0, 1, 0, 1, 1, 0, 1,
            // left
            0, 0, 1, 0, 1, 1, 0, 1,
            // right
            0, 0, 1, 0, 1, 1, 0, 1
        ];

        const indices = [
            // front
            0, 1, 2, 2, 3, 0,
            // back
            4, 5, 6, 6, 7, 4,
            // top
            8, 9, 10, 10, 11, 8,
            // bottom
            12, 13, 14, 14, 15, 12,
            // left
            16, 17, 18, 18, 19, 16,
            // right
            20, 21, 22, 22, 23, 20
        ];

        return new Geometry(
            Vector3.fromNumbers(positions),
            indices,
            Vector2.fromNumbers(texels),
            Geometry.calculateNormals(Vector3.fromNumbers(positions), indices),
            Geometry.calculateTangents(Vector3.fromNumbers(positions), Vector2.fromNumbers(texels), indices));
    }

    public static quad(): Geometry {
        const positions = [
            -0.5, -0.5, 0.5,
            0.5, -0.5, 0.5,
            0.5, 0.5, 0.5,
            -0.5, 0.5, 0.5,
        ];

        const texels = [
            0, 1, 1, 1, 1, 0, 0, 0,
        ];

        const indices = [
            0, 1, 2, 2, 3, 0,
        ];

        return new Geometry(
            Vector3.fromNumbers(positions),
            indices,
            Vector2.fromNumbers(texels),
            Geometry.calculateNormals(Vector3.fromNumbers(positions), indices),
            Geometry.calculateTangents(Vector3.fromNumbers(positions), Vector2.fromNumbers(texels), indices));
    }
}
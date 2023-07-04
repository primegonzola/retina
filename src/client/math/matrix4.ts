import {
    Quaternion,
    Vector3
} from "../index"

export class Matrix4 {
    public readonly values: number[];

    constructor(values: readonly number[] = Matrix4.zero.values) {
        this.values = values.slice(0, values.length);
    }

    public static get zero(): Matrix4 {
        return new Matrix4([
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0,
            0, 0, 0, 0
        ]);
    }

    public static get identity(): Matrix4 {
        return new Matrix4([
            1, 0, 0, 0,
            0, 1, 0, 0,
            0, 0, 1, 0,
            0, 0, 0, 1
        ]);
    }

    public get(row: number, column: number): number {
        return this.values[(4 * column) + row];
    }

    public set(row: number, column: number, value: number): void {
        this.values[(4 * column) + row] = value;
    }

    public scale(scale: number): Matrix4 {
        let result: Matrix4 = Matrix4.zero;
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 4; i++) {
                result.set(i, j, this.get(i, j) * scale);
            }
        }
        // all done
        return result;
    }

    public multiply(m: Matrix4): Matrix4 {
        // column order matrices are being used
        let result: Matrix4 = Matrix4.zero;
        for (let r = 0; r < 4; r++) {
            for (let c = 0; c < 4; c++) {
                result.set(r, c,
                    this.get(r, 0) * m.get(0, c) +
                    this.get(r, 1) * m.get(1, c) +
                    this.get(r, 2) * m.get(2, c) +
                    this.get(r, 3) * m.get(3, c));
            }
        }
        // all done
        return result;
    }

    public get transpose(): Matrix4 {
        let result: Matrix4 = Matrix4.zero;
        for (let j = 0; j < 4; j++) {
            for (let i = 0; i < 4; i++) {
                result.set(i, j, this.get(j, i));
            }
        }
        // all done
        return result;
    }

    // http://www.euclideanspace.com/maths/algebra/matrix/transforms/index.htm
    public static rotateAxis(axis: Vector3, angle: number): Matrix4 {
        const c = Math.cos(angle);
        const s = Math.sin(angle);
        const x = axis.normalize().x;
        const y = axis.normalize().y;
        const z = axis.normalize().z;
        const t = 1 - c;
        const m00 = t * x * x + c;
        const m01 = t * x * y - z * s;
        const m02 = t * x * z + y * s;
        const m10 = t * x * y + z * s;
        const m11 = t * y * y + c;
        const m12 = t * y * z - x * s;
        const m20 = t * x * z - y * s;
        const m21 = t * y * z + x * s;
        const m22 = t * z * z + c;
        const m30 = 0, m31 = 0, m32 = 0, m03 = 0, m13 = 0, m23 = 0, m33 = 1;

        const result = Matrix4.zero;
        result.set(0, 0, m00);
        result.set(1, 0, m10);
        result.set(2, 0, m20);
        result.set(3, 0, m30);

        result.set(0, 1, m01);
        result.set(1, 1, m11);
        result.set(2, 1, m21);
        result.set(3, 1, m31);

        result.set(0, 2, m02);
        result.set(1, 2, m12);
        result.set(2, 2, m22);
        result.set(3, 2, m32);

        result.set(0, 3, m03);
        result.set(1, 3, m13);
        result.set(2, 3, m23);
        result.set(3, 3, m33);

        // all done
        return result;
    }

    // see http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
    public determinant(): number {
        const m00 = this.get(0, 0);
        const m10 = this.get(1, 0);
        const m20 = this.get(2, 0);
        const m30 = this.get(3, 0);

        const m01 = this.get(0, 1);
        const m11 = this.get(1, 1);
        const m21 = this.get(2, 1);
        const m31 = this.get(3, 1);

        const m02 = this.get(0, 2);
        const m12 = this.get(1, 2);
        const m22 = this.get(2, 2);
        const m32 = this.get(3, 2);

        const m03 = this.get(0, 3);
        const m13 = this.get(1, 3);
        const m23 = this.get(2, 3);
        const m33 = this.get(3, 3);

        return (
            (m03 * m12 * m21 * m30) - (m02 * m13 * m21 * m30) - (m03 * m11 * m22 * m30) + (m01 * m13 * m22 * m30) +
            (m02 * m11 * m23 * m30) - (m01 * m12 * m23 * m30) - (m03 * m12 * m20 * m31) + (m02 * m13 * m20 * m31) +
            (m03 * m10 * m22 * m31) - (m00 * m13 * m22 * m31) - (m02 * m10 * m23 * m31) + (m00 * m12 * m23 * m31) +
            (m03 * m11 * m20 * m32) - (m01 * m13 * m20 * m32) - (m03 * m10 * m21 * m32) + (m00 * m13 * m21 * m32) +
            (m01 * m10 * m23 * m32) - (m00 * m11 * m23 * m32) - (m02 * m11 * m20 * m33) + (m01 * m12 * m20 * m33) +
            (m02 * m10 * m21 * m33) - (m00 * m12 * m21 * m33) - (m01 * m10 * m22 * m33) + (m00 * m11 * m22 * m33)
        );
    }

    // see http://www.euclideanspace.com/maths/algebra/matrix/functions/inverse/fourD/index.htm
    public get inverse(): Matrix4 {
        const m00 = this.get(0, 0);
        const m10 = this.get(1, 0);
        const m20 = this.get(2, 0);
        const m30 = this.get(3, 0);

        const m01 = this.get(0, 1);
        const m11 = this.get(1, 1);
        const m21 = this.get(2, 1);
        const m31 = this.get(3, 1);

        const m02 = this.get(0, 2);
        const m12 = this.get(1, 2);
        const m22 = this.get(2, 2);
        const m32 = this.get(3, 2);

        const m03 = this.get(0, 3);
        const m13 = this.get(1, 3);
        const m23 = this.get(2, 3);
        const m33 = this.get(3, 3);

        const t00 = m12 * m23 * m31 - m13 * m22 * m31 + m13 * m21 * m32 - m11 * m23 * m32 - m12 * m21 * m33 + m11 * m22 * m33;
        const t01 = m03 * m22 * m31 - m02 * m23 * m31 - m03 * m21 * m32 + m01 * m23 * m32 + m02 * m21 * m33 - m01 * m22 * m33;
        const t02 = m02 * m13 * m31 - m03 * m12 * m31 + m03 * m11 * m32 - m01 * m13 * m32 - m02 * m11 * m33 + m01 * m12 * m33;
        const t03 = m03 * m12 * m21 - m02 * m13 * m21 - m03 * m11 * m22 + m01 * m13 * m22 + m02 * m11 * m23 - m01 * m12 * m23;
        const t10 = m13 * m22 * m30 - m12 * m23 * m30 - m13 * m20 * m32 + m10 * m23 * m32 + m12 * m20 * m33 - m10 * m22 * m33;
        const t11 = m02 * m23 * m30 - m03 * m22 * m30 + m03 * m20 * m32 - m00 * m23 * m32 - m02 * m20 * m33 + m00 * m22 * m33;
        const t12 = m03 * m12 * m30 - m02 * m13 * m30 - m03 * m10 * m32 + m00 * m13 * m32 + m02 * m10 * m33 - m00 * m12 * m33;
        const t13 = m02 * m13 * m20 - m03 * m12 * m20 + m03 * m10 * m22 - m00 * m13 * m22 - m02 * m10 * m23 + m00 * m12 * m23;
        const t20 = m11 * m23 * m30 - m13 * m21 * m30 + m13 * m20 * m31 - m10 * m23 * m31 - m11 * m20 * m33 + m10 * m21 * m33;
        const t21 = m03 * m21 * m30 - m01 * m23 * m30 - m03 * m20 * m31 + m00 * m23 * m31 + m01 * m20 * m33 - m00 * m21 * m33;
        const t22 = m01 * m13 * m30 - m03 * m11 * m30 + m03 * m10 * m31 - m00 * m13 * m31 - m01 * m10 * m33 + m00 * m11 * m33;
        const t23 = m03 * m11 * m20 - m01 * m13 * m20 - m03 * m10 * m21 + m00 * m13 * m21 + m01 * m10 * m23 - m00 * m11 * m23;
        const t30 = m12 * m21 * m30 - m11 * m22 * m30 - m12 * m20 * m31 + m10 * m22 * m31 + m11 * m20 * m32 - m10 * m21 * m32;
        const t31 = m01 * m22 * m30 - m02 * m21 * m30 + m02 * m20 * m31 - m00 * m22 * m31 - m01 * m20 * m32 + m00 * m21 * m32;
        const t32 = m02 * m11 * m30 - m01 * m12 * m30 - m02 * m10 * m31 + m00 * m12 * m31 + m01 * m10 * m32 - m00 * m11 * m32;
        const t33 = m01 * m12 * m20 - m02 * m11 * m20 + m02 * m10 * m21 - m00 * m12 * m21 - m01 * m10 * m22 + m00 * m11 * m22;

        const result = Matrix4.zero;
        result.set(0, 0, t00);
        result.set(1, 0, t10);
        result.set(2, 0, t20);
        result.set(3, 0, t30);

        result.set(0, 1, t01);
        result.set(1, 1, t11);
        result.set(2, 1, t21);
        result.set(3, 1, t31);

        result.set(0, 2, t02);
        result.set(1, 2, t12);
        result.set(2, 2, t22);
        result.set(3, 2, t32);

        result.set(0, 3, t03);
        result.set(1, 3, t13);
        result.set(2, 3, t23);
        result.set(3, 3, t33);

        // get determinant
        const determinant = this.determinant();

        // check if zero
        if (determinant === 0)
            return Matrix4.zero;

        // scale accordingy
        return result.scale(1.0 / determinant);
    }

    public static construct(position: Vector3, quaternion: Quaternion, scale: Vector3): Matrix4 {

        const result = Matrix4.zero;
        const te = result.values;
        const x = quaternion.x, y = quaternion.y, z = quaternion.z, w = quaternion.w;
        const x2 = x + x, y2 = y + y, z2 = z + z;
        const xx = x * x2, xy = x * y2, xz = x * z2;
        const yy = y * y2, yz = y * z2, zz = z * z2;
        const wx = w * x2, wy = w * y2, wz = w * z2;

        const sx = scale.x, sy = scale.y, sz = scale.z;

        te[0] = (1 - (yy + zz)) * sx;
        te[1] = (xy + wz) * sx;
        te[2] = (xz - wy) * sx;
        te[3] = 0;

        te[4] = (xy - wz) * sy;
        te[5] = (1 - (xx + zz)) * sy;
        te[6] = (yz + wx) * sy;
        te[7] = 0;

        te[8] = (xz + wy) * sz;
        te[9] = (yz - wx) * sz;
        te[10] = (1 - (xx + yy)) * sz;
        te[11] = 0;

        te[12] = position.x;
        te[13] = position.y;
        te[14] = position.z;
        te[15] = 1;

        return result;
    }

    // public transform(): Transform {
    //     return new Transform(this.getPosition(), this.getRotation(), this.getScale());
    // }

    public deconstructPosition(): Vector3 {
        return new Vector3(this.values[12], this.values[13], this.values[14]);
    }

    public deconstructRotation(): Quaternion {
        let sx = new Vector3(this.values[0], this.values[1], this.values[2]).magnitude();
        const sy = new Vector3(this.values[4], this.values[5], this.values[6]).magnitude();
        const sz = new Vector3(this.values[8], this.values[9], this.values[10]).magnitude();

        // flip if needed
        if (this.determinant() < 0) sx = -sx;

        // scale the rotation part
        const m1 = new Matrix4(this.values.slice());

        const invSX = 1 / sx;
        const invSY = 1 / sy;
        const invSZ = 1 / sz;

        m1.values[0] *= invSX;
        m1.values[1] *= invSX;
        m1.values[2] *= invSX;

        m1.values[4] *= invSY;
        m1.values[5] *= invSY;
        m1.values[6] *= invSY;

        m1.values[8] *= invSZ;
        m1.values[9] *= invSZ;
        m1.values[10] *= invSZ;

        return Quaternion.fromMatrix(m1);
    }

    public deconstructScale(): Vector3 {
        let sx = new Vector3(this.values[0], this.values[1], this.values[2]).magnitude();
        const sy = new Vector3(this.values[4], this.values[5], this.values[6]).magnitude();
        const sz = new Vector3(this.values[8], this.values[9], this.values[10]).magnitude();

        // flip if needed
        if (this.determinant() < 0) sx = -sx;

        return new Vector3(sx, sy, sz);
    }

    public static orthographic(left: number, right: number, top: number, bottom: number, near: number, far: number): Matrix4 {
        const result = Matrix4.zero;
        const te = result.values;
        const w = 1.0 / (right - left);
        const h = 1.0 / (top - bottom);
        const p = 1.0 / (far - near);

        const x = (right + left) * w;
        const y = (top + bottom) * h;
        const z = (far + near) * p;

        te[0] = 2 * w; te[4] = 0; te[8] = 0; te[12] = - x;
        te[1] = 0; te[5] = 2 * h; te[9] = 0; te[13] = - y;
        te[2] = 0; te[6] = 0; te[10] = - 2 * p; te[14] = - z;
        te[3] = 0; te[7] = 0; te[11] = 0; te[15] = 1;

        return result;
    }

    public static perspective(left: number, right: number, top: number, bottom: number, near: number, far: number): Matrix4 {
        const result = Matrix4.zero;
        const te = result.values;
        const x = 2 * near / (right - left);
        const y = 2 * near / (top - bottom);
        const a = (right + left) / (right - left);
        const b = (top + bottom) / (top - bottom);
        const c = - (far + near) / (far - near);
        const d = - 2 * far * near / (far - near);
        te[0] = x; te[4] = 0; te[8] = a; te[12] = 0;
        te[1] = 0; te[5] = y; te[9] = b; te[13] = 0;
        te[2] = 0; te[6] = 0; te[10] = c; te[14] = d;
        te[3] = 0; te[7] = 0; te[11] = - 1; te[15] = 0;

        return result;
    }

    public copy(m: Matrix4) {
        for (let i = 0; i < 16; i++) {
            this.values[i] = m.values[i];
        }
    }
}
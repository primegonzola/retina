import {
    Euler,
    EulerOrderOptions,
    Matrix4,
    Vector3
} from "../index"

export class Quaternion {
    public x: number;
    public y: number;
    public z: number;
    public w: number;

    constructor(x: number = 0, y: number = 0, z: number = 0, w: number = 1) {
        this.x = x;
        this.y = y;
        this.z = z;
        this.w = w;
    }

    public static get zero(): Quaternion {
        return new Quaternion(0.0, 0.0, 0.0, 0.0);
    }

    public static get identity(): Quaternion {
        return new Quaternion(0.0, 0.0, 0.0, 1.0);
    }

    public get direction(): Vector3 {
        return this.rotateVector(Vector3.forward).normalize();
    }

    public scale(scale: number): Quaternion {
        return new Quaternion(
            this.x * scale,
            this.y * scale,
            this.z * scale,
            this.w * scale);
    }

    public dot(q: Quaternion): number {
        return this.x * q.x + this.y * q.y + this.z * q.z + this.w * q.w;
    }

    public magnitude(): number {
        return Math.sqrt(this.x * this.x + this.y * this.y + this.z * this.z + this.w * this.w);
    }

    public normalize(): Quaternion {
        // get magnitude
        const magnitude = this.magnitude();

        // check if zero and avoid division
        if (magnitude === 0)
            return Quaternion.identity;

        // all done
        return this.scale(1.0 / magnitude);
    }

    public add(q: Quaternion): Quaternion {
        return new Quaternion(
            this.x + q.x,
            this.y + q.y,
            this.z + q.z,
            this.w + q.w);
    }

    public multiply(q: Quaternion): Quaternion {

        // from http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/code/index.htm
        const qax = this.x, qay = this.y, qaz = this.z, qaw = this.w;
        const qbx = q.x, qby = q.y, qbz = q.z, qbw = q.w;

        return new Quaternion(
            qax * qbw + qaw * qbx + qay * qbz - qaz * qby,
            qay * qbw + qaw * qby + qaz * qbx - qax * qbz,
            qaz * qbw + qaw * qbz + qax * qby - qay * qbx,
            qaw * qbw - qax * qbx - qay * qby - qaz * qbz
        );
    }

    public static axisAngle(axis: Vector3, angle: number): Quaternion {
        const s = Math.sin(angle / 2);
        const n = axis.normalize();
        return new Quaternion(
            n.x * s, n.y * s, n.z * s, Math.cos(angle / 2)).normalize();
    }

    public static degrees(x: number, y: number, z: number,
        order: EulerOrderOptions = EulerOrderOptions.ZYX): Quaternion {
        return Quaternion.fromEuler(Euler.fromDegrees(x, y, z, order));
    }

    public static radians(x: number, y: number, z: number,
        order: EulerOrderOptions = EulerOrderOptions.ZYX): Quaternion {
        return Quaternion.fromEuler(Euler.fromRadians(x, y, z, order));
    }

    public static fromEuler(euler: Euler): Quaternion {
        const t = Quaternion.zero;
        const c1 = Math.cos(euler.x / 2);
        const c2 = Math.cos(euler.y / 2);
        const c3 = Math.cos(euler.z / 2);
        const s1 = Math.sin(euler.x / 2);
        const s2 = Math.sin(euler.y / 2);
        const s3 = Math.sin(euler.z / 2);

        switch (euler.order) {

            case EulerOrderOptions.XYZ:
                t.x = s1 * c2 * c3 + c1 * s2 * s3;
                t.y = c1 * s2 * c3 - s1 * c2 * s3;
                t.z = c1 * c2 * s3 + s1 * s2 * c3;
                t.w = c1 * c2 * c3 - s1 * s2 * s3;
                return t;

            case EulerOrderOptions.YXZ:
                t.x = s1 * c2 * c3 + c1 * s2 * s3;
                t.y = c1 * s2 * c3 - s1 * c2 * s3;
                t.z = c1 * c2 * s3 - s1 * s2 * c3;
                t.w = c1 * c2 * c3 + s1 * s2 * s3;
                return t;

            case EulerOrderOptions.ZXY:
                t.x = s1 * c2 * c3 - c1 * s2 * s3;
                t.y = c1 * s2 * c3 + s1 * c2 * s3;
                t.z = c1 * c2 * s3 + s1 * s2 * c3;
                t.w = c1 * c2 * c3 - s1 * s2 * s3;
                return t;

            case EulerOrderOptions.ZYX:
                t.x = s1 * c2 * c3 - c1 * s2 * s3;
                t.y = c1 * s2 * c3 + s1 * c2 * s3;
                t.z = c1 * c2 * s3 - s1 * s2 * c3;
                t.w = c1 * c2 * c3 + s1 * s2 * s3;
                return t;

            case EulerOrderOptions.YZX:
                t.x = s1 * c2 * c3 + c1 * s2 * s3;
                t.y = c1 * s2 * c3 + s1 * c2 * s3;
                t.z = c1 * c2 * s3 - s1 * s2 * c3;
                t.w = c1 * c2 * c3 - s1 * s2 * s3;
                return t;

            case EulerOrderOptions.XZY:
                t.x = s1 * c2 * c3 - c1 * s2 * s3;
                t.y = c1 * s2 * c3 - s1 * c2 * s3;
                t.z = c1 * c2 * s3 + s1 * s2 * c3;
                t.w = c1 * c2 * c3 + s1 * s2 * s3;
                return t;
            default:
                throw Error("invalid-euler-order-type");
        }
    }

    public get inverse(): Quaternion {
        return new Quaternion(this.x, -this.y, -this.z, this.w);
    }

    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/quaternionToMatrix/index.htm
    public toMatrix(): Matrix4 {
        const sqw = this.w * this.w;
        const sqx = this.x * this.x;
        const sqy = this.y * this.y;
        const sqz = this.z * this.z;

        // invs (inverse square length) is only required if quaternion is not already normalised
        const invs = 1 / (sqx + sqy + sqz + sqw)
        const m00 = (sqx - sqy - sqz + sqw) * invs; // since sqw + sqx + sqy + sqz =1/invs*invs
        const m11 = (-sqx + sqy - sqz + sqw) * invs;
        const m22 = (-sqx - sqy + sqz + sqw) * invs;

        let tmp1 = this.x * this.y;
        let tmp2 = this.z * this.w;
        const m10 = 2.0 * (tmp1 + tmp2) * invs;
        const m01 = 2.0 * (tmp1 - tmp2) * invs;

        tmp1 = this.x * this.z;
        tmp2 = this.y * this.w;
        const m20 = 2.0 * (tmp1 - tmp2) * invs;
        const m02 = 2.0 * (tmp1 + tmp2) * invs;
        tmp1 = this.y * this.z;
        tmp2 = this.x * this.w;
        const m21 = 2.0 * (tmp1 + tmp2) * invs;
        const m12 = 2.0 * (tmp1 - tmp2) * invs;

        const result = Matrix4.zero;
        result.set(0, 0, m00);
        result.set(1, 0, m10);
        result.set(2, 0, m20);
        result.set(3, 0, 0);

        result.set(0, 1, m01);
        result.set(1, 1, m11);
        result.set(2, 1, m21);
        result.set(3, 1, 0);

        result.set(0, 2, m02);
        result.set(1, 2, m12);
        result.set(2, 2, m22);
        result.set(3, 2, 0);

        result.set(0, 3, 0);
        result.set(1, 3, 0);
        result.set(2, 3, 0);
        result.set(3, 3, 1);

        return result;
    }

    // http://www.euclideanspace.com/maths/geometry/rotations/conversions/matrixToQuaternion/index.htm
    public static fromMatrix(m: Matrix4): Quaternion {
        // assumes the upper 3x3 of m is a pure rotation matrix (i.e, unscaled)
        const q = Quaternion.identity;
        const te = m.values;

        const m11 = te[0], m12 = te[4], m13 = te[8];
        const m21 = te[1], m22 = te[5], m23 = te[9];
        const m31 = te[2], m32 = te[6], m33 = te[10];
        const trace = m11 + m22 + m33;

        if (trace > 0) {
            const s = 0.5 / Math.sqrt(trace + 1.0);
            q.w = 0.25 / s;
            q.x = (m32 - m23) * s;
            q.y = (m13 - m31) * s;
            q.z = (m21 - m12) * s;

        } else if (m11 > m22 && m11 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m11 - m22 - m33);
            q.w = (m32 - m23) / s;
            q.x = 0.25 * s;
            q.y = (m12 + m21) / s;
            q.z = (m13 + m31) / s;

        } else if (m22 > m33) {
            const s = 2.0 * Math.sqrt(1.0 + m22 - m11 - m33);
            q.w = (m13 - m31) / s;
            q.x = (m12 + m21) / s;
            q.y = 0.25 * s;
            q.z = (m23 + m32) / s;
        } else {
            const s = 2.0 * Math.sqrt(1.0 + m33 - m11 - m22);
            q.w = (m21 - m12) / s;
            q.x = (m13 + m31) / s;
            q.y = (m23 + m32) / s;
            q.z = 0.25 * s;
        }
        return q;
    }

    /**
    * Rotates a vector using provided rotation.
    *
    * @static
    * @param {Vector3} v 
    * @return {Vector3} 
    * @memberof Quaternion
    */
    public rotateVector(v: Vector3): Vector3 {
        const x = v.x, y = v.y, z = v.z;
        const qx = this.x, qy = this.y, qz = this.z, qw = this.w;

        const ix = qw * x + qy * z - qz * y;
        const iy = qw * y + qz * x - qx * z;
        const iz = qw * z + qx * y - qy * x;
        const iw = - qx * x - qy * y - qz * z;

        return new Vector3(
            ix * qw + iw * - qx + iy * - qz - iz * - qy,
            iy * qw + iw * - qy + iz * - qx - ix * - qz,
            iz * qw + iw * - qz + ix * - qy - iy * - qx);
    }

    public static equals(q1: Quaternion, q2: Quaternion): boolean {
        return ((q1.x === q2.x) && (q1.y === q2.y) && (q1.z === q2.z) && (q1.w === q2.w));
    }

    // http://www.euclideanspace.com/maths/algebra/realNormedAlgebra/quaternions/slerp/
    /**
     * Spherically interpolates between provided quaternions by ratio t.  
     *
     * @static
     * @param {Quaternion} q
     * @param {number} t 
     * @return {Quaternion} 
     * @memberof Quaternion
     */
    public slerp(q: Quaternion, t: number): Quaternion {
        const me = new Quaternion(this.x, this.y, this.z, this.w);
        if (t === 0) return me;
        if (t === 1) return new Quaternion(q.x, q.y, q.z, q.w);

        const x = me.x, y = me.y, z = me.z, w = me.w;

        let cosHalfTheta = w * q.w + x * q.x + y * q.y + z * q.z;

        if (cosHalfTheta < 0) {

            me.w = - q.w;
            me.x = - q.x;
            me.y = - q.y;
            me.z = - q.z;

            cosHalfTheta = - cosHalfTheta;

        } else {
            me.x = q.x;
            me.y = q.y;
            me.z = q.z;
            me.w = q.w;
        }

        if (cosHalfTheta >= 1.0) {
            me.w = w;
            me.x = x;
            me.y = y;
            me.z = z;
            return me;
        }

        const sqrSinHalfTheta = 1.0 - cosHalfTheta * cosHalfTheta;

        if (sqrSinHalfTheta <= Number.EPSILON) {

            const s = 1 - t;
            me.w = s * w + t * me.w;
            me.x = s * x + t * me.x;
            me.y = s * y + t * me.y;
            me.z = s * z + t * me.z;
            return me.normalize();
        }

        const sinHalfTheta = Math.sqrt(sqrSinHalfTheta);
        const halfTheta = Math.atan2(sinHalfTheta, cosHalfTheta);
        const ratioA = Math.sin((1 - t) * halfTheta) / sinHalfTheta,
            ratioB = Math.sin(t * halfTheta) / sinHalfTheta;

        me.w = (w * ratioA + me.w * ratioB);
        me.x = (x * ratioA + me.x * ratioB);
        me.y = (y * ratioA + me.y * ratioB);
        me.z = (z * ratioA + me.z * ratioB);

        return me;
    }

    public static lookRotation(forward: Vector3 = Vector3.forward, up: Vector3 = Vector3.up): Quaternion {
        // return identity if magnitude is zero.
        if (forward.magnitude === 0 || up.magnitude === 0)
            return Quaternion.identity;

        // return identity if colinear.            
        if (forward.cross(up).equals(Vector3.zero))
            return Quaternion.identity;

        // let's contruct
        return Quaternion.fromMatrix(
            Matrix4.lookAt(Vector3.zero, forward, up));
    }

}
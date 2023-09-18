import {
    Camera,
    ModelNode,
    ModelNodeKindOptions,
    Platform,
    Quaternion,
    Transform,
    Utils,
    Vector2,
    Vector3
} from "../index";


export class CameraController {

    public readonly platform: Platform;
    public readonly leftAxis: Vector2;
    public readonly rightAxis: Vector2;
    public readonly camera: Camera;

    public distance: number = 24;
    public degrees: Vector3 = Vector3.zero;
    public target: ModelNode;
    public editing: boolean;

    constructor(platform: Platform, camera: Camera) {

        // init
        this.platform = platform;
        this.leftAxis = Vector2.zero;
        this.rightAxis = Vector2.zero;
        this.camera = camera;
        this.editing = true;
        this.target = ModelNode.none(this.platform);
    }

    public reset(target: ModelNode, degrees: Vector3, distance: number): void {
        this.target = target;
        this.distance = distance;
        this.degrees = degrees;
    }

    public update(): void {

        // check modifier
        const modifierOne = this.platform.input.isKey("AltLeft");

        // reset axis
        this.leftAxis.x = 0;
        this.leftAxis.y = 0;
        this.rightAxis.x = 0;
        this.rightAxis.y = 0;

        if (this.platform.input.isKey("KeyA")) {
            this.leftAxis.x = -1;
        }
        if (this.platform.input.isKey("KeyD")) {
            this.leftAxis.x = 1;
        }
        if (this.platform.input.isKey("KeyW")) {
            this.leftAxis.y = 1;
        }
        if (this.platform.input.isKey("KeyS")) {
            this.leftAxis.y = -1;
        }
        if (this.platform.input.isKey("ArrowLeft")) {
            this.rightAxis.x = -1;
        }
        if (this.platform.input.isKey("ArrowRight")) {
            this.rightAxis.x = 1;
        }
        if (this.platform.input.isKey("ArrowUp")) {
            this.rightAxis.y = 1;
        }
        if (this.platform.input.isKey("ArrowDown")) {
            this.rightAxis.y = -1;
        }
        if (this.platform.input.isKey("F2")) {
            this.editing = !this.editing;
        }

        // speed to use
        const sd = this.platform.timer.delta;

        // check if editing
        if (this.editing) {

            const speed = 100.0 / 120;

            // allow camera distance update if modifier is active
            if (modifierOne) {
                this.distance = this.distance - (0.5 * 1 * speed * this.rightAxis.y);
                this.distance = Math.max(Math.min(this.distance, 2 * 128.0), 4.0)
            }
            else {
                // update
                this.degrees.x = Utils.wrap(this.degrees.x - (speed * this.rightAxis.y), 360);
                this.degrees.y = Utils.wrap(this.degrees.y + (speed * this.rightAxis.x), 360);
            }

            // get position
            let position = this.target.transform.position;

            // position properly
            position = position.add(
                Quaternion.degrees(0, this.degrees.y, 0).rotateVector(Vector3.forward).scale(0.5 * speed * this.leftAxis.y));
            position = position.add(
                Quaternion.degrees(0, this.degrees.y, 0).rotateVector(Vector3.right).scale(0.5 * speed * this.leftAxis.x));

            // update rotation
            const rotation = Quaternion.degrees(
                this.degrees.x, this.degrees.y, this.degrees.z).normalize();

            // update position
            const cposition = position.subtract(
                rotation.direction.scale(this.distance));

            // update camera with final position and rotation
            this.camera.transform.update(cposition, rotation, Vector3.one);

            // update target
            this.target.transform.update(position,
                this.target.transform.rotation,
                this.target.transform.scale);
        }
        else {

            const speed = 1.0 / 8;

            // get target transform
            const ptf = Transform.matrix(this.target.graph);

            // get current position & rotation
            let position = ptf.position;
            let rotation = ptf.rotation;

            // get normalized move direction
            const npos = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

            // update position
            position = ptf.position.add(
                new Vector3(speed * npos.x, 0, -speed * npos.z));

            // create normalized target otation
            const direction = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

            // rotate into move drection if any rotation
            if (!Vector3.zero.equals(direction)) {
                // update rotation
                rotation = rotation.slerp(
                    Quaternion.lookRotation(direction),
                    2 * speed);
            }

            // slerp etc
            position = position.lerp(position, 2 * sd);

            // update 
            this.target.transform.update(position, rotation, ptf.scale);
        }
    }
}

//     public processInput(): void {
//         const modifierOne = this.input.isKey("AltLeft");

//         // reset axis
//         this.leftAxis.x = 0;
//         this.leftAxis.y = 0;
//         this.rightAxis.x = 0;
//         this.rightAxis.y = 0;

//         if (this.input.isKey("KeyA")) {
//             this.leftAxis.x = -1;
//         }
//         if (this.input.isKey("KeyD")) {
//             this.leftAxis.x = 1;
//         }
//         if (this.input.isKey("KeyW")) {
//             this.leftAxis.y = 1;
//         }
//         if (this.input.isKey("KeyS")) {
//             this.leftAxis.y = -1;
//         }
//         if (this.input.isKey("ArrowLeft")) {
//             this.rightAxis.x = -1;
//         }
//         if (this.input.isKey("ArrowRight")) {
//             this.rightAxis.x = 1;
//         }
//         if (this.input.isKey("ArrowUp")) {
//             this.rightAxis.y = 1;
//         }
//         if (this.input.isKey("ArrowDown")) {
//             this.rightAxis.y = -1;
//         }

//         if (this.input.isKeyDown("F2")) {
//             this._editing = !this._editing;
//             this.reset();
//         }

//         if (this.input.isKeyDown("F3")) {
//             this._displayFrustum = !this._displayFrustum;
//             this.reset();
//         }

//         if (this.input.isKeyDown("F4")) {
//             this.renderer.displayDirectionalMap = !this.renderer.displayDirectionalMap;
//         }

//         if (this.input.isKeyDown("F5")) {
//             this.renderer.displayPointMap = !this.renderer.displayPointMap;
//         }

//         if (this.input.isKeyDown("F6")) {
//             this.renderer.displayPointMapIndex = ++this.renderer.displayPointMapIndex % 6;
//         }

//         // speed to use
//         const sd = this.timer.delta;

//         if (this._editing) {
//             const speed = 100.0 / 120;

//             // allow camera distance update if modifier is active
//             if (modifierOne) {
//                 this._cameraDistance = this._cameraDistance - (0.5 * 1 * speed * this.rightAxis.y);
//                 this._cameraDistance = Math.max(Math.min(this._cameraDistance, 2 * 128.0), 4.0)
//             }
//             else {
//                 // update
//                 this._cameraDegrees.x = Utils.wrap(this._cameraDegrees.x - (speed * this.rightAxis.y), 360);
//                 this._cameraDegrees.y = Utils.wrap(this._cameraDegrees.y + (speed * this.rightAxis.x), 360);
//             }

//             this._cameraTarget = this._cameraTarget.add(
//                 Quaternion.degrees(0, this._cameraDegrees.y, 0).rotateVector(Vector3.forward).scale(0.5 * speed * this.leftAxis.y));
//             this._cameraTarget = this._cameraTarget.add(
//                 Quaternion.degrees(0, this._cameraDegrees.y, 0).rotateVector(Vector3.right).scale(0.5 * speed * this.leftAxis.x));

//             const rotation = Quaternion.degrees(
//                 this._cameraDegrees.x, this._cameraDegrees.y, this._cameraDegrees.z).normalize();

//             const position = this._cameraTarget.subtract(
//                 rotation.direction.scale(this._cameraDistance));

//             // update camera with final position and rotation
//             this.camera.transform.update(position, rotation, Vector3.one);
//         }
//         else {
//             const speed = 1.0 / 8;

//             // get player transform
//             const ptf = Transform.matrix(this.world.player.graph);

//             // get current position & rotation
//             let position = ptf.position;
//             let rotation = ptf.rotation;

//             // get normalized move direction
//             const npos = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

//             // update position
//             position = ptf.position.add(
//                 new Vector3(speed * npos.x, 0, -speed * npos.z));

//             // create normalized target otation
//             const direction = new Vector3(this.leftAxis.x, 0, this.leftAxis.y).normalize();

//             // rotate into move drection if any rotation
//             if (!Vector3.zero.equals(direction)) {
//                 // update rotation
//                 rotation = rotation.slerp(
//                     Quaternion.lookRotation(direction),
//                     2 * speed);
//             }

//             // slerp etc
//             position = position.lerp(position, 2 * sd);

//             // camera distances
//             let cd = 24;
//             let minc = 16;
//             let maxc = 32;

//             // get current sector
//             const sector = this.world.sector;

//             // see if valid
//             if (sector !== null) {

//                 // get sector graph
//                 const sg = Transform.matrix(sector.graph);

//                 // scale to total area
//                 const area = new Vector3(sg.scale.x, 0, sg.scale.z).magnitude;

//                 // get distance from center
//                 const distance = position.subtract(sg.position).magnitude;

//                 // calculate cd
//                 if (distance !== 0)
//                     cd = maxc - ((maxc - minc) * (distance / area));

//                 // start with current block
//                 let targetModel: Block = undefined;

//                 // check if intersecting
//                 for (let i = 0; i < sector.models.count; i++) {

//                     // get block
//                     const block = sector.models.item(i) as Block;

//                     // get block transform
//                     const btf = Transform.matrix(block.graph);
//                     let result = new BoxIntersection();

//                     // check intersection with player
//                     if (Box.intersects(
//                         new Box(position, rotation, ptf.scale),
//                         new Box(btf.position, btf.rotation, btf.scale),
//                         result)) {

//                         // update postion
//                         if (block.kind !== ModelKindOptions.Transparent &&
//                             block.kind !== ModelKindOptions.Gate) {

//                             // update postion
//                             position = position.subtract(result.axis.scale(result.distance))
//                         }

//                         // set as target
//                         targetModel = block;

//                         // done
//                         break;
//                     }
//                 }

//                 // trigger leave when not found or different one
//                 if (this._currentModel && (!targetModel || this._currentModel.id !== targetModel.id))
//                     this._currentModel.trigger("leave");

//                 // update block and trigger
//                 if (!(this._currentModel && targetModel && this._currentModel.id === targetModel.id)) {
//                     this._currentModel = targetModel;
//                     if (this._currentModel && this._currentModel.kind == ModelKindOptions.Gate)
//                         this._currentModel.trigger("enter");
//                 }
//             }

//             // final cd
//             cd = Math.max(Math.min(cd, maxc), minc);

//             // new camera position
//             let ncpos = this.world.player.transform.position.add(new Vector3(0, cd, 0));
//             let cpos = this.camera.transform.position.lerp(ncpos, 0.25 * speed);

//             // update player transform
//             this.world.player.transform.update(position, rotation, ptf.scale);

//             // set camera
//             this.camera.transform.update(
//                 new Vector3(ptf.position.x, cpos.y, ptf.position.z),
//                 Quaternion.degrees(-90, 0, 0),
//                 this.camera.transform.scale
//             );
//         }
//     }
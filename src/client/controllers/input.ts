// import {
//     Engine,
//     Camera,
//     Quaternion,
//     Vector2,
//     Vector3,
//     Utils,
//     Transform
// } from "../index";

// export class InputController {
//     public readonly engine: Engine;
//     public readonly camera: Camera;
//     public cameraDegrees: Vector3;
//     public cameraTarget: Vector3;
//     public cameraDistance: number;
//     public leftAxis: Vector2 = Vector2.zero;
//     public rightAxis: Vector2 = Vector2.zero;
//     public centerAxis: Vector2 = Vector2.zero;
//     public modifierOne: boolean = false;
//     public isEditing: boolean = true;
//     public readonly target: Transform;
//     public isTargetLocked: boolean = false;

//     constructor(engine: Engine, camera: Camera, target: Transform) {
//         this.engine = engine;
//         this.camera = camera;
//         this.target = target;


//         this.reset();
//     }

//     private updateTarget(sd: number) {
//         // only if not editing
//         if (this.isEditing) return;

//         // define speed
//         const speed = 8 * sd;

//         // get left axis
//         const left = this.leftAxis;

//         // update our position
//         this.target.position = Vector3.add(this.target.position,
//             new Vector3(speed * left.x, 0, -speed * left.y));

//         // create target rotation
//         const direction = new Vector3(left.x, 0, left.y).normalize();
//         // const direction = this.camera.transform.rotation.rotateVector(
//         //     new Vector3(left.x, 0, left.y)).normalize();

//         // rotate into move drection if any rotation
//         if (!Vector3.equals(direction, Vector3.zero)) {
//             this.target.rotation = Quaternion.slerp(
//                 this.target.rotation,
//                 Quaternion.lookRotation(direction),
//                 sd * 16);
//         }
//     }

//     private updateCamera(sd: number) {

//         // check button states of both sticks
//         let lsp = false;
//         let rsp = false;

//         // start positions
//         let position = Transform.identity.position;
//         let rotation = Transform.identity.rotation;

//         // reset distance
//         const speed = 100.0 * sd;

//         // check if editing
//         if (this.isEditing) {

//             if (this.leftAxis) {
//                 this.cameraDegrees.x = Utils.wrap(this.cameraDegrees.x - (speed * this.leftAxis.y), 360);
//                 this.cameraDegrees.y = Utils.wrap(this.cameraDegrees.y + (speed * this.leftAxis.x), 360);
//             }

//             if (this.rightAxis) {
//                 this.cameraDistance = this.cameraDistance - (0.25 * speed * this.rightAxis.y);
//                 this.cameraDistance = Math.max(Math.min(this.cameraDistance, 1024.0), 2.0)
//                 this.cameraTarget = this.cameraTarget.add(
//                     Vector3.right.scale(0.1 * this.rightAxis.x)
//                 );
//             }

//             position = this.camera.transform.position;
//             rotation = this.camera.transform.rotation;

//             if (this.leftAxis) {
//                 // get left axis
//                 const left = this.leftAxis;
                
//                 // update our position
//                 position = Vector3.add(position,
//                     new Vector3(speed * left.x, 0, -speed * left.y));

//                 // create target rotation
//                 const direction = new Vector3(left.x, 0, left.y).normalize();

//                 // rotate into move drection if any rotation
//                 if (!Vector3.equals(direction, Vector3.zero)) {
//                     rotation = Quaternion.slerp(
//                         rotation,
//                         Quaternion.lookRotation(direction),
//                         speed * 128);
//                 }
//             }
//             // lsp && rsp on
//             lsp = true;
//             rsp = true;
//         }
//         else if (this.isTargetLocked) {
//             if (this.leftAxis) {
//                 // this.cameraDegrees.x = Utils.wrap(this.cameraDegrees.x - (speed * this.leftAxis.y), 360);
//                 // this.cameraDegrees.y = Utils.wrap(this.cameraDegrees.y + (speed * this.leftAxis.x), 360);
//             }
//             if (this.rightAxis) {
//                 this.cameraDistance = this.cameraDistance - (0.25 * speed * this.rightAxis.y);
//                 this.cameraDistance = Math.max(Math.min(this.cameraDistance, 128.0), 12.0)
//                 this.cameraTarget = this.target.position;
//             }

//             position = this.target.position;
//             rotation = this.target.rotation;

//             // lsp && rsp off
//             lsp = false;
//             rsp = false;
//         }
        
//         // set proper final position and rotation
//         rotation = Quaternion.fromDegrees(
//             this.cameraDegrees.x, this.cameraDegrees.y, this.cameraDegrees.z).normalize();
//         position = this.cameraTarget.subtract(
//             rotation.direction.scale(this.cameraDistance));
//         // 
//         // lerp position for smooth transitions
//         this.camera.transform.position = rsp ? this.camera.transform.position.lerp(
//             position, 4 * sd) : position;
//         // lerp rotation for smooth transitions
//         this.camera.transform.rotation = lsp ? this.camera.transform.rotation.slerp(
//             rotation, 4 * sd) : rotation;

//     }

//     public async update(): Promise<void> {
//         const sd = 1 / 60;
//         // see if any target
//         if (this.target){
//             // update target
//             this.updateTarget(sd);    
//         }

//         // see if any camera
//         if (!this.camera) return;

//         // update camera
//         this.updateCamera(sd);
//     }

//     public reset(): void {
//         // init the camera
//         this.cameraDistance = 8;
//         this.cameraTarget = Vector3.zero;
//         this.cameraDegrees = new Vector3(-45, -45.0, 0);
//         this.camera.transform.scale = Vector3.one;
//         this.camera.transform.position = Vector3.zero;
//         this.camera.transform.rotation = Quaternion.identity;
//     }
// }
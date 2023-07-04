import {
    Material,
    Matrix4,
    Quaternion,
    Rectangle,
    Utils,
    Vector3
} from "../index";

export class Panel {
    public readonly id: string;
    public readonly area: Rectangle;
    public readonly material: Material;
    public readonly children: Panel[] = [];

    constructor(area?: Rectangle, material?: Material) {
        this.id = Utils.uuid();
        this.area = area ?? Rectangle.one;
        this.material = material;
    }

    public model(): Matrix4 {
        return Matrix4.construct(
            new Vector3(
                (this.area.position.x - 0.5) + (0.5 * this.area.width),
                (0.5 - this.area.position.y) - (0.5 * this.area.height),
                0),
            Quaternion.identity,
            new Vector3(this.area.width, this.area.height, 1.0)
        );
    }

    public render(): void {

    }
}
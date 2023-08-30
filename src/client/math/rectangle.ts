import {
    Size,
    Vector2
} from "../index";

export class Rectangle {
    public readonly position: Vector2;
    public readonly size: Size;

    constructor(position: Vector2, size: Size) {
        this.position = position;
        this.size = size;
    }

    public static get zero(): Rectangle {
        return new Rectangle(Vector2.zero, Size.zero);
    }

    public static get one(): Rectangle {
        return new Rectangle(Vector2.zero, Size.one);
    }

    public static construct(left: number, right: number, top: number, bottom: number): Rectangle {
        return new Rectangle(new Vector2(left, bottom), new Size(right - left, top - bottom));
    }

    public get left(): number {
        return this.position.x;
    }

    public get right(): number {
        return this.position.x + this.size.width;
    }

    public get top(): number {
        return this.position.y + this.size.height;
    }

    public get bottom(): number {
        return this.position.y;
    }

    public get width(): number {
        return this.right - this.left;
    }

    public get height(): number {
        return this.top - this.bottom;
    }

    public static get screen(): Rectangle {
        return new Rectangle(new Vector2(-0.5, -0.5), new Size(1.0, 1.0));
    }

    public equals(r: Rectangle): boolean {
        return this.position.equals(r.position) && this.size.equals(r.size);
    }

    public set(position: Vector2, size: Size): void {
        this.position.x = position.x;
        this.position.y = position.y;
        this.size.width = size.width;
        this.size.height = size.height;
    }
}

import {
    Vector2
} from "../index";

export class Size {
    public width: number;
    public height: number;

    constructor(width: number, height: number) {
        this.width = width;
        this.height = height;
    }

    public static get zero(): Size {
        return new Size(0.0, 0.0);
    }

    public static get one(): Size {
        return new Size(1.0, 1.0);
    }

    public get xy(): Vector2 {
        return new Vector2(this.width, this.height);
    }

    public scale(s: number): Size {
        return new Size(this.width * s, this.height * s);
    }

    public set(size: Size): void {
        this.width = size.width;
        this.height = size.height;
    }

    public equals(s: Size): boolean {
        return ((this.width === s.width) && (this.height === s.height));
    }
}

import {
    Material,
    Rectangle,
} from "../index";

export enum PanelDockKindOptions {
    None,
    Left,
    Right,
    Top,
    Bottom,
    Fill
}

export class Panel {

    public readonly parent: Panel;
    public readonly children: Panel[] = [];
    public readonly area: Rectangle;
    public readonly dock: PanelDockKindOptions;
    public readonly material: Material;

    public constructor(parent: Panel, dock: PanelDockKindOptions, area: Rectangle, material?: Material) {

        // init
        this.parent = parent;
        this.dock = dock;
        this.material = material;
        this.area = area || Rectangle.one;
        this.children = [];
    }

    public update(): void {
        // loop over all children and invalidate each
        this.children.forEach(child => child.update());
    }
}
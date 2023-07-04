export class Range {
    public minimum: number;
    public maximum: number;

    constructor(minimum: number, maximum: number) {
        this.minimum = minimum;
        this.maximum = maximum;
    }

    public static get zero(): Range {
        return new Range(0.0, 0.0);
    }

    public static get one(): Range {
        return new Range(1.0, 1.0);
    }

    public equals(r: Range): boolean {
        return ((this.minimum === r.minimum) && (this.maximum === r.maximum));
    }
}

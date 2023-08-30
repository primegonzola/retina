export class LockMonitor<T> {
    private _locked: boolean;

    constructor(locked: boolean = false) {
        this._locked = locked;
    }

    public wait(action: () => T) {
        while (this._locked);
        this._locked = true;
        const r:T = action();
        this._locked = false;
        return r;
    }
}
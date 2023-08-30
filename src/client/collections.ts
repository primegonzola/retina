export class HashMap<S, T> {
    private readonly _map: Map<S, T>;
    private readonly _handlers: Array<(kind: string, key: S, value: T) => void>;

    constructor() {
        // init
        this._map = new Map<S, T>();
        this._handlers = new Array<(kind: string, key: S, value: T) => void>();
    }

    private _notifyHandlers(kind: string, key?: S, value?: T): void {
        this._handlers.forEach(handler => handler(
            kind, key, value
        ));
    }

    public notify(handler: (kind: string, key: S, value: T) => void): void {
        this._handlers.push(handler);
    }

    public get size(): number {
        return this._map.size;
    }

    public keys(): IterableIterator<S> {
        return this._map.keys();
    }

    public values(): IterableIterator<T> {
        return this._map.values();
    }

    public has(key: S): boolean {
        return this._map.has(key);
    }

    public get(key: S): T | undefined {
        return this._map.get(key);
    }

    public set(key: S, value: T): void {
        this._map.set(key, value);
        this._notifyHandlers("set", key, value);
    }

    public clear(): void {
        this._map.clear();
        this._notifyHandlers("clear");
    }

    public forEach(action: (v: T, k: S) => void): void {
        this._map.forEach(action);
    }
}
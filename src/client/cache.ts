import {
    LockMonitor,
} from "./index";

export abstract class CacheEntry {
    public key: string;
    public updated: number;
    public duration: number;

    constructor(key: string, duration: number) {
        this.key = key;
        this.updated = performance.now();
        this.duration = duration;
    }

    public abstract destroy(): void;
}

export class Cache {

    private readonly _lock: LockMonitor<CacheEntry>;
    private readonly _cache: Map<string, CacheEntry>;
    private readonly _timer: unknown;
    private static _instance?: Cache;

    constructor() {
        // init
        this._lock = new LockMonitor<CacheEntry>();
        this._cache = new Map<string, CacheEntry>();
        this._timer = setInterval(() => this._check(), 5000);
    }

    public static get instance(): Cache {
        if (!Cache._instance)
            Cache._instance = new Cache();
        return Cache._instance;
    }

    private _check(): void {
        // wait
        this._lock.wait(() => {

            // get current time
            const now = performance.now();

            // deletes
            const deletes: string[] = [];

            // loop over entries
            this._cache.forEach(entry => {
                // check if expired and mark for deletion
                if (now - entry.duration >= entry.updated)
                    deletes.push(entry.key);
            });

            // loop over deletes
            deletes.forEach(key => {
                // destroy entry
                this._cache.get(key)?.destroy();

                // delete entry
                this._cache.delete(key);
            });

            // nothing to return
            return null;
        });
    }

    public cacheItem(key: string, action: (entry: CacheEntry) => CacheEntry): CacheEntry {
        return this._lock.wait(() => {

            // get entry or create new one
            let entry = action(this._cache.get(key));

            // update entry with new timestamp
            entry.updated = performance.now();

            // all done
            return entry;
        });
    }

    public destroy(): void {
        // wait
        this._lock.wait(() => {

            // clear timer
            clearInterval(this._timer as number);

            // loop over items and destroy buffers
            this._cache.forEach(entry => entry?.destroy());

            // clear
            this._cache.clear();

            // nothing to return 
            return undefined;
        });
    }
}
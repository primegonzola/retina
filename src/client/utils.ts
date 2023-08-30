export abstract class Utils {
    public static async delay(ms = 0): Promise<void> {
        return await new Promise(resolve => setTimeout(resolve, ms));
    }

    public static find<T>(item: T, items: T[]): T {
        if (item && items) {
            for (let i = 0; i < items.length; i++) {
                if (items[i] === item)
                    return item;
            }
        }
        return null;
    }

    public static nPow2(aSize: number): number {
        return Math.pow(2, Math.round(Math.log(aSize) / Math.log(2)));
    }

    public static hPow2(aSize: number): number {
        return Math.pow(2, Math.ceil(Math.log(aSize) / Math.log(2)));
    }

    public static isPow2(value: number) {
        return (value & (value - 1)) == 0;
    }

    public static random(start?: number, end?: number, round?: boolean): number {
        if (start === undefined && end === undefined) return Math.random();
        const result = start + (Math.random() * (end - start));
        return round ? Math.round(result) : result;
    }

    public static even(value: number): number {
        return Math.round(value / 2) * 2;
    }

    // public static getRelativeMousePosition(event: any, target: any): Vector2 {
    //     target = target || event.target;
    //     const rect = target.getBoundingClientRect();
    //     return new Vector2(event.clientX - rect.left, event.clientY - rect.top);
    // }

    // public static getCanvasRelativeMousePosition(event: any, target: any): Vector2 {
    //     target = target || event.target;
    //     const pos = Utils.getRelativeMousePosition(event, target);
    //     return new Vector2(pos.x * target.width / target.clientWidth,
    //         pos.y * target.height / target.clientHeight);
    // }

    public static wrap(next: number, total: number): number {
        return (total + next) % total;
    }

    public static clamp(value: number, min: number, max: number): number {
        return Math.max(min, Math.min(max, value));
    }

    //https://stackoverflow.com/questions/105034/how-to-create-a-guid-uuid
    static uuid(): string {
        //Timestamp
        let d = new Date().getTime();
        //Time in microseconds since page-load or 0 if unsupported        
        let d2 = (performance && performance.now && (performance.now() * 1000)) || 0;
        return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
            let r = Math.random() * 16;//random number between 0 and 16
            if (d > 0) {//Use timestamp until depleted
                r = (d + r) % 16 | 0;
                d = Math.floor(d / 16);
            } else {//Use microseconds since page-load if supported
                r = (d2 + r) % 16 | 0;
                d2 = Math.floor(d2 / 16);
            }
            return (c === 'x' ? r : (r & 0x3 | 0x8)).toString(16);
        });
    }

    public static get navigatorLanguage(): string {
        if (navigator.languages && navigator.languages.length) {
            return navigator.languages[0];
        } else {
            return (navigator as any).userLanguage || navigator.language || (navigator as any).browserLanguage || 'en';
        }
    }

    public static clone(value: any): any {
        if (!value) return value;
        if (value.clone) return value.clone();
        if (value.map) return value.map((v: any) => Utils.clone(v));
        return value;
    }

    public static toHex(value: number, padding = 2): string {
        let result = "";
        if (value >= 0) {
            const val = value.toString(16);
            if (val.length < padding) {
                let p = padding - val.length;
                while (p--) result += "0";
            }
            result += val;
        }
        return result.toUpperCase();
    }

    public static async downloadImage(uri: string): Promise<ImageBitmap> {

        // const image = document.createElement('img');
        // image.src = uri;
        // await image.decode();
        // return await createImageBitmap(image);

        return new Promise((resolve, reject) => {

            // create request object
            const request = new XMLHttpRequest();

            // we expect a blob
            request.responseType = 'blob';

            // open using provided uri
            request.open('get', uri, true);

            // let's see what happens
            request.onload = async () => {

                // check if ready 
                if (request.readyState == 4 && request.status == 200) {

                    // get blob from response
                    const blob = request.response as Blob;

                    // get image
                    const image = await createImageBitmap(blob,
                        {
                            colorSpaceConversion: 'none',
                            premultiplyAlpha: 'none',
                        });

                    // all done
                    resolve(image);
                }
                else if (request.readyState == 4) {
                    // all done
                    reject(request.statusText);
                }
            };

            // all prepared let's send
            request.send();
        });
    }

    public static downloadText(uri: string): Promise<string> {
        // do it async
        return new Promise((resolve, reject) => {
            // create request object
            const request = new XMLHttpRequest();

            // we expect a blob
            request.responseType = 'blob';

            // let's see what happens
            request.onreadystatechange = async () => {
                // check if ready 
                if (request.readyState == 4 && request.status == 200) {

                    // get blob from response
                    const blob = request.response as Blob;

                    // all done
                    resolve(await blob.text());
                }
                else if (request.readyState == 4) {
                    // all done
                    reject(request.statusText);
                }
            };

            // open using provided uri
            request.open('get', uri, true);

            // all done let's send
            request.send();
        });
    }
}   

export enum LogTypeOptions {
    Trace = "trace",
    Verbose = "verbose",
    Info = "info",
    Warning = "warning",
    Error = "error",
    Exception = "exception"
}
export class LogEntry { 
    public readonly when: Date;
    public readonly type: LogTypeOptions;
    public readonly message: string;
    

    constructor(type: LogTypeOptions, when: Date, message: string) {
        this.when = when;
        this.type = type;
        this.message = message;
    }

    public toString(short = true): string {
        // format to short time only
        const date = this.when.toISOString();
        const dt = short ? date.substring(date.indexOf("T") + 1, date.length - 1) : this.when.toISOString();
        return `${this.type} | ${dt} | ${this.message}`;
    }
}

export class Logger {
    public static Level = 2;

    public static readonly entries: LogEntry[] = [];

    public static enter<T>(name: string, action: () => T): T {
        // mark start of trace
        Logger.trace(`entering ${name}`);
        // execute the action
        try {
            // execute action and return result
            return action();
        }
        catch (error) {
            // log exception
            Logger.error(error);
        }
        finally {
            // end trace
            Logger.trace(`leaving ${name}`);
        }
    }

    public static async enterAsync<T>(name: string, action: () => Promise<T>): Promise<T> {
        // mark start of trace
        Logger.trace(`entering ${name}`);
        // execute the action
        try {
            // execute action and return result
            return await action();
        }
        catch (error) {
            // log exception
            Logger.exception(error);
        }
        finally {
            // end trace
            Logger.trace(`leaving ${name}`);
        }
    }

    public static trace(message: string): void {
        if (Logger.Level < 1) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Trace, message);
            // log to console
            console.log(entry.toString())
        }
    }

    public static verbose(message: string): void {
        if (Logger.Level < 2) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Verbose, message);
            // log to console
            console.log(entry.toString())
        }
    }

    public static info(message: string): void {
        if (Logger.Level < 3) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Info, message);
            // log to console
            console.info(entry.toString())
        }
    }

    public static warn(message: string): void {
        if (Logger.Level < 4) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Warning, message);
            // log to console
            console.warn(entry.toString())
        }
    }

    public static error(message: string): void {
        if (Logger.Level < 5) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Error, message);
            // log to console
            console.error(entry.toString());
        }
    }

    public static exception(error: Error): void {
        if (Logger.Level < 6) {
            // log internally
            const entry = Logger.log(LogTypeOptions.Exception, error.message);
            // log to console
            console.error(entry.toString(), error.stack);
        }
    }

    private static log(type: LogTypeOptions, message: string): LogEntry {
        Logger.entries.push(new LogEntry(type, new Date(), message));
        return this.entries[Logger.entries.length - 1];
    }

    public static clear(): void {
        // remove all entries
        Logger.entries.splice(0, Logger.entries.length);
    }
}
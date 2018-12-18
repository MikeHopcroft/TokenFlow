import * as Debug from 'debug';

export class Logger {
    logger: Debug.IDebugger | undefined = undefined;

    constructor(namespace: string, forceInteractive = false) {
        if (!Debug('tf-interactive').enabled && !forceInteractive) {
            this.logger = Debug(namespace);
        }
    }

    log(message: string) {
        if (this.logger) {
            this.logger(message);
        }
        else {
            console.log(message);
        }
    }
}
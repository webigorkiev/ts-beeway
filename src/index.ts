import fetch from "cross-fetch";

export namespace beeway {
    export interface Options {
        token: string,
        from?: string,
        entry?:string
    }
    export interface Request {
        to: string,
        message: string,
        from?:string
    }
    export interface Response {
        errors?: string
    }
    export interface ResponseSend extends Response {
        id: string
    }
    export interface ResponseStatus extends Response {
        status: "enroute"|"accepted"|"delivered"|"undeliverable"|"expired"|"rejected"|"unknown"
    }
}
export class BeewayError extends Error {
    public code?: number;
    constructor(message?:string, code?:number) {
        super();
        this.message = message|| "";
        this.code = code;
    }
}
export class Beeway {
    private defaultOpts: Omit<beeway.Options, "token"> = {
        entry: "https://my.beeway.com.ua/api/sms"
    }
    private opts: Required<beeway.Options>;

    constructor(options: beeway.Options) {
        this.opts = Object.assign({}, this.defaultOpts, options) as Required<beeway.Options>;
    }

    /**
     * Send single notification
     * @param params
     */
    public async send(params:beeway.Request): Promise<beeway.ResponseSend> {
        const {body} = await this.fetch(
            `${this.opts.entry}/${this.opts.token}/send`,
            "get",
            {
                from: this.opts.from || "",
                ...params
            }
        );
        return {...(body || {})};
    }

    /**
     * Request status by notification id
     */
    public async status(id: string): Promise<beeway.ResponseStatus> {
        const {body} = await this.fetch(
            `${this.opts.entry}/${this.opts.token}/status/${id}`,
            "get"
        );
        return {...(body || {})};
    }

    /**
     * Get account balance
     */
    public async balance() {
        const {body} = await this.fetch(
            `${this.opts.entry}/${this.opts.token}/balance`,
            "get"
        );
        return {...(body || {})};
    }

    private async fetch(url: string, method: string, params: Record<string, any> = {}) {
        method = method.toLowerCase();
        const urlObj = new URL(url);
        method === "get" && Object.keys(params).length && (urlObj.search = new URLSearchParams(params).toString());

        const response = await fetch(urlObj.toString(), {
            headers: {"Content-Type": "application/json"},
            ...(method === "get" ? {} : {body: JSON.stringify(params)}),
            method
        });
        const body = await response.json();
        if(!response.ok) {
            throw new BeewayError(
                "Api beeway: " + (body.errors || response.statusText) + ", code: " + response.status,
                response.status
            );
        }
        if(body.errors) {
            throw new BeewayError(body.errors, response.status);
        }
        return {response, body};
    }
}
export const beeway = (opts: beeway.Options) => new Beeway(opts);
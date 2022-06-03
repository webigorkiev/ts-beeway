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
    export interface RequestViber extends Request{
        sms?:string,
        vtime?:string
    }

    /**
     * рассылки работают с 10:00 до 20:00
     */
    export interface RequestBulk {
        label: string,
        start?: Date,
        end?: Date,
        from?: string,
        messages: {
            to: string,
            message: string,
            messageId?: string
        }[]
    }
    export interface Response {
        errors?: string
    }
    export interface ResponseSend extends Response {
        id: string,
    }

    /**
     * «enroute» - принято/ожидает отправки,
     * «accepted» - отправлено в сеть
     * «delivered» - доставлено,
     * «undeliverable» - доставка невозможна,
     * «expired» - истек срок доставки,
     * «rejected» - отклонено сетью
     * «unknown» - Сбой сети при доставке SMS
     */
    export interface ResponseStatus extends Response {
        status: "enroute"|"accepted"|"delivered"|"undeliverable"|"expired"|"rejected"|"unknown"
    }
    export interface ResponseBalance extends Response {
        balance: string
    }
    export interface ResponseBulk extends Response {
        result: {
            id: string,
            messageId?: string,
            parts_count: number,
            status: ResponseStatus["status"]
        }[]
    }
    export interface Provider {
        send(params:beeway.Request): Promise<ResponseSend>;
        viber(params:beeway.RequestViber): Promise<ResponseSend>;
        status(id: string): Promise<ResponseStatus>;
        statusViber(id: string): Promise<ResponseStatus>;
        balance(): Promise<ResponseBalance>
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
class Beeway {
    private defaultOpts: Omit<beeway.Options, "token"> = {
        entry: "https://my.beeway.com.ua/api"
    }
    private opts: Required<beeway.Options>;

    constructor(options: beeway.Options) {
        this.opts = Object.assign({}, this.defaultOpts, options) as Required<beeway.Options>;
    }

    /**
     * Send single sms notification
     */
    public async send(params:beeway.Request): Promise<beeway.ResponseSend> {
        const {body} = await this.fetch(
            `${this.opts.entry}/sms/${this.opts.token}/send`,
            "get",
            {
                from: this.opts.from || "",
                ...params
            }
        );
        return {...(body || {})};
    }

    /**
     * Send notification to viber messenger
     */
    public async viber(params:beeway.RequestViber): Promise<beeway.ResponseSend> {
        const {body} = await this.fetch(
            `${this.opts.entry}/viber/${this.opts.token}/send`,
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
            `${this.opts.entry}/sms/${this.opts.token}/status/${id}`,
            "get"
        );
        return {...(body || {})};
    }

    /**
     * Request status by notification id
     */
    public async statusViber(id: string): Promise<beeway.ResponseStatus> {
        const {body} = await this.fetch(
            `${this.opts.entry}/viber/${this.opts.token}/status/${id}`,
            "get"
        );
        return {...(body || {})};
    }

    /**
     * Send bulk sms
     * From 1000 sms
     */
    public async bulk(params:beeway.RequestBulk): Promise<beeway.ResponseBulk> {
        if(!params.messages?.length) {
            return {
                result: []
            } as beeway.ResponseBulk
        }

        const defaultEndDate = new Date();
        defaultEndDate.setHours(new Date().getHours() + 3);
        const {body} = await this.fetch(
            `${this.opts.entry}/sms/${this.opts.token}/bulk`,
            "post",
            {
                api_key: this.opts.token,
                bulk_name: params.label,
                start_date: this.toBeewayDate(params.start || new Date()),
                start_time: this.toBeewayTime(params.start || new Date()),
                end_time: this.toBeewayTime(params.end || defaultEndDate),
                from: this.opts.from || params.from,
                messages: params.messages
            }
        );
        return {...(body || {})};
    }

    /**
     * Get account balance
     */
    public async balance(): Promise<beeway.ResponseBalance> {
        const {body} = await this.fetch(
            `${this.opts.entry}/sms/${this.opts.token}/balance`,
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

    private pad(value: number): string {
        return ("0" + value.toString()).slice(-2);
    }

    private toBeewayDate(now: Date): string {
        return `${this.pad(now.getDate())}.${this.pad(now.getMonth()+1)}.${now.getFullYear()}`;
    }
    private toBeewayTime(now: Date) {
        return `${this.pad(now.getHours())}:${this.pad(now.getMinutes())}`;
    }
}
export const beeway = (opts: beeway.Options) => new Beeway(opts);
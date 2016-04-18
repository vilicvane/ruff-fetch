/**
 * A subset of `window.fetch`.
 *
 * https://github.com/vilic/ruff-fetch
 *
 * MIT License
 */

import 'promise';

import * as HTTP from 'http';
import * as URL from 'url';

module.exports = exports = fetch;

export interface HashTable<T> {
    [key: string]: T;
}

export type HttpMethod = 'GET' | 'POST';

export interface InitOptions {
    method?: HttpMethod;
    headers?: HashTable<string>;
    body?: string | Buffer;
    referrer?: string;
}

export default function fetch(url: string, {
    method,
    headers,
    body,
    referrer
}: InitOptions = {}): Promise<Response> {
    return new Promise<Response>((resolve, reject) => {
        let urlObject = URL.parse(url);

        if (referrer) {
            // Well-known misspelled `referer` (should be `referrer`) header.
            if (headers) {
                headers['referer'] = referrer;
            } else {
                headers = {
                    referer: referrer
                };
            }
        }

        let req = HTTP.request({
            protocol: urlObject.protocol,
            hostname: urlObject.hostname,
            port: urlObject.port,
            method,
            headers
        }, res => resolve(new Response(res)));

        req.on('error', (error: Error) => reject(error));

        if (body) {
            req.write(body);
        }

        req.end();
    });
}

export class Response {
    private _res: HTTP.IncomingMessage;
    private _headers: HashTable<string>;

    private _bufferPromise: Promise<Buffer>;

    constructor(res: HTTP.IncomingMessage) {
        this._res = res;
        this._headers = res.headers;

        this._bufferPromise = new Promise<Buffer>((resolve, reject) => {
            let chunks: Buffer[] = [];

            res.on('data', (chunk: Buffer) => {
                chunks.push(chunk);
            });

            res.on('end', () => {
                resolve(Buffer.concat(chunks));
                chunks = undefined;
            });

            res.on('error', (error: Error) => {
                reject(error);
                chunks = undefined;
            });
        });
    }

    get ok(): boolean {
        let res = this._res;
        return res.statusCode >= 200 && res.statusCode < 300;
    }

    get status(): number {
        return this._res.statusCode;
    }

    get statusText(): string {
        return this._res.statusMessage;
    }

    get bodyUsed(): boolean {
        return !!this._bufferPromise;
    }

    buffer(): Promise<Buffer> {
        if (!this._bufferPromise) {
            return Promise.reject<Buffer>(new Error('Buffer has already been used'));
        }

        let bufferPromise = this._bufferPromise;

        this._bufferPromise = undefined;

        return bufferPromise;
    }

    text(): Promise<string> {
        return this
            .buffer()
            .then(buffer => buffer.toString());
    }

    json(): Promise<string> {
        return this
            .buffer()
            .then(buffer => JSON.parse(buffer.toString()));
    }
}

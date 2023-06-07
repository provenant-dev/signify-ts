import { btoa } from "buffer";
import { concat, d, b } from "./core";
import { Matter, MtrDex, Codex } from "./matter";

class BextCodex extends Codex {
    StrB64_L0: string = '4A'  // String Base64 Only Leader Size 0
    StrB64_L1: string = '5A'  // String Base64 Only Leader Size 1
    StrB64_L2: string = '6A'  // String Base64 Only Leader Size 2
    StrB64_Big_L0: string = '7AAA'  // String Base64 Only Big Leader Size 0
    StrB64_Big_L1: string = '8AAA'  // String Base64 Only Big Leader Size 1
    StrB64_Big_L2: string = '9AAA'  // String Base64 Only Big Leader Size 2
}

const BexDex = new BextCodex();

class Bexter extends Matter {
    private bext: string;
    constructor(raw: Uint8Array = Uint8Array.from([]),
        qb64b: Uint8Array = Uint8Array.from([]),
        qb64: string = '',
        qb2: Uint8Array = Uint8Array.from([]),
        code: string = MtrDex.StrB64_L0,
        bext: string = '') {

        if (raw === null && qb64b.length === 0 && qb64 === '' && qb2.length === 0) {
            if (bext === null) {
                throw new Error("Missing bext string.");
            }

            if (!this.isBase64(bext)) {
                throw new Error("Invalid Base64.");
            }

            raw = this.rawify(bext);
        }

        super({ raw, code, qb64, qb64b, qb2 });

        if (!Object.values(BexDex).includes(this.code)) {
            throw new Error(`Invalid code = ${this.code} for Bexter.`);
        }

        this.bext = this.getBext();
    }

    isBase64(input: string): boolean {
        try {
            // If the input is not a string, or its length is not a multiple of 4, it's not a valid Base64 format
            if (typeof input !== 'string' || input.length % 4 !== 0) {
                return false;
            }

            // Validate the Base64 format using a regular expression
            const base64Regex = /^(?:[A-Za-z0-9+/]{4})*?(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;
            return base64Regex.test(input);
        } catch (error) {
            return false;
        }
    }


    private rawify(bext: string): Uint8Array {
        const ts = bext.length % 4; // bext size mod 4
        const ws = (4 - ts) % 4; // pre conv wad size in chars
        const ls = (3 - ts) % 3;//  post conv lead size in bytes
        const base = 'A'.repeat(ws) + bext; // pre pad with wad of zeros in Base64 == 'A'
        const raw = b(base).slice(ls); // convert and remove leader
        return raw; // raw binary equivalent of text
    }

    private getBext(): string {
        const sizage = Matter.Sizes.get(this.code)!;
        //create new Uint8Array filled with 0s as long as ls 
        let arrayOne = new Uint8Array(sizage?.ls).fill(0)
        //concat with this.raw
        let mergedArray = concat(arrayOne, this.raw); //can be done in one line 
        //convert to base64
        let bext = Buffer.from(d(mergedArray), 'base64')
        let ws = 0;
        if (sizage?.ls === 0 && bext.length > 0) {
            if (bext[0] === 65) { //65 is 'A' in ascii
                ws = 1;
            }
        }
        else {
            ws = (sizage?.ls + 1) % 4;
        }

        return bext.toString('utf-8').slice(ws);
    }
}
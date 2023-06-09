import {  b ,concat} from "./core";
import { Matter, MtrDex, BexDex } from "./matter";


const base64Regex = /^(?:[A-Za-z0-9+/]{4})*?(?:[A-Za-z0-9+/]{2}==|[A-Za-z0-9+/]{3}=)?$/;

export class Bexter extends Matter {
    public bext: string;
    constructor(bext: string = '',
        raw: Uint8Array = Uint8Array.from([]),
        qb64b: Uint8Array = Uint8Array.from([]),
        qb64: string = '',
        qb2: Uint8Array = Uint8Array.from([]),
        code: string = MtrDex.StrB64_L0,
    ) {

        if (raw.length ===0 && qb64b.length === 0 && qb64.length ===0 && qb2.length === 0) {
            if (bext === null) {
                throw new Error("Missing bext string.");
            }

            if (!base64Regex.test(bext)) {
                throw new Error("Invalid Base64.");
            }
            const ts = bext.length % 4; // bext size mod 4
            const ws = (4 - ts) % 4; // pre conv wad size in chars
            const ls = (3 - ts) % 3;//  post conv lead size in bytes
            const base = 'A'.repeat(ws) + bext; // pre pad with wad of zeros in Base64 == 'A'
            raw = b(base).slice(ls); // convert and remove leader

        }
        super({ raw, code, qb64, qb64b, qb2 });

        if (!Object.values(BexDex).includes(this.code)) {
            throw new Error(`Invalid code = ${this.code} for Bexter.`);
        }

        this.bext = this.getBext();
    }

    private getBext(): string {
        const sizage = Matter.Sizes.get(this.code)!;
        //create new Uint8Array filled with 0s as long as ls 
        let arrayOne = new Uint8Array(sizage.ls).fill(0)
        //concat with this.raw
        let bext = concat(arrayOne, this.raw); //can be done in one line 
        //convert to base64
        // let bext = this.raw
        // let bext = Buffer.from(d(mergedArray), 'base64')
        let ws = 0;
        if (bext.length > 0) {
            if (bext[0] === 65) { //65 is 'A' in ascii
                ws = 1;
            }
        }
        else {
            ws = (0 + 1) % 4;
        }

        return bext.toString().slice(ws);
    }
}
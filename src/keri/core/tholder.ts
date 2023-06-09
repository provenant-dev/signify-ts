export class Tholder {
    private _weighted: boolean = false
    private _thold: number = 0
    private _size: number = 0
    private _sith: string = ""
    private _limen: Array<string> = new Array<string>()

    constructor(sith: string | number | Array<string>) {
        this.processSith(sith)
    }

    get num(): number | undefined {
        return this._weighted ? undefined : this._thold 
    }

    get size(): number {
        return this._size
    }

    get thold(): number {
        return this._thold;
    }
    get weighted(): boolean {
        return this._weighted;
    }

    get sith(): string {
        if (this.weighted) {
            if (this._sith == "") {
                return `${this._limen}`
            }
            return this._sith
        } else {
            return this.thold.toString(16)
        }
    }

    private processSith(sith: string | number | Array<string>) {
        if (typeof(sith) == "string") {
            this._sith = sith
            this._thold = parseInt(sith)
        } else if (typeof(sith) == "number") {
            this._thold = sith
            this._size = this._thold
        } else {
            this._limen = sith
            this._size = this._limen.length
        }
    }
}


import Fraction from "fraction.js"
import {Bexter} from "./bexter"
import {PNumber} from "./pnumber"

class Tholder2 {
    private _weighted: boolean;
    private _thold: number | string[][];
    private _size: number;
    private _bexter: Bexter | null;
    private _number: PNumber | null;
    private _satisfy: (indices: number[]) => boolean;

    constructor({ thold = null, limen = null, sith = null, ...kwa }: { thold?: number | Iterable<string>, limen?: string | Uint8Array, sith?: number | string | Iterable<string> }) {
        if (thold !== null) {
            this._processThold(thold);
        } else if (limen !== null) {
            this._processLimen(limen, kwa);
        } else if (sith !== null) {
            this._processSith(sith);
        } else {
            throw new Error("Missing threshold expression.");
        }
    }

    get weighted(): boolean {
        return this._weighted;
    }

    get thold(): number | string[][] {
        return this._thold;
    }

    get size(): number {
        return this._size;
    }

    get limen(): string {
        return this._weighted ? this._bexter!.qb64b : this._number!.qb64b;
    }

    get sith(): string {
        if (this.weighted) {
                const fractions = this._thold.map((f) => new Fraction(f))

            const sith: string | string[][] = this._thold.map((clause: Fraction[]) =>
                clause.map((f: Fraction) =>
                    0 < f && f < 1 ? ${ f.numerator } / ${ f.denominator } : ${ Math.round(f) }
                )
            );
            return Array.isArray(sith[0]) ? JSON.stringify(sith) : sith[0];
        } else {
            return this._thold.toString(16);
        }
    }

    get json(): string {
        return JSON.stringify(this.sith);
    }

    get num(): number | null {
        return this._weighted ? null : this._thold as number;
    }

    private _processThold(thold: number | Iterable<number>): void {
        if (typeof thold === "number") {
            this._processUnweighted(thold);
        } else {
            this._processWeighted(thold);
        }
    }

    private _processLimen(limen: string | Uint8Array, kwa: any): void {
        const matter = new Matter({ qb64b: limen, ...kwa });
        if (Matter.code in NumDex) {
            const number = new PNumber({ raw: matter.raw, code: matter.code, ...kwa });
            this._processUnweighted(number.num);
        } else if (Matter.code in BexDex) {
            const bexter = new Bexter({ raw: matter.raw, code: matter.code, ...kwa });
            const t = bexter.bext.replace("s", "/");
            const thold = t.split("a").map((clause: string) =>
                clause.split("c").map((w: string) => this.weight(w))
            );
            this._processWeighted(thold);
        } else {
            throw new Error(Invalid code for limen = ${ matter.code }.);
        }
    }

    private _processSith(sith: number | string | Iterable<string>): void {
        if (typeof sith === "number") {
            this._processUnweighted(sith);
        } else if (typeof sith === "string" && !sith.includes("[")) {
            this._processUnweighted(parseInt(sith, 16));
        } else {
            let parsedSith: string[] | string[][] = sith;
            if (typeof sith === "string") {
                parsedSith = JSON.parse(sith);
            }
            if (!Array.isArray(parsedSith) || parsedSith.length === 0) {
                throw new Error(`Empty weight list = ${parsedSith}.`);
            }

            const mask = parsedSith.map((c: string | string[]) => {
                if (Array.isArray(c)) {
                    return c.every((w: string) => typeof w === "string");
                } else {
                    return typeof c === "string";
                }
            });

            if (mask.some((m: boolean) => !m)) {
                throw new Error(`Invalid sith = ${parsedSith}, some weights in clause are non string.`);
            }

            const thold = parsedSith.map((clause: string | string[]) => {
                if (Array.isArray(clause)) {
                    return clause.map((w: string) => this.weight(w));
                } else {
                    return [this.weight(clause)];
                }
            });

            this._processWeighted(thold);
        }
    }

    private _processUnweighted(thold: number): void {
        if (thold < 0) {
            throw new Error(`Non - positive int threshold = ${ thold }.`);
        }
        this._thold = thold;
        this._weighted = false;
        this._size = this._thold;
        this._satisfy = this._satisfy_numeric;
        this._number = new PNumber(thold);
        this._bexter = null;
    }

    private _processWeighted(thold: number[][]): void {
        for (const clause of thold) {
            if (!(clause.reduce((sum: number, w: number) => sum + w, 0) >= 1)) {
                throw new Error(`Invalid sith clause = ${ thold }, all clause weight sums must be >= 1.`);
            }
        }
        this._thold = thold;
        this._weighted = true;
        this._size = thold.reduce((sum: number, clause: number[]) => sum + clause.length, 0);
        this._satisfy = this._satisfy_weighted;
        const bext = thold
            .map((clause: number[]) =>
                clause
                    .map((f: number) => (0 < f && f < 1 ? ${ f.numerator }s${ f.denominator } : ${ Math.round(f) }))
            .join("c")
)
.join("a");
        this._number = null;
        this._bexter = new Bexter({ bext });
    }

    private weight(w: string): Fraction {
        try {
            const parsedW = parseFloat(w);
            if (Number.isInteger(parsedW)) {
                return parsedW;
            }
            throw new TypeError(`Invalid weight str got float w = ${ w }.`);
        } catch {
            return new Fraction(w);
        }
    }

    satisfy(indices: number[]): boolean {
        return this._satisfy(indices);
    }

    private _satisfy_numeric(indices: number[]): boolean {
        try {
            if (this.thold > 0 && indices.length >= this.thold) {
                return true;
            }
        } catch {
            return false;
        }
        return false;
    }

    private _satisfy_weighted(indices: number[]): boolean {
        try {
            if (indices.length === 0) {
                return false;
            }
            const uniqueIndices = [...new Set(indices)].sort((a, b) => a - b);
            const sats = new Array<boolean>(this.size).fill(false);
            for (const idx of uniqueIndices) {
                sats[idx] = true;
            }
            let wio = 0;
            for (const clause of this.thold) {
                let cw = 0;
                for (const w of clause) {
                    if (sats[wio]) {
                        cw += w;
                    }
                    wio += 1;
                }
                if (cw < 1) {
                    return false;
                }
            }
            return true;
        } catch {
            return false;
        }
        return false;
    }
}
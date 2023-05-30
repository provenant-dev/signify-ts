import { Controller, Agent } from "./controller"
import { Tier } from "../core/salter"
import { Authenticater } from "../core/authing"
import { KeyManager } from "../core/keeping"
import { Algos } from '../core/manager';
import { incept, rotate } from "../core/eventing"
import { b, Serials, Versionage } from "../core/core";
import { Tholder } from "../core/tholder";
import { MtrDex } from "../core/matter";

class State {
    agent: any | null
    controller: any | null
    ridx: number
    pidx: number

    constructor() {
        this.agent = null
        this.controller = null
        this.pidx = 0
        this.ridx = 0
    }
}

export class SignifyClient {
    public controller: Controller
    public url: string
    public bran: string
    public pidx: number
    public agent: Agent | null
    public authn: any
    public session: any
    public manager: KeyManager | null
    public tier: Tier

    constructor(url: string, bran: string, tier: Tier = Tier.low) {
        this.url = url;
        if (bran.length < 21) {
            throw Error("bran must be 21 characters")
        }
        this.bran = bran;
        this.pidx = 0;
        this.controller = new Controller(bran, tier)
        this.authn = null
        this.agent = null
        this.manager = null
        this.tier = tier

    }

    get data() {
        return [this.url, this.bran, this.pidx, this.authn]
    }

    async boot() {
        const [evt, sign] = this.controller?.event ?? [];
        const data = {
            icp: evt.ked,
            sig: sign.qb64,
            stem: this.controller?.stem,
            pidx: 1,
            tier: this.controller?.tier
        };
        let _url = this.url.includes("https") ? this.url : "http://localhost:3903";
        const res = await fetch(_url + "/boot", {
            method: "POST",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        });

        return res;
    }

    async state(): Promise<State> {
        let caid = this.controller?.pre;
        let res = await fetch(this.url + `/agent/${caid}`);
        if (res.status == 404) {
            throw new Error(`agent does not exist for controller ${caid}`);
        }
        let data = await res.json();
        let state = new State();
        state.agent = data["agent"] ?? {};
        state.controller = data["controller"] ?? {};
        state.ridx = data["ridx"] ?? 0;
        state.pidx = data["pidx"] ?? 0;
        return state;
    }

    async connect() {
        let state = await this.state()
        this.pidx = state.pidx
        //Create controller representing local auth AID
        this.controller = new Controller(this.bran, this.tier, 0, state.controller)
        this.controller.ridx = state.ridx !== undefined ? state.ridx : 0
        // Create agent representing the AID of the cloud agent
        this.agent = new Agent(state.agent)
        if (this.agent.anchor != this.controller.pre) {
            throw Error("commitment to controller AID missing in agent inception event")
        }
        console.log(this.controller.serder)
        if (this.controller.serder.ked.s == 0 ) {
            console.log('approving delegation')
            await this.approveDelegation()
        }
        this.manager = new KeyManager(this.controller.salter, null)
        this.authn = new Authenticater(this.controller.signer, this.agent.verfer!)
    }

    async fetch(path: string, method: string, data: any) {
        //BEGIN Headers
        let headers = new Headers()
        headers.set('Signify-Resource', this.controller.pre)
        headers.set('Signify-Timestamp', new Date().toISOString().replace('Z','000+00:00'))
        headers.set('Content-Type', 'application/json')

        if (data !== null) {
            headers.set('Content-Length', data.length)
        }
        else {
            headers.set('Content-Length', '0')
        }
        let signed_headers = this.authn.sign(headers, method, path)
        //END Headers
        let _body = method == 'GET' ? null : JSON.stringify(data)
        let res = await fetch(this.url + path, {
            method: method,
            body: _body,
            headers: signed_headers
        });
        //BEGIN Verification
        if (res.status !== 200) {
            throw new Error('Response status is not 200');
        }
        const isSameAgent = this.agent?.pre === res.headers.get('signify-resource');
        if (!isSameAgent) {
            throw new Error('Message from a different remote agent');
        }

        const verification = this.authn.verify(res.headers, method, path);
        if (verification) {
            return res;
        } else {
            throw new Error('Response verification failed');
        }
    }

    async approveDelegation(){
        // {
        // "ixn": {"v": "KERI10JSON00013a_", "t": "ixn", "d": "EA4YpgJavlrjDRIE5UdkM44wiGTcCTfsTayrAViCDV4s", "i": "ELI7pg979AdhmvrjDeam2eAO2SR5niCgnjAJXJHtJose", "s": "1", "p": "ELI7pg979AdhmvrjDeam2eAO2SR5niCgnjAJXJHtJose", "a": [{"i": "EEXekkGu9IAzav6pZVJhkLnjtjM5v3AcyA-pdKUcaGei", "s": "0", "d": "EEXekkGu9IAzav6pZVJhkLnjtjM5v3AcyA-pdKUcaGei"}]}, 
        // "sigs": ["AAD6nSSSGy_uO41clzL-g3czC8W0Ax-2M87NXA_Iu50ZdEhbekuv2k7dY0fjoO3su3aBRBx4EXryPc8x4uGfbVYG"]
        // }
        let sigs = this.controller.approveDelegation(this.agent!)

        let data = {
            ixn: this.controller.serder.ked,
            sigs: sigs
        }
        
        await fetch(this.url + "/agent/"+ this.controller.pre+"?type=ixn", {
            method: "PUT",
            body: JSON.stringify(data),
            headers: {
                "Content-Type": "application/json"
            }
        })
    }

    identifiers() {
        return new Identifier(this)
    }
}

class Identifier {
    public client: SignifyClient
    constructor(client: SignifyClient) {
        this.client = client
    }

    async list_identifiers() {
        let path = `/identifiers`
        let data = null
        let method = 'GET'
        let res = await this.client.fetch(path, method, data)
        return await res.json()
    }

    async get_identifier(name: string) {
        let path = `/identifiers/${name}`
        let data = null
        let method = 'GET'
        let res = await this.client.fetch(path, method, data)
        return await res.json()
    }

    async create(name: string,  
                kargs:{
                    transferable:boolean, 
                    isith:string, 
                    nsith:string, 
                    wits:string[], 
                    toad:string, 
                    proxy:string, 
                    delpre:string, 
                    dcode:string, 
                    data:any, 
                    algo:Algos,
                    pre:string,
                    states:any[],
                    rstates:any[]}) {

        let algo = kargs["algo"] ?? Algos.salty
        let transferable = kargs["transferable"] ?? true
        let isith = kargs["isith"] ?? "1"
        let nsith = kargs["nsith"] ?? "1"
        let wits = kargs["wits"] ?? []
        let toad = kargs["toad"] ?? "0"
        let dcode = kargs["dcode"] ?? MtrDex.Blake3_256
        let proxy = kargs["proxy"]
        let delpre = kargs["delpre"]
        let data = kargs["data"] != undefined ? [kargs["data"]] : []
        let pre = kargs["pre"]
        let states = kargs["states"]
        let rstates = kargs["rstates"]

        let xargs = {
            transferable:transferable, 
            isith:isith, 
            nsith:nsith, 
            wits:wits, 
            toad:toad, 
            proxy:proxy, 
            delpre:delpre, 
            dcode:dcode, 
            data:data, 
            algo:algo,
            pre:pre

        }


        let keeper = this.client.manager!.new( algo, this.client.pidx, xargs)
        let [keys, ndigs] = keeper!.incept(transferable)
        wits = wits !== undefined ? wits : []
        if (delpre == undefined){
            var serder = incept({ 
                keys: keys, 
                isith: isith, 
                ndigs: ndigs, 
                nsith: nsith, 
                toad: toad, 
                wits: wits, 
                cnfg: [], 
                data: data, 
                version: Versionage, 
                kind: Serials.JSON, 
                code: dcode,
                intive: false, 
                delpre})
            
        } else {
            var serder = incept({ 
                keys: keys, 
                isith: isith, 
                ndigs: ndigs, 
                nsith: nsith, 
                toad: toad, 
                wits: wits, 
                cnfg: [], 
                data: data, 
                version: Versionage, 
                kind: Serials.JSON, 
                code: dcode,
                intive: false, 
                delpre})
        }

        let sigs = keeper!.sign(b(serder.raw))
        var jsondata = {
            name: name,
            icp: serder.ked,
            sigs: sigs,
            proxy: proxy,
            salty: keeper.params(),
            smids: states != undefined ? states.map(state => state['i']) : undefined,
            rmids: rstates != undefined ? rstates.map(state => state['i']) : undefined
            }
        // TODO FIX TO other algos    
        // jsondata[algo.toString()] = keeper.params()

        this.client.pidx = this.client.pidx + 1
        let res = await this.client.fetch("/identifiers", "POST", jsondata)
        return res.json()

    }


    // async interact(name:string, data:Array<object>|undefined=undefined){

    //     let hab = await this.get_identifier(name)
    //     let pre:string = hab["prefix"]

    //     let  state = hab["state"]
    //     let sn = state["s"].toString(16)
    //     let dig = state["d"]
        
    //     let _data = Array.isArray(data) ? data : [data]

    //     let serder = interact(pre, sn=sn + 1, data=data, dig=dig)
    //     let keeper = this.client!.manager!.get(hab)
    //     let  sigs = keeper.sign(b(serder.raw))

    //     // FIX TO OTHER ALGOS
    //     let jsondata = {
    //         ixn: serder.ked,
    //         sigs: sigs,
    //         salty: keeper.params()
    //     }
    //     let res = await this.client.fetch("/identifiers/"+name+"?type=ixn", "PUT", jsondata)
    //     return res.json()

    // }


    async rotate(
        name: string,
        kargs:{
            transferable:boolean, 
            nsith:string, 
            toad:number,
            cuts:string[],
            adds:string[],
            data:Array<object>,
            ncode:string,
            ncount:number,
            ncodes:string[],
            states:any[],
            rstates:any[]}){

        let transferable = kargs["transferable"] ?? true
        let ncode = kargs["ncode"] ?? MtrDex.Ed25519_Seed
        let ncount = kargs["ncount"] ?? 1


        let hab = await this.get_identifier(name)
        let pre = hab["prefix"]

        let state = hab["state"]
        let count = state['k'].length
        let dig = state["d"]
        let ridx = state["s"].toString(16) + 1
        let wits = state['b']
        let isith = state["kt"]

        let nsith = kargs["nsith"] ?? isith


        // if isith is None:  # compute default from newly rotated verfers above
        if (isith == undefined) isith = `${Math.max(1, Math.ceil(count / 2)).toString(16)}`

        // if nsith is None:  # compute default from newly rotated digers above
        if (nsith == undefined) nsith = `${Math.max(1, Math.ceil(ncount / 2)).toString(16)}`

        let cst = new Tholder(isith).sith  // current signing threshold
        let  nst = new Tholder(nsith).sith  // next signing threshold

        // Regenerate next keys to sign rotation event
        let keeper = this.client.manager!.get(hab)
        // Create new keys for next digests
        let ncodes = kargs["ncodes"] ?? new Array(ncount).fill(ncode)

        let states = kargs["states"]
        let rstates = kargs["rstates"]
        let [keys, ndigs] = keeper!.rotate(ncodes, transferable, states, rstates)

        let cuts = kargs["cuts"] ?? []
        let adds = kargs["adds"] ?? []
        let data = kargs["data"] != undefined ? [kargs["data"]]:[]
        let toad = kargs["toad"]
        let serder = rotate({
                pre: pre,
                keys: keys,
                dig: dig,
                sn: ridx,
                isith: cst,
                nsith: nst,
                ndigs: ndigs,
                toad: toad,
                wits: wits,
                cuts: cuts,
                adds: adds,
                data: data })

        let  sigs = keeper.sign(b(serder.raw))

        // FIX TO ADD OTHER ALGOS
        var jsondata = {
            rot: serder.ked,
            sigs: sigs,
            salty: keeper.params(),
            smids: states != undefined ? states.map(state => state['i']) : undefined,
            rmids: rstates != undefined ? rstates.map(state => state['i']) : undefined
        }

        let res = await this.client.fetch("/identifiers/"+name, "PUT", jsondata)
        return res.json()
    }

}

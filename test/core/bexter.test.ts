
import { Bexter } from '../../src/keri/core/bexter';
import { MtrDex } from '../../src/keri/core/matter';
import assert from 'assert';
describe('Bexter', () => {
    it('should hold a bext string', async () => {
        
        let bext = ""
        let bexter = new Bexter(bext)
        assert.strictEqual(bexter.code, MtrDex.StrB64_L0)
        assert.strictEqual(bexter.both, '4AAA')
        assert.strictEqual(bexter.raw.toString(), '')
        assert.strictEqual(bexter.qb64, '4AAA')
        assert.strictEqual(bexter.bext, bext)

        // bext = "-"
        // let bexter2 = new Bexter(bext)
        // assert.strictEqual(bexter2.code, MtrDex.StrB64_L2)
        // assert.strictEqual(bexter2.both, '6AAB')
        // assert.strictEqual(bexter2.raw.toString(), '>')
        // assert.strictEqual(bexter2.qb64, '6AABAAA-')
        // assert.strictEqual(bexter2.bext, bext)

        // bext = "-A"
        // let bexter3 = new Bexter(bext)
        // assert.strictEqual(bexter3.code, MtrDex.StrB64_L1)
        // assert.strictEqual(bexter3.both, '5AAB')
        // assert.strictEqual(bexter3.raw.toString(), '\x0f\x80')
        // assert.strictEqual(bexter3.qb64, '5AABAA-A')
        // assert.strictEqual(bexter3.bext, bext)

        // bext = "-A-"
        // let bexter4 = new Bexter(bext)
        // assert.strictEqual(bexter4.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter4.both, '4AAB')
        // assert.strictEqual(bexter4.raw.toString(), '\x03\xe0>')
        // assert.strictEqual(bexter4.qb64, '4AABA-A-')
        // assert.strictEqual(bexter4.bext, bext)

        // bext = "-A-B"
        // let bexter5 = new Bexter(bext)
        // assert.strictEqual(bexter5.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter5.both, '4AAB')
        // assert.strictEqual(bexter5.raw.toString(), '\xf8\x0f\x81')
        // assert.strictEqual(bexter5.qb64, '4AAB-A-B')
        // assert.strictEqual(bexter5.bext, bext)

        // bext = "A"
        // let bexter6 = new Bexter(bext)
        // assert.strictEqual(bexter6.code, MtrDex.StrB64_L2)
        // assert.strictEqual(bexter6.both, '6AAB')
        // assert.strictEqual(bexter6.raw.toString(), '\x00')
        // assert.strictEqual(bexter6.qb64, '6AABAAAA')
        // assert.strictEqual(bexter6.bext, bext)

        // bext = "AA"
        // let bexter7 = new Bexter(bext)
        // assert.strictEqual(bexter7.code, MtrDex.StrB64_L1)
        // assert.strictEqual(bexter7.both, '5AAB')
        // assert.strictEqual(bexter7.raw.toString(), '\x00\x00')
        // assert.strictEqual(bexter7.qb64, '5AABAAAA')
        // assert.strictEqual(bexter7.bext, bext)

        // //test of ambiguity with bext that starts with "A" and is multiple of 3 or 4
        // bext = "AAA"  // multiple of three
        // let bexter8 = new Bexter(bext)
        // assert.strictEqual(bexter8.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter8.both, '4AAB')
        // assert.strictEqual(bexter8.raw.toString(), '\x00\x00\x00')
        // assert.strictEqual(bexter8.qb64, '4AABAAAA')
        // assert.strictEqual(bexter8.bext, bext)

        // //multiple of four loses leading 'A' for round trip of bext
        // bext = "AAAA"
        // let bexter9 = new Bexter(bext)
        // assert.strictEqual(bexter9.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter9.both, '4AAB')
        // assert.strictEqual(bexter9.raw.toString(), '\x00\x00\x00')
        // assert.strictEqual(bexter9.qb64, '4AABAAAA')
        // assert.strictEqual(bexter9.bext, 'AAA')

        // // multiple of three
        // bext = "ABB"
        // let bexter10 = new Bexter(bext)
        // assert.strictEqual(bexter10.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter10.both, '4AAB')
        // assert.strictEqual(bexter10.raw.toString(), '\x00\x00A')
        // assert.strictEqual(bexter10.qb64, '4AABAAAB')
        // assert.strictEqual(bexter10.bext, bext)

        // bext = "BBB"
        // let bexter11 = new Bexter(bext)
        // assert.strictEqual(bexter11.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter11.both, '4AAB')
        // assert.strictEqual(bexter11.raw.toString(), '\x00\x10A')
        // assert.strictEqual(bexter11.qb64, '4AABABBB')
        // assert.strictEqual(bexter11.bext, bext)

        // //multiple of four loses leading 'A' for round trip of bext
        // bext = "ABBBB"
        // let bexter12 = new Bexter(bext)
        // assert.strictEqual(bexter12.code, MtrDex.StrB64_L0)
        // assert.strictEqual(bexter12.both, '4AAB')
        // assert.strictEqual(bexter12.raw.toString(), '\x00\x10A')
        // assert.strictEqual(bexter12.qb64, '4AABABBBB')
        // assert.strictEqual(bexter12.bext, 'BBB')

        // """ Done Test """
    });
}
)
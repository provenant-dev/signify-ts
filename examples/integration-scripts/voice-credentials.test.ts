import { strict as assert } from 'assert';
import signify, { Algos, CesrNumber, d, messagize, randomNonce, Saider, Serder, Siger, SignifyClient } from 'signify-ts';
import { resolveEnvironment } from './utils/resolve-env';
import {
    assertNotifications,
    assertOperations,
    markAndRemoveNotification,
    resolveOobi,
    waitForNotifications,
    waitOperation,
} from './utils/test-util';
import { retry } from './utils/retry';
import {
    getOrCreateClients,
    getOrCreateContact,
    getOrCreateIdentifier,
} from './utils/test-setup';
import { randomUUID } from 'crypto';
import { step } from './utils/test-step';
import { StartMultisigInceptArgs } from './utils/multisig-utils';

const { vleiServerUrl } = resolveEnvironment();

const QVI_SCHEMA_SAID = 'EBfdlu8R27Fbx-ehrqwImnK-8Cm79sqbAQ4MmvEAYqao';
const LE_SCHEMA_SAID = 'ENPXp1vQzRF6JwIuS-mp2U8Uf1MoADoP_GqQ62VsDZWY';
const TN_ALLOC_SCHEMA_SAID = 'EFvnoHDY7I-kaBBeKlbDbkjG4BaI0nKLGadxBdjMGgSQ';
const GCD_SCHEMA_SAID = 'EL7irIKYJL9Io0hhKSGWI4OznhwC7qgJG5Qf4aEs6j0o';
const VVP_DOSSIER_SCHEMA_SAID = 'EFv3_L64_xNhOGQkaAHQTI-lzQYDvlaHcuZbuOTuDBXj';

const vLEIServerHostUrl = `${vleiServerUrl}/oobi`;
const QVI_SCHEMA_URL = `${vLEIServerHostUrl}/${QVI_SCHEMA_SAID}`;
const LE_SCHEMA_URL = `${vLEIServerHostUrl}/${LE_SCHEMA_SAID}`;
const TN_SCHEMA_URL = `${vLEIServerHostUrl}/${TN_ALLOC_SCHEMA_SAID}`;
const GCD_SCHEMA_URL = `${vLEIServerHostUrl}/${GCD_SCHEMA_SAID}`;
const VVP_DOSSIER_SCHEMA_URL = `${vLEIServerHostUrl}/${VVP_DOSSIER_SCHEMA_SAID}`;

interface Aid {
    name: string;
    prefix: string;
    oobi: string;
}

function createTimestamp() {
    return new Date().toISOString().replace('Z', '000+00:00');
}

async function createAid(client: SignifyClient, name: string): Promise<Aid> {
    const [prefix, oobi] = await getOrCreateIdentifier(client, name);
    return { prefix, oobi, name };
}

// Boot clients
// gar
// qar
// qvi
// regulator - LAR1, regAlloc
// shell - LAR1, LAR2, shellAlloc
// delSigner
let garClient: SignifyClient;
let qviClient: SignifyClient;
let regLar1Client: SignifyClient;
let regAlloc1Client: SignifyClient;
let shellLar1Client: SignifyClient;
let shellLar2Client: SignifyClient;
let shellAlloc1Client: SignifyClient;
let shellDelSigClient: SignifyClient;

let garAid: Aid;
let qviAid: Aid;
let regLar1Aid: Aid;
let regAlloc1Aid: Aid;
let shellLar1Aid: Aid;
let shellLar2Aid: Aid;
let shellAlloc1Aid: Aid;
let shellDelSigAid: Aid;

let regLeAid: Aid;
let shellLeAid: Aid;
let shellAllocAid: Aid;
let regLeAidAlias = "reg-legal-entity";
let shellLeAidAlias = "shell-legal-entity";
let shellAllocAidAlias = "allocator-at-shell";
let regLeAidOobi: string;
let shellLeAidOobi: string;
let shellAllocAidOobi: string;


beforeAll(async () => {
    [garClient, qviClient, regLar1Client, regAlloc1Client, shellLar1Client, shellLar2Client, shellAlloc1Client, shellDelSigClient] =
        await getOrCreateClients(8);
});

beforeAll(async () => {
    [garAid, qviAid, regLar1Aid, regAlloc1Aid, shellLar1Aid, shellLar2Aid, shellAlloc1Aid, shellDelSigAid] = await Promise.all([
        createAid(garClient, 'gar'),
        createAid(qviClient, 'qvi'),
        createAid(regLar1Client, 'reg-lar-1'),
        createAid(regAlloc1Client, 'reg-alloc-1'),
        createAid(shellLar1Client, 'shell-lar-1'),
        createAid(shellLar2Client, 'shell-lar-2'),
        createAid(shellAlloc1Client, 'shell-alloc-1'),
        createAid(shellDelSigClient, 'shell-del-sig'),
    ]);
});

beforeAll(async () => {
    await Promise.all([
        getOrCreateContact(garClient, 'qvi', qviAid.oobi),
        getOrCreateContact(qviClient, 'gar', garAid.oobi),
        getOrCreateContact(qviClient, 'reg-lar-1', regLar1Aid.oobi),
        getOrCreateContact(qviClient, 'shell-lar-1', shellLar1Aid.oobi),
        getOrCreateContact(qviClient, 'shell-lar-2', shellLar2Aid.oobi),
        getOrCreateContact(regLar1Client, 'qvi', qviAid.oobi),
        getOrCreateContact(regLar1Client, 'shell-alloc-1', shellAlloc1Aid.oobi),
        getOrCreateContact(regAlloc1Client, 'reg-lar-1', regLar1Aid.oobi),
        getOrCreateContact(regAlloc1Client, 'shell-alloc-1', shellAlloc1Aid.oobi),
        getOrCreateContact(shellLar1Client, 'qvi', qviAid.oobi),
        getOrCreateContact(shellLar2Client, 'qvi', qviAid.oobi),
        getOrCreateContact(shellAlloc1Client, 'reg-alloc-1', regAlloc1Aid.oobi),
        getOrCreateContact(shellAlloc1Client, 'shell-lar-1', shellLar1Aid.oobi),
        getOrCreateContact(shellAlloc1Client, 'shell-lar-2', shellLar2Aid.oobi),
        getOrCreateContact(shellAlloc1Client, 'shell-del-sig', shellDelSigAid.oobi),
        getOrCreateContact(shellDelSigClient, 'shell-alloc-1', shellAlloc1Aid.oobi)
    ]);
});

// afterAll(async () => {
//     await assertOperations(
//         qviClient,
//         regLar1Client,
//         regAlloc1Client,
//         shellLar1Client,
//         shellLar2Client,
//         shellAlloc1Client,
//         shellDelSigClient
//     );
//     await assertNotifications(
//         qviClient,
//         regLar1Client,
//         regAlloc1Client,
//         shellLar1Client,
//         shellLar2Client,
//         shellAlloc1Client,
//         shellDelSigClient
//     );
// });

test('voice protocol credentials', async () => {
    await step('Resolve schema oobis', async () => {
        await Promise.all([
            resolveOobi(qviClient, QVI_SCHEMA_URL),
            resolveOobi(qviClient, LE_SCHEMA_URL),
            resolveOobi(regLar1Client, QVI_SCHEMA_URL),
            resolveOobi(regLar1Client, LE_SCHEMA_URL),
            resolveOobi(regLar1Client, TN_SCHEMA_URL),
            resolveOobi(regLar1Client, GCD_SCHEMA_URL),
            resolveOobi(regLar1Client, VVP_DOSSIER_SCHEMA_URL),
            resolveOobi(regAlloc1Client, QVI_SCHEMA_URL),
            resolveOobi(regAlloc1Client, LE_SCHEMA_URL),
            resolveOobi(regAlloc1Client, TN_SCHEMA_URL),
            resolveOobi(regAlloc1Client, GCD_SCHEMA_URL),
            resolveOobi(regAlloc1Client, VVP_DOSSIER_SCHEMA_URL),
            resolveOobi(shellLar1Client, QVI_SCHEMA_URL),
            resolveOobi(shellLar1Client, LE_SCHEMA_URL),
            resolveOobi(shellLar1Client, TN_SCHEMA_URL),
            resolveOobi(shellLar1Client, GCD_SCHEMA_URL),
            resolveOobi(shellLar1Client, VVP_DOSSIER_SCHEMA_URL),
            resolveOobi(shellLar2Client, QVI_SCHEMA_URL),
            resolveOobi(shellLar2Client, LE_SCHEMA_URL),
            resolveOobi(shellLar2Client, TN_SCHEMA_URL),
            resolveOobi(shellLar2Client, GCD_SCHEMA_URL),
            resolveOobi(shellLar2Client, VVP_DOSSIER_SCHEMA_URL),
            resolveOobi(shellAlloc1Client, QVI_SCHEMA_URL),
            resolveOobi(shellAlloc1Client, LE_SCHEMA_URL),
            resolveOobi(shellAlloc1Client, TN_SCHEMA_URL),
            resolveOobi(shellAlloc1Client, GCD_SCHEMA_URL),
            resolveOobi(shellAlloc1Client, VVP_DOSSIER_SCHEMA_URL),
            resolveOobi(shellDelSigClient, QVI_SCHEMA_URL),
            resolveOobi(shellDelSigClient, LE_SCHEMA_URL),
            resolveOobi(shellDelSigClient, TN_SCHEMA_URL),
            resolveOobi(shellDelSigClient, GCD_SCHEMA_URL),
            resolveOobi(shellDelSigClient, VVP_DOSSIER_SCHEMA_URL),
        ]);
    });

    const garRegistry = await step('Create GAR registry', async () => {
        const garRegName = 'gar-registry';

        const regResult = await garClient
            .registries()
            .create({ name: garAid.name, registryName: garRegName });

        await waitOperation(garClient, await regResult.op());
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let registries = await garClient.registries().list(garAid.name);
        const registry: { name: string; regk: string } = registries[0];
        assert.equal(registries.length, 1);
        assert.equal(registry.name, garRegName);

        return registry;
    });

    const qviRegistry = await step('Create QVI registry', async () => {
        const qviRegName = 'qvi-registry';

        const regResult = await qviClient
            .registries()
            .create({ name: qviAid.name, registryName: qviRegName });

        await waitOperation(qviClient, await regResult.op());
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let registries = await qviClient.registries().list(qviAid.name);
        const registry: { name: string; regk: string } = registries[0];
        assert.equal(registries.length, 1);
        assert.equal(registry.name, qviRegName);

        return registry;
    });

    const qviCredentialId = await step('Create QVI credential', async () => {
        const vcdata = {
            LEI: '549300QME1XNVC6E2R42',
        };

        const issResult = await garClient.credentials().issue({
            issuerName: garAid.name,
            registryId: garRegistry.regk,
            schemaId: QVI_SCHEMA_SAID,
            recipient: qviAid.prefix,
            data: vcdata,
        });

        await waitOperation(garClient, issResult.op);
        return issResult.acdc.ked.d as string;
    });

    await step('GAR IPEX grant', async () => {
        const dt = createTimestamp();
        const issuerCredential = await garClient
            .credentials()
            .get(qviCredentialId);
        assert(issuerCredential !== undefined);

        const [grant, gsigs, gend] = await garClient.ipex().grant({
            senderName: garAid.name,
            acdc: new Serder(issuerCredential.sad),
            anc: new Serder(issuerCredential.anc),
            iss: new Serder(issuerCredential.iss),
            ancAttachment: issuerCredential.ancAttachment,
            recipient: qviAid.prefix,
            datetime: dt,
        });

        let op = await garClient
            .ipex()
            .submitGrant(garAid.name, grant, gsigs, gend, [
                qviAid.prefix,
            ]);
        await waitOperation(garClient, op);
    });

    await step('QVI IPEX admit', async () => {
        const holderNotifications = await waitForNotifications(
            qviClient,
            '/exn/ipex/grant'
        );
        const grantNotification = holderNotifications[0]; // should only have one notification right now

        const [admit, sigs, aend] = await qviClient
            .ipex()
            .admit(
                qviAid.name,
                '',
                grantNotification.a.d!,
                createTimestamp()
            );
        let op = await qviClient
            .ipex()
            .submitAdmit(qviAid.name, admit, sigs, aend, [garAid.prefix]);
        await waitOperation(qviClient, op);

        await markAndRemoveNotification(qviClient, grantNotification);
    });

    // await step('gar IPEX grant response', async () => {
    //     const issuerNotifications = await waitForNotifications(
    //         garClient,
    //         '/exn/ipex/admit'
    //     );
    //     await markAndRemoveNotification(garClient, issuerNotifications[0]);
    // });

    await step('QVI has credential', async () => {
        const holderCredential = await retry(async () => {
            const result = await qviClient
                .credentials()
                .get(qviCredentialId);
            assert(result !== undefined);
            return result;
        });
        assert.equal(holderCredential.sad.s, QVI_SCHEMA_SAID);
        assert.equal(holderCredential.sad.i, garAid.prefix);
        assert.equal(holderCredential.status.s, '0');

    });

    await step('Create Regulator LE multisig aid', async () => {

        let regLar1localAid = await regLar1Client.identifiers().get(regLar1Aid.name)
        //let regAidOp = await createMultisigAid(regLar1Client, regLeAidAlias)
        let regAidOp = await startMultisigIncept(regLar1Client, {
            groupName: regLeAidAlias,
            localMemberName: regLar1Aid.name,
            participants: [regLar1Aid.prefix],
            isith: ["1"],
            nsith: ["1"],
            toad: regLar1localAid.state.b.length,
            wits: regLar1localAid.state.b,
        });
        console.log(
            'Member1 initiated multisig, waiting for others to join...'
        );
        regAidOp = await waitOperation(regLar1Client, regAidOp);

        regLeAid = await regLar1Client.identifiers().get(regLeAidAlias)
        regLar1localAid = await regLar1Client.identifiers().get(regLar1Aid.name)
        const members = await regLar1Client.identifiers().members(regLeAidAlias);
        const signing = members['signing']
        const filteredMembers = await filterAuthSigningMembers(signing)
        let mEids: string[] = []
        for (let m = 0; m < filteredMembers.length; m++) {
            if (filteredMembers[m].ends?.agent) {
                let eid = Object.keys(filteredMembers[m].ends.agent)[0]
                mEids.push(eid)
            }
        }
        let endRoleRes = await multisigAddEndRole(
            regLar1Client,
            regLeAidAlias,
            mEids[0],
            regLeAid,
            regLar1localAid,
            filteredMembers
        )
        let roleOp = await endRoleRes.op()
        roleOp = await waitOperation(regLar1Client, roleOp);

        const oobisRes = await regLar1Client.oobis().get(regLeAidAlias, 'agent');
        regLeAidOobi = oobisRes.oobis[0].split('/agent/')[0];

        const regIcpResult = await multisigCreateRegistry(
            regLar1Client,
            regLeAidAlias,
            regLar1Aid.name
        )

        const op = await regIcpResult.op();
        await waitOperation(regLar1Client, op);

        console.log(
            `Initiated credential registry creation for identifier ${regLeAidAlias}. Waiting for other group members to join.`
        )

        return { regLeAid, regLeAidOobi };
    });

    await step('Resolve Regulator LE aid oobi', async () => {
        //await new Promise((resolve) => setTimeout(resolve, 3000));
        getOrCreateContact(qviClient, regLeAidAlias, regLeAidOobi),
            getOrCreateContact(regAlloc1Client, regLeAidAlias, regLeAidOobi),
            getOrCreateContact(shellLar1Client, regLeAidAlias, regLeAidOobi),
            getOrCreateContact(shellLar2Client, regLeAidAlias, regLeAidOobi),
            getOrCreateContact(shellAlloc1Client, regLeAidAlias, regLeAidOobi)
        await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    await step('Create Shell LE multisig aid', async () => {

        let shellLar1localAid = await shellLar1Client.identifiers().get(shellLar1Aid.name)
        let shellAidOp = await startMultisigIncept(shellLar1Client, {
            groupName: shellLeAidAlias,
            localMemberName: shellLar1Aid.name,
            participants: [shellLar1Aid.prefix],
            isith: ["1"],
            nsith: ["1"],
            toad: shellLar1localAid.state.b.length,
            wits: shellLar1localAid.state.b,
        });
        console.log(
            'Shell Member 1 initiated multisig, waiting for others to join...'
        );
        shellAidOp = await waitOperation(shellLar1Client, shellAidOp);

        shellLeAid = await shellLar1Client.identifiers().get(shellLeAidAlias)
        shellLar1localAid = await shellLar1Client.identifiers().get(shellLar1Aid.name)
        const members = await shellLar1Client.identifiers().members(shellLeAidAlias);
        const signing = members['signing']
        const filteredMembers = await filterAuthSigningMembers(signing)
        let mEids: string[] = []
        for (let m = 0; m < filteredMembers.length; m++) {
            if (filteredMembers[m].ends?.agent) {
                let eid = Object.keys(filteredMembers[m].ends.agent)[0]
                mEids.push(eid)
            }
        }
        let endRoleRes = await multisigAddEndRole(
            shellLar1Client,
            shellLeAidAlias,
            mEids[0],
            shellLeAid,
            shellLar1localAid,
            filteredMembers
        )
        let roleOp = await endRoleRes.op()
        roleOp = await waitOperation(shellLar1Client, roleOp);

        const oobisRes = await shellLar1Client.oobis().get(shellLeAidAlias, 'agent');
        shellLeAidOobi = oobisRes.oobis[0].split('/agent/')[0];

        let shellIcpResult = await multisigCreateRegistry(
            shellLar1Client,
            shellLeAidAlias,
            shellLar1Aid.name
        )

        console.log(
            `Initiated credential registry creation for shell identifier ${shellLeAidAlias}. Waiting for other group members to join.`
        )

        const op = await shellIcpResult.op();
        await waitOperation(shellLar1Client, op);

        return { shellLeAid, shellLeAidOobi };
    });

    await step('Resolve Shell LE aid oobi', async () => {
        //await new Promise((resolve) => setTimeout(resolve, 3000));
        getOrCreateContact(qviClient, shellLeAidAlias, shellLeAidOobi),
            getOrCreateContact(regLar1Client, shellLeAidAlias, shellLeAidOobi),
            getOrCreateContact(regAlloc1Client, shellLeAidAlias, shellLeAidOobi),
            getOrCreateContact(shellAlloc1Client, shellLeAidAlias, shellLeAidOobi)
        getOrCreateContact(shellDelSigClient, shellLeAidAlias, shellLeAidOobi)
        await new Promise((resolve) => setTimeout(resolve, 1000));
    });

    const regLeCredentialId = await step(
        'QVI create Regulator LE credential',
        async () => {
            const qviCredential = await qviClient
                .credentials()
                .get(qviCredentialId);

            const result = await qviClient.credentials().issue({
                issuerName: qviAid.name,
                recipient: regLeAid.prefix,
                registryId: qviRegistry.regk,
                schemaId: LE_SCHEMA_SAID,
                data: {
                    LEI: '549300QME1XNVC6E2REG',
                },
                rules: Saider.saidify({
                    d: '',
                    usageDisclaimer: {
                        l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                    },
                    issuanceDisclaimer: {
                        l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                    },
                })[1],
                source: Saider.saidify({
                    d: '',
                    qvi: {
                        n: qviCredential.sad.d,
                        s: qviCredential.sad.s,
                    },
                })[1],
            });

            await waitOperation(qviClient, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Regulator LE credential IPEX grant', async () => {
        const dt = createTimestamp();
        const leCredential = await qviClient
            .credentials()
            .get(regLeCredentialId);
        assert(leCredential !== undefined);

        const [grant, gsigs, gend] = await qviClient.ipex().grant({
            senderName: qviAid.name,
            acdc: new Serder(leCredential.sad),
            anc: new Serder(leCredential.anc),
            iss: new Serder(leCredential.iss),
            ancAttachment: leCredential.ancAttachment,
            recipient: regLeAid.prefix,
            datetime: dt,
        });

        let op = await qviClient
            .ipex()
            .submitGrant(qviAid.name, grant, gsigs, gend, [
                regLeAid.prefix,
            ]);
        await waitOperation(qviClient, op);
    });

    await step('Regulator Legal Entity IPEX admit', async () => {
        const notifications = await waitForNotifications(
            regLar1Client,
            '/exn/ipex/grant'
        );
        const grantNotification = notifications[0];

        const [admit, sigs, aend] = await regLar1Client
            .ipex()
            .admit(
                regLeAid.name,
                '',
                grantNotification.a.d!,
                createTimestamp()
            );

        let op = await regLar1Client
            .ipex()
            .submitAdmit(regLeAid.name, admit, sigs, aend, [
                qviAid.prefix,
            ]);
        await waitOperation(regLar1Client, op);

        await markAndRemoveNotification(regLar1Client, grantNotification);
    });

    await step('Regulator Legal Entity has LE credential', async () => {
        const legalEntityCredential = await retry(async () =>
            regLar1Client.credentials().get(regLeCredentialId)
        );

        assert.equal(legalEntityCredential.sad.s, LE_SCHEMA_SAID);
        assert.equal(legalEntityCredential.sad.i, qviAid.prefix);
        assert.equal(legalEntityCredential.sad.a.i, regLeAid.prefix);
    });

    const regAllocRegistry = await step('Create Regulator allocator registry', async () => {
        const regAllocRegName = 'reg-alloc1-registry';

        const regResult = await regAlloc1Client
            .registries()
            .create({ name: regAlloc1Aid.name, registryName: regAllocRegName });

        await waitOperation(regAlloc1Client, await regResult.op());
        await new Promise((resolve) => setTimeout(resolve, 3000));
        let registries = await regAlloc1Client.registries().list(regAlloc1Aid.name);
        const registry: { name: string; regk: string } = registries[0];
        assert.equal(registries.length, 1);
        assert.equal(registry.name, regAllocRegName);

        return registry;
    });

    const regTnAllocCredentialId = await step(
        'Regulator self issue TN-Alloc credential',
        async () => {
            const result = await regAlloc1Client.credentials().issue({
                issuerName: regAlloc1Aid.name,
                recipient: regAlloc1Aid.prefix,
                registryId: regAllocRegistry.regk,
                schemaId: TN_ALLOC_SCHEMA_SAID,
                privacy: true,
                data: {
                    numbers: {
                        rangeStart: '+1801361000',
                        rangeEnd: '+1801361100',
                    },
                    channel: "voice",
                    doNotOriginate: false,
                    // // optional attributes
                    // startDate: "2024-12-25T20:20:39+00:00",
                    // endDate: "2024-11-29T20:20:39+00:00"
                },
                rules: Saider.saidify({
                    d: '',
                    perBrand: "Issuees agree not to share the phone number with other brands which may have a common owner but which will make it difficult to consistently identify the originator of traffic."
                })[1],
                // // // edge section is option, 
                source: undefined
                // source: Saider.saidify({
                //     d: '',
                //     // tnalloc: {
                //     //     n: tnAllocCredential.sad.d,
                //     //     s: tnAllocCredential.sad.s,
                //     // },
                //     // issuer: {
                //     //     n: leCredential.sad.d,
                //     //     s: leCredential.sad.s,
                //     // },
                // })[1],
            });

            await waitOperation(regAlloc1Client, result.op);
            return result.acdc.ked.d;
        }
    );

    const shellLeCredentialId = await step(
        'QVI create Shell LE credential',
        async () => {
            const qviCredential = await qviClient
                .credentials()
                .get(qviCredentialId);

            const result = await qviClient.credentials().issue({
                issuerName: qviAid.name,
                recipient: shellLeAid.prefix,
                registryId: qviRegistry.regk,
                schemaId: LE_SCHEMA_SAID,
                data: {
                    LEI: '549300QME1XNVC6ESHEL',
                },
                rules: Saider.saidify({
                    d: '',
                    usageDisclaimer: {
                        l: 'Usage of a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, does not assert that the Legal Entity is trustworthy, honest, reputable in its business dealings, safe to do business with, or compliant with any laws or that an implied or expressly intended purpose will be fulfilled.',
                    },
                    issuanceDisclaimer: {
                        l: 'All information in a valid, unexpired, and non-revoked vLEI Credential, as defined in the associated Ecosystem Governance Framework, is accurate as of the date the validation process was complete. The vLEI Credential has been issued to the legal entity or person named in the vLEI Credential as the subject; and the qualified vLEI Issuer exercised reasonable care to perform the validation process set forth in the vLEI Ecosystem Governance Framework.',
                    },
                })[1],
                source: Saider.saidify({
                    d: '',
                    qvi: {
                        n: qviCredential.sad.d,
                        s: qviCredential.sad.s,
                    },
                })[1],
            });

            await waitOperation(qviClient, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Shell LE credential IPEX grant by qvi', async () => {
        const dt = createTimestamp();
        const leCredential = await qviClient
            .credentials()
            .get(shellLeCredentialId);
        assert(leCredential !== undefined);

        const [grant, gsigs, gend] = await qviClient.ipex().grant({
            senderName: qviAid.name,
            acdc: new Serder(leCredential.sad),
            anc: new Serder(leCredential.anc),
            iss: new Serder(leCredential.iss),
            ancAttachment: leCredential.ancAttachment,
            recipient: shellLeAid.prefix,
            datetime: dt,
        });

        let op = await qviClient
            .ipex()
            .submitGrant(qviAid.name, grant, gsigs, gend, [
                shellLeAid.prefix,
            ]);
        await waitOperation(qviClient, op);
    });

    await step('Shell Legal Entity IPEX admit', async () => {
        const notifications = await waitForNotifications(
            shellLar1Client,
            '/exn/ipex/grant'
        );
        const grantNotification = notifications[0];

        const [admit, sigs, aend] = await shellLar1Client
            .ipex()
            .admit(
                shellLeAid.name,
                '',
                grantNotification.a.d!,
                createTimestamp()
            );

        let op = await shellLar1Client
            .ipex()
            .submitAdmit(shellLeAid.name, admit, sigs, aend, [
                qviAid.prefix,
            ]);
        await waitOperation(shellLar1Client, op);

        await markAndRemoveNotification(shellLar1Client, grantNotification);
    });

    await step('Shell Legal Entity has LE credential', async () => {
        const legalEntityCredential = await retry(async () =>
            shellLar1Client.credentials().get(shellLeCredentialId)
        );

        assert.equal(legalEntityCredential.sad.s, LE_SCHEMA_SAID);
        assert.equal(legalEntityCredential.sad.i, qviAid.prefix);
        assert.equal(legalEntityCredential.sad.a.i, shellLeAid.prefix);
    });

    await step('Create Shell Alloctor multisig aid', async () => {

        let shellAlloc1localAid = await shellAlloc1Client.identifiers().get(shellAlloc1Aid.name)
        let shellAllocAidOp = await startMultisigIncept(shellAlloc1Client, {
            groupName: shellAllocAidAlias,
            localMemberName: shellAlloc1Aid.name,
            participants: [shellAlloc1Aid.prefix],
            isith: ["1"],
            nsith: ["1"],
            toad: shellAlloc1localAid.state.b.length,
            wits: shellAlloc1localAid.state.b,
        });
        console.log(
            'Shell Alloctor 1 initiated multisig, waiting for others to join...'
        );
        shellAllocAidOp = await waitOperation(shellAlloc1Client, shellAllocAidOp);

        shellAllocAid = await shellAlloc1Client.identifiers().get(shellAllocAidAlias)
        shellAlloc1localAid = await shellAlloc1Client.identifiers().get(shellAlloc1Aid.name)
        const members = await shellAlloc1Client.identifiers().members(shellAllocAidAlias);
        const signing = members['signing']
        const filteredMembers = await filterAuthSigningMembers(signing)
        let mEids: string[] = []
        for (let m = 0; m < filteredMembers.length; m++) {
            if (filteredMembers[m].ends?.agent) {
                let eid = Object.keys(filteredMembers[m].ends.agent)[0]
                mEids.push(eid)
            }
        }
        let endRoleRes = await multisigAddEndRole(
            shellAlloc1Client,
            shellAllocAidAlias,
            mEids[0],
            shellAllocAid,
            shellAlloc1localAid,
            filteredMembers
        )
        let roleOp = await endRoleRes.op()
        roleOp = await waitOperation(shellAlloc1Client, roleOp);

        const oobisRes = await shellAlloc1Client.oobis().get(shellAllocAidAlias, 'agent');
        shellAllocAidOobi = oobisRes.oobis[0].split('/agent/')[0];

        let shellAllocIcpResult = await multisigCreateRegistry(
            shellAlloc1Client,
            shellAllocAidAlias,
            shellAlloc1Aid.name
        )

        console.log(
            `Initiated credential registry creation for shell Alloc identifier ${shellAllocAidAlias}. Waiting for other group members to join.`
        )

        const op = await shellAllocIcpResult.op();
        await waitOperation(shellAlloc1Client, op);

        return { shellAllocAid, shellAllocAidOobi };
    });

    await step('Resolve Shell Alloctor aid oobi', async () => {
        getOrCreateContact(regLar1Client, shellAllocAidAlias, shellAllocAidOobi),
            getOrCreateContact(regAlloc1Client, shellAllocAidAlias, shellAllocAidOobi),
            getOrCreateContact(shellLar1Client, shellAllocAidAlias, shellAllocAidOobi),
            getOrCreateContact(shellDelSigClient, shellAllocAidAlias, shellAllocAidOobi)
        await new Promise((resolve) => setTimeout(resolve, 3000));
    });

    const shellGroupAuthCredentialId = await step(
        'Shell LARs create Shell allocator-group-auth credential',
        async () => {
            const shellLeCredential = await shellLar1Client
                .credentials()
                .get(shellLeCredentialId);

            let shellLeRegistries = await shellLar1Client.registries().list(shellLeAid.name);
            let shellLeRegistry: { name: string; regk: string } = shellLeRegistries[0];

            const result = await shellLar1Client.credentials().issue({
                issuerName: shellLeAid.name,
                recipient: shellAllocAid.prefix,
                registryId: shellLeRegistry.regk,
                schemaId: GCD_SCHEMA_SAID,
                privacy: true,      // // as nonce "u" is optional, if not provided, it will be considered as false
                data: {
                    role: "TN Allocator",
                    c_goal: [
                        "ops.it.telco.tnalloc"
                    ],
                    c_pgeo: [
                        "US-CA",
                        "GB-ENG",
                        "FR",
                    ],
                    c_rgeo: [
                        "US-CA",
                        "GB-ENG",
                        "FR",
                    ],
                    c_proto: [
                        "ipex:issuer,issuee"
                    ],
                    c_human: "",
                    c_after: "2024-12-17T10:39:29.769000+00:00",
                    c_before: "2025-12-17T10:39:29.769000+00:00"
                },
                rules: Saider.saidify({
                    d: '',
                    noRoleSemanticsWithoutGfw: "All parties agree that the role field has no enforceable semantics unless the gfw field is also defined, and its rules formally describe what the role means.",
                    issuerNotResponsibleOutsideConstraints: "Although verifiers set their own standards for verification, verifiers and issuees/delegates agree that they cannot not use this credential as proof that delegator has the right to exercise delegated authority under conditions when the constraints say otherwise.",
                    noConstraintSansPrefix: "Issuers agree that constraints exist only in fields with the c_ prefix, or in the role field with gfw defined. This allows verifiers to know with confidence whether all constraints have been satisfied, even if they do not understand some custom fields that lack the prefix.",
                    useStdIfPossible: "Issuers agree that if it is reasonable to express a constraint in one of the pre-defined ways, they will do so, rather than expressing the constraint in a note or in a custom field. This allows verifiers to be confident that when one of the pre-defined constraints is absent, delegated authority is unconstrained in its corresponding dimension.",
                    onlyDelegateHeldAuthority: "Issuers agree to only delegate authority that they reasonably believe they hold. Whether they do in fact hold that authority is still a matter for verifiers to evaluate (e.g., via edges or separate proving interactions), but this rule creates a modest accountability for data quality."
                })[1],
                source: Saider.saidify({
                    d: '',
                    issuer: {
                        n: shellLeCredential.sad.d,
                        s: shellLeCredential.sad.s,
                        o: 'I2I'
                    },
                })[1]
            });

            console.log("Shell Allocator-group-authz credential: ", result)

            await waitOperation(shellLar1Client, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Shell allocator-group-auth credential IPEX grant by LARs', async () => {
        const dt = createTimestamp();
        const shellAllocGroupAuthCredential = await shellLar1Client
            .credentials()
            .get(shellGroupAuthCredentialId);
        assert(shellAllocGroupAuthCredential !== undefined);

        const [grant, gsigs, gend] = await shellLar1Client.ipex().grant({
            senderName: shellLeAid.name,
            acdc: new Serder(shellAllocGroupAuthCredential.sad),
            anc: new Serder(shellAllocGroupAuthCredential.anc),
            iss: new Serder(shellAllocGroupAuthCredential.iss),
            ancAttachment: shellAllocGroupAuthCredential.ancAttachment,
            recipient: shellAllocAid.prefix,
            datetime: dt,
        });

        let op = await shellLar1Client
            .ipex()
            .submitGrant(shellLeAid.name, grant, gsigs, gend, [
                shellAllocAid.prefix,
            ]);
        await waitOperation(shellLar1Client, op);
    });

    await step('Shell alloctor-group-auth credential IPEX admit by allocator', async () => {
        const notifications = await waitForNotifications(
            shellAlloc1Client,
            '/exn/ipex/grant'
        );
        const grantNotification = notifications[0];

        const [admit, sigs, aend] = await shellAlloc1Client
            .ipex()
            .admit(
                shellAllocAid.name,
                '',
                grantNotification.a.d!,
                createTimestamp()
            );

        let op = await shellAlloc1Client
            .ipex()
            .submitAdmit(shellAllocAid.name, admit, sigs, aend, [
                shellLeAid.prefix,
            ]);
        await waitOperation(shellAlloc1Client, op);

        await markAndRemoveNotification(shellAlloc1Client, grantNotification);
    });

    await step('Shell Allocator has allocator-group-auth credential', async () => {
        const allocGroupAuthCredential = await retry(async () =>
            shellAlloc1Client.credentials().get(shellGroupAuthCredentialId)
        );
        console.log("Shell allocator-group-auth credential: ", JSON.stringify(allocGroupAuthCredential))

        assert.equal(allocGroupAuthCredential.sad.s, GCD_SCHEMA_SAID);
        assert.equal(allocGroupAuthCredential.sad.i, shellLeAid.prefix);
        assert.equal(allocGroupAuthCredential.sad.a.i, shellAllocAid.prefix);
    });

    const shellTnCredentialId = await step(
        'Regulator create Shell TN-Alloc credential',
        async () => {
            const regLeCredential = await regLar1Client
                .credentials()
                .get(regLeCredentialId);
            const regTnAllocCredential = await regAlloc1Client
                .credentials()
                .get(regTnAllocCredentialId);

            let regAlloc1Registries = await regAlloc1Client.registries().list(regAlloc1Aid.name);
            let regAlloc1Registry: { name: string; regk: string } = regAlloc1Registries[0];

            const result = await regAlloc1Client.credentials().issue({
                issuerName: regAlloc1Aid.name,
                recipient: shellAllocAid.prefix,
                registryId: regAlloc1Registry.regk,
                schemaId: TN_ALLOC_SCHEMA_SAID,
                privacy: true,
                data: {
                    numbers: {
                        rangeStart: '+1801361002',
                        rangeEnd: '+1801361009',
                    },
                    channel: "voice",
                    doNotOriginate: false,
                    // // optional attributes
                    // startDate: "2024-12-25T20:20:39+00:00",
                    // endDate: "2024-11-29T20:20:39+00:00"
                },
                rules: Saider.saidify({
                    d: '',
                    perBrand: "Issuees agree not to share the phone number with other brands which may have a common owner but which will make it difficult to consistently identify the originator of traffic."
                })[1],
                source: Saider.saidify({
                    d: '',
                    tnalloc: {
                        n: regTnAllocCredential.sad.d,
                        s: regTnAllocCredential.sad.s,
                        o: 'I2I'
                    },
                })[1],
            });

            await waitOperation(regAlloc1Client, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Shell TN-Allocation credential IPEX grant by regulator', async () => {
        const dt = createTimestamp();
        const shellTnCredential = await regAlloc1Client
            .credentials()
            .get(shellTnCredentialId);
        assert(shellTnCredential !== undefined);

        const [grant, gsigs, gend] = await regAlloc1Client.ipex().grant({
            senderName: regAlloc1Aid.name,
            acdc: new Serder(shellTnCredential.sad),
            anc: new Serder(shellTnCredential.anc),
            iss: new Serder(shellTnCredential.iss),
            ancAttachment: shellTnCredential.ancAttachment,
            recipient: shellAllocAid.prefix,
            datetime: dt,
        });

        let op = await regAlloc1Client
            .ipex()
            .submitGrant(regAlloc1Aid.name, grant, gsigs, gend, [
                shellAllocAid.prefix,
            ]);
        await waitOperation(regAlloc1Client, op);
    });

    await step('Shell TN-Allocation credential IPEX admit by allocator', async () => {
        const notifications = await waitForNotifications(
            shellAlloc1Client,
            '/exn/ipex/grant'
        );
        const grantNotification = notifications[0];

        const [admit, sigs, aend] = await shellAlloc1Client
            .ipex()
            .admit(
                shellAllocAid.name,
                '',
                grantNotification.a.d!,
                createTimestamp()
            );

        let op = await shellAlloc1Client
            .ipex()
            .submitAdmit(shellAllocAid.name, admit, sigs, aend, [
                regAlloc1Aid.prefix,
            ]);
        await waitOperation(shellAlloc1Client, op);

        await markAndRemoveNotification(shellAlloc1Client, grantNotification);
    });

    await step('Shell Allocator has TN credential', async () => {
        const tnCredential = await retry(async () =>
            shellAlloc1Client.credentials().get(shellTnCredentialId)
        );
        console.log("Shell TN credential: ", JSON.stringify(tnCredential))

        assert.equal(tnCredential.sad.s, TN_ALLOC_SCHEMA_SAID);
        assert.equal(tnCredential.sad.i, regAlloc1Aid.prefix);
        assert.equal(tnCredential.sad.a.i, shellAllocAid.prefix);
    });

    const shellDelegSignerCredentialId = await step(
        'Shell allocator create delegated-signer credential',
        async () => {
            // const shellLeCredential = await shellLar1Client
            //     .credentials()
            //     .get(shellLeCredentialId);

            let shellAllocRegistries = await shellAlloc1Client.registries().list(shellAllocAid.name);
            let shellAllocRegistry: { name: string; regk: string } = shellAllocRegistries[0];

            const result = await shellAlloc1Client.credentials().issue({
                issuerName: shellAllocAid.name,
                recipient: shellDelSigAid.prefix,
                registryId: shellAllocRegistry.regk,
                schemaId: GCD_SCHEMA_SAID,
                privacy: false,     // // as nonce "u" is optional, if not provided, it will be considered as false
                data: {
                    role: "Delegated Voice Call Signer",
                    c_goal: [
                        "ops.it.telco.send.sign"
                    ],
                    c_pgeo: [
                        "US-CA",
                        "GB-ENG",
                        "FR",
                    ],
                    c_rgeo: [
                        "US-CA",
                        "GB-ENG",
                        "FR",
                    ],
                    c_proto: [
                        "vvp:op"
                    ],
                    c_human: "",
                    c_after: "2024-12-17T10:39:29.769000+00:00",
                    c_before: "2025-12-17T10:39:29.769000+00:00"
                },
                rules: Saider.saidify({
                    d: '',
                    noRoleSemanticsWithoutGfw: "All parties agree that the role field has no enforceable semantics unless the gfw field is also defined, and its rules formally describe what the role means.",
                    issuerNotResponsibleOutsideConstraints: "Although verifiers set their own standards for verification, verifiers and issuees/delegates agree that they cannot not use this credential as proof that delegator has the right to exercise delegated authority under conditions when the constraints say otherwise.",
                    noConstraintSansPrefix: "Issuers agree that constraints exist only in fields with the c_ prefix, or in the role field with gfw defined. This allows verifiers to know with confidence whether all constraints have been satisfied, even if they do not understand some custom fields that lack the prefix.",
                    useStdIfPossible: "Issuers agree that if it is reasonable to express a constraint in one of the pre-defined ways, they will do so, rather than expressing the constraint in a note or in a custom field. This allows verifiers to be confident that when one of the pre-defined constraints is absent, delegated authority is unconstrained in its corresponding dimension.",
                    onlyDelegateHeldAuthority: "Issuers agree to only delegate authority that they reasonably believe they hold. Whether they do in fact hold that authority is still a matter for verifiers to evaluate (e.g., via edges or separate proving interactions), but this rule creates a modest accountability for data quality."
                })[1],
                // source: Saider.saidify({
                //     d: '',
                //     le: {
                //         n: shellLeCredential.sad.d,
                //         s: shellLeCredential.sad.s,
                //     },
                // })[1],
            });
            await waitOperation(shellAlloc1Client, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Shell delegated signer credential IPEX grant by allocator', async () => {
        const dt = createTimestamp();
        const shellDelegSignerCredential = await shellAlloc1Client
            .credentials()
            .get(shellDelegSignerCredentialId);
        assert(shellDelegSignerCredential !== undefined);

        const [grant, gsigs, gend] = await shellAlloc1Client.ipex().grant({
            senderName: shellAllocAid.name,
            acdc: new Serder(shellDelegSignerCredential.sad),
            anc: new Serder(shellDelegSignerCredential.anc),
            iss: new Serder(shellDelegSignerCredential.iss),
            ancAttachment: shellDelegSignerCredential.ancAttachment,
            recipient: shellDelSigAid.prefix,
            datetime: dt,
        });

        let op = await shellAlloc1Client
            .ipex()
            .submitGrant(shellAllocAid.name, grant, gsigs, gend, [
                shellDelSigAid.prefix,
            ]);
        await waitOperation(shellAlloc1Client, op);

        const delegSignerCredential = await retry(async () =>
            shellAlloc1Client.credentials().get(shellDelegSignerCredentialId)
        );
        console.log("Shell delegated signer credential: ", JSON.stringify(delegSignerCredential))
    });

    const shellDossierCredentialId = await step(
        'Shell allocator create dossier credential',
        async () => {
            const shellGroupAuthCredential = await shellAlloc1Client
                .credentials()
                .get(shellGroupAuthCredentialId);
            const shellTnCredential = await shellAlloc1Client
                .credentials()
                .get(shellTnCredentialId);
            const shellDelegSignerCredential = await shellAlloc1Client
                .credentials()
                .get(shellDelegSignerCredentialId);
            const shellLeCredential = await shellAlloc1Client
                .credentials()
                .get(shellLeCredentialId);

            let shellAllocRegistries = await shellAlloc1Client.registries().list(shellAllocAid.name);
            let shellAllocRegistry: { name: string; regk: string } = shellAllocRegistries[0];

            const result = await shellAlloc1Client.credentials().issue({
                issuerName: shellAllocAid.name,
                registryId: shellAllocRegistry.regk,
                schemaId: VVP_DOSSIER_SCHEMA_SAID,
                data: {
                },
                rules: undefined,
                source: Saider.saidify({
                    d: '',
                    vetting: {
                        n: shellLeCredential.sad.d,
                        s: shellLeCredential.sad.s,
                        o: 'NI2I'
                    },
                    alloc: {
                        n: shellGroupAuthCredential.sad.d,
                        s: shellGroupAuthCredential.sad.s,
                        o: 'I2I'
                    },
                    tnalloc: {
                        n: shellTnCredential.sad.d,
                        s: shellTnCredential.sad.s,
                        o: 'I2I'
                    },
                    delsig: {
                        n: shellDelegSignerCredential.sad.d,
                        s: shellDelegSignerCredential.sad.s,
                        o: 'NI2I'
                    },
                })[1]
            });

            console.log("Shell allocator created dossier credential: ", result)

            await waitOperation(shellAlloc1Client, result.op);
            return result.acdc.ked.d;
        }
    );

    await step('Shell has dossier credential', async () => {
        const dossierCredential = await retry(async () =>
            shellAlloc1Client.credentials().get(shellDossierCredentialId)
        );
        console.log("Shell dossier credential: ", JSON.stringify(dossierCredential))
    });


}, 90000);


async function getStates(client: SignifyClient, prefixes: string[]) {
    const participantStates = await Promise.all(
        prefixes.map((p) => client.keyStates().get(p))
    );
    return participantStates.map((s) => s[0]);
}

export async function startMultisigIncept(
    client: SignifyClient,
    {
        groupName,
        localMemberName,
        participants,
        ...args
    }: StartMultisigInceptArgs
) {
    const aid1 = await client.identifiers().get(localMemberName);
    const participantStates = await getStates(client, participants);
    const icpResult1 = await client.identifiers().create(groupName, {
        algo: Algos.group,
        mhab: aid1,
        isith: args.isith,
        nsith: args.nsith,
        toad: args.toad,
        wits: args.wits,
        delpre: args.delpre,
        states: participantStates,
        rstates: participantStates,
    });
    const op1 = await icpResult1.op();
    const serder = icpResult1.serder;

    const sigs = icpResult1.sigs;
    const sigers = sigs.map((sig) => new Siger({ qb64: sig }));
    const ims = d(messagize(serder, sigers));
    const atc = ims.substring(serder.size);
    const embeds = {
        icp: [serder, atc],
    };

    const smids = participantStates.map((state) => state['i']);

    let recp = []
    for (let indx = 0; indx < participantStates.length; indx++) {
        if (participantStates[indx].i === aid1.prefix) {
            continue
        }
        recp.push(participantStates[indx].i)
    }
    if (recp.length > 0) {
        await client
            .exchanges()
            .send(
                aid1.name,
                'multisig',
                aid1,
                '/multisig/icp',
                { gid: serder.pre, smids: smids, rmids: smids },
                embeds,
                participants
            );
    }
    return op1;
}

export async function multisigAddEndRole(
    client: SignifyClient,
    groupName: string,
    eid: string,
    gHab: any,
    mHab: any,
    members: any
) {
    console.log(`Initiating adding end role auth for multisig aid`, groupName)

    let stamp = new Date().toISOString().replace('Z', '000+00:00')

    let endRoleRes = await client
        .identifiers()
        .addEndRole(groupName, 'agent', eid, stamp)

    let rpy = endRoleRes.serder
    let sigs = endRoleRes.sigs
    let ghabState = gHab['state']
    let sner = new CesrNumber({}, undefined, ghabState['ee']['s'])
    let seal = [
        'SealEvent',
        { i: gHab['prefix'], s: sner.num, d: ghabState['ee']['d'] }
    ]
    let sigers = sigs.map((sig: any) => new signify.Siger({ qb64: sig }))
    let roleims = signify.d(
        signify.messagize(rpy, sigers, seal, undefined, undefined, false)
    )
    let atc = roleims.substring(rpy.size)
    let roleembeds = {
        rpy: [rpy, atc]
    }

    const recipients = members
        .map((m: { aid: string }) => m.aid)
        .filter((aid: string) => aid !== mHab.prefix)

    if (recipients.length > 0) {
        console.log(
            `Sending join end role auth exn message to other members : `,
            recipients
        )

        await client
            .exchanges()
            .send(
                mHab.name,
                'multisig',
                mHab,
                '/multisig/rpy',
                { gid: gHab['prefix'] },
                roleembeds,
                recipients
            )
    }
    return endRoleRes
}

export async function multisigCreateRegistry(
    client: SignifyClient,
    groupName: string,
    memberName: string
) {
    console.log(`Starting create registry for identifier ${groupName}`)
    const gHab = await client.identifiers().get(groupName)

    memberName = memberName ? memberName : gHab?.group?.mhab?.name
    const mHab = await client.identifiers().get(memberName)
    const members = await client.identifiers().members(groupName)

    let aid = gHab['prefix']

    let nonce = randomNonce()
    let vcpRes = await client.registries().create({
        name: groupName,
        registryName: `${groupName}-reg`,
        nonce: nonce
    })
    let serder = vcpRes.regser
    let anc = vcpRes.serder
    let sigs = vcpRes.sigs

    let sigers = sigs.map((sig: any) => new signify.Siger({ qb64: sig }))

    let ims = signify.d(signify.messagize(anc, sigers))
    let atc = ims.substring(anc.size)
    let regbeds = {
        vcp: [serder, ''],
        anc: [anc, atc]
    }

    const recipients = members.signing
        .map((m: { aid: string }) => m.aid)
        .filter((aid: string) => aid !== mHab.prefix)

    if (recipients.length > 0) {
        console.log(
            `Sending join registry inception exn message to other members : `,
            recipients
        )
        await client
            .exchanges()
            .send(
                mHab.name,
                'registry',
                mHab,
                '/multisig/vcp',
                { gid: aid, usage: 'Issue vLEIs' },
                regbeds,
                recipients
            )
    }
    return vcpRes
}

export const filterAuthSigningMembers = async (signingMembers: any[]) => {
    const members = signingMembers
        .map((m: { aid: string; ends: { agent: any; witness: any } }) => m)
        .filter((m: { aid: string; ends: { agent: any; witness: any } }) =>
            hasKey(m.ends, 'agent')
        )

    return members
}

export const hasKey = <T>(obj: T, key: keyof any): boolean => {
    if (obj === null || obj === undefined) {
        return false
    }

    if (typeof obj !== 'object' || Array.isArray(obj)) {
        return false
    }

    return key in obj
}
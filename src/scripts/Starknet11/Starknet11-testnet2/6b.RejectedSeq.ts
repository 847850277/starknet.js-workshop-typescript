// test in testnet2/Sequencer a contract that can be rejected.
// launch with npx ts-node src/scripts/cairo11-testnet2/6b.RejectedSeq.ts
// Coded with Starknet.js v5.19.0

import { constants, Provider, Contract, Account, json, shortString, RpcProvider } from "starknet";
import fs from "fs";
import { account1Testnet2ArgentXAddress, account1Testnet2ArgentXprivateKey, TonyNode } from "../../A2priv/A2priv";
import { infuraKey } from "../../A-MainPriv/mainPriv";

function wait(delay: number) {
    return new Promise((res) => {
        setTimeout(res, delay);
    });
}

async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI2 } });

    // initialize existing Argent X account
    const account0Address = account1Testnet2ArgentXAddress;
    console.log('existing_ACCOUNT_ADDRESS=', account0Address);
    const account0 = new Account(provider, account0Address, account1Testnet2ArgentXprivateKey);
    console.log('existing account connected.\n');

    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/reject.sierra.json").toString("ascii"));

    const contractAddress = "0x2b8a9002121875e6ce75f3ea30b8df471c93e8466983226473b3b63a355628a";
    const myTestContract = new Contract(compiledSierra.abi, contractAddress, provider);
    myTestContract.connect(account0);
    console.log('✅ Test Contract connected =', myTestContract.address);

    const count1 = await myTestContract.get_counter();
    console.log("counter =", count1);

    const { transaction_hash: txH2 } = await myTestContract.invoke("test_fail", [100], { maxFee: 1000000000000000 });
    console.log("txH2 =", txH2);
    for (let i = 0; i < 15; i++) {
        let txR: any;
        txR = await provider.getTransactionReceipt(txH2) 
        
            console.log("txR: execution =", txR.status, ",", txR.finality_status);
            
        await wait(200);
    }
    const txR2 = await provider.waitForTransaction(txH2);
    console.log("txR2 =", txR2);

    const count2 = await myTestContract.get_counter();
    console.log("counter =", count2);

    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// Connect a predeployed OZ account in devnet. 
// address and PrivKey are displayed when lanching starknet-devnet, and have been  stored in .env file.
// launch with npx ts-node src/scripts/13.signer.ts

import { Account, ec, hash, Provider, number, json, Contract, encode, Signature, typedData } from "starknet";
import * as dotenv from "dotenv";
import fs from "fs";
import { BigNumberish } from "starknet/src/utils/number";
import BN from "bn.js";
dotenv.config();

//    👇👇👇
// 🚨 launch 'starknet-devnet --seed 0' before using this script
//    👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (process.env.STARKNET_PROVIDER_BASE_URL != "http://127.0.0.1:5050") {
        console.log("This script work only on local devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });
    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const starkKeyPair0 = ec.getKeyPair(privateKey0);
    const accountAddress: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account = new Account(provider, accountAddress, starkKeyPair0);
    console.log('✅ OZ predeployed account 0 connected.');

    // creation of message signature
    //const privateKey = stark.randomAddress();
    const privateKey = privateKey0;
    const starkKeyPair = ec.getKeyPair(privateKey);
    const message: BigNumberish[] = [1, 128, 18, 14];
    const msgHash = hash.computeHashOnElements(message);
    const signature = ec.sign(starkKeyPair, msgHash);
    const starknetPublicKey = ec.getStarkKey(starkKeyPair);
    const fullPublicKey = encode.addHexPrefix(starkKeyPair.getPublic("hex"));
    console.log("     publicKey calculated =", starknetPublicKey, typeof (starknetPublicKey));
    console.log("full publicKey calculated =", fullPublicKey, typeof (fullPublicKey));

    // EIP712
    const typedDataValidate: typedData.TypedData = {
        types: {
            StarkNetDomain: [
                { name: 'name', type: 'string' },
                { name: 'version', type: 'felt' },
                { name: 'chainId', type: 'felt' },
                { name: 'verifyingContract', type: 'felt' },
            ],
            Validate: [
                { name: 'from', type: 'felt' },
                { name: 'starknetAddress', type: 'felt' },
                { name: 'yourSelection', type: 'felt' },
            ],
        },
        primaryType: 'Validate',
        domain: {
            name: 'Confirm the address',
            version: '1',
            chainId: "0x534e5f474f45524c49",
            verifyingContract: '0xCcCCccccCCCCcCCCCCCcCcCccCcCCCcCcccccccC',
        },
        message: {
            from: '0xCD2a3d9F938E13CD947Ec05AbC7FE734Df8DD826',
            starknetAddress: "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a",
            yourSelection: "4",
        },
    };
    const signature4 = await account.signMessage(typedDataValidate);

    // on receiver side, with account (that needs privKey)
    const result4 = await account.verifyMessage(typedDataValidate, signature4);
    console.log("Result4 (boolean)=", result4);

    // on receiver side, without account  (so, without privKey)
    const compiledAccount = json.parse(fs.readFileSync("./compiledContracts/Account_0_5_1.json").toString("ascii"));
    const contractAccount = new Contract(compiledAccount.abi, accountAddress, provider);

    const msgHash5 = typedData.getMessageHash(typedDataValidate, account.address);
    // The call of isValidSignature will generate an error if not valid
    let result5: boolean;
    try {
        await contractAccount.call("isValidSignature", [msgHash5, signature4]);
        result5 = true;
    } catch {
        result5 = false;
    }
    console.log("Result5 (boolean) =", result5);


    // // verify message outside of StarkNet
    // console.log("Outside Starknet =");
    // const starkKeyPair1 = ec.getKeyPairFromPublicKey(fullPublicKey);
    // const msgHash1 = hash.computeHashOnElements(message);
    // const result1 = ec.verify(starkKeyPair1, msgHash1, signature);
    // console.log("Result (boolean) =", result1);

    // // verify message in the network, using the account linked to the privatekey
    // console.log("With Starknet =");
    // const compiledAccount = json.parse(fs.readFileSync("./compiledContracts/Account_0_5_1.json").toString("ascii"));
    // const contractAccount = new Contract(compiledAccount.abi, accountAddress, provider);
    // const msgHash2 = hash.computeHashOnElements(message);
    // // The call of isValidSignature will generate an error if not valid
    // let result2: boolean;
    // try {
    //     await contractAccount.call("isValidSignature", [msgHash2, signature]);
    //     result2 = true;
    // } catch {
    //     result2 = false;
    // }
    // console.log("Result (boolean) =", result2);

    // check fullPubKey
    // console.log("full pub key check with account =");
    // const pubKey3 = await contractAccount.call("getPublicKey");
    // const isFullPubKeyRelatedToAccount: boolean =
    //     BigInt(pubKey3.publicKey.toString()) ==
    //     BigInt(encode.addHexPrefix(fullPublicKey.slice(4, 68)));
    // console.log("Result (boolean)=", isFullPubKeyRelatedToAccount);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
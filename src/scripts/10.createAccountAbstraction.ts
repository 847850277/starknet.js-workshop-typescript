// create a new abstracted account in devnet
// launch with npx ts-node src/scripts/10.createAccountAbstraction.ts
// Coded with Starknet.js v5.11.1

import { Account, ec, json, stark, Provider, hash, CallData } from "starknet";
import fs from "fs";
import axios from "axios";
import * as dotenv from "dotenv";
dotenv.config();


//        👇👇👇
// 🚨🚨🚨 launch 'starknet-devnet --seed 0' before using this script
//        👆👆👆
async function main() {
    //initialize Provider with DEVNET, reading .env file
    if (process.env.STARKNET_PROVIDER_BASE_URL != "http://127.0.0.1:5050") {
        console.log("This script work only on local devnet.");
        process.exit(1);
    }
    const provider = new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });

    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // Connect existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT0_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT0_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey0 = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const account0Address: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, account0Address, privateKey0);
    console.log('OZ account0 connected.\n');


    // my customized account, with administrators :

    // Generate public and private key pair.
    const AAprivateKey = process.env.AA_NEW_ACCOUNT_PRIVKEY ?? "";
    // or for random private key :
    //const privateKey=stark.randomAddress() ;
    console.log('privateKey=', AAprivateKey);
    const AAstarkKeyPub = ec.starkCurve.getStarkKey(AAprivateKey);
    console.log('publicKey=', AAstarkKeyPub);
    //declare my wallet contract
    const compiledAAaccount = json.parse(
        fs.readFileSync("./compiledContracts/myAccountAbstraction.json").toString("ascii")
    );
//    const AAaccountClashHass = "0x1d926edb81b7ef0efcb67dd4558a6dffc2bf31a8bc9c3fe7832a5ec3d1b70da";
    const { transaction_hash: declTH, class_hash: decCH } = await account0.declare({ contract: compiledAAaccount });
    console.log('Customized account class hash =', decCH);
    await provider.waitForTransaction(declTH);

    // Calculate future address of the account
    const AAaccountConstructorCallData = CallData.compile({ super_admin_address: account0.address, publicKey: AAstarkKeyPub });
    const AAcontractAddress = hash.calculateContractAddressFromHash(AAstarkKeyPub, decCH, AAaccountConstructorCallData, 0);
    console.log('Precalculated account address=', AAcontractAddress);
    // fund account address before account creation
    const { data: answer } = await axios.post('http://127.0.0.1:5050/mint', { "address": AAcontractAddress, "amount": 50_000_000_000_000_000_000, "lite": true }, { headers: { "Content-Type": "application/json" } });
    console.log('Answer mint =', answer);
    // deploy account
    const AAaccount = new Account(provider, AAcontractAddress, AAprivateKey);
    const { transaction_hash, contract_address } = await AAaccount.deployAccount({ classHash: decCH, constructorCalldata: AAaccountConstructorCallData, addressSalt: AAstarkKeyPub }, { maxFee: 9000000000000000 });
    console.log('✅ New customized account created.\n   final address =', contract_address);
    await provider.waitForTransaction(transaction_hash);

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });


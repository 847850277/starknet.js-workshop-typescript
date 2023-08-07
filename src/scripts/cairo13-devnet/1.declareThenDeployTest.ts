// declare & deploy a Cairov2.1.0 contract.
// use Starknet.js v5.16+branch Calldata-result-in-populate, starknet-devnet 0.5.5
// launch with npx ts-node src/scripts/cairo13-devnet/1.declareThenDeployTest.ts

import { Provider, Account, Contract, json ,constants, GetTransactionReceiptResponse, InvokeFunctionResponse} from "starknet";
import fs from "fs";
import {accountTestnet4privateKey, accountTestnet4Address} from "../../A1priv/A1priv"
import * as dotenv from "dotenv";
import { resetDevnetNow } from "../resetDevnetFunc";
dotenv.config();

//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --cairo-compiler-manifest /D/Cairo1-dev/cairo/Cargo.toml' before using this script. cairo directory fetched to v2.1.0 rc0, then cargo build --release.
//          👆👆👆


async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
    console.log('✅ Connected to devnet.');
    // const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });

    resetDevnetNow();
    // initialize existing predeployed account 0 of Devnet
    const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    // const privateKey=accountTestnet4privateKey;
    // const accountAddress=accountTestnet4Address;
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    //console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);

    // Declare & deploy Test contract in devnet
    const compiledSierra = json.parse(fs.readFileSync("./compiledContracts/cairo210/PhilTest2.sierra.json").toString("ascii"));
    const compiledCasm = json.parse(fs.readFileSync("./compiledContracts/cairo210/PhilTest2.casm.json").toString("ascii"));
    
    const declareResponse = await account0.declare({ contract: compiledSierra, casm: compiledCasm });
    const contractClassHash = declareResponse.class_hash;
    console.log('✅ Test Contract declared with classHash =', contractClassHash);
    // class hash = 0x6797fc142b0bb44ae96d0cf211fa739eeec950fbd249620da5ce62a9a28b579

    await provider.waitForTransaction(declareResponse.transaction_hash);
    
    const { transaction_hash: th2, address } = await account0.deployContract({ classHash: contractClassHash ,constructorCalldata:[100]});
    console.log("contract_address =", address);
    await provider.waitForTransaction(th2);

    // Connect the new contract instance :
    
        const myTestContract = new Contract(compiledSierra.abi, address, provider);
        myTestContract.connect(account0);
        console.log('✅ Test Contract connected at =', myTestContract.address);
        // testnet address = 
        const amount0=await myTestContract.get_counter();
        console.log("counter init =",amount0);
        const {transaction_hash:txh}=await myTestContract.increase_counter(10);
        await provider.waitForTransaction(txh);
        const amount1=await myTestContract.get_counter();
        console.log("counter final =",amount1);
    
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
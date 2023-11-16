// connect a contract that is already deployed on devnet.
// use Starknet.js v5.6.0, starknet-devnet 0.5.0
// launch with npx ts-node src/scripts/cairo11-devnet/11.CallInvokeContract.ts

import { CallData, Provider, Contract, Account, json, Call } from "starknet";
import fs from "fs";
import * as dotenv from "dotenv";
dotenv.config();


//          👇👇👇
// 🚨🚨🚨   Launch 'starknet-devnet --seed 0 --timeout 5000' before using this script.
//          Launch also the script for deployement of Test (script4).
//          👆👆👆
async function main() {
    //initialize Provider 
    const provider = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });
    console.log('✅ Connected to devnet.');

    // initialize existing predeployed account 0 of Devnet
    const privateKey = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('✅ Predeployed account connected\nOZ_ACCOUNT_ADDRESS=', account0.address);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', privateKey);


    // Connect the deployed Test instance in devnet
    const testAddress = "0x2321a88f22375650ebd214283d5f8d0db3494c2d127af9e063204a6c9fc4f9c";
    const compiledTest = json.parse(fs.readFileSync("./compiledContracts/test_type1.sierra").toString("ascii"));
    const myTestContract = new Contract(compiledTest.abi, testAddress, provider);
    myTestContract.connect(account0);

    console.log('Test Contract connected at =', myTestContract.address);

    // Interactions with the contract

    const balance0 = await myTestContract.get_balance();
    console.log("balance =", balance0);

    const tx1 = await myTestContract.increase_balance(100);
    const tx2 = await myTestContract["increase_balance"](100);
    const tx3 = await myTestContract.invoke("increase_balance",[100]);
    const tx4 = await account0.execute({contractAddress:testAddress, entrypoint: "increase_balance",calldata:{amount:100}});
    const tx5 = await account0.execute({contractAddress:testAddress, entrypoint: "increase_balance",calldata:[100]});
    const calldata5: Call = myTestContract.populate("increase_balance", [100]);
    const tx6 = await account0.execute(calldata5);
    const multicall:Call[]=[calldata5,calldata5];
    const tx7 = await account0.execute(multicall);
console.log("waiting approval")
    await provider.waitForTransaction(tx7.transaction_hash);
    const balance = await myTestContract.get_balance();
    console.log("balance (should be 800) =", balance);
    console.log('✅ Test completed.');

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
// Deploy and use an ERC20, monetized by an existing account
// use Starknet.js v5.9.1, starknet-devnet 0.5.1
// Launch with : npx ts-node src/starknet_jsExistingAccount.ts

import fs from "fs";
import { Account, Contract, defaultProvider, json, stark, Provider, shortString, uint256, CallData, RawArgs, Calldata, RawArgsArray, RawArgsObject, Call } from "starknet";
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
    const provider = process.env.STARKNET_PROVIDER_BASE_URL === undefined ?
        defaultProvider :
        new Provider({ sequencer: { baseUrl: process.env.STARKNET_PROVIDER_BASE_URL } });
    console.log('STARKNET_PROVIDER_BASE_URL=', process.env.STARKNET_PROVIDER_BASE_URL);

    // initialize existing predeployed account 0 of Devnet
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT0_DEVNET_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY);
    const privateKey = process.env.OZ_ACCOUNT0_DEVNET_PRIVATE_KEY ?? "";
    const accountAddress: string = process.env.OZ_ACCOUNT0_DEVNET_ADDRESS ?? "";
    const account0 = new Account(provider, accountAddress, privateKey);
    console.log('OZ account 0 connected.\n');

    // Deploy an ERC20 contract 
    console.log("Deployment Tx - ERC20 Contract to StarkNet...");

    // Constructor of the ERC20 Cairo 0 contract :
    // {
    //     "inputs": [
    //         {
    //             "name": "name",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "symbol",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "decimals",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "initial_supply",
    //             "type": "Uint256"
    //         },
    //         {
    //             "name": "recipient",
    //             "type": "felt"
    //         },
    //         {
    //             "name": "owner",
    //             "type": "felt"
    //         }
    //     ],
    //     "name": "constructor",
    //     "outputs": [],
    //     "type": "constructor"
    // },

    const compiledErc20mintable = json.parse(fs.readFileSync("compiledContracts/ERC20MintableOZ_0_6_1.json").toString("ascii"));
    const initialTk: uint256.Uint256 = uint256.bnToUint256(100);

    // define the constructor :

    // method 1 : lowest raw data : an array of numbers. Only for specific cases (ex : max performance needed) :
    const ERC20ConstructorCallData1: RawArgsArray = [ // accept only flatten objects
        'niceToken',
        'NIT',
        18,
        initialTk.low,initialTk.high, // 🚨 Uint256 and BigNumberish do not work (are not a flatten object of 2 elements)
        account0.address,
        account0.address
    ];

    // method 2 : with CallData.compile (to use in the rare case of no abi available). Each parameter has to be constructed properly, without starknet.js verification of conformity to abi :
    const ERC20ConstructorCallData2: Calldata = CallData.compile({
        name: 'niceToken',
        symbol: 'NIT',
        decimals: 18,
        initial_supply: initialTk, // needs a Uint256 type. '100n' is not accepted because no abi 
        recipient: account0.address,
        owner: account0.address
    });

    // method 3 : with RawArgsObject. Close to method 2 :
    const ERC20ConstructorCallData3: RawArgsObject = {
        name: "niceToken",
        symbol: "NIT",
        decimals: 18,
        initial_supply: initialTk, // needs a Uint256 type. '100n' is not accepted because no abi
        recipient: account0.address,
        owner: account0.address,
    }

    // method 4: recommended method : send an array of parameters. With the abi, starknet.js converts automatically the parameters to the types defined in the abi, and checks the conformity to the abi :
    const erc20CallData: CallData = new CallData(compiledErc20mintable.abi);
    const ERC20ConstructorCallData4: Calldata = erc20CallData.compile("constructor", [
        "niceToken",
        "NIT",
        18,
        initialTk, // needs a Uint256 type for Cairo 0 (with Cairo 1, '100n' is accepted)
        account0.address,
        account0.address
    ]);

    const ERC20ConstructorCallData = ERC20ConstructorCallData4;

    console.log("constructor=", ERC20ConstructorCallData);
    const deployERC20Response = await account0.declareAndDeploy({
        contract: compiledErc20mintable,
        constructorCalldata: ERC20ConstructorCallData
    });
    console.log("ERC20 declared hash: ", deployERC20Response.declare.class_hash);
    console.log("ERC20 deployed at address: ", deployERC20Response.deploy.contract_address);

    // Get the erc20 contract address
    const erc20Address = deployERC20Response.deploy.contract_address;
    // Create a new erc20 contract object
    const erc20 = new Contract(compiledErc20mintable.abi, erc20Address, provider);
    erc20.connect(account0);

    // Check balance - should be 100
    console.log(`Calling StarkNet for account balance...`);
    const balanceInitial = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", uint256.uint256ToBN(balanceInitial.balance).toString());

    // Mint 1000 tokens to account address
    const amountToMint = uint256.bnToUint256(1000);
    console.log("Invoke Tx - Minting 1000 tokens to account0...");
    const { transaction_hash: mintTxHash } = await erc20.mint(account0.address, amountToMint, { maxFee: 900_000_000_000_000 }); // with Cairo 1 contract, 'amountToMint' can be replaced by '100n'
    // Wait for the invoke transaction to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Minting...`);
    await provider.waitForTransaction(mintTxHash);
    // Check balance - should be 1100
    console.log(`Calling StarkNet for account balance...`);
    const balanceBeforeTransfer = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", uint256.uint256ToBN(balanceBeforeTransfer.balance).toString());

    // Execute tx transfer of 2x10 tokens, showing 2 ways to write data in Starknet
    console.log(`Invoke Tx - Transfer 2x10 tokens back to erc20 contract...`);
    const toTransferTk: uint256.Uint256 = uint256.bnToUint256(10);
    const transferCallData : Call = erc20.populate("transfer", [
        erc20Address,
        toTransferTk // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    ]);
    const { transaction_hash: transferTxHash } = await account0.execute(transferCallData, undefined, { maxFee: 900_000_000_000_000 });
    const { transaction_hash: transferTxHash2 } = await erc20.transfer(erc20Address, toTransferTk); // with Cairo 1 contract, 'toTransferTk' can be replaced by '10n'
    // Wait for the invoke transaction to be accepted on StarkNet
    console.log(`Waiting for Tx to be Accepted on Starknet - Transfer...`);
    await provider.waitForTransaction(transferTxHash2);
    // Check balance after transfer - should be 1080
    console.log(`Calling StarkNet for account balance...`);
    const balanceAfterTransfer = await erc20.balanceOf(account0.address);
    console.log("account0 has a balance of :", uint256.uint256ToBN(balanceAfterTransfer.balance).toString());
    console.log("✅ Test completed.");
}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
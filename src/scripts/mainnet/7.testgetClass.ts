// Connect to a Pathfinder Mainnet node
// Launch with npx ts-node src/scripts/mainnet/7.testgetClass.ts
// Coded with Starknet.js v5.13.0

import { Provider, RpcProvider, Contract, Account, json, uint256, Abi, constants, shortString, CompiledContract, ContractClass, RPC, SequencerProvider, } from "starknet";
import { accountMainnet4Address, accountMainnet4AddressprivateKey } from "../../A-MainPriv/mainPriv";
import { alchemyKey } from "../../A-MainPriv/mainPriv";
import { resetDevnetNow } from "../resetDevnetFunc";
import fs from "fs";
import axios from 'axios';
import * as dotenv from "dotenv";
dotenv.config();

async function main() {
    //initialize the Provider, with a rpc node 

    // const provider = new RpcProvider({ nodeUrl: 'https://starknet-mainnet.g.alchemy.com/v2/' + alchemyKey });
    // with a Provider object : 
    const providerMainnetRpc = new Provider({ rpc: { nodeUrl: 'http://192.168.1.99:9545' } });
    // on the same computer : const provider = new Provider({ rpc: { nodeUrl: 'http://127.0.0.1:9545' } });
    const providerMainnetSequencer = new SequencerProvider({ network: constants.NetworkName.SN_MAIN });
    // const provider = new Provider({ sequencer: { network: constants.NetworkName.SN_GOERLI } });
    const providerDevnet = new Provider({ sequencer: { baseUrl: "http://127.0.0.1:5050" } });

    const chainId = await providerMainnetRpc.getChainId();
    console.log('Connected to the local network node (Mainnet)=', chainId);

    // connect existing ArgentX account 4 in Mainnet
    const account4 = new Account(providerMainnetRpc, accountMainnet4Address, accountMainnet4AddressprivateKey);
    console.log('existing ArgentX account4 connected. Address =', account4.address, "\n");

    // connect account 0 in devnet
    const privateKey0 = "0xe3e70682c2094cac629f6fbed82c07cd";
    const accountAddress0: string = "0x7e00d496e324876bbc8531f2d9a82bf154d1a04a50218ee74cdd372f75a551a";
    const account0 = new Account(providerDevnet, accountAddress0, privateKey0);

    // console.log("text =", shortString.decodeShortString("0x6d696e74206c696d69742072656163686564"));

    // re-initialization of devnet
    await resetDevnetNow();
    // **************** Cairo 0 **************
    const addrErc20Cairo0 = "0x03d71989510013c4c4853a176325588bb84eaeb8886f032dd15d7ad2935a9e33";
    const classHashErc20Cairo0 = "0x00bbcdb339b2d436ddc8174c661cc6de29786f93e9d3b56a16bd658f306eb12a";
    const compiledContract0 = await providerMainnetRpc.getClassAt(addrErc20Cairo0);
    const compiledContract00 = await providerMainnetRpc.getClassByHash(classHashErc20Cairo0);
    fs.writeFileSync("./c0contract.json", json.stringify(compiledContract0, undefined, 2));
    const compiledC0 = json.parse(fs.readFileSync("./c0contract.json").toString("ascii"));
    const abi0 = compiledContract0.abi;
    // console.log("abi =", compiledC0.abi, "===")
   const deployResponse0 = await account0.declareAndDeploy({ contract: compiledC0 });
    const deployResponse00 = await account0.declare({ contract: compiledContract00  });

    const contractClassHash0 = deployResponse0.declare.class_hash;
    console.log('✅ Contract0 declared with classHash =', contractClassHash0);
    console.log("contract0_address =", deployResponse0.deploy.contract_address);
    await providerDevnet.waitForTransaction(deployResponse0.deploy.transaction_hash);

    // process.exit(4);

    // ***************Cairo 1 
    const addrErc20Cairo1 = "0x060cf64cf9edfc1b16ec903cee31a2c21680ee02fc778225dacee578c303806a";
    const classHashErc20Cairo1 = "0x021b9a01b8f17682f92c18ac4fa08ea90b371f07e27cd08de8451892546d341f";

    const compiledSierra1 = await providerMainnetRpc.getClassAt(addrErc20Cairo0); // with sequencer or rpc
    fs.writeFileSync("./c1_Sierra.json", json.stringify(compiledContract0, undefined, 2));
    const compiledCasm1 = await providerMainnetSequencer.getCompiledClassByClassHash(classHashErc20Cairo1); // only with a sequencer
    fs.writeFileSync("./c1_Casm.json", json.stringify(compiledCasm1, undefined, 2));

    const compiledC1 = json.parse(fs.readFileSync("./c1Sierra.json").toString("ascii"));
    // const abi0:Abi=compiledContract0.abi as Abi;
    console.log("abi =", compiledSierra1.abi, "===")
    const deployResponse1 = await account0.declareAndDeploy({ contract: compiledSierra1,casm: compiledCasm1 });

    const contractClassHash1 = deployResponse1.declare.class_hash;
    console.log('✅ Contract1 declared with classHash =', contractClassHash1);
    console.log("contract1_address =", deployResponse1.deploy.contract_address);
    await providerDevnet.waitForTransaction(deployResponse1.deploy.transaction_hash);  
    console.log("✅ Test completed.");

}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
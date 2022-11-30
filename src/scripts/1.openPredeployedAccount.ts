// Connect a predeployed OZ account in devnet. 
// address and PrivKey are displayed when lanching starknet-devnet, and have been  stored in .env file.
import { Account, defaultProvider, ec, Provider } from "starknet";
import * as dotenv from "dotenv";
dotenv.config();

//    👇👇👇
// 🚧 launch 'starknet-devnet --seed 0' before using this script
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
    console.log('OZ_ACCOUNT_ADDRESS=', process.env.OZ_ACCOUNT_ADDRESS);
    console.log('OZ_ACCOUNT_PRIVATE_KEY=', process.env.OZ_ACCOUNT_PRIVATE_KEY);
    const privateKey = process.env.OZ_ACCOUNT_PRIVATE_KEY ?? "";
    const starkKeyPair = ec.getKeyPair(privateKey);
    const accountAddress: string = process.env.OZ_ACCOUNT_ADDRESS ?? "";
    const account = new Account(
        provider,
        accountAddress,
        starkKeyPair
    );
    console.log('✅ OZ predeployed account 0 connected.');


}
main()
    .then(() => process.exit(0))
    .catch((error) => {
        console.error(error);
        process.exit(1);
    });
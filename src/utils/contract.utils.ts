import { createWalletClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS } from '../config/constant';






export async function mintNFT(action: ClaimAction, signal: `0x${string}`, tokenId: string, env: Env) {
    try {
        //Ensure the private key has 0x prefix and exists
        // if (!env.PRIVATE_KEY) {
        //     throw new Error('PRIVATE_KEY is not defined in environment variables');
        // }        

        console.log("------")
        console.log(action)
        console.log(signal)
        console.log(tokenId)
        console.log("------")

        const account = privateKeyToAccount(`0x${env.PRIVATE_KEY}`);
        console.log(account)

        const client = createWalletClient({
            account,
            chain: worldchain,
            transport: http('https://worldchain-mainnet.g.alchemy.com/public'),
        });

        console.log(client)

        const tier = ACTION_TO_TIER[action];
        
        const hash = await client.writeContract({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: [
                action.startsWith('mint')
                    ? {
                            name: 'mintNFT',
                            type: 'function',
                            stateMutability: 'nonpayable',
                            inputs: [
                                { name: 'to', type: 'address' },
                                { name: 'tierId', type: 'uint256' },
                            ],
                            outputs: [],
                        }
                    : {
                            name: 'upgradeNFT',
                            type: 'function',
                            stateMutability: 'nonpayable',
                            inputs: [
                                { name: 'tokenId', type: 'uint256' },
                                { name: 'newTierId', type: 'uint256' },
                            ],
                            outputs: [],
                        },
            ],
            functionName: action.startsWith('mint') ? 'mintNFT' : 'upgradeNFT',
            args: action.startsWith('mint') ? [signal as `0x${string}`, BigInt(tier)] : [BigInt(tokenId!), BigInt(tier)],
        });
        return hash;

    } catch (err) {
        console.log("asdsadasdsad")
        console.error(err);    
        return null;
    }
}


import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import MagnifySoulboundAbi from "../config/contracts/MagnifySoulbound.json";
import MagnifyV3Abi from "../config/contracts/MagnifyV3.json";
import { WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3 } from "../config/constant";


const RPC_URLS = [WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export async function readSoulboundContract(env: Env, viewFunctionName: string, params?: any) {
        for (let rpcUrlIndex = 0; rpcUrlIndex < RPC_URLS.length; rpcUrlIndex++) {
            let maxRetries = 3;
            let retryCount = 0;
            while (retryCount < maxRetries) {
                try {
                    const client = await initPublicClient(env, RPC_URLS[rpcUrlIndex]);
                    const argument: {
                        address: `0x${string}`;
                        abi: typeof MagnifySoulboundAbi;
                        functionName: string;
                        args?: [bigint] | [`0x${string}`];
                     } = {
                        address: env.SOULBOUND_NFT_CONTRACT_ADDRESS as `0x${string}`,
                        abi: MagnifySoulboundAbi,
                        functionName: viewFunctionName
                    };
                    if (params !== undefined) {
                        if (typeof params === 'string' && params.startsWith('0x')) {
                            argument.args = [params as `0x${string}`];
                        } else {
                            argument.args = [BigInt(params)];
                        }
                    }
                    const data = await client.readContract(argument);
                    return data;
                } catch (err) {
                    retryCount++;
                    const backoffMs = 1000 * Math.pow(2, retryCount);
                    console.log(`RPC request failed for ${viewFunctionName} using RPC URL #${rpcUrlIndex + 1}, retrying in ${backoffMs}ms (${retryCount}/${maxRetries})`);
                    await sleep(backoffMs);
                }
            }
            if (rpcUrlIndex < RPC_URLS.length - 1) {
                console.log(`Failed with RPC URL #${rpcUrlIndex + 1} for ${viewFunctionName}, switching to next fallback URL`);
            }
        }
        console.error(`Failed to get ${viewFunctionName} after trying all ${RPC_URLS.length} RPC URLs`);
        throw new Error(`Could not retrieve ${viewFunctionName} from any RPC endpoint after multiple attempts`);
}

export async function readMagnifyV3Contract(env: Env, contractAddress: string, viewFunctionName: string, params?: any) {
    for (let rpcUrlIndex = 0; rpcUrlIndex < RPC_URLS.length; rpcUrlIndex++) {
        let maxRetries = 3;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                const client = await initPublicClient(env, RPC_URLS[rpcUrlIndex]);
                const argument: {
                    address: `0x${string}`;
                    abi: typeof MagnifySoulboundAbi;
                    functionName: string;
                    args?: [bigint] | [`0x${string}`];
                } = {
                    address: contractAddress as `0x${string}`,
                    abi: MagnifyV3Abi,
                    functionName: viewFunctionName
                };

                if (params !== undefined) {
                    if (typeof params === 'string' && params.startsWith('0x')) {
                        argument.args = [params as `0x${string}`];
                    } else {
                        argument.args = [BigInt(params)];
                    }
                }
                const data = await client.readContract(argument);
                return data;
            } catch (err) {
                console.log('err: ', err);
                retryCount++;
                const backoffMs = 1000 * Math.pow(2, retryCount);
                console.log(`RPC request failed for ${viewFunctionName} using RPC URL #${rpcUrlIndex + 1}, retrying in ${backoffMs}ms (${retryCount}/${maxRetries})`);
                await sleep(backoffMs);
            }
        }
        if (rpcUrlIndex < RPC_URLS.length - 1) {
            console.log(`Failed with RPC URL #${rpcUrlIndex + 1} for ${viewFunctionName}, switching to next fallback URL`);
        }
    }
    console.error(`Failed to get ${viewFunctionName} after trying all ${RPC_URLS.length} RPC URLs`);
    throw new Error(`Could not retrieve ${viewFunctionName} from any RPC endpoint after multiple attempts`);
}

export async function getBlockTimestamp(env: Env, blockNumber: number) {
    const client = await initPublicClient(env, WORLDCHAIN_RPC_URL);
    const block = await client.getBlock({ blockNumber: BigInt(blockNumber) });
    return block.timestamp;
}


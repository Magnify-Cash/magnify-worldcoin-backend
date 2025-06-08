import { initPublicClient, serializeBigInt } from "../utils/contract.utils";
import { Env } from "../config/interface";
import MagnifySoulboundAbi from "../config/contracts/MagnifySoulbound.json";
import MagnifyV3Abi from "../config/contracts/MagnifyV3.json";
import MagnifyDefaultsAbi from "../config/contracts/MagnifyDefaults.json";
import { WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3, ETHERSCAN_API_KEY } from "../config/constant";
import axios from "axios";


const RPC_URLS = [WORLDCHAIN_RPC_URL, WORLDCHAIN_RPC_URL_V2, WORLDCHAIN_RPC_URL_V3];

const sleep = (ms: number) => new Promise(resolve => setTimeout(resolve, ms));


export async function readSoulboundContract(env: Env, viewFunctionName: string, params?: any) {
        console.log('soulbound contract: ', env.SOULBOUND_NFT_CONTRACT_ADDRESS);
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

export async function readFromDefaultsContract(
    env: Env,
    contractAddress: string,
    viewFunctionName: string,
    params?: any
) {
    for (let rpcUrlIndex = 0; rpcUrlIndex < RPC_URLS.length; rpcUrlIndex++) {
        let maxRetries = 3;
        let retryCount = 0;
        while (retryCount < maxRetries) {
            try {
                const client = await initPublicClient(env, RPC_URLS[rpcUrlIndex]);
                const argument: {
                    address: `0x${string}`;
                    abi: typeof MagnifyDefaultsAbi;
                    functionName: string;
                    args?: [bigint] | [`0x${string}`];
                } = {
                    address: contractAddress as `0x${string}`,
                    abi: MagnifyDefaultsAbi,
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

export function formatDate(timestamp: string): string {
    const date = new Date(Number(timestamp) * 1000); 
    const mm = String(date.getMonth() + 1).padStart(2, '0');
    const dd = String(date.getDate()).padStart(2, '0');
    const yy = String(date.getFullYear()).slice(-2);
    return `${mm}/${dd}/${yy}`;
}

export async function getPoolCreationTx(env: Env, contractAddress: string) {
    try {
        console.log(`Fetching pool creation TX for contract: ${contractAddress}`);
        
        const url = `https://api.worldscan.org/api?module=contract&action=getcontractcreation&contractaddresses=${contractAddress}&apikey=${ETHERSCAN_API_KEY}`;
        console.log(`Worldscan API URL: ${url}`);
        
        const result = await axios.get(url, {
            timeout: 10000, // 10 second timeout
            headers: {
                'User-Agent': 'Magnify-Backend/1.0'
            }
        });
        
        console.log('Worldscan API response status:', result.status);
        console.log('Worldscan API response data:', JSON.stringify(result.data));
        
        if (!result.data || !result.data.result || !Array.isArray(result.data.result) || result.data.result.length === 0) {
            throw new Error(`No creation transaction found for contract ${contractAddress}. API response: ${JSON.stringify(result.data)}`);
        }
        
        if (!result.data.result[0].blockNumber) {
            throw new Error(`Block number not found in creation transaction for contract ${contractAddress}. Response: ${JSON.stringify(result.data.result[0])}`);
        }
        
        const blockNumber = serializeBigInt(result.data.result[0].blockNumber);
        console.log(`Successfully retrieved block number ${blockNumber} for contract ${contractAddress}`);
        
        return blockNumber;
    } catch (err) {
        console.error(`Error in getPoolCreationTx for ${contractAddress}:`, {
            error: err,
            message: err instanceof Error ? err.message : 'Unknown error',
            response: axios.isAxiosError(err) ? {
                status: err.response?.status,
                statusText: err.response?.statusText,
                data: err.response?.data
            } : 'Not an Axios error'
        });
        
        if (axios.isAxiosError(err)) {
            if (err.code === 'ECONNABORTED') {
                throw new Error(`Worldscan API timeout for contract ${contractAddress}`);
            } else if (err.response?.status === 429) {
                throw new Error(`Worldscan API rate limit exceeded for contract ${contractAddress}`);
            } else if (err.response?.status) {
                throw new Error(`Worldscan API error ${err.response.status}: ${err.response.statusText} for contract ${contractAddress}`);
            }
        }
        
        throw new Error(`Failed to get pool creation transaction for contract ${contractAddress}: ${err instanceof Error ? err.message : 'Unknown error'}`);
    }
}

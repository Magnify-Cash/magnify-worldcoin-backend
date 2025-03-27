import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import MagnifySoulboundAbi from "../config/contracts/MagnifySoulbound.json";
import MagnifyV3Abi from "../config/contracts/MagnifyV3.json";


export async function readSoulboundContract(env: Env, viewFunctionName: string, params?: any) {
    try {
        const client = await initPublicClient(env);
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
            if (params.startsWith('0x')) {
                argument.args = [params as `0x${string}`];
            } else {
                argument.args = [BigInt(params)];
            }
        }
        const data = await client.readContract(argument);
        return data;
    } catch (err) {
        throw err;
    }  
}

export async function readMagnifyV3Contract(env: Env, contractAddress: string, viewFunctionName: string, params?: any) {
    try {
        const client = await initPublicClient(env);
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
            if (params.startsWith('0x')) {
                argument.args = [params as `0x${string}`];
            } else {
                argument.args = [BigInt(params)];
            }
        }
        const data = await client.readContract(argument);
        return data;
    } catch (err) {
        throw err;
    }  
}


import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import MagnifySoulboundAbi from "../config/contracts/MagnifySoulbound.json";
import MagnifyV3Abi from "../config/contracts/MagnifyV3.json";



// Soulbound NFT Contract
export async function getSoulboundData(tokenId: string, env: Env) {
    const client = await initPublicClient(env);
    const data = await client.readContract({
        address: env.SOULBOUND_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifySoulboundAbi,
        functionName: 'getNFTData',
        args: [BigInt(tokenId)]
    })
    return data;
}

export async function readSoulboundContract(env: Env, viewFunctionName: string, params?: any) {
    try {
        const client = await initPublicClient(env);
        const argument: {
            address: `0x${string}`;
            abi: typeof MagnifySoulboundAbi;
            functionName: string;
            args?: [bigint];
        } = {
            address: env.SOULBOUND_NFT_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifySoulboundAbi,
            functionName: viewFunctionName
        };

        if (params !== undefined) {
            argument.args = [BigInt(params)];
        }
        const data = await client.readContract(argument);
        return data;
    } catch (err) {
        throw err;
    }  
}

export async function getSoulboundTokenURI(tokenId: string ,env: Env) {
    const client = await initPublicClient(env);
    const data = await client.readContract({
        address: env.SOULBOUND_NFT_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifySoulboundAbi,
        functionName: 'tokenURI',
        args: [BigInt(tokenId)]
    });
    return data;
}

export async function getTotalAssetsMagnifyV3(env: Env) {
    const client = await initPublicClient(env);
    const data = await client.readContract({
        address: env.V3_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifyV3Abi,
        functionName: 'totalAssets'
    });
    return data;
}

export async function previewMint(env: Env) {
    const client = await initPublicClient(env);
    const data = await client.readContract({
        address: env.V3_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
        abi: MagnifyV3Abi,
        functionName: 'previewMint'
    });
    return data;
}

export async function readMagnifyV3Contract(env: Env, viewFunctionName: string, params?: any) {
    try {
        const client = await initPublicClient(env);
        const argument: {
            address: `0x${string}`;
            abi: typeof MagnifySoulboundAbi;
            functionName: string;
            args?: [bigint];
        } = {
            address: env.V3_MAGNIFY_CONTRACT_ADDRESS as `0x${string}`,
            abi: MagnifyV3Abi,
            functionName: viewFunctionName
        };

        if (params !== undefined) {
            if (params.startsWith('0x'))
            argument.args = [BigInt(params)];
        }
        const data = await client.readContract(argument);
        return data;
    } catch (err) {
        throw err;
    }  
}


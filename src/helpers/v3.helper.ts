import { initPublicClient } from "../utils/contract.utils";
import { Env } from "../config/interface";
import MagnifySoulboundAbi from "../config/contracts/MagnifySoulbound.json";



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


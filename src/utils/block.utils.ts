import { createPublicClient } from "viem";
import { worldchain } from "viem/chains";
import { WORLDCHAIN_RPC_URL } from "../config/constant";
import { http } from "viem";


export async function getBlockTimestamp(blockNumber: bigint) {
    const client = createPublicClient({
        chain: worldchain,
        transport: http(WORLDCHAIN_RPC_URL),
    });

    const block = await client.getBlock({
        blockNumber: blockNumber
    })
    return block.timestamp;
}

import { hyperOptimizedGetRequest } from "./utils/hyperOptimizedGetRequest";
import { USDC_ADDRESS, V1_MAGNIFY_CONTRACT_ADDRESS, V2_MAGNIFY_CONTRACT_ADDRESS } from "./utils/constants";
import { WorldScanTransaction, FormattedTransaction } from "./utils/types";

interface Env {
  WORLDSCAN_API_KEY: string;
}

const usdcAddress = USDC_ADDRESS.toLowerCase();
const contractAddresses = [
  V1_MAGNIFY_CONTRACT_ADDRESS, V2_MAGNIFY_CONTRACT_ADDRESS
].map(addr => addr.toLowerCase());

const apiHost = "api.worldscan.org";
const apiPath = "/api";

export async function getTransactionHistory(request: Request, env: Env): Promise<Response> {
  const url = new URL(request.url);
  const walletAddress = url.searchParams.get("wallet");

  if (!walletAddress) {
    return new Response(JSON.stringify({ error: "Missing wallet parameter" }), {
      status: 400,
      headers: { "Content-Type": "application/json" },
    });
  }

  try {
    const response = await hyperOptimizedGetRequest(apiHost, apiPath, {
      module: "account",
      action: "tokentx",
      contractaddress: usdcAddress,
      address: walletAddress.toLowerCase(),
      sort: "asc",
      apikey: env.WORLDSCAN_API_KEY
    });

    const transactions: WorldScanTransaction[] = response.result || [];
    if (transactions.length === 0) {
      return new Response(JSON.stringify([]), {
        status: 200,
        headers: { "Content-Type": "application/json" },
      });
    }

    const filteredTransactions: WorldScanTransaction[] = transactions.filter(tx =>
      contractAddresses.includes(tx.to.toLowerCase()) || contractAddresses.includes(tx.from.toLowerCase())
    );

    const formattedTransactions: FormattedTransaction[] = filteredTransactions.map(tx => ({
      transactionHash: tx.hash,
      blockNumber: tx.blockNumber,
      from: tx.from,
      to: tx.to,
      amount: (parseFloat(tx.value) / Math.pow(10, parseInt(tx.tokenDecimal))).toFixed(6),
      timestamp: new Date(parseInt(tx.timeStamp) * 1000).toISOString(),
      status: tx.to.toLowerCase() === walletAddress.toLowerCase() ? "received" : "repaid"
    }));

    return new Response(JSON.stringify(formattedTransactions), {
      status: 200,
      headers: { "Content-Type": "application/json" },
    });

  } catch (error) {
    console.error("Error fetching token transfers:", error);
    return new Response(JSON.stringify({ error: "Failed to fetch transactions" }), {
      status: 500,
      headers: { "Content-Type": "application/json" },
    });
  }
}

export interface WorldScanTransaction {
    blockNumber: string;
    timeStamp: string;
    hash: string;
    nonce: string;
    blockHash: string;
    from: string;
    contractAddress: string;
    to: string;
    value: string;
    tokenName: string;
    tokenSymbol: string;
    tokenDecimal: string;
    transactionIndex: string;
    gas: string;
    gasPrice: string;
    gasUsed: string;
    cumulativeGasUsed: string;
    input: string;
    confirmations: string;
  }
  
export interface FormattedTransaction {
    transactionHash: string;
    blockNumber: string;
    from: string;
    to: string;
    amount: string;
    timestamp: string;
    status: "received" | "repaid";
  }
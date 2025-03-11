import { createWalletClient, createPublicClient, http } from 'viem';
import { privateKeyToAccount } from 'viem/accounts';
import { Bytes, Hex, Hash } from 'ox';
import { ACTION_TO_TIER, Env, ClaimAction } from '../config/interface';
import { worldchain } from 'viem/chains';
import { V1_MAGNIFY_CONTRACT_ADDRESS } from '../config/constant';
import { WORLDCHAIN_RPC_URL } from '../config/constant';
import MagnifyV1Abi from '../config/contracts/MagnifyV1.json';
import { getBlockTimestamp } from './block.utils';
import { LoanRepaid } from '../config/interface';

export async function getContractAddress(env: Env) {
    const contractAddresses = [
        V1_MAGNIFY_CONTRACT_ADDRESS, 
        String(env.V2_MAGNIFY_CONTRACT_ADDRESS || '').trim()
      ].map(addr => addr.toLowerCase());
      return contractAddresses;
}


export async function mintNFT(action: ClaimAction, signal: `0x${string}`, tokenId: string, env: Env) {
    try {

        let privateKey = String(env.PRIVATE_KEY || '').trim();

        if (!privateKey) {
            throw new Error('PRIVATE_KEY is undefined or empty after sanitization');
        }

        if (!privateKey.startsWith('0x')) {
            privateKey = `0x${privateKey}`;
        }

        if (privateKey.length !== 66) {
            throw new Error(`Invalid PRIVATE_KEY length: expected 66 characters, got ${privateKey.length}`);
        }


        const account = privateKeyToAccount(privateKey as Hex.Hex);

        const client = createWalletClient({
            account,
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });


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
        console.error(err);    
        return null;
    }
}


// Helper function to convert BigInt values to strings
function serializeBigInt(obj: any): any {
    if (obj === null || obj === undefined) {
        return obj;
    }
    
    if (typeof obj === 'bigint') {
        return obj.toString();
    }
    
    if (Array.isArray(obj)) {
        return obj.map(serializeBigInt);
    }
    
    if (typeof obj === 'object') {
        const result: any = {};
        for (const key in obj) {
            result[key] = serializeBigInt(obj[key]);
        }
        return result;
    }
    
    return obj;
}

//LoanRequested
//LoanRepaid
export async function getLoanV1() {
    try {
        let result = [];
        const client = createPublicClient({
            chain: worldchain,
            transport: http(WORLDCHAIN_RPC_URL),
        });

        const loanRequestedV1 = await client.getContractEvents({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRequested',
            fromBlock: 1n,
            toBlock: 'latest'
        })
        const loanRequestArr = serializeBigInt(loanRequestedV1);
        const beforeCount = loanRequestArr.length;
        console.log('before loanRequestArr: ', loanRequestArr.length);

        const loanRepaidV1 = await client.getContractEvents({
            address: V1_MAGNIFY_CONTRACT_ADDRESS,
            abi: MagnifyV1Abi,
            eventName: 'LoanRepaid',
            fromBlock: 1n,
            toBlock: 'latest'
        })
        const loanRepaidArr: LoanRepaid[] = serializeBigInt(loanRepaidV1);
        // console.log('length: ', loanRequestedV1.length);
        
        for (let i = 0; i < loanRequestArr.length; i++) {
            const item = loanRequestArr[i];
            let tokenRequestId = item.args.tokenId;
            
            for (let j = 0; j < loanRepaidArr.length; j++) {
                const repaidItem = loanRepaidArr[j];
                let repaidTokenRequestId = repaidItem.args.tokenId;
                
                if (repaidTokenRequestId === tokenRequestId) { 
                    if(repaidItem.blockNumber >= item.blockNumber) {

                    }
                    let obj = {
                        user_wallet: item.args.borrower,
                        loan_amount: item.args.amount,
                        loan_repaid_amount: repaidItem.args.repaymentAmount,
                        loan_term: {
                            blockStart: item.blockNumber,
                            blockEnd: repaidItem.blockNumber
                        }
                    }  
                    result.push(obj);
                    loanRequestArr.splice(i, 1);   // [0,1,3,4]
                    loanRepaidArr.splice(j, 1);   // [0,1,2,3,4]
                    i--;
                    j--;
                    break;
                }
            }
        }


        // console.log('timestamp: ', serializeBigInt(timestamp));
        // Convert BigInt values to strings before returning
       // return serializeBigInt(loanRepaidV1);
       const afterCount = loanRequestArr.length;
       console.log('after loanRequestArr: ', loanRequestArr.length);
       console.log('diff: ', beforeCount - afterCount);
       //console.log('defaultedLoan: ', loan);
       console.log('loanRepaidCount ', result.length);
        return result;
    } catch (err) {
        console.log(err);
        return [];
    }
}


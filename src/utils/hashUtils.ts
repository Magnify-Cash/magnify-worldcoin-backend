import { Hex, Hash, Bytes} from 'ox'

export interface HashFunctionOutput {
    hash: bigint;
    digest: `0x${string}`;
}


export function hashToField(input: Bytes.Bytes | string): HashFunctionOutput {
    if (Bytes.validate(input) || Hex.validate(input)) return hashEncodedBytes(input);
    return hashString(input);
}

function hashString(input: string): HashFunctionOutput {
    const bytesInput = Buffer.from(input);
    return hashEncodedBytes(bytesInput);
}

function hashEncodedBytes(input: Hex.Hex | Bytes.Bytes): HashFunctionOutput {
    const hash = BigInt(Hash.keccak256(input, { as: 'Hex' })) >> 8n;
    const rawDigest = hash.toString(16);
    return { hash, digest: `0x${rawDigest.padStart(64, '0')}` };
} 

export function convertHexToInteger(hex: string, decimal: number) {
    const bigInt = BigInt(hex);
    const result = Number(bigInt) / Math.pow(10, decimal);
    return result;
}
import { Buffer } from "buffer";
import { encrypt } from "eccrypto";
import { ethers } from "ethers";

// https://github.com/ethers-io/ethers.js/issues/447

export async function recover(tx: ethers.Transaction): Promise<{
  publicKey: string;
  address: string;
}> {
  const expandedSig = {
    r: tx.r!,
    s: tx.s!,
    v: tx.v!,
  };

  const signature = ethers.utils.joinSignature(expandedSig);

  const txData = {
    gasLimit: tx.gasLimit,
    value: tx.value,
    nonce: tx.nonce,
    data: tx.data,
    chainId: tx.chainId,
    to: tx.to,
    type: tx.type,
    maxFeePerGas: tx.maxFeePerGas,
    maxPriorityFeePerGas: tx.maxPriorityFeePerGas,
  };

  const rsTx = await ethers.utils.resolveProperties(txData);
  const raw = ethers.utils.serializeTransaction(rsTx); // returns RLP encoded tx
  const msgHash = ethers.utils.keccak256(raw); // as specified by ECDSA
  const msgBytes = ethers.utils.arrayify(msgHash); // create binary hash

  return {
    publicKey: ethers.utils.recoverPublicKey(msgBytes, signature),
    address: ethers.utils.recoverAddress(msgBytes, signature),
  };
}

export async function encryptWithPublicKey(
  publicKey: Uint8Array,
  message: string,
  opts = undefined
) {
  // TODO: add 0x04 prefix to public key.
  const encryptedBuffers = await encrypt(
    Buffer.from(publicKey),
    Buffer.from(message),
    opts || {}
  );

  const encrypted = {
    iv: encryptedBuffers.iv.toString("hex"),
    ephemPublicKey: encryptedBuffers.ephemPublicKey.toString("hex"),
    ciphertext: encryptedBuffers.ciphertext.toString("hex"),
    mac: encryptedBuffers.mac.toString("hex"),
  };

  return encrypted;
}

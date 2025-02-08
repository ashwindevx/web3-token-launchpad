import { useState, useCallback } from "react";
import { WalletNotConnectedError } from "@solana/wallet-adapter-base";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  SystemProgram,
  Transaction,
  PublicKey,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js";

export const SendSol = () => {
  const { connection } = useConnection();
  const { publicKey, sendTransaction } = useWallet();

  const [amount, setAmount] = useState("");
  const [recipientAddress, setRecipientAddress] = useState("");

  const sendSol = useCallback(async () => {
    if (!publicKey) throw new WalletNotConnectedError();

    let recipientPubkey;
    try {
      recipientPubkey = new PublicKey(recipientAddress);
    } catch (error) {
      console.error("Invalid recipient address:", error);
      return;
    }

    const transaction = new Transaction().add(
      SystemProgram.transfer({
        fromPubkey: publicKey,
        toPubkey: recipientPubkey,
        lamports: amount * LAMPORTS_PER_SOL,
      })
    );

    const {
      context: { slot: minContextSlot },
      value: { blockhash, lastValidBlockHeight },
    } = await connection.getLatestBlockhashAndContext();

    const signature = await sendTransaction(transaction, connection, {
      minContextSlot,
    });
    await connection.confirmTransaction({
      blockhash,
      lastValidBlockHeight,
      signature,
    });

    alert("Sent " + amount + " SOL to " + recipientAddress);
  }, [publicKey, sendTransaction, connection, recipientAddress]);

  return (
    <>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          type="text"
          placeholder="Amount"
          value={amount}
          onChange={(e) => setAmount(e.target.value)}
        />
        <input
          type="text"
          placeholder="Recipient Address"
          value={recipientAddress}
          onChange={(e) => setRecipientAddress(e.target.value)}
        />
        <button onClick={sendSol}>Send SOL</button>
      </div>
    </>
  );
};

export default SendSol;

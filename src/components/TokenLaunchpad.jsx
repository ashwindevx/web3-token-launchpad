import { useState } from "react";
import { Keypair, SystemProgram, Transaction } from "@solana/web3.js";
import { useConnection, useWallet } from "@solana/wallet-adapter-react";
import {
  TOKEN_2022_PROGRAM_ID,
  getMintLen,
  TYPE_SIZE,
  LENGTH_SIZE,
  ExtensionType,
  createInitializeMetadataPointerInstruction,
  createInitializeMintInstruction,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const TokenLaunchpad = () => {
  const [name, setName] = useState("Avi");
  const [symbol, setSymbol] = useState("AVI");
  const [image, setImage] = useState(
    "https://images.unsplash.com/photo-1625750331870-624de6fd3452?q=80&w=2070&auto=format&fit=crop&ixlib=rb-4.0.3&ixid=M3wxMjA3fDB8MHxwaG90by1wYWdlfHx8fGVufDB8fHx8fA%3D%3D"
  );
  const [supply, setSupply] = useState("100");

  const { connection } = useConnection();
  const { publicKey, signTransaction } = useWallet();

  const createToken = async () => {
    try {
      const mintKeyPair = Keypair.generate();

      const metadata = {
        mint: mintKeyPair.publicKey,
        name: name,
        symbol: symbol,
        uri: image,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      const transaction = new Transaction().add(
        SystemProgram.createAccount({
          fromPubkey: publicKey,
          newAccountPubkey: mintKeyPair.publicKey,
          space: mintLen,
          lamports,
          programId: TOKEN_2022_PROGRAM_ID,
        }),
        createInitializeMetadataPointerInstruction(
          mintKeyPair.publicKey,
          publicKey,
          publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeMintInstruction(
          mintKeyPair.publicKey,
          9,
          publicKey,
          null,
          TOKEN_2022_PROGRAM_ID
        ),
        createInitializeInstruction({
          programId: TOKEN_2022_PROGRAM_ID,
          mint: mintKeyPair.publicKey,
          metadata: mintKeyPair.publicKey,
          name: metadata.name,
          symbol: metadata.symbol,
          uri: metadata.image,
          mintAuthority: publicKey,
          updateAuthority: publicKey,
        })
      );

      transaction.feePayer = publicKey;
      transaction.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;
      transaction.partialSign(mintKeyPair);

      const signedTransaction = await signTransaction(transaction);
      const signature = await connection.sendRawTransaction(
        signedTransaction.serialize()
      );

      await connection.confirmTransaction(signature, "confirmed");

      console.log(`Token mint created at ${mintKeyPair.publicKey.toBase58()}`);
      alert(`Token mint created at ${mintKeyPair.publicKey.toBase58()}`);
    } catch (error) {
      console.error("Error creating token:", error);
      alert("Error creating token. Check the console for more details.");
    }
  };

  return (
    <>
      <h2>Solana Token Launchpad</h2>
      <div style={{ display: "flex", flexDirection: "column", gap: "12px" }}>
        <input
          className="inputText"
          type="text"
          placeholder="Name"
          value={name}
          onChange={(e) => setName(e.target.value)}
        />
        <input
          className="inputText"
          type="text"
          placeholder="Symbol"
          value={symbol}
          onChange={(e) => setSymbol(e.target.value)}
        />
        <input
          className="inputText"
          type="text"
          placeholder="Image URL"
          value={image}
          onChange={(e) => setImage(e.target.value)}
        />
        <input
          className="inputText"
          type="text"
          placeholder="Initial Supply"
          value={supply}
          onChange={(e) => setSupply(e.target.value)}
        />

        <button onClick={createToken} className="btn">
          Create a token
        </button>
      </div>
    </>
  );
};

export default TokenLaunchpad;

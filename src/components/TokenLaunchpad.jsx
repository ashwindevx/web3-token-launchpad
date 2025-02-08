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
  getAssociatedTokenAddressSync,
  createAssociatedTokenAccountInstruction,
  createMintToInstruction,
} from "@solana/spl-token";
import { createInitializeInstruction, pack } from "@solana/spl-token-metadata";

const TokenLaunchpad = () => {
  const [name, setName] = useState("");
  const [symbol, setSymbol] = useState("");
  const [image, setImage] = useState("");
  const [isLoading, setIsLoading] = useState(false);

  const { connection } = useConnection();
  const { publicKey } = useWallet();
  const wallet = useWallet();

  const createToken = async () => {
    if (!publicKey) {
      alert("Please connect your wallet!");
      return;
    }

    setIsLoading(true);
    try {
      const mintKeyPair = Keypair.generate();
      const associatedToken = getAssociatedTokenAddressSync(
        mintKeyPair.publicKey,
        publicKey,
        false,
        TOKEN_2022_PROGRAM_ID
      );

      const metadata = {
        name,
        symbol,
        uri: image,
        updateAuthority: publicKey,
        mint: mintKeyPair.publicKey,
        additionalMetadata: [],
      };

      const mintLen = getMintLen([ExtensionType.MetadataPointer]);
      const metadataLen = TYPE_SIZE + LENGTH_SIZE + pack(metadata).length;
      const lamports = await connection.getMinimumBalanceForRentExemption(
        mintLen + metadataLen
      );

      // Create and initialize mint
      const createMintTx = new Transaction().add(
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
          uri: metadata.uri,
          mintAuthority: publicKey,
          updateAuthority: publicKey,
        })
      );

      const latestBlockhash = await connection.getLatestBlockhash();
      createMintTx.feePayer = publicKey;
      createMintTx.recentBlockhash = latestBlockhash.blockhash;
      createMintTx.partialSign(mintKeyPair);

      await wallet.sendTransaction(createMintTx, connection);

      // Create associated token account and mint tokens
      const setupTokenTx = new Transaction().add(
        createAssociatedTokenAccountInstruction(
          publicKey,
          associatedToken,
          publicKey,
          mintKeyPair.publicKey,
          TOKEN_2022_PROGRAM_ID
        ),
        createMintToInstruction(
          mintKeyPair.publicKey,
          associatedToken,
          publicKey,
          1000000000,
          [],
          TOKEN_2022_PROGRAM_ID
        )
      );

      setupTokenTx.feePayer = publicKey;
      setupTokenTx.recentBlockhash = (
        await connection.getLatestBlockhash()
      ).blockhash;

      wallet.sendTransaction(setupTokenTx, connection);

      console.log(
        `Token created successfully! Mint: ${mintKeyPair.publicKey.toBase58()}`
      );
      alert(
        `Token created successfully! Mint: ${mintKeyPair.publicKey.toBase58()}`
      );
    } catch (error) {
      console.error("Error creating token:", error);
      alert(`Error creating token: ${error.message}`);
    } finally {
      setIsLoading(false);
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

        <button
          onClick={createToken}
          className="btn"
          disabled={isLoading || !publicKey}
        >
          {isLoading ? "Creating..." : "Create Token"}
        </button>
      </div>
    </>
  );
};

export default TokenLaunchpad;

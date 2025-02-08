import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import SendSol from "./SendSol";
import TokenLaunchpad from "./TokenLaunchpad";

const WalletContent = () => {
  const { connected } = useWallet();

  return (
    <>
      <div
        style={{
          display: "flex",
          justifyContent: "flex-end",
          gap: "12px",
        }}
      >
        <WalletMultiButton />
        <WalletDisconnectButton />
      </div>
      <div style={{ margin: "12px" }}>
        {connected ? (
          <>
            <SendSol />
            <TokenLaunchpad />
          </>
        ) : (
          <p>Please connect your wallet to use the application.</p>
        )}
      </div>
    </>
  );
};

export default WalletContent;

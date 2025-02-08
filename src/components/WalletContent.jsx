import { useWallet } from "@solana/wallet-adapter-react";
import {
  WalletDisconnectButton,
  WalletMultiButton,
} from "@solana/wallet-adapter-react-ui";
import SendSol from "./SendSol";

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
      <div style={{ margin: "12px" }}>{connected && <SendSol />}</div>
    </>
  );
};

export default WalletContent;

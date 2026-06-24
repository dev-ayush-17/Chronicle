"use client";

import { useAccount, useChainId } from "wagmi";

export function WalletInfo() {
  const { address, isConnected } = useAccount();
  const chainId = useChainId();

  if (!isConnected) {
    return (
      <div className="text-on-surface-variant text-sm">
        <p>Not Connected</p>
      </div>
    );
  }

  return (
    <div className="text-on-surface text-sm space-y-1">
      <p>
        Connected: {isConnected ? "Yes" : "No"}
      </p>
      <p>Address: {address}</p>
      <p>Chain Id: {chainId}</p>
    </div>
  );
}

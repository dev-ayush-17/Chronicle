import { type HardhatUserConfig } from "hardhat/config";
import toolboxViem from "@nomicfoundation/hardhat-toolbox-viem";
import * as dotenv from "dotenv";
import { Wallet } from "ethers";
import { walletActions } from "viem";
import { LOADIPHLPAPI } from "dns";

// Load .env file from this directory (contracts/.env)
dotenv.config();

const BLOCKCHAIN_PRIVATE_KEY = process.env.BLOCKCHAIN_PRIVATE_KEY ?? "";
const SEPOLIA_RPC = process.env.SEPOLIA_RPC_URL!;

if (BLOCKCHAIN_PRIVATE_KEY) {
  const wallet = new Wallet(BLOCKCHAIN_PRIVATE_KEY)
  console.log("Deployer", wallet.address);
}

// Check if the key is a real key (not empty and not the placeholder)
const hasRealKey =
  BLOCKCHAIN_PRIVATE_KEY.length > 0 &&
  !BLOCKCHAIN_PRIVATE_KEY.includes("YOUR_BACKEND_WALLET");

// Hardhat v3 requires the private key as a 0x-prefixed hex string
const accounts = hasRealKey
  ? [BLOCKCHAIN_PRIVATE_KEY.startsWith("0x")
    ? BLOCKCHAIN_PRIVATE_KEY
    : `0x${BLOCKCHAIN_PRIVATE_KEY}`]
  : [];

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: {
        enabled: true,
        runs: 200,
      },
    },
  },
  networks: {
    hardhat: {
      type: "edr-simulated",
    },
    sepolia: {
      type: "http",
      url: SEPOLIA_RPC,
      accounts,
      chainId: 11155111,
    },
  },
  paths: {
    sources: "./",      // ChronicleAnchor.sol lives in contracts/ root
    tests: "./test",
    cache: "./cache",
    artifacts: "./artifacts",
    ignition: "./ignition",
  },
  plugins: [toolboxViem],
};

export default config;

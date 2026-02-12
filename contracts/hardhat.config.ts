import { HardhatUserConfig } from "hardhat/config";
import "@nomicfoundation/hardhat-toolbox";
import * as dotenv from "dotenv";

dotenv.config();

const PRIVATE_KEY = process.env.DEPLOYER_PRIVATE_KEY || "0x0000000000000000000000000000000000000000000000000000000000000001";
const BASE_SEPOLIA_RPC = process.env.BASE_SEPOLIA_RPC || "https://sepolia.base.org";
const BASE_MAINNET_RPC = process.env.BASE_MAINNET_RPC || "https://mainnet.base.org";
const BASESCAN_API_KEY = process.env.BASESCAN_API_KEY || "";
const HASHKEY_MAINNET_RPC = process.env.HASHKEY_MAINNET_RPC || "https://mainnet.hsk.xyz";

const config: HardhatUserConfig = {
  solidity: {
    version: "0.8.20",
    settings: {
      optimizer: { enabled: true, runs: 200 },
    },
  },
  networks: {
    hardhat: {},
    baseSepolia: {
      url: BASE_SEPOLIA_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 84532,
    },
    base: {
      url: BASE_MAINNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 8453,
    },
    hashkey: {
      url: HASHKEY_MAINNET_RPC,
      accounts: [PRIVATE_KEY],
      chainId: 177,
    },
  },
  etherscan: {
    apiKey: {
      baseSepolia: BASESCAN_API_KEY,
      base: BASESCAN_API_KEY,
    },
    customChains: [
      {
        network: "baseSepolia",
        chainId: 84532,
        urls: {
          apiURL: "https://api-sepolia.basescan.org/api",
          browserURL: "https://sepolia.basescan.org",
        },
      },
    ],
  },
};

export default config;

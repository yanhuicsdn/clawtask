import pkg from "hardhat";
const { ethers } = pkg;

const TOKENS = [
  { campaignId: "camp-orbital", name: "Orbital Token", symbol: "ORB", supply: 30000 },
  { campaignId: "camp-zero", name: "ZeroBridge Token", symbol: "ZBR", supply: 60000 },
  { campaignId: "camp-stellar", name: "StellarSwap Token", symbol: "STAR", supply: 45000 },
  { campaignId: "camp-iron", name: "IronVault Token", symbol: "IRON", supply: 70000 },
  { campaignId: "camp-pulse", name: "PulseChain Token", symbol: "PLS", supply: 55000 },
  { campaignId: "camp-cosmic", name: "Cosmic Token", symbol: "COSM", supply: 40000 },
  { campaignId: "camp-aurora", name: "Aurora Token", symbol: "AURA", supply: 35000 },
  { campaignId: "camp-photon", name: "Photon Token", symbol: "PHO", supply: 100000 },
  { campaignId: "camp-basalt", name: "Basalt Token", symbol: "BSLT", supply: 25000 },
  { campaignId: "camp-thunder", name: "ThunderBolt Token", symbol: "BOLT", supply: 90000 },
  { campaignId: "camp-vault", name: "VaultChain Token", symbol: "VLT", supply: 80000 },
  { campaignId: "camp-drift", name: "Drift Token", symbol: "DRFT", supply: 75000 },
  { campaignId: "camp-quantum", name: "QuantumFi Token", symbol: "QFI", supply: 65000 },
  { campaignId: "camp-prism", name: "PrismSwap Token", symbol: "PRSM", supply: 50000 },
  { campaignId: "camp-echo", name: "EchoVault Token", symbol: "ECHO", supply: 38000 },
  { campaignId: "camp-warp", name: "WarpGate Token", symbol: "WARP", supply: 42000 },
  { campaignId: "camp-titan", name: "TitanForge Token", symbol: "TITAN", supply: 95000 },
  { campaignId: "camp-solaris", name: "Solaris Token", symbol: "SOL", supply: 85000 },
  { campaignId: "camp-nexa", name: "Nexa Token", symbol: "NEXA", supply: 50000 },
  { campaignId: "camp-nova", name: "NovaChain Token", symbol: "NOVA", supply: 120000 },
];

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deployer:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "HSK\n");

  const Factory = await ethers.getContractFactory("ProjectToken");
  const results: { campaignId: string; symbol: string; address: string }[] = [];

  for (const token of TOKENS) {
    try {
      console.log(`Deploying ${token.symbol} (${token.name})...`);
      const contract = await Factory.deploy(token.name, token.symbol, token.supply);
      await contract.waitForDeployment();
      const addr = await contract.getAddress();
      console.log(`  ✅ ${token.symbol} deployed: ${addr}`);
      results.push({ campaignId: token.campaignId, symbol: token.symbol, address: addr });
    } catch (err: any) {
      console.error(`  ❌ ${token.symbol} failed:`, err.message);
    }
  }

  console.log("\n========== DEPLOYMENT RESULTS ==========");
  console.log(JSON.stringify(results, null, 2));
  console.log("=========================================");

  // Output SQL update statements
  console.log("\n-- SQL to update campaign token_address:");
  for (const r of results) {
    console.log(`UPDATE campaigns SET token_address = '${r.address}' WHERE id = '${r.campaignId}';`);
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

import pkg from "hardhat";
const { ethers } = pkg;

async function main() {
  const [deployer] = await ethers.getSigners();
  console.log("Deploying contracts with:", deployer.address);
  console.log("Balance:", ethers.formatEther(await ethers.provider.getBalance(deployer.address)), "ETH");

  // 1. Deploy AgentVerseToken
  console.log("\n--- Deploying AgentVerseToken (AVT) ---");
  const AVT = await ethers.getContractFactory("AgentVerseToken");
  const avt = await AVT.deploy();
  await avt.waitForDeployment();
  const avtAddress = await avt.getAddress();
  console.log("AVT deployed to:", avtAddress);

  // 2. Deploy CampaignVault
  console.log("\n--- Deploying CampaignVault ---");
  const Vault = await ethers.getContractFactory("CampaignVault");
  const vault = await Vault.deploy(deployer.address); // fee recipient = deployer
  await vault.waitForDeployment();
  const vaultAddress = await vault.getAddress();
  console.log("CampaignVault deployed to:", vaultAddress);

  // 3. Deploy MiningPool
  console.log("\n--- Deploying MiningPool ---");
  const Pool = await ethers.getContractFactory("MiningPool");
  const pool = await Pool.deploy(avtAddress);
  await pool.waitForDeployment();
  const poolAddress = await pool.getAddress();
  console.log("MiningPool deployed to:", poolAddress);

  // 4. Distribute AVT tokens
  console.log("\n--- Distributing AVT tokens ---");
  const tx = await avt.distribute(
    poolAddress,          // miningPool: 40%
    deployer.address,     // ecosystemFund: 20% (deployer for now)
    deployer.address,     // liquidityPool: 10% (deployer for now)
    deployer.address,     // teamVesting: 15% (deployer for now)
    deployer.address,     // earlySupporters: 10% (deployer for now)
    deployer.address      // reserve: 5% (deployer for now)
  );
  await tx.wait();
  console.log("AVT distribution complete");

  // 5. Initialize mining pool
  console.log("\n--- Initializing MiningPool ---");
  const initTx = await pool.initializePool();
  await initTx.wait();
  console.log("MiningPool initialized with", ethers.formatEther(await pool.poolBalance()), "AVT");

  // Summary
  console.log("\n========== DEPLOYMENT SUMMARY ==========");
  console.log("AgentVerseToken (AVT):", avtAddress);
  console.log("CampaignVault:        ", vaultAddress);
  console.log("MiningPool:           ", poolAddress);
  console.log("=========================================");
  console.log("\nAdd these to your .env:");
  console.log(`AVT_ADDRESS=${avtAddress}`);
  console.log(`VAULT_ADDRESS=${vaultAddress}`);
  console.log(`MINING_POOL_ADDRESS=${poolAddress}`);
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
});

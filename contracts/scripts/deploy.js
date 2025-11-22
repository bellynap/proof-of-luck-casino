const hre = require("hardhat");

async function main() {
  console.log("🎰 Deploying Proof of Luck Casino contracts to Sapphire...\n");

  const [deployer] = await hre.ethers.getSigners();
  console.log("Deploying with account:", deployer.address);
  
  const balance = await hre.ethers.provider.getBalance(deployer.address);
  console.log("Account balance:", hre.ethers.formatEther(balance), "TEST\n");

  console.log("📝 Deploying GameManager...");
  const GameManager = await hre.ethers.getContractFactory("GameManager");
  const gameManager = await GameManager.deploy();
  await gameManager.waitForDeployment();
  const gameManagerAddress = await gameManager.getAddress();
  console.log("✅ GameManager deployed to:", gameManagerAddress);

  console.log("\n📝 Deploying MysteryBoxNFT...");
  const MysteryBoxNFT = await hre.ethers.getContractFactory("MysteryBoxNFT");
  const nft = await MysteryBoxNFT.deploy(gameManagerAddress);
  await nft.waitForDeployment();
  const nftAddress = await nft.getAddress();
  console.log("✅ MysteryBoxNFT deployed to:", nftAddress);

  console.log("\n📝 Deploying LuckToken...");
  const LuckToken = await hre.ethers.getContractFactory("LuckToken");
  const token = await LuckToken.deploy(gameManagerAddress);
  await token.waitForDeployment();
  const tokenAddress = await token.getAddress();
  console.log("✅ LuckToken deployed to:", tokenAddress);

  console.log("\n💰 Funding house balance with 10 TEST...");
  const depositTx = await gameManager.depositHouse({ 
    value: hre.ethers.parseEther("10") 
  });
  await depositTx.wait();
  console.log("✅ House funded!");

  console.log("\n" + "=".repeat(60));
  console.log("🎉 DEPLOYMENT COMPLETE!");
  console.log("=".repeat(60));
  console.log("\n📋 Contract Addresses:");
  console.log("   GameManager:     ", gameManagerAddress);
  console.log("   MysteryBoxNFT:   ", nftAddress);
  console.log("   LuckToken:       ", tokenAddress);
  
  console.log("\n💾 SAVE THESE ADDRESSES!");
  console.log(`GAME_MANAGER_ADDRESS=${gameManagerAddress}`);
  console.log(`NFT_ADDRESS=${nftAddress}`);
  console.log(`TOKEN_ADDRESS=${tokenAddress}`);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });

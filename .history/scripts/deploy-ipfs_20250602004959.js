const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying ArtValidationIPFS contract...");

  // Get the contract factory
  const ArtValidationIPFS = await ethers.getContractFactory("ArtValidationIPFS");
  
  // For now, use a placeholder token contract address (can be updated later)
  // In production, this should be the actual ValidatorToken contract address
  const tokenContractAddress = "0x0000000000000000000000000000000000000000";
  
  // Deploy the contract
  const artValidationIPFS = await ArtValidationIPFS.deploy(tokenContractAddress);
  
  // Wait for deployment to be mined
  await artValidationIPFS.waitForDeployment();
  
  const contractAddress = await artValidationIPFS.getAddress();
  
  console.log("ArtValidationIPFS deployed to:", contractAddress);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    contractAddress: contractAddress,
    contractName: "ArtValidationIPFS",
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    tokenContractAddress: tokenContractAddress
  };
  
  fs.writeFileSync(
    'deployment-ipfs-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-ipfs-info.json");
  
  // Verify contract on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await artValidationIPFS.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [tokenContractAddress],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
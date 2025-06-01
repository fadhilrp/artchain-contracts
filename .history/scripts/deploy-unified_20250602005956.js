const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying unified ArtValidation contract...");

  // Use existing ValidatorToken address
  const existingValidatorTokenAddress = "0xc3fb13Da28f5abf142A1b8219DF26A8Ab7127504";
  console.log("Using existing ValidatorToken at:", existingValidatorTokenAddress);

  // Deploy unified ArtValidation contract
  const ArtValidation = await ethers.getContractFactory("ArtValidation");
  const artValidation = await ArtValidation.deploy(existingValidatorTokenAddress);
  
  // Wait for deployment to be mined
  await artValidation.waitForDeployment();
  
  const contractAddress = await artValidation.getAddress();
  
  console.log("Unified ArtValidation deployed to:", contractAddress);
  
  // Save deployment info
  const fs = require('fs');
  const deploymentInfo = {
    validatorToken: existingValidatorTokenAddress,
    artValidation: contractAddress,
    contractName: "ArtValidation",
    network: "sepolia",
    deployedAt: new Date().toISOString(),
    features: [
      "IPFS image URI storage",
      "Metadata storage", 
      "Legacy compatibility",
      "Enhanced artwork details",
      "Decentralized validation"
    ]
  };
  
  fs.writeFileSync(
    'deployment-unified-info.json', 
    JSON.stringify(deploymentInfo, null, 2)
  );
  
  console.log("Deployment info saved to deployment-unified-info.json");
  
  // Verify contract on Etherscan (optional)
  if (process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await artValidation.deploymentTransaction().wait(6);
    
    try {
      await hre.run("verify:verify", {
        address: contractAddress,
        constructorArguments: [existingValidatorTokenAddress],
      });
      console.log("Contract verified on Etherscan");
    } catch (error) {
      console.log("Error verifying contract:", error);
    }
  }

  console.log("\n✅ Deployment Summary:");
  console.log("- ValidatorToken (existing):", existingValidatorTokenAddress);
  console.log("- ArtValidation (new):", contractAddress);
  console.log("- Features: IPFS support + Legacy compatibility");
  console.log("- Network:", "sepolia");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
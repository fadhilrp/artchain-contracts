const hre = require("hardhat");

async function main() {
  // Use existing ValidatorToken address
  const existingValidatorTokenAddress = "0xc3fb13Da28f5abf142A1b8219DF26A8Ab7127504"; // Replace with your actual ValidatorToken address
  console.log("Using existing ValidatorToken at:", existingValidatorTokenAddress);

  // Deploy ArtValidation with the existing ValidatorToken address
  const ArtValidation = await hre.ethers.getContractFactory("ArtValidation");
  const artValidation = await ArtValidation.deploy(existingValidatorTokenAddress);
  await artValidation.waitForDeployment();
  console.log("ArtValidation deployed to:", await artValidation.getAddress());

  // Verify contract on Etherscan
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await artValidation.deploymentTransaction().wait(6);

    console.log("Verifying ArtValidation...");
    await hre.run("verify:verify", {
      address: await artValidation.getAddress(),
      constructorArguments: [existingValidatorTokenAddress],
    });
  }

  // Save deployment info to a file for easy reference
  const deploymentInfo = {
    validatorToken: existingValidatorTokenAddress,
    artValidation: await artValidation.getAddress(),
    network: hre.network.name,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to deployment-info.json");
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
const hre = require("hardhat");

async function main() {
  // Use existing ValidatorToken address
  const existingValidatorTokenAddress = "0x65832592c9b9a80d8Da2BA90e13b1313b2217374"; // Replace with your actual ValidatorToken address
  console.log("Using existing ValidatorToken at:", existingValidatorTokenAddress);

  // Deploy ArtValidationNew with the existing ValidatorToken address
  const ArtValidationNew = await hre.ethers.getContractFactory("ArtValidationNew");
  const artValidationNew = await ArtValidationNew.deploy(existingValidatorTokenAddress);
  await artValidationNew.waitForDeployment();
  console.log("ArtValidationNew deployed to:", await artValidationNew.getAddress());

  // Verify contract on Etherscan
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await artValidationNew.deploymentTransaction().wait(6);

    console.log("Verifying ArtValidationNew...");
    await hre.run("verify:verify", {
      address: await artValidationNew.getAddress(),
      constructorArguments: [existingValidatorTokenAddress],
    });
  }

  // Save deployment info to a file for easy reference
  const deploymentInfo = {
    validatorToken: existingValidatorTokenAddress,
    artValidationNew: await artValidationNew.getAddress(),
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
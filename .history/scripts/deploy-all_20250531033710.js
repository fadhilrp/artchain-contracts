const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying contracts...");

  // 1. Deploy ValidatorToken
  console.log("Deploying ValidatorToken...");
  const ValidatorToken = await ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.waitForDeployment();
  const validatorTokenAddress = await validatorToken.getAddress();
  console.log("ValidatorToken deployed to:", validatorTokenAddress);

  // 2. Deploy ArtValidationNew with the ValidatorToken address
  console.log("Deploying ArtValidationNew...");
  const ArtValidationNew = await ethers.getContractFactory("ArtValidationNew");
  const artValidationNew = await ArtValidationNew.deploy(validatorTokenAddress);
  await artValidationNew.waitForDeployment();
  const artValidationNewAddress = await artValidationNew.getAddress();
  console.log("ArtValidationNew deployed to:", artValidationNewAddress);

  // 3. Set the ArtValidation contract in ValidatorToken
  console.log("Setting ArtValidation contract in ValidatorToken...");
  const tx = await validatorToken.setArtValidationContract(artValidationNewAddress);
  await tx.wait();
  console.log("Successfully set ArtValidation contract!");

  // 4. Verify contracts on Etherscan
  if (network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await validatorToken.deploymentTransaction().wait(6);
    await artValidationNew.deploymentTransaction().wait(6);

    console.log("Verifying ValidatorToken...");
    await run("verify:verify", {
      address: validatorTokenAddress,
      constructorArguments: [],
    });

    console.log("Verifying ArtValidationNew...");
    await run("verify:verify", {
      address: artValidationNewAddress,
      constructorArguments: [validatorTokenAddress],
    });
  }

  // 5. Save deployment info
  const deploymentInfo = {
    validatorToken: validatorTokenAddress,
    artValidationNew: artValidationNewAddress,
    network: network.name,
    timestamp: new Date().toISOString()
  };

  const fs = require('fs');
  fs.writeFileSync(
    'deployment-info.json',
    JSON.stringify(deploymentInfo, null, 2)
  );
  console.log("Deployment info saved to deployment-info.json");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
const hre = require("hardhat");

async function main() {
  // Deploy ValidatorToken first
  const ValidatorToken = await hre.ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.waitForDeployment();
  console.log("ValidatorToken deployed to:", await validatorToken.getAddress());

  // Deploy ArtValidationNew with the ValidatorToken address
  const ArtValidationNew = await hre.ethers.getContractFactory("ArtValidationNew");
  const artValidationNew = await ArtValidationNew.deploy(await validatorToken.getAddress());
  await artValidationNew.waitForDeployment();
  console.log("ArtValidationNew deployed to:", await artValidationNew.getAddress());

  // Set the ArtValidationNew contract address in ValidatorToken
  const tx = await validatorToken.setArtValidationContract(await artValidationNew.getAddress());
  await tx.wait();
  console.log("ArtValidationNew contract set in ValidatorToken");

  // Verify contracts on Etherscan
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await validatorToken.deploymentTransaction().wait(6);
    await artValidationNew.deploymentTransaction().wait(6);

    console.log("Verifying ValidatorToken...");
    await hre.run("verify:verify", {
      address: await validatorToken.getAddress(),
      constructorArguments: [],
    });

    console.log("Verifying ArtValidationNew...");
    await hre.run("verify:verify", {
      address: await artValidationNew.getAddress(),
      constructorArguments: [await validatorToken.getAddress()],
    });
  }

  // Save deployment addresses to a file for easy reference
  const deploymentInfo = {
    validatorToken: await validatorToken.getAddress(),
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
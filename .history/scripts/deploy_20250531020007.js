const hre = require("hardhat");

async function main() {
  console.log("Deploying ArtValidation contract...");

  // Deploy ValidatorToken first
  const ValidatorToken = await hre.ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.waitForDeployment();
  console.log("ValidatorToken deployed to:", await validatorToken.getAddress());

  // Deploy ArtValidation with ValidatorToken address
  const ArtValidation = await hre.ethers.getContractFactory("ArtValidation");
  const artValidation = await ArtValidation.deploy(await validatorToken.getAddress());
  await artValidation.waitForDeployment();
  console.log("ArtValidation deployed to:", await artValidation.getAddress());

  // Set ArtValidation contract in ValidatorToken
  const tx = await validatorToken.setArtValidationContract(await artValidation.getAddress());
  await tx.wait();
  console.log("ValidatorToken configured with ArtValidation contract");

  console.log("\nDeployment Summary:");
  console.log("-------------------");
  console.log("ValidatorToken:", await validatorToken.getAddress());
  console.log("ArtValidation:", await artValidation.getAddress());

  // Verify contracts on Etherscan
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await validatorToken.deploymentTransaction().wait(6);
    await artValidation.deploymentTransaction().wait(6);

    console.log("Verifying ValidatorToken...");
    await hre.run("verify:verify", {
      address: await validatorToken.getAddress(),
      constructorArguments: [],
    });

    console.log("Verifying ArtValidation...");
    await hre.run("verify:verify", {
      address: await artValidation.getAddress(),
      constructorArguments: [await validatorToken.getAddress()],
    });
  }
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
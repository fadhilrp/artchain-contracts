const hre = require("hardhat");

async function main() {
  // Deploy ValidatorToken first
  const ValidatorToken = await hre.ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.waitForDeployment();
  console.log("ValidatorToken deployed to:", await validatorToken.getAddress());

  // Deploy ArtValidation with the ValidatorToken address
  const ArtValidation = await hre.ethers.getContractFactory("ArtValidation");
  const artValidation = await ArtValidation.deploy(await validatorToken.getAddress());
  await artValidation.waitForDeployment();
  console.log("ArtValidation deployed to:", await artValidation.getAddress());

  // Set the ArtValidation contract address in ValidatorToken
  const tx = await validatorToken.setArtValidationContract(await artValidation.getAddress());
  await tx.wait();
  console.log("ArtValidation contract set in ValidatorToken");

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

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
const hre = require("hardhat");

async function main() {
  // Deploy ValidatorToken first
  const ValidatorToken = await hre.ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.deployed();
  console.log("ValidatorToken deployed to:", validatorToken.address);

  // Deploy ArtValidation with the ValidatorToken address
  const ArtValidation = await hre.ethers.getContractFactory("ArtValidation");
  const artValidation = await ArtValidation.deploy(validatorToken.address);
  await artValidation.deployed();
  console.log("ArtValidation deployed to:", artValidation.address);

  // Set the ArtValidation contract address in ValidatorToken
  const tx = await validatorToken.setArtValidationContract(artValidation.address);
  await tx.wait();
  console.log("ArtValidation contract set in ValidatorToken");

  // Verify contracts on Etherscan
  if (hre.network.name === "sepolia") {
    console.log("Waiting for block confirmations...");
    await validatorToken.deployTransaction.wait(6);
    await artValidation.deployTransaction.wait(6);

    console.log("Verifying ValidatorToken...");
    await hre.run("verify:verify", {
      address: validatorToken.address,
      constructorArguments: [],
    });

    console.log("Verifying ArtValidation...");
    await hre.run("verify:verify", {
      address: artValidation.address,
      constructorArguments: [validatorToken.address],
    });
  }
}

main().catch((error) => {
  console.error(error);
  process.exitCode = 1;
}); 
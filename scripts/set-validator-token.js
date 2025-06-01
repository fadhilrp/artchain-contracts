const { ethers } = require("hardhat");

async function main() {
  // Get the ValidatorToken contract
  const validatorTokenAddress = "0xc3fb13Da28f5abf142A1b8219DF26A8Ab7127504"; // Your ValidatorToken address
  const ValidatorToken = await ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.attach(validatorTokenAddress);

  // Get the ArtValidationNew contract address
  const artValidationNewAddress = "0xB0990384c19159883CFE65F1Ae056CE15A489dd2"; // Your ArtValidationNew address

  console.log("Setting ArtValidation contract address in ValidatorToken...");
  console.log("ValidatorToken address:", validatorTokenAddress);
  console.log("ArtValidationNew address:", artValidationNewAddress);

  // Set the ArtValidation contract address
  const tx = await validatorToken.setArtValidationContract(artValidationNewAddress);
  await tx.wait();

  console.log("Successfully set ArtValidation contract address!");
  console.log("Transaction hash:", tx.hash);
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  });
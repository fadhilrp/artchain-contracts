const hre = require("hardhat");

async function main() {
  const contractAddress = "<YOUR ART ORACLE CONTRACT ADDRESS>";
  const artValidationContract = "<YOUR ART VALIDATION CONTRACT ADDRESS>";
  const constructorArgs = [artValidationContract];

  console.log("Verifying ArtOracle contract...");
  await verify(
    contractAddress,
    "contracts/ArtOracle.sol:ArtAIOracle",
    constructorArgs
  );
}

async function verify(address, contract, args) {
  try {
    return await hre.run("verify:verify", {
      address: address,
      contract: contract,
      constructorArguments: args,
    });
  } catch (e) {
    console.log(address, args, e);
  }
}

main()
  .then(() => process.exit(0))
  .catch((e) => {
    console.error(e);
    process.exit(1);
  }); 
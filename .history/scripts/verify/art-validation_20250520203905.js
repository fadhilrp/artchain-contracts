const hre = require("hardhat");

async function main() {
  const contractAddress = "<YOUR ART VALIDATION CONTRACT ADDRESS>";
  const tokenContract = "<YOUR VALIDATOR TOKEN CONTRACT ADDRESS>";
  const constructorArgs = [tokenContract];

  console.log("Verifying ArtValidation contract...");
  await verify(
    contractAddress,
    "contracts/ArtValidation.sol:ArtValidation",
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
const hre = require("hardhat");

async function main() {
  const contractAddress = "0xd1219EA7976C84380f386881F4a6823Be2410ED9";
  const constructorArgs = []; // ValidatorToken has no constructor arguments

  console.log("Verifying ValidatorToken contract...");
  await verify(
    contractAddress,
    "contracts/ValidatorToken.sol:ValidatorToken",
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
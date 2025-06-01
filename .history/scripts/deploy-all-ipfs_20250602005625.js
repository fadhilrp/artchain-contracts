const { ethers } = require("hardhat");

async function main() {
  console.log("Deploying complete ArtChain system with IPFS support...");

  // 1. Deploy ValidatorToken
  console.log("Deploying ValidatorToken...");
  const ValidatorToken = await ethers.getContractFactory("ValidatorToken");
  const validatorToken = await ValidatorToken.deploy();
  await validatorToken.waitForDeployment();
  const validatorTokenAddress = await validatorToken.getAddress();
  console.log("ValidatorToken deployed to:", validatorTokenAddress);

  // 2. Deploy ArtValidationIPFS with the ValidatorToken address
  console.log("Deploying ArtValidationIPFS...");
  const ArtValidationIPFS = await ethers.getContractFactory("ArtValidationIPFS");
  const artValidationIPFS = await ArtValidationIPFS.deploy(validatorTokenAddress);
  await artValidationIPFS.waitForDeployment();
  const artValidationIPFSAddress = await artValidationIPFS.getAddress();
  console.log("ArtValidationIPFS deployed to:", artValidationIPFSAddress);

  // 3. Set the ArtValidation contract in ValidatorToken
  console.log("Setting ArtValidationIPFS contract in ValidatorToken...");
  const tx = await validatorToken.setArtValidationContract(artValidationIPFSAddress);
  await tx.wait();
  console.log("Successfully linked ValidatorToken with ArtValidationIPFS!");

  // 4. Test the deployment by checking the link
  console.log("Verifying contract linkage...");
  const linkedContract = await validatorToken.artValidationContract();
  console.log("ValidatorToken linked to:", linkedContract);
  console.log("Expected:", artValidationIPFSAddress);
  console.log("Link verified:", linkedContract === artValidationIPFSAddress);

  // 5. Save deployment info for both old and new formats
  const fs = require('fs');
  
  // Save in the format expected by blockchain-ipfs.js
  const ipfsDeploymentInfo = {
    contractAddress: artValidationIPFSAddress,
    contractName: "ArtValidationIPFS",
    network: network.name,
    deployedAt: new Date().toISOString(),
    tokenContractAddress: validatorTokenAddress
  };
  
  fs.writeFileSync(
    'deployment-ipfs-info.json',
    JSON.stringify(ipfsDeploymentInfo, null, 2)
  );
  
  // Also save complete deployment info
  const completeDeploymentInfo = {
    validatorToken: validatorTokenAddress,
    artValidationIPFS: artValidationIPFSAddress,
    artValidationLegacy: null, // We're not deploying the old contract
    network: network.name,
    timestamp: new Date().toISOString(),
    contracts: {
      ValidatorToken: {
        address: validatorTokenAddress,
        verified: false
      },
      ArtValidationIPFS: {
        address: artValidationIPFSAddress,
        verified: false
      }
    }
  };

  fs.writeFileSync(
    'deployment-complete-info.json',
    JSON.stringify(completeDeploymentInfo, null, 2)
  );

  console.log("Deployment info saved to:");
  console.log("- deployment-ipfs-info.json (for blockchain-ipfs.js)");
  console.log("- deployment-complete-info.json (complete system info)");

  // 6. Verify contracts on Etherscan if on testnet/mainnet
  if (network.name === "sepolia" && process.env.ETHERSCAN_API_KEY) {
    console.log("Waiting for block confirmations...");
    await validatorToken.deploymentTransaction().wait(6);
    await artValidationIPFS.deploymentTransaction().wait(6);

    try {
      console.log("Verifying ValidatorToken on Etherscan...");
      await run("verify:verify", {
        address: validatorTokenAddress,
        constructorArguments: [],
      });
      completeDeploymentInfo.contracts.ValidatorToken.verified = true;

      console.log("Verifying ArtValidationIPFS on Etherscan...");
      await run("verify:verify", {
        address: artValidationIPFSAddress,
        constructorArguments: [validatorTokenAddress],
      });
      completeDeploymentInfo.contracts.ArtValidationIPFS.verified = true;

      // Update deployment info with verification status
      fs.writeFileSync(
        'deployment-complete-info.json',
        JSON.stringify(completeDeploymentInfo, null, 2)
      );

      console.log("Contracts verified on Etherscan!");
    } catch (error) {
      console.log("Error verifying contracts:", error.message);
    }
  }

  console.log("\n🎉 Deployment Complete!");
  console.log("======================");
  console.log(`ValidatorToken: ${validatorTokenAddress}`);
  console.log(`ArtValidationIPFS: ${artValidationIPFSAddress}`);
  console.log(`Network: ${network.name}`);
  console.log("\n✅ The system is ready to use with IPFS storage!");
  console.log("✅ Backend will automatically detect and use the IPFS-enabled contract");
  console.log("✅ Artwork images will be stored and retrieved directly from blockchain");
}

main()
  .then(() => process.exit(0))
  .catch((error) => {
    console.error(error);
    process.exit(1);
  }); 
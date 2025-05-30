const { ethers } = require('ethers');
const ArtChain = require('../artifacts/contracts/ArtChain.sol/ArtChain.json');

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);
const contract = new ethers.Contract(
  process.env.CONTRACT_ADDRESS,
  ArtChain.abi,
  wallet
);

// Function to submit artwork to blockchain
async function submitArtwork(imageHash) {
  try {
    const tx = await contract.submitArtwork(imageHash);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error submitting artwork:', error);
    throw error;
  }
}

// Function to validate artwork
async function validateArtwork(imageHash, isOriginal, originalAuthor) {
  try {
    const tx = await contract.validateArtwork(imageHash, isOriginal, originalAuthor);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error validating artwork:', error);
    // Check if this is an "Already voted" error
    if (error.reason === 'Already voted') {
      throw new Error('Already voted');
    }
    throw new Error('Failed to validate artwork on blockchain');
  }
}

// Function to get artwork details
async function getArtworkDetails(imageHash) {
  try {
    const details = await contract.getArtworkDetails(imageHash);
    return {
      isOriginal: details[0],
      validated: details[1],
      consensusCount: details[2],
      requiredValidators: details[3],
      originalAuthor: details[4],
    };
  } catch (error) {
    console.error('Error getting artwork details:', error);
    return null;
  }
}

module.exports = {
  submitArtwork,
  validateArtwork,
  getArtworkDetails,
}; 
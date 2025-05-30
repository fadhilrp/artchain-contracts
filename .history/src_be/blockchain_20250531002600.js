require('dotenv').config();
const { ethers } = require('ethers');
const ArtValidation = require('../artifacts-zk/contracts/ArtValidation.sol/ArtValidation.json');

// Initialize provider and contract with hardcoded values
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/5adc04e9ea8646d481e94c0475580fe6");
const wallet = new ethers.Wallet("0x74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd", provider);
const contract = new ethers.Contract(
  "0x65832592c9b9a80d8Da2BA90e13b1313b2217374",
  ArtValidation.abi,
  wallet
);

// Log initialization
console.log('Initialized blockchain connection with:');
console.log('Contract Address:', contract.address);
console.log('Wallet Address:', wallet.address);

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
async function validateArtwork(imageHash, isOriginal, originalAuthor, validatorAddress) {
  try {
    // Check if the validator has already voted
    const hasVoted = await contract.hasVoted(imageHash, validatorAddress);
    if (hasVoted) {
      throw new Error('Already voted');
    }

    const tx = await contract.validateArtwork(imageHash, isOriginal, originalAuthor);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error validating artwork:', error);
    // Check if this is an "Already voted" error
    if (error.reason === 'Already voted' || error.message === 'Already voted') {
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
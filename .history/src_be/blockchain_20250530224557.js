const { ethers } = require('ethers');
const ArtValidation = require('../artifacts-zk/contracts/ArtValidation.sol/ArtValidation.json');
const ValidatorToken = require('../artifacts-zk/contracts/ValidatorToken.sol/ValidatorToken.json');

// Contract addresses - replace these with your deployed contract addresses
const ART_VALIDATION_ADDRESS = process.env.ART_VALIDATION_ADDRESS;
const VALIDATOR_TOKEN_ADDRESS = process.env.VALIDATOR_TOKEN_ADDRESS;

// Initialize provider and signer
const provider = new ethers.providers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(process.env.PRIVATE_KEY, provider);

// Initialize contracts
const artValidation = new ethers.Contract(
  ART_VALIDATION_ADDRESS,
  ArtValidation.abi,
  wallet
);

const validatorToken = new ethers.Contract(
  VALIDATOR_TOKEN_ADDRESS,
  ValidatorToken.abi,
  wallet
);

// Function to submit artwork to blockchain
async function submitArtwork(imageHash) {
  try {
    const tx = await artValidation.submitArtwork(imageHash);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error submitting artwork:', error);
    return false;
  }
}

// Function to validate artwork
async function validateArtwork(imageHash, isOriginal, originalAuthor) {
  try {
    const tx = await artValidation.validateArtwork(imageHash, isOriginal, originalAuthor);
    await tx.wait();
    return true;
  } catch (error) {
    console.error('Error validating artwork:', error);
    return false;
  }
}

// Function to get artwork details
async function getArtworkDetails(imageHash) {
  try {
    const artwork = await artValidation.artworks(imageHash);
    return {
      imageHash: artwork.imageHash,
      artist: artwork.artist,
      timestamp: artwork.timestamp.toNumber(),
      originalAuthor: artwork.originalAuthor,
      validated: artwork.validated,
      isOriginal: artwork.isOriginal,
      consensusCount: artwork.consensusCount.toNumber(),
      requiredValidators: artwork.requiredValidators.toNumber()
    };
  } catch (error) {
    console.error('Error getting artwork details:', error);
    return null;
  }
}

module.exports = {
  submitArtwork,
  validateArtwork,
  getArtworkDetails
}; 
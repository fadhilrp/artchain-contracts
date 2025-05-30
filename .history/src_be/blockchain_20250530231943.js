const { ethers } = require('ethers');
const ArtValidation = require('../artifacts-zk/contracts/ArtValidation.sol/ArtValidation.json');
const ValidatorToken = require('../artifacts-zk/contracts/ValidatorToken.sol/ValidatorToken.json');

// Contract addresses - replace these with your deployed contract addresses
const ART_VALIDATION_ADDRESS = process.env.ART_VALIDATION_ADDRESS;
const VALIDATOR_TOKEN_ADDRESS = process.env.VALIDATOR_TOKEN_ADDRESS;

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider(process.env.SEPOLIA_RPC_URL);
const wallet = new ethers.Wallet(""74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd"", provider);

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
      timestamp: artwork.timestamp,
      originalAuthor: artwork.originalAuthor,
      validated: artwork.validated,
      isOriginal: artwork.isOriginal,
      consensusCount: artwork.consensusCount,
      requiredValidators: artwork.requiredValidators
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
const { ethers } = require('ethers');
const ArtValidation = require('../artifacts-zk/contracts/ArtValidation.sol/ArtValidation.json');
const ValidatorToken = require('../artifacts-zk/contracts/ValidatorToken.sol/ValidatorToken.json');

// Contract addresses - replace these with your deployed contract addresses
const ART_VALIDATION_ADDRESS = "0x5FbDB2315678afecb367f032d93F642f64180aa3";
const VALIDATOR_TOKEN_ADDRESS = "0xc3fb13Da28f5abf142A1b8219DF26A8Ab7127504";

// Initialize provider and signer
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/5adc04e9ea8646d481e94c0475580fe6");
const wallet = new ethers.Wallet("0x74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd", provider);

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
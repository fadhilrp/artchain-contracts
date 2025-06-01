require('dotenv').config();
const { ethers } = require('ethers');
const ArtValidationNew = require('../artifacts/contracts/ArtValidationNew.sol/ArtValidationNew.json');

// Initialize provider and contract with hardcoded values
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/5adc04e9ea8646d481e94c0475580fe6");
const wallet = new ethers.Wallet("0x74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd", provider);
const contract = new ethers.Contract(
  "0xB0990384c19159883CFE65F1Ae056CE15A489dd2",
  ArtValidationNew.abi,
  wallet
);

// Log initialization
console.log('Initialized blockchain connection with:');
console.log('Contract Address:', contract.target);
console.log('Wallet Address:', wallet.address);

// Function to get all artworks
async function getAllArtworks() {
  try {
    // Get the total number of artworks
    const totalArtworks = await contract.getTotalArtworks();
    const artworks = [];

    // Fetch details for each artwork
    for (let i = 0; i < totalArtworks; i++) {
      const imageHash = await contract.getArtworkHash(i);
      const artwork = await contract.artworks(imageHash);
      
      artworks.push({
        imageHash,
        artist: artwork.artist,
        timestamp: new Date(Number(artwork.timestamp) * 1000).toISOString(),
        originalAuthor: artwork.originalAuthor,
        validated: artwork.validated,
        isOriginal: artwork.isOriginal,
        consensusCount: artwork.consensusCount,
        requiredValidators: artwork.requiredValidators
      });
    }

    return artworks;
  } catch (error) {
    console.error('Error getting all artworks:', error);
    throw error;
  }
}

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
    const artwork = await contract.artworks(imageHash);
    return {
      artist: artwork.artist,
      timestamp: new Date(Number(artwork.timestamp) * 1000).toISOString(),
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
  getArtworkDetails,
  getAllArtworks,
}; 
require('dotenv').config();
const { ethers } = require('ethers');

// Initialize provider and contract with hardcoded values for now
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/5adc04e9ea8646d481e94c0475580fe6");
const wallet = new ethers.Wallet("0x74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd", provider);

// This will be updated after deployment
let contract = null;
let contractAddress = null;

// Try to load deployment info
try {
  const deploymentInfo = require('../deployment-ipfs-info.json');
  contractAddress = deploymentInfo.contractAddress;
  const ArtValidationIPFS = require('../artifacts/contracts/ArtValidationIPFS.sol/ArtValidationIPFS.json');
  contract = new ethers.Contract(contractAddress, ArtValidationIPFS.abi, wallet);
  
  console.log('Initialized IPFS blockchain connection with:');
  console.log('Contract Address:', contractAddress);
  console.log('Wallet Address:', wallet.address);
} catch (error) {
  console.warn('IPFS contract not deployed yet. Please run deployment first.');
  console.warn('Error:', error.message);
}

// Function to get all artworks with IPFS data
async function getAllArtworksIPFS() {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    // Get the total number of artworks
    const totalArtworks = await contract.getTotalArtworks();
    const artworks = [];

    // Fetch details for each artwork including IPFS data
    for (let i = 0; i < totalArtworks; i++) {
      const imageHash = await contract.getArtworkHash(i);
      const artworkDetails = await contract.getArtworkDetails(imageHash);
      
      // Destructure the returned tuple
      const [
        hash,
        artist,
        timestamp,
        originalAuthor,
        validated,
        isOriginal,
        consensusCount,
        requiredValidators,
        ipfsImageUris,
        ipfsMetadataUri,
        title,
        description,
        medium,
        additionalInfo
      ] = artworkDetails;

      artworks.push({
        imageHash: hash,
        artist: artist,
        timestamp: new Date(Number(timestamp) * 1000).toISOString(),
        originalAuthor: originalAuthor,
        validated: validated,
        isOriginal: isOriginal,
        consensusCount: consensusCount,
        requiredValidators: requiredValidators,
        ipfsImageUris: ipfsImageUris,
        ipfsMetadataUri: ipfsMetadataUri,
        title: title,
        description: description,
        medium: medium,
        additionalInfo: additionalInfo
      });
    }

    return artworks;
  } catch (error) {
    console.error('Error getting all artworks with IPFS:', error);
    throw error;
  }
}

// Function to submit artwork with IPFS data to blockchain
async function submitArtworkIPFS(
  imageHash,
  ipfsImageUris,
  ipfsMetadataUri,
  title,
  description,
  medium,
  additionalInfo
) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    const tx = await contract.submitArtwork(
      imageHash,
      ipfsImageUris,
      ipfsMetadataUri,
      title,
      description,
      medium,
      additionalInfo
    );
    
    await tx.wait();
    console.log('Artwork submitted to blockchain with IPFS data:', {
      imageHash,
      title,
      ipfsImageCount: ipfsImageUris.length,
      metadataUri: ipfsMetadataUri
    });
    
    return true;
  } catch (error) {
    console.error('Error submitting artwork with IPFS:', error);
    throw error;
  }
}

// Function to validate artwork (same as before)
async function validateArtworkIPFS(imageHash, isOriginal, originalAuthor, validatorAddress) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
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

// Function to get artwork details with IPFS data
async function getArtworkDetailsIPFS(imageHash) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    const artworkDetails = await contract.getArtworkDetails(imageHash);
    
    // Destructure the returned tuple
    const [
      hash,
      artist,
      timestamp,
      originalAuthor,
      validated,
      isOriginal,
      consensusCount,
      requiredValidators,
      ipfsImageUris,
      ipfsMetadataUri,
      title,
      description,
      medium,
      additionalInfo
    ] = artworkDetails;

    return {
      imageHash: hash,
      artist: artist,
      timestamp: new Date(Number(timestamp) * 1000).toISOString(),
      originalAuthor: originalAuthor,
      validated: validated,
      isOriginal: isOriginal,
      consensusCount: consensusCount,
      requiredValidators: requiredValidators,
      ipfsImageUris: ipfsImageUris,
      ipfsMetadataUri: ipfsMetadataUri,
      title: title,
      description: description,
      medium: medium,
      additionalInfo: additionalInfo
    };
  } catch (error) {
    console.error('Error getting artwork details:', error);
    return null;
  }
}

// Function to get only IPFS data for an artwork
async function getArtworkIPFSData(imageHash) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    const [ipfsImageUris, ipfsMetadataUri] = await contract.getArtworkIPFS(imageHash);
    return {
      ipfsImageUris,
      ipfsMetadataUri
    };
  } catch (error) {
    console.error('Error getting artwork IPFS data:', error);
    return null;
  }
}

// Function to check if contract is deployed and ready
function isContractReady() {
  return contract !== null;
}

// Function to get contract info
function getContractInfo() {
  return {
    address: contractAddress,
    isReady: isContractReady()
  };
}

module.exports = {
  getAllArtworksIPFS,
  submitArtworkIPFS,
  validateArtworkIPFS,
  getArtworkDetailsIPFS,
  getArtworkIPFSData,
  isContractReady,
  getContractInfo,
  
  // Legacy exports for backward compatibility
  submitArtwork: submitArtworkIPFS,
  validateArtwork: validateArtworkIPFS,
  getArtworkDetails: getArtworkDetailsIPFS,
  getAllArtworks: getAllArtworksIPFS,
}; 
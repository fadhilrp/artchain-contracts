require('dotenv').config();
const { ethers } = require('ethers');

// Initialize provider and contract
const provider = new ethers.JsonRpcProvider("https://sepolia.infura.io/v3/5adc04e9ea8646d481e94c0475580fe6");
const wallet = new ethers.Wallet("0x74deef292241a189d5bf39dc2cd12e0f9aeebb956ff082ccee03fc8f98c10ebd", provider);

// Contract addresses from deployment
const VALIDATOR_TOKEN_ADDRESS = "0xc3fb13Da28f5abf142A1b8219DF26A8Ab7127504";
const ART_VALIDATION_ADDRESS = "0x5bf9f5f8d02A6Efc12E5Ae79D6f99E7cB0B577af";

// Initialize contract
let contract = null;
let contractAddress = ART_VALIDATION_ADDRESS;

// Initialize the contract
try {
  const ArtValidation = require('../artifacts/contracts/ArtValidation.sol/ArtValidation.json');
  contract = new ethers.Contract(ART_VALIDATION_ADDRESS, ArtValidation.abi, wallet);
  
  console.log('✅ Initialized unified ArtValidation blockchain connection with:');
  console.log('- ValidatorToken Address:', VALIDATOR_TOKEN_ADDRESS);
  console.log('- ArtValidation Address:', ART_VALIDATION_ADDRESS);
  console.log('- Wallet Address:', wallet.address);
  console.log('- Network: Sepolia');
  console.log('- Features: IPFS support + Legacy compatibility');
} catch (error) {
  console.error('❌ Error initializing unified ArtValidation contract:', error.message);
  console.error('Please ensure the contract is compiled and deployed.');
}

// Function to get all artworks with full details
async function getAllArtworks() {
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
        // IPFS data (may be empty for legacy artworks)
        ipfsImageUris: ipfsImageUris,
        ipfsMetadataUri: ipfsMetadataUri,
        title: title,
        description: description,
        medium: medium,
        additionalInfo: additionalInfo,
        // Additional computed fields
        hasIPFS: ipfsImageUris.length > 0,
        isLegacy: ipfsImageUris.length === 0
      });
    }

    return artworks;
  } catch (error) {
    console.error('Error getting all artworks:', error);
    throw error;
  }
}

// Function to submit artwork with IPFS data
async function submitArtworkWithIPFS(
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

    const tx = await contract['submitArtwork(bytes32,string[],string,string,string,string,string)'](
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

// Function to submit artwork (legacy - without IPFS)
async function submitArtwork(imageHash) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    const tx = await contract['submitArtwork(bytes32)'](imageHash);
    await tx.wait();
    console.log('Legacy artwork submitted to blockchain:', { imageHash });
    return true;
  } catch (error) {
    console.error('Error submitting legacy artwork:', error);
    throw error;
  }
}

// Function to validate artwork
async function validateArtwork(imageHash, isOriginal, originalAuthor, validatorAddress) {
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

// Function to get artwork details
async function getArtworkDetails(imageHash) {
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
      additionalInfo: additionalInfo,
      hasIPFS: ipfsImageUris.length > 0,
      isLegacy: ipfsImageUris.length === 0
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
      ipfsMetadataUri,
      hasIPFS: ipfsImageUris.length > 0
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
    isReady: isContractReady(),
    type: 'unified',
    features: ['IPFS support', 'Legacy compatibility', 'Enhanced metadata']
  };
}

// Function to check if artwork has IPFS data
async function hasIPFSData(imageHash) {
  try {
    if (!contract) {
      throw new Error('Contract not initialized. Please deploy the contract first.');
    }

    return await contract.hasIPFSData(imageHash);
  } catch (error) {
    console.error('Error checking IPFS data:', error);
    return false;
  }
}

module.exports = {
  // Main functions
  getAllArtworks,
  submitArtworkWithIPFS,
  submitArtwork,
  validateArtwork,
  getArtworkDetails,
  getArtworkIPFSData,
  hasIPFSData,
  isContractReady,
  getContractInfo,
  
  // Aliases for backward compatibility
  getAllArtworksIPFS: getAllArtworks,
  submitArtworkIPFS: submitArtworkWithIPFS,
  validateArtworkIPFS: validateArtwork,
  getArtworkDetailsIPFS: getArtworkDetails,
}; 
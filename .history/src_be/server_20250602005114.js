const express = require('express');
const multer = require('multer');
const cors = require('cors');
const { ethers } = require('ethers');
const app = express();
const port = 3001;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient({
  log: ['query', 'info', 'warn', 'error'],
});

// Try to use new IPFS blockchain integration, fallback to old one
let blockchain;
try {
  blockchain = require('./blockchain-ipfs');
  console.log('Using IPFS-enabled blockchain integration');
  
  // Check if contract is ready
  if (!blockchain.isContractReady()) {
    console.warn('IPFS contract not ready, falling back to legacy blockchain');
    blockchain = require('./blockchain');
  }
} catch (error) {
  console.warn('IPFS blockchain not available, using legacy blockchain:', error.message);
  blockchain = require('./blockchain');
}

// Middleware
app.use(cors());
app.use(express.json());

// Helper function to convert BigInt to string
function convertBigIntToString(obj) {
  if (obj === null || obj === undefined) {
    return obj;
  }
  
  if (typeof obj === 'bigint') {
    return obj.toString();
  }
  
  if (Array.isArray(obj)) {
    return obj.map(convertBigIntToString);
  }
  
  if (typeof obj === 'object') {
    const newObj = {};
    for (const key in obj) {
      newObj[key] = convertBigIntToString(obj[key]);
    }
    return newObj;
  }
  
  return obj;
}

// Multer for file uploads (legacy endpoint)
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simulate VLM validation
function validateWithVLM(imageBuffer) {
  // TODO: Replace with real VLM logic
  return Math.random() < 0.5 ? 'duplicate' : 'original';
}

// Generate image hash from IPFS URI (for blockchain compatibility)
function generateHashFromIPFS(imageUri, metadata) {
  // Create a deterministic hash from IPFS URI + metadata
  const combined = JSON.stringify({
    image: imageUri,
    title: metadata.title,
    artist: metadata.artist,
    timestamp: Date.now()
  });
  return ethers.keccak256(ethers.toUtf8Bytes(combined));
}

// New IPFS-integrated upload endpoint
app.post('/upload-ipfs', async (req, res) => {
  try {
    const { imageUris, metadataUri, metadata } = req.body;

    if (!imageUris || !imageUris.length || !metadata) {
      return res.status(400).json({ error: 'Missing required fields: imageUris and metadata' });
    }

    console.log('Processing IPFS upload:', {
      imageCount: imageUris.length,
      metadataUri,
      title: metadata.name
    });

    // 1. Generate image hash for blockchain (using primary image and metadata)
    const imageHash = generateHashFromIPFS(imageUris[0], metadata);
    console.log('Generated image hash:', imageHash);

    // 2. Check if using IPFS-enabled contract
    if (blockchain.isContractReady && blockchain.isContractReady()) {
      console.log('Using IPFS-enabled smart contract');
      
      // Submit to new IPFS-enabled blockchain contract
      const submitted = await blockchain.submitArtworkIPFS(
        imageHash,
        imageUris,
        metadataUri || '',
        metadata.name || 'Untitled',
        metadata.description || '',
        metadata.properties?.medium || 'Digital Art',
        metadata.properties?.additionalInfo || ''
      );
      
      if (!submitted) {
        throw new Error('Failed to submit artwork to IPFS-enabled blockchain');
      }
      
      console.log('Artwork submitted to IPFS-enabled blockchain successfully');
      
      // 3. Simulate VLM validation (using IPFS URI instead of buffer)
      const validationResult = Math.random() < 0.8 ? 'original' : 'duplicate';
      const isOriginal = validationResult === 'original';

      // 4. Submit validation to blockchain
      const validated = await blockchain.validateArtworkIPFS(
        imageHash,
        isOriginal,
        isOriginal ? metadata.properties?.artist || 'Unknown' : 'Unknown'
      );

      if (!validated) {
        throw new Error('Failed to validate artwork on IPFS-enabled blockchain');
      }

      // 5. Get artwork details from blockchain
      const artworkDetails = await blockchain.getArtworkDetailsIPFS(imageHash);

      // 6. Save to database with complete IPFS data
      const artwork = await prisma.artwork.upsert({
        where: {
          imageHash: imageHash
        },
        update: {
          title: metadata.name || 'Untitled',
          artist: metadata.properties?.artist || 'Unknown Artist',
          // Store original IPFS data for backward compatibility
          imageUrl: JSON.stringify({
            ipfsImages: imageUris,
            metadataUri: metadataUri,
            description: metadata.description,
            medium: metadata.properties?.medium,
            year: metadata.properties?.year,
            dimensions: metadata.properties?.dimensions,
            additionalInfo: metadata.properties?.additionalInfo
          }),
          isOriginal,
          validated: artworkDetails?.validated || true,
          consensusCount: Number(artworkDetails?.consensusCount || 1),
          requiredValidators: Number(artworkDetails?.requiredValidators || 2),
          updatedAt: new Date(),
        },
        create: {
          imageHash,
          title: metadata.name || 'Untitled',
          artist: metadata.properties?.artist || 'Unknown Artist',
          imageUrl: JSON.stringify({
            ipfsImages: imageUris,
            metadataUri: metadataUri,
            description: metadata.description,
            medium: metadata.properties?.medium,
            year: metadata.properties?.year,
            dimensions: metadata.properties?.dimensions,
            additionalInfo: metadata.properties?.additionalInfo
          }),
          isOriginal: true,
          validated: true,
          consensusCount: 1,
          requiredValidators: 2,
          timestamp: new Date(),
        },
      });

      console.log('Artwork saved to database:', artwork.id);

      res.json({
        success: true,
        artwork: convertBigIntToString(artwork),
        imageHash,
        blockchain: 'ipfs-enabled',
        message: 'Artwork successfully uploaded to IPFS-enabled blockchain and stored'
      });
      
    } else {
      console.log('Using legacy blockchain (no IPFS storage)');
      
      // Fallback to old blockchain method
      const submitted = await blockchain.submitArtwork(imageHash);
      console.log('Artwork submission result:', submitted);
      if (!submitted) {
        throw new Error('Failed to submit artwork to blockchain');
      }

      // Continue with legacy flow...
      const validationResult = Math.random() < 0.8 ? 'original' : 'duplicate';
      const isOriginal = validationResult === 'original';

      const validated = await blockchain.validateArtwork(
        imageHash,
        isOriginal,
        isOriginal ? metadata.properties?.artist || 'Unknown' : 'Unknown'
      );

      if (!validated) {
        throw new Error('Failed to validate artwork on blockchain');
      }

      const artworkDetails = await blockchain.getArtworkDetails(imageHash);

      const artwork = await prisma.artwork.upsert({
        where: {
          imageHash: imageHash
        },
        update: {
          title: metadata.name || 'Untitled',
          artist: metadata.properties?.artist || 'Unknown Artist',
          imageUrl: JSON.stringify({
            ipfsImages: imageUris,
            metadataUri: metadataUri,
            description: metadata.description,
            medium: metadata.properties?.medium,
            year: metadata.properties?.year,
            dimensions: metadata.properties?.dimensions,
            additionalInfo: metadata.properties?.additionalInfo
          }),
          isOriginal,
          validated,
          consensusCount: Number(artworkDetails?.consensusCount || 1),
          requiredValidators: Number(artworkDetails?.requiredValidators || 2),
          updatedAt: new Date(),
        },
        create: {
          imageHash,
          title: metadata.name || 'Untitled',
          artist: metadata.properties?.artist || 'Unknown Artist',
          imageUrl: JSON.stringify({
            ipfsImages: imageUris,
            metadataUri: metadataUri,
            description: metadata.description,
            medium: metadata.properties?.medium,
            year: metadata.properties?.year,
            dimensions: metadata.properties?.dimensions,
            additionalInfo: metadata.properties?.additionalInfo
          }),
          isOriginal: true,
          validated: true,
          consensusCount: 1,
          requiredValidators: 2,
          timestamp: new Date(),
        },
      });

      console.log('Artwork saved to database:', artwork.id);

      res.json({
        success: true,
        artwork: convertBigIntToString(artwork),
        imageHash,
        blockchain: 'legacy',
        message: 'Artwork successfully uploaded to legacy blockchain and stored'
      });
    }

  } catch (error) {
    console.error('Error processing IPFS artwork:', error);
    res.status(500).json({ 
      error: 'Failed to process artwork',
      details: error.message 
    });
  }
});

app.post('/ai-vlm', async (req, res) => {
  const result = {
    image_similarity: +(Math.random() * 100).toFixed(2),
    metadata_similarity: +(Math.random() * 100).toFixed(2),
    confidence: +(Math.random() * 100).toFixed(2),
  };
  res.json(result);
});

// Legacy upload endpoint (keep for backward compatibility)
app.post('/upload', upload.single('image'), async (req, res) => {
  const { artist, title } = req.body;
  const imageBuffer = req.file.buffer;

  try {
    // 1. Generate image hash
    const imageHash = ethers.keccak256(imageBuffer);
    console.log('Generated image hash:', imageHash);

    // 2. Submit to blockchain
    const submitted = await blockchain.submitArtwork(imageHash);
    console.log('Artwork submission result:', submitted);
    if (!submitted) {
      throw new Error('Failed to submit artwork to blockchain');
    }

    // 3. Simulate validators decoding hash and VLM validation
    const validationResult = validateWithVLM(imageBuffer);
    const isOriginal = validationResult === 'original';

    // // 4. Submit validation to blockchain
    const validated = await blockchain.validateArtwork(
      imageHash,
      isOriginal,
      isOriginal ? artist : 'Unknown'
    );

    if (!validated) {
      throw new Error('Failed to validate artwork on blockchain');
    }

    // // 5. Get artwork details from blockchain
    const artworkDetails = await blockchain.getArtworkDetails(imageHash);

    // 6. Save to database (backward compatibility format)
    const artwork = await prisma.artwork.upsert({
      where: {
        imageHash: imageHash
      },
      update: {
        artist,
        title,
        isOriginal,
        validated,
        consensusCount: Number(artworkDetails?.consensusCount || 1n),
        requiredValidators: Number(artworkDetails?.requiredValidators || 2n),
        originalAuthor: artworkDetails?.originalAuthor || artist,
        updatedAt: new Date(),
      },
      create: {
        imageHash,
        title: title || 'Untitled',
        artist,
        isOriginal: true,
        validated: true,
        consensusCount: 1,
        requiredValidators: 2,
        originalAuthor: artist,
        timestamp: new Date(),
      },
    });

    res.json(artwork);
  } catch (error) {
    console.error('Error processing artwork:', error);
    res.status(500).json({ error: 'Failed to process artwork' });
  }
});

// Endpoint to fetch all artworks
app.get('/artworks', async (req, res) => {
  try {
    const artworks = await prisma.artwork.findMany({ orderBy: { timestamp: 'desc' } });
    
    // Transform artworks to include IPFS data
    const transformedArtworks = artworks.map(artwork => {
      let ipfsData = {};
      
      // Try to parse IPFS data from imageUrl
      if (artwork.imageUrl) {
        try {
          ipfsData = JSON.parse(artwork.imageUrl);
        } catch (e) {
          // If parsing fails, treat as regular imageUrl
          ipfsData = { imageUrl: artwork.imageUrl };
        }
      }
      
      return {
        ...artwork,
        // Add IPFS fields if available
        imageUris: ipfsData.ipfsImages || [],
        metadataUri: ipfsData.metadataUri || null,
        description: ipfsData.description || null,
        medium: ipfsData.medium || null,
        year: ipfsData.year || null,
        dimensions: ipfsData.dimensions || null,
        additionalInfo: ipfsData.additionalInfo || null,
        // Keep original imageUrl for backward compatibility
        originalImageUrl: ipfsData.imageUrl || artwork.imageUrl || ''
      };
    });
    
    res.json(transformedArtworks);
  } catch (err) {
    console.error('Error fetching artworks:', err);
    res.status(500).json({ error: 'Failed to fetch artworks.' });
  }
});

// Endpoint to validate artwork
app.post('/validate', async (req, res) => {
  const { imageHash, isOriginal, originalAuthor, validatorAddress } = req.body;

  if (!imageHash || typeof isOriginal !== 'boolean' || !validatorAddress) {
    return res.status(400).json({ error: 'Missing required fields' });
  }

  try {
    // 1. Submit validation to blockchain
    const validated = await blockchain.validateArtwork(
      imageHash,
      isOriginal,
      originalAuthor || 'Unknown',
      validatorAddress
    );

    // 2. Get updated artwork details from blockchain
    const artworkDetails = await blockchain.getArtworkDetails(imageHash);
    const serializedDetails = convertBigIntToString(artworkDetails);

    // 3. Update database with new validation results
    const artwork = await prisma.artwork.upsert({
      where: {
        imageHash: imageHash
      },
      update: {
        isOriginal: serializedDetails?.isOriginal || isOriginal,
        validated: serializedDetails?.validated || true,
        consensusCount: Number(serializedDetails?.consensusCount || 1),
        requiredValidators: Number(serializedDetails?.requiredValidators || 2),
        originalAuthor: serializedDetails?.originalAuthor || originalAuthor || 'Unknown',
        updatedAt: new Date(),
      },
      create: {
        imageHash: imageHash,
        artist: serializedDetails?.artist || 'Unknown',
        title: 'Unknown',
        isOriginal: serializedDetails?.isOriginal || isOriginal,
        validated: serializedDetails?.validated || true,
        consensusCount: Number(serializedDetails?.consensusCount || 1),
        requiredValidators: Number(serializedDetails?.requiredValidators || 2),
        originalAuthor: serializedDetails?.originalAuthor || originalAuthor || 'Unknown',
        timestamp: new Date(serializedDetails?.timestamp || Date.now()),
        updatedAt: new Date(),
      },
    });

    res.json({
      success: true,
      artwork,
      message: 'Artwork validation submitted successfully'
    });
  } catch (error) {
    console.error('Error validating artwork:', error);
    
    // Check for specific blockchain errors
    if (error.message === 'Already voted') {
      return res.status(400).json({ 
        error: 'Validation failed',
        details: 'You have already validated this artwork',
        code: 'ALREADY_VOTED'
      });
    }

    res.status(500).json({ 
      error: 'Failed to validate artwork',
      details: error.message || 'An unexpected error occurred'
    });
  }
});

// Get all artworks from blockchain
app.get('/api/artworks', async (req, res) => {
  try {
    // Check if using IPFS-enabled contract
    if (blockchain.isContractReady && blockchain.isContractReady()) {
      console.log('Fetching artworks from IPFS-enabled blockchain');
      const artworks = await blockchain.getAllArtworksIPFS();
      // Convert BigInt values to strings before sending response
      const serializedArtworks = convertBigIntToString(artworks);
      res.json({
        artworks: serializedArtworks,
        source: 'ipfs-blockchain',
        contract: blockchain.getContractInfo()
      });
    } else {
      console.log('Fetching artworks from legacy blockchain');
      const artworks = await blockchain.getAllArtworks();
      // Convert BigInt values to strings before sending response
      const serializedArtworks = convertBigIntToString(artworks);
      res.json({
        artworks: serializedArtworks,
        source: 'legacy-blockchain'
      });
    }
  } catch (error) {
    console.error('Error fetching artworks from blockchain:', error);
    res.status(500).json({ 
      error: 'Failed to fetch artworks from blockchain',
      details: error.message,
      fallback: 'Consider using /artworks endpoint for database fallback'
    });
  }
});

app.listen(port, () => {
  console.log(`ArtChain backend listening at http://localhost:${port}`);
});

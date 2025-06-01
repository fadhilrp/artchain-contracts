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
const blockchain = require('./blockchain');

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

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simulate VLM validation
function validateWithVLM(imageBuffer) {
  // TODO: Replace with real VLM logic
  return Math.random() < 0.5 ? 'duplicate' : 'original';
}

app.post('/ai-vlm', async (req, res) => {
  const result = {
    image_similarity: +(Math.random() * 100).toFixed(2),
    metadata_similarity: +(Math.random() * 100).toFixed(2),
    confidence: +(Math.random() * 100).toFixed(2),
  };
  res.json(result);
});
// Main upload endpoint
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

    // 6. Save to database
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
        artist,
        title,
        isOriginal: true,
        validated: true,
        consensusCount: 1,
        requiredValidators: 2,
        originalAuthor: artist,
        timestamp: new Date(),
        updatedAt: new Date(),
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
    res.json(artworks);
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
    const artworks = await blockchain.getAllArtworks();
    // Convert BigInt values to strings before sending response
    const serializedArtworks = convertBigIntToString(artworks);
    res.json(serializedArtworks);
  } catch (error) {
    console.error('Error fetching artworks:', error);
    res.status(500).json({ error: 'Failed to fetch artworks' });
  }
});

app.listen(port, () => {
  console.log(`ArtChain backend listening at http://localhost:${port}`);
});

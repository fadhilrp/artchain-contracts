const express = require('express');
const multer = require('multer');
const cors = require('cors');
// const { ethers } = require('ethers');
const app = express();
const port = 3001;

const { PrismaClient } = require('@prisma/client');
const prisma = new PrismaClient();
// const blockchain = require('./blockchain');

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simulate VLM validation
function validateWithVLM(imageBuffer) {
  // TODO: Replace with real VLM logic
  return Math.random() < 0.5 ? 'duplicate' : 'original';
}

// Main upload endpoint
app.post('/upload', upload.single('image'), async (req, res) => {
  const { artist, title } = req.body;
  const imageBuffer = req.file.buffer;

  try {
    // 1. Generate image hash
    const imageHash = ethers.utils.keccak256(imageBuffer);
    
    // 2. Submit to blockchain
    // const submitted = await blockchain.submitArtwork(imageHash);
    // if (!submitted) {
    //   throw new Error('Failed to submit artwork to blockchain');
    // }

    // 3. Simulate validators decoding hash and VLM validation
    const validationResult = validateWithVLM(imageBuffer);
    const isOriginal = validationResult === 'original';

    // 4. Submit validation to blockchain
    const validated = await blockchain.validateArtwork(
      imageHash,
      isOriginal,
      isOriginal ? artist : 'Unknown'
    );

    if (!validated) {
      throw new Error('Failed to validate artwork on blockchain');
    }

    // 5. Get artwork details from blockchain
    const artworkDetails = await blockchain.getArtworkDetails(imageHash);

    // 6. Save to database
    const artwork = await prisma.artwork.create({
      data: {
        imageHash: imageHash,
        artist,
        title,
        isOriginal: artworkDetails.isOriginal,
        validated: artworkDetails.validated,
        consensusCount: artworkDetails.consensusCount,
        requiredValidators: artworkDetails.requiredValidators,
        originalAuthor: artworkDetails.originalAuthor,
        timestamp: new Date(artworkDetails.timestamp * 1000)
      }
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

app.listen(port, () => {
  console.log(`ArtChain backend listening at http://localhost:${port}`);
});
const express = require('express');
const multer = require('multer');
const cors = require('cors');
const app = express();
const port = 3001;

// Middleware
app.use(cors());
app.use(express.json());

// Multer for file uploads
const storage = multer.memoryStorage();
const upload = multer({ storage: storage });

// Simulate blockchain embedding
function embedImageToBlockchain(imageBuffer) {
  // TODO: Replace with real blockchain logic
  return {
    imageHash: '0x' + Math.random().toString(16).substr(2, 64),
    txHash: '0x' + Math.random().toString(16).substr(2, 64),
  };
}

// Simulate VLM validation
function validateWithVLM(imageBuffer) {
  // TODO: Replace with real VLM logic
  // Randomly decide if image is duplicate
  return Math.random() < 0.5 ? 'duplicate' : 'original';
}

// Simulate consensus
function reachConsensus(validationResult) {
  // TODO: Replace with real consensus logic
  return validationResult === 'original';
}

// Main upload endpoint
app.post('/upload', upload.single('image'), (req, res) => {
  const { artist, title } = req.body;
  const imageBuffer = req.file.buffer;

  // 1. Simulate embedding image to blockchain
  const blockchainResult = embedImageToBlockchain(imageBuffer);

  // 2. Simulate sharing hash to nodes (skipped, just log)
  console.log('Sharing hash to nodes:', blockchainResult.imageHash);

  // 3. Simulate validators decoding hash and VLM validation
  const validationResult = validateWithVLM(imageBuffer);

  // 4. Simulate consensus
  const consensus = reachConsensus(validationResult);

  // 5. Build result
  const result = {
    imageHash: blockchainResult.imageHash,
    artist,
    isDuplicate: validationResult === 'duplicate',
    consensus,
    metadata: {
      title,
      timestamp: new Date().toISOString(),
    },
  };

  res.json(result);
});

// Endpoint to fetch all artworks
app.get('/artworks', async (req, res) => {
    try {
      const artworks = await prisma.artwork.findMany({ orderBy: { createdAt: 'desc' } });
      res.json(artworks);
    } catch (err) {
      console.error('Error fetching artworks:', err);
      res.status(500).json({ error: 'Failed to fetch artworks.' });
    }
});

app.listen(port, () => {
  console.log(`Simulated ArtChain backend listening at http://localhost:${port}`);
});
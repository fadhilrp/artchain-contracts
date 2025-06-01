// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IValidatorToken {
    function rewardValidator(address validator) external;
}

contract ArtValidation {
    struct Artwork {
        bytes32 imageHash;
        address artist;
        uint256 timestamp;
        string originalAuthor;
        bool validated;
        bool isOriginal;
        uint8 consensusCount;
        uint8 requiredValidators;
        // IPFS and metadata fields
        string[] ipfsImageUris;    // Array of IPFS image URIs
        string ipfsMetadataUri;    // IPFS metadata URI
        string title;              // Artwork title
        string description;        // Artwork description
        string medium;             // Art medium
        string additionalInfo;     // Additional information
    }

    struct Validator {
        address validatorAddress;
        bool hasVoted;
        bool voteResult;
    }

    address public tokenContract;
    mapping(bytes32 => Artwork) public artworks;
    mapping(bytes32 => Validator[]) public artworkVotes;
    bytes32[] public artworkHashes; // Array to store all artwork hashes
    uint8 public constant MIN_VALIDATORS = 2;

    event ArtworkSubmitted(
        bytes32 indexed hash, 
        address indexed artist, 
        string title,
        string[] ipfsImageUris,
        string ipfsMetadataUri
    );
    event ArtworkValidated(
        bytes32 indexed hash, 
        bool isOriginal, 
        string originalAuthor, 
        uint256 confidence
    );

    constructor(address _tokenContract) {
        tokenContract = _tokenContract;
    }

    // Enhanced submit function with IPFS support
    function submitArtwork(
        bytes32 imageHash,
        string[] memory ipfsImageUris,
        string memory ipfsMetadataUri,
        string memory title,
        string memory description,
        string memory medium,
        string memory additionalInfo
    ) external {
        require(artworks[imageHash].timestamp == 0, "Artwork already submitted");
        require(ipfsImageUris.length > 0, "At least one IPFS image URI required");
        
        artworks[imageHash] = Artwork({
            imageHash: imageHash,
            artist: msg.sender,
            timestamp: block.timestamp,
            originalAuthor: "",
            validated: false,
            isOriginal: false,
            consensusCount: 0,
            requiredValidators: MIN_VALIDATORS,
            ipfsImageUris: ipfsImageUris,
            ipfsMetadataUri: ipfsMetadataUri,
            title: title,
            description: description,
            medium: medium,
            additionalInfo: additionalInfo
        });
        
        artworkHashes.push(imageHash); // Add hash to array
        
        emit ArtworkSubmitted(
            imageHash, 
            msg.sender, 
            title, 
            ipfsImageUris, 
            ipfsMetadataUri
        );
    }

    // Legacy submit function (backward compatibility)
    function submitArtwork(bytes32 imageHash) external {
        require(artworks[imageHash].timestamp == 0, "Artwork already submitted");
        
        // Create empty arrays for legacy submissions
        string[] memory emptyUris = new string[](0);
        
        artworks[imageHash] = Artwork({
            imageHash: imageHash,
            artist: msg.sender,
            timestamp: block.timestamp,
            originalAuthor: "",
            validated: false,
            isOriginal: false,
            consensusCount: 0,
            requiredValidators: MIN_VALIDATORS,
            ipfsImageUris: emptyUris,
            ipfsMetadataUri: "",
            title: "",
            description: "",
            medium: "",
            additionalInfo: ""
        });
        
        artworkHashes.push(imageHash); // Add hash to array
        
        emit ArtworkSubmitted(imageHash, msg.sender, "", emptyUris, "");
    }

    function validateArtwork(
        bytes32 imageHash, 
        bool isOriginal, 
        string calldata originalAuthor
    ) external {
        Artwork storage artwork = artworks[imageHash];
        require(artwork.timestamp != 0, "Artwork not found");
        require(!artwork.validated, "Already validated");

        Validator[] storage validators = artworkVotes[imageHash];
        for (uint256 i = 0; i < validators.length; i++) {
            require(validators[i].validatorAddress != msg.sender, "Already voted");
        }

        validators.push(Validator(msg.sender, true, isOriginal));
        artwork.consensusCount++;

        if (artwork.consensusCount >= artwork.requiredValidators) {
            uint256 originalVotes = 0;
            for (uint256 i = 0; i < validators.length; i++) {
                if (validators[i].voteResult) originalVotes++;
            }

            uint256 confidence = (originalVotes * 100) / artwork.requiredValidators;
            artwork.validated = true;
            artwork.isOriginal = originalVotes > (artwork.requiredValidators / 2);
            artwork.originalAuthor = originalAuthor;

            for (uint256 i = 0; i < validators.length; i++) {
                IValidatorToken(tokenContract).rewardValidator(validators[i].validatorAddress);
            }

            emit ArtworkValidated(imageHash, artwork.isOriginal, originalAuthor, confidence);
        }
    }

    // Get total number of artworks
    function getTotalArtworks() external view returns (uint256) {
        return artworkHashes.length;
    }

    // Get artwork hash by index
    function getArtworkHash(uint256 index) external view returns (bytes32) {
        require(index < artworkHashes.length, "Index out of bounds");
        return artworkHashes[index];
    }

    // Get complete artwork details including IPFS data
    function getArtworkDetails(bytes32 imageHash) external view returns (
        bytes32,           // imageHash
        address,           // artist
        uint256,           // timestamp
        string memory,     // originalAuthor
        bool,              // validated
        bool,              // isOriginal
        uint8,             // consensusCount
        uint8,             // requiredValidators
        string[] memory,   // ipfsImageUris
        string memory,     // ipfsMetadataUri
        string memory,     // title
        string memory,     // description
        string memory,     // medium
        string memory      // additionalInfo
    ) {
        Artwork storage artwork = artworks[imageHash];
        require(artwork.timestamp != 0, "Artwork not found");
        
        return (
            artwork.imageHash,
            artwork.artist,
            artwork.timestamp,
            artwork.originalAuthor,
            artwork.validated,
            artwork.isOriginal,
            artwork.consensusCount,
            artwork.requiredValidators,
            artwork.ipfsImageUris,
            artwork.ipfsMetadataUri,
            artwork.title,
            artwork.description,
            artwork.medium,
            artwork.additionalInfo
        );
    }

    // Get only IPFS URIs for an artwork
    function getArtworkIPFS(bytes32 imageHash) external view returns (
        string[] memory ipfsImageUris,
        string memory ipfsMetadataUri
    ) {
        Artwork storage artwork = artworks[imageHash];
        require(artwork.timestamp != 0, "Artwork not found");
        
        return (artwork.ipfsImageUris, artwork.ipfsMetadataUri);
    }

    // Check if artwork has IPFS data
    function hasIPFSData(bytes32 imageHash) external view returns (bool) {
        Artwork storage artwork = artworks[imageHash];
        return artwork.ipfsImageUris.length > 0;
    }
}
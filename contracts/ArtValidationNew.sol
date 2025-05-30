// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IValidatorToken {
    function rewardValidator(address validator) external;
}

contract ArtValidationNew {
    struct Artwork {
        bytes32 imageHash;
        address artist;
        uint256 timestamp;
        string originalAuthor;
        bool validated;
        bool isOriginal;
        uint8 consensusCount;
        uint8 requiredValidators;
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
    uint8 public constant MIN_VALIDATORS = 10;

    event ArtworkSubmitted(bytes32 indexed hash, address indexed artist);
    event ArtworkValidated(bytes32 indexed hash, bool isOriginal, string originalAuthor, uint256 confidence);

    constructor(address _tokenContract) {
        tokenContract = _tokenContract;
    }

    function submitArtwork(bytes32 imageHash) external {
        require(artworks[imageHash].timestamp == 0, "Artwork already submitted");
        artworks[imageHash] = Artwork(imageHash, msg.sender, block.timestamp, "", false, false, 0, MIN_VALIDATORS);
        artworkHashes.push(imageHash); // Add hash to array
        emit ArtworkSubmitted(imageHash, msg.sender);
    }

    function validateArtwork(bytes32 imageHash, bool isOriginal, string calldata originalAuthor) external {
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

    // New function to get total number of artworks
    function getTotalArtworks() external view returns (uint256) {
        return artworkHashes.length;
    }

    // New function to get artwork hash by index
    function getArtworkHash(uint256 index) external view returns (bytes32) {
        require(index < artworkHashes.length, "Index out of bounds");
        return artworkHashes[index];
    }
}
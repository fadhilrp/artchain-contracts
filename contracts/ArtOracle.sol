// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

interface IArtValidation {
    function validateArtwork(bytes32 imageHash, bool isOriginal, string calldata originalAuthor) external;
}

contract ArtAIOracle {
    address public artValidationContract;

    constructor(address _artValidationContract) {
        artValidationContract = _artValidationContract;
    }

    function submitValidationResult(bytes32 imageHash, bool isOriginal, string calldata originalAuthor) external {
        IArtValidation(artValidationContract).validateArtwork(imageHash, isOriginal, originalAuthor);
    }
}

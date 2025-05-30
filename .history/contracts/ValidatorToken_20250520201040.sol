// SPDX-License-Identifier: MIT
pragma solidity ^0.8.19;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";

contract ValidatorToken is ERC20 {
    address public artValidationContract;
    uint256 public constant REWARD_AMOUNT = 10 * 10 ** 18;

    constructor() ERC20("ValidatorToken", "VLT") {
        _mint(msg.sender, 1000000 * 10 ** 18); // Mint initial supply
    }

    modifier onlyArtValidation() {
        require(msg.sender == artValidationContract, "Unauthorized");
        _;
    }

    function setArtValidationContract(address _contract) external {
        require(artValidationContract == address(0), "Contract already set");
        artValidationContract = _contract;
    }

    function rewardValidator(address validator) external onlyArtValidation {
        _mint(validator, REWARD_AMOUNT);
    }
}

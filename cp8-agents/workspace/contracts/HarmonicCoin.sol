// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

interface ICP8Oracle {
    function verifyProof(uint256 blockNumber, bytes calldata proof) external returns (bool);
}

contract HarmonicCoin is ERC20, Ownable {
    uint256 public constant MINT_AMOUNT = 111 * 10**18; // 111 HHC per verified block
    address public cp8Oracle;

    event BlockVerified(address indexed verifier, uint256 blockNumber, uint256 minted);

    constructor(address initialOwner) ERC20("HarmonicCoin", "HHC") Ownable(initialOwner) {
        cp8Oracle = address(0); // Will be set by owner
    }

    function setOracle(address _oracle) external onlyOwner {
        cp8Oracle = _oracle;
    }

    function mintForVerifiedBlock(uint256 blockNumber, bytes calldata proof) external {
        require(cp8Oracle != address(0), "Oracle not set");
        require(ICP8Oracle(cp8Oracle).verifyProof(blockNumber, proof), "Invalid CP8 Proof");

        _mint(msg.sender, MINT_AMOUNT);
        emit BlockVerified(msg.sender, blockNumber, MINT_AMOUNT);
    }
}

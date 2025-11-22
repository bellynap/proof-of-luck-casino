// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC20/ERC20.sol";
import "@openzeppelin/contracts/access/Ownable.sol";

contract LuckToken is ERC20, Ownable {
    
    address public gameManager;
    uint256 public constant MAX_SUPPLY = 1_000_000 * 10**18;
    
    event TokensMinted(address indexed to, uint256 amount);
    
    constructor(address _gameManager) ERC20("Luck Token", "LUCK") Ownable(msg.sender) {
        gameManager = _gameManager;
        _mint(address(this), MAX_SUPPLY);
    }
    
    function reward(address to, uint256 amount) external {
        require(msg.sender == gameManager || msg.sender == owner(), "Not authorized");
        require(balanceOf(address(this)) >= amount, "Insufficient token balance");
        
        _transfer(address(this), to, amount);
        emit TokensMinted(to, amount);
    }
    
    function setGameManager(address _gameManager) external onlyOwner {
        require(_gameManager != address(0), "Invalid address");
        gameManager = _gameManager;
    }
    
    function rewardPoolBalance() external view returns (uint256) {
        return balanceOf(address(this));
    }
}

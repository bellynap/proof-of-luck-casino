// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/token/ERC721/ERC721.sol";
import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/Strings.sol";

contract MysteryBoxNFT is ERC721, Ownable {
    using Strings for uint256;
    
    enum Rarity { Common, Rare, Epic, Legendary }
    
    struct NFTData {
        Rarity rarity;
        uint256 mintedAt;
        string name;
    }
    
    uint256 private _tokenIdCounter;
    mapping(uint256 => NFTData) public nftData;
    address public gameManager;
    
    string[4] private rarityNames = ["Common", "Rare", "Epic", "Legendary"];
    string private _baseTokenURI;
    
    event NFTMinted(address indexed to, uint256 indexed tokenId, Rarity rarity);
    
    constructor(address _gameManager) ERC721("Mystery Box NFT", "MBNFT") Ownable(msg.sender) {
        gameManager = _gameManager;
        _baseTokenURI = "https://proof-of-luck.example.com/nft/";
    }
    
    function mint(address to, Rarity rarity) external returns (uint256) {
        require(msg.sender == gameManager || msg.sender == owner(), "Not authorized");
        
        uint256 tokenId = _tokenIdCounter++;
        _safeMint(to, tokenId);
        
        nftData[tokenId] = NFTData({
            rarity: rarity,
            mintedAt: block.timestamp,
            name: string(abi.encodePacked(rarityNames[uint256(rarity)], " Box #", tokenId.toString()))
        });
        
        emit NFTMinted(to, tokenId, rarity);
        return tokenId;
    }
    
    function setGameManager(address _gameManager) external onlyOwner {
        require(_gameManager != address(0), "Invalid address");
        gameManager = _gameManager;
    }
    
    function setBaseURI(string memory baseURI) external onlyOwner {
        _baseTokenURI = baseURI;
    }
    
    function tokenURI(uint256 tokenId) public view override returns (string memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        
        NFTData memory data = nftData[tokenId];
        
        return string(abi.encodePacked(
            _baseTokenURI,
            tokenId.toString(),
            "?rarity=",
            rarityNames[uint256(data.rarity)]
        ));
    }
    
    function getNFTData(uint256 tokenId) external view returns (NFTData memory) {
        require(ownerOf(tokenId) != address(0), "Token does not exist");
        return nftData[tokenId];
    }
    
    function totalSupply() external view returns (uint256) {
        return _tokenIdCounter;
    }
}

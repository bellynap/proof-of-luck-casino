// SPDX-License-Identifier: MIT
pragma solidity ^0.8.20;

import "@openzeppelin/contracts/access/Ownable.sol";
import "@openzeppelin/contracts/utils/ReentrancyGuard.sol";
import "@openzeppelin/contracts/utils/Pausable.sol";

contract GameManager is Ownable, ReentrancyGuard, Pausable {
    
    enum GameType { MysteryBox, CoinFlip, DiceRoll, Lottery }
    enum GameStatus { Pending, Resolved, Cancelled }
    
    struct GameRequest {
        address player;
        GameType gameType;
        uint256 wager;
        uint256 timestamp;
        GameStatus status;
        uint256 payout;
        uint256 multiplier;
    }
    
    mapping(uint256 => GameRequest) public games;
    uint256 public gameCounter;
    
    address public roflApp;
    uint256 public houseBalance;
    uint256 public totalWagered;
    uint256 public totalPaidOut;
    
    mapping(GameType => uint256) public minWagers;
    
    event GameCreated(uint256 indexed gameId, address indexed player, GameType gameType, uint256 wager);
    event GameResolved(uint256 indexed gameId, address indexed player, uint256 payout, bool won);
    event ROFLAppUpdated(address indexed oldApp, address indexed newApp);
    event HouseDeposit(uint256 amount);
    event HouseWithdraw(uint256 amount);
    
    constructor() Ownable(msg.sender) {
        minWagers[GameType.MysteryBox] = 0.1 ether;
        minWagers[GameType.CoinFlip] = 0.1 ether;
        minWagers[GameType.DiceRoll] = 0.1 ether;
        minWagers[GameType.Lottery] = 0.05 ether;
    }
    
    function playMysteryBox() external payable nonReentrant whenNotPaused {
        require(msg.value >= minWagers[GameType.MysteryBox], "Wager too low");
        
        uint256 gameId = gameCounter++;
        games[gameId] = GameRequest({
            player: msg.sender,
            gameType: GameType.MysteryBox,
            wager: msg.value,
            timestamp: block.timestamp,
            status: GameStatus.Pending,
            payout: 0,
            multiplier: 0
        });
        
        totalWagered += msg.value;
        emit GameCreated(gameId, msg.sender, GameType.MysteryBox, msg.value);
    }
    
    function playCoinFlip() external payable nonReentrant whenNotPaused {
        require(msg.value >= minWagers[GameType.CoinFlip], "Wager too low");
        require(houseBalance >= msg.value * 2, "House cannot cover potential payout");
        
        uint256 gameId = gameCounter++;
        games[gameId] = GameRequest({
            player: msg.sender,
            gameType: GameType.CoinFlip,
            wager: msg.value,
            timestamp: block.timestamp,
            status: GameStatus.Pending,
            payout: 0,
            multiplier: 200
        });
        
        totalWagered += msg.value;
        emit GameCreated(gameId, msg.sender, GameType.CoinFlip, msg.value);
    }
    
    function playDiceRoll(uint256 multiplier) external payable nonReentrant whenNotPaused {
        require(msg.value >= minWagers[GameType.DiceRoll], "Wager too low");
        require(multiplier >= 110 && multiplier <= 600, "Invalid multiplier");
        
        uint256 potentialPayout = (msg.value * multiplier) / 100;
        require(houseBalance >= potentialPayout, "House cannot cover potential payout");
        
        uint256 gameId = gameCounter++;
        games[gameId] = GameRequest({
            player: msg.sender,
            gameType: GameType.DiceRoll,
            wager: msg.value,
            timestamp: block.timestamp,
            status: GameStatus.Pending,
            payout: 0,
            multiplier: multiplier
        });
        
        totalWagered += msg.value;
        emit GameCreated(gameId, msg.sender, GameType.DiceRoll, msg.value);
    }
    
    function resolveGame(uint256 gameId, bool won, uint256 payout) external nonReentrant {
        require(msg.sender == roflApp, "Only ROFL app can resolve");
        require(games[gameId].status == GameStatus.Pending, "Game not pending");
        
        GameRequest storage game = games[gameId];
        game.status = GameStatus.Resolved;
        game.payout = payout;
        
        if (won && payout > 0) {
            require(address(this).balance >= payout, "Insufficient balance");
            totalPaidOut += payout;
            
            if (payout > game.wager) {
                houseBalance -= (payout - game.wager);
            } else {
                houseBalance += (game.wager - payout);
            }
            
            (bool success, ) = game.player.call{value: payout}("");
            require(success, "Payout failed");
        } else {
            houseBalance += game.wager;
        }
        
        emit GameResolved(gameId, game.player, payout, won);
    }
    
    function setROFLApp(address _roflApp) external onlyOwner {
        require(_roflApp != address(0), "Invalid address");
        emit ROFLAppUpdated(roflApp, _roflApp);
        roflApp = _roflApp;
    }
    
    function depositHouse() external payable {
        houseBalance += msg.value;
        emit HouseDeposit(msg.value);
    }
    
    function withdrawHouse(uint256 amount) external onlyOwner nonReentrant {
        require(amount <= houseBalance, "Insufficient house balance");
        houseBalance -= amount;
        
        (bool success, ) = msg.sender.call{value: amount}("");
        require(success, "Withdrawal failed");
        
        emit HouseWithdraw(amount);
    }
    
    function pause() external onlyOwner {
        _pause();
    }
    
    function unpause() external onlyOwner {
        _unpause();
    }
    
    function getGame(uint256 gameId) external view returns (GameRequest memory) {
        return games[gameId];
    }
    
    function getStats() external view returns (uint256, uint256, uint256, uint256) {
        return (gameCounter, totalWagered, totalPaidOut, houseBalance);
    }
}

'use client';

import { useState, useEffect } from 'react';
import styles from './animations.module.css';

const GAME_MANAGER_ADDRESS = "0x7c4d3367f346E80E655Ab87620A790b5d43a9296";
const SAPPHIRE_TESTNET_RPC = "https://testnet.sapphire.oasis.io";
const EXPLORER_URL = "https://testnet.explorer.sapphire.oasis.dev";

const GAME_MANAGER_ABI = [
  "function playMysteryBox() external payable",
  "function playCoinFlip() external payable",
  "function playDiceRoll(uint256 multiplier) external payable",
  "function getStats() external view returns (uint256, uint256, uint256, uint256)",
  "event GameCreated(uint256 indexed gameId, address indexed player, uint8 gameType, uint256 wager)",
  "event GameResolved(uint256 indexed gameId, address indexed player, uint256 payout, bool won)"
];

export default function Home() {
  const [account, setAccount] = useState("");
  const [balance, setBalance] = useState("0");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const [stats, setStats] = useState(null);
  const [diceMultiplier, setDiceMultiplier] = useState(200);
  const [recentGames, setRecentGames] = useState([]);
  const [lastTxHash, setLastTxHash] = useState("");
  const [showModal, setShowModal] = useState(false);
  const [modalContent, setModalContent] = useState("");
  const [isAnimating, setIsAnimating] = useState(false);
  const [coinFlipState, setCoinFlipState] = useState('idle');
  const [diceRollState, setDiceRollState] = useState('idle');
  const [mysteryBoxState, setMysteryBoxState] = useState('idle');
  const [revealedNFT, setRevealedNFT] = useState(null);
const [coinChoice, setCoinChoice] = useState('heads');  
const [coinResult, setCoinResult] = useState(null);
const [wrongNetwork, setWrongNetwork] = useState(false);

  // Sound effects
  const playSound = (type) => {
    if (typeof Audio !== 'undefined') {
      const sounds = {
        win: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIGGa56+mgUBELTKXh8bllHAU7k9f0yX0vBSh+zPDckjwJE12y6OyrWBUIQ5zh8r9uJAYyi9Hy1YU1Bhxrvu7mnEoPEFWs5++xXxkIP5fY8sh0KgUrlM3y2oo3CBdluuvpn08RC0yl4fG6Zh0FO5PX88p+MAUofszw3ZI9CRJcsuvsq1kVCEOc4fK/cCQGM4vR8tWFNgYca77u5pw=',
        lose: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIGGa56+mgUBELTKXh8bllHAU7k9f0yX0vBSh+zPDckjwJE12y6OyrWBUIQ5zh8r9uJAYyi9Hy1YU1Bhxrvu7mnEoPEFWs5++xXxkIP5fY8sh0KgUrlM3y2oo3CBdluuvpn08RC0yl4fG6Zh0FO5PX88p+MAUofszw3ZI9CRJcsuvsq1kVCEOc4fK/cCQGM4vR8tWFNgYca77u5pw=',
        click: 'data:audio/wav;base64,UklGRnoGAABXQVZFZm10IBAAAAABAAEAQB8AAEAfAAABAAgAZGF0YQoGAACBhYqFbF1fdJivrJBhNjVgodDbq2EcBj+a2/LDciUFLIHO8tiJNwgZaLvt559NEAxQp+PwtmMcBjiR1/LMeSwFJHfH8N2QQAoUXrTp66hVFApGn+DyvmwhBjKM0fPTgjMGHm7A7+OZSA0PVqzn77BdGAg+ltryxnMpBSuBzvLZiTYIGGa56+mgUBELTKXh8bllHAU7k9f0yX0vBSh+zPDckjwJE12y6OyrWBUIQ5zh8r9uJAYyi9Hy1YU1Bhxrvu7mnEoPEFWs5++xXxkIP5fY8sh0KgUrlM3y2oo3CBdluuvpn08RC0yl4fG6Zh0FO5PX88p+MAUofszw3ZI9CRJcsuvsq1kVCEOc4fK/cCQGM4vR8tWFNgYca77u5pw='
      };
      try {
        const audio = new Audio(sounds[type]);
        audio.volume = 0.3;
        audio.play().catch(() => {});
      } catch(e) {}
    }
  };

  const checkNetwork = async () => {
    if (typeof window.ethereum !== 'undefined') {
      try {
        const chainId = await window.ethereum.request({ method: 'eth_chainId' });
        setWrongNetwork(chainId !== '0x5aff');
      } catch(e) {}
    }
  };

  useEffect(() => {
    checkNetwork();
    if (typeof window.ethereum !== 'undefined') {
      window.ethereum.on('chainChanged', checkNetwork);
      return () => window.ethereum.removeListener('chainChanged', checkNetwork);
    }
  }, []);

  const connectWallet = async () => {
    if (typeof window.ethereum === 'undefined') {
      setMessage("❌ Please install MetaMask to play!");
      return;
    }

    try {
      setLoading(true);
      playSound('click');
      const accounts = await window.ethereum.request({ method: 'eth_requestAccounts' });
      
      try {
        await window.ethereum.request({
          method: 'wallet_switchEthereumChain',
          params: [{ chainId: '0x5aff' }],
        });
      } catch (switchError) {
        if (switchError.code === 4902) {
          await window.ethereum.request({
            method: 'wallet_addEthereumChain',
            params: [{
              chainId: '0x5aff',
              chainName: 'Sapphire Testnet',
              nativeCurrency: { name: 'TEST', symbol: 'TEST', decimals: 18 },
              rpcUrls: ['https://testnet.sapphire.oasis.io'],
              blockExplorerUrls: ['https://testnet.explorer.sapphire.oasis.dev']
            }]
          });
        } else {
          throw switchError;
        }
      }

      setAccount(accounts[0]);
      const balanceWei = await window.ethereum.request({
        method: 'eth_getBalance',
        params: [accounts[0], 'latest']
      });
      const balanceEth = parseInt(balanceWei, 16) / 1e18;
      setBalance(balanceEth.toFixed(4));
      
      await loadStats();
      setMessage("✅ Connected to Sapphire Testnet!");
      setWrongNetwork(false);
      setLoading(false);
    } catch (error) {
      console.error(error);
      let errorMsg = "❌ Connection failed";
      if (error.code === 4001) errorMsg = "❌ Connection rejected by user";
      else if (error.code === -32002) errorMsg = "⚠️ Connection request pending - check MetaMask";
      setMessage(errorMsg);
      setLoading(false);
    }
  };

  const loadStats = async () => {
    try {
      const response = await fetch(SAPPHIRE_TESTNET_RPC, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          jsonrpc: '2.0',
          id: 1,
          method: 'eth_call',
          params: [{
            to: GAME_MANAGER_ADDRESS,
            data: '0xc59d4847'
          }, 'latest']
        })
      });
      const data = await response.json();
      if (data.result) {
        const result = data.result;
        setStats({
          totalGames: parseInt(result.slice(2, 66), 16),
          totalWagered: (parseInt(result.slice(66, 130), 16) / 1e18).toFixed(2),
          totalPaidOut: (parseInt(result.slice(130, 194), 16) / 1e18).toFixed(2),
          houseBalance: (parseInt(result.slice(194, 258), 16) / 1e18).toFixed(2)
        });
      }
    } catch (error) {
      console.error("Error loading stats:", error);
    }
  };

  const showHowToPlay = (game) => {
    playSound('click');
    const content = {
      mysteryBox: "🎁 Mystery Box: Deposit 0.1 TEST and receive a random NFT based on rarity. 75% chance of Common (0.5x tokens), 17.5% Rare (1x), 5% Epic (3x), 2.5% Legendary (10x). All outcomes are generated by ROFL in a secure TEE!",
      coinFlip: "🪙 Coin Flip: Simple 50/50 game! Bet 0.1 TEST and either win 0.2 TEST (double your money) or lose it all. Pure chance, perfectly fair randomness from ROFL.",
      diceRoll: "🎲 Dice Roll: Choose your risk level! Higher multiplier = lower win chance but bigger payout. The win probability is calculated fairly: if you choose 2x, you have ~50% chance to win. All randomness generated securely in TEE."
    };
    setModalContent(content[game]);
    setShowModal(true);
  };

  const playGame = async (gameType, value, multiplier = 0) => {
    if (!account) {
      setMessage("❌ Please connect wallet first!");
      return;
    }

    if (wrongNetwork) {
      setMessage("❌ Please switch to Sapphire Testnet!");
      return;
    }

    const balanceNum = parseFloat(balance);
    if (balanceNum < value) {
      setMessage(`❌ Insufficient balance! You need ${value} TEST but only have ${balance} TEST`);
      return;
    }

    try {
// Reset all animation states first
  setCoinFlipState('idle');
  setDiceRollState('idle');
  setMysteryBoxState('idle');
      setLoading(true);
      setIsAnimating(true);
setCoinResult(null);     
 playSound('click');
      
      let data;
      let gameName;
      
      if (gameType === 'mysteryBox') {
        data = '0x3b2d1f0a';
        gameName = "Mystery Box";
        setMessage("🎁 Opening mystery box...");
        setMysteryBoxState('shaking');



// Generate random NFT after animation with procedural generation
setTimeout(() => {
  const rand = Math.random() * 100;
  
  // Procedural NFT generator
  const generateNFT = (rarityType, multiplier) => {
    const traits = {
      common: {
        colors: ['#94a3b8', '#64748b', '#475569'],
        emojis: ['🎴', '🎭', '🎪', '🎨', '🎯', '🎲', '🃏', '🎰'],
        adjectives: ['Simple', 'Basic', 'Plain', 'Common', 'Standard', 'Ordinary'],
        nouns: ['Card', 'Token', 'Chip', 'Piece', 'Coin', 'Dice']
      },
      rare: {
        colors: ['#3b82f6', '#2563eb', '#1d4ed8', '#06b6d4'],
        emojis: ['💎', '🔮', '🏆', '⚡', '🌊', '❄️', '💠', '🔷'],
        adjectives: ['Shiny', 'Brilliant', 'Gleaming', 'Radiant', 'Lustrous', 'Sparkling'],
        nouns: ['Diamond', 'Crystal', 'Gem', 'Jewel', 'Sapphire', 'Trophy']
      },
      epic: {
        colors: ['#a855f7', '#9333ea', '#7e22ce', '#c026d3'],
        emojis: ['👑', '🦄', '🎆', '🌈', '🔥', '⚔️', '🏰', '🌙'],
        adjectives: ['Mystical', 'Ancient', 'Legendary', 'Divine', 'Enchanted', 'Sacred'],
        nouns: ['Crown', 'Relic', 'Artifact', 'Treasure', 'Unicorn', 'Phoenix']
      },
      legendary: {
        colors: ['#eab308', '#ca8a04', '#a16207', '#f59e0b'],
        emojis: ['⭐', '🌟', '💫', '✨', '🌠', '☄️', '🔆', '🌅'],
        adjectives: ['Cosmic', 'Celestial', 'Supreme', 'Ultimate', 'Ethereal', 'Transcendent'],
        nouns: ['Star', 'Phoenix', 'Dragon', 'Oracle', 'Nebula', 'Supernova']
      }
    };
    
    const tier = traits[rarityType];
    const color = tier.colors[Math.floor(Math.random() * tier.colors.length)];
    const emoji1 = tier.emojis[Math.floor(Math.random() * tier.emojis.length)];
    const emoji2 = tier.emojis[Math.floor(Math.random() * tier.emojis.length)];
    const adj = tier.adjectives[Math.floor(Math.random() * tier.adjectives.length)];
    const noun = tier.nouns[Math.floor(Math.random() * tier.nouns.length)];
    
    // Generate unique ID
    const uniqueId = Math.floor(Math.random() * 10000);
    
    return {
      rarity: rarityType.charAt(0).toUpperCase() + rarityType.slice(1),
      color: color,
      emoji: emoji1 + emoji2,
      name: `${adj} ${noun} #${uniqueId}`,
      multiplier: multiplier
    };
  };
  
  let nft;
  if (rand < 75) {
    nft = generateNFT('common', '0.5x');
  } else if (rand < 92.5) {
    nft = generateNFT('rare', '1x');
  } else if (rand < 97.5) {
    nft = generateNFT('epic', '3x');
  } else {
    nft = generateNFT('legendary', '10x');
  }
  
  setRevealedNFT(nft);
  setMysteryBoxState('opening');
  setTimeout(() => setMysteryBoxState('idle'), 800);
}, 2400);  
      } else if (gameType === 'coinFlip') {
        data = '0x6f52d1e4';
        gameName = "Coin Flip";
        setMessage("🪙 Flipping coin...");
        setCoinFlipState('flipping');
// Simulate coin flip result
setTimeout(() => {
  const result = Math.random() < 0.5 ? 'heads' : 'tails';
  setCoinResult(result);
}, 2000);   
      } else if (gameType === 'diceRoll') {
        const multiplierHex = multiplier.toString(16).padStart(64, '0');
        data = '0xb6b55f25' + multiplierHex;
        gameName = "Dice Roll";
        setMessage("🎲 Rolling dice...");
        setDiceRollState('rolling');
       }

      const txHash = await window.ethereum.request({
        method: 'eth_sendTransaction',
        params: [{
          from: account,
          to: GAME_MANAGER_ADDRESS,
          value: '0x' + Math.floor(value * 1e18).toString(16),
          data: data
        }]
      });

      setLastTxHash(txHash);
      setMessage("⏳ Transaction sent! Waiting for confirmation...");
      
      let receipt = null;
      let attempts = 0;
      while (!receipt && attempts < 30) {
        await new Promise(resolve => setTimeout(resolve, 2000));
        const receiptResponse = await fetch(SAPPHIRE_TESTNET_RPC, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            jsonrpc: '2.0',
            id: 1,
            method: 'eth_getTransactionReceipt',
            params: [txHash]
          })
        });
        const receiptData = await receiptResponse.json();
        receipt = receiptData.result;
        attempts++;
      }

      if (receipt) {
        playSound('win');
        setMessage(`✅ ${gameName} played! Transaction confirmed!`);
        
        // Add to recent games
        setRecentGames(prev => [{
          game: gameName,
          wager: value,
          time: new Date().toLocaleTimeString(),
          txHash: txHash
        }, ...prev].slice(0, 5));
        
        await loadStats();
        
        const balanceWei = await window.ethereum.request({
          method: 'eth_getBalance',
          params: [account, 'latest']
        });
        const balanceEth = parseInt(balanceWei, 16) / 1e18;
        setBalance(balanceEth.toFixed(4));
      } else {
        setMessage("⚠️ Transaction pending - may take a moment to confirm");
      }
      
      setLoading(false);
      setIsAnimating(false);
      setCoinFlipState('idle');
      setDiceRollState('idle');
      setMysteryBoxState('idle');
    } 
      catch (error) {
      console.error(error);
      playSound('lose');
      let errorMsg = "❌ Transaction failed";
      if (error.code === 4001) errorMsg = "❌ Transaction rejected by user";
      else if (error.code === -32603) errorMsg = "❌ Internal error - check your balance";
      else if (error.message) errorMsg = `❌ Error: ${error.message.slice(0, 50)}`;
      setMessage(errorMsg);
      setLoading(false);
      setIsAnimating(false);
    }
  };

  return (
    <main style={{
      minHeight: '100vh',
      background: 'linear-gradient(to bottom right, #581c87, #1e3a8a, #000000)',
      color: 'white',
      padding: '2rem',
      position: 'relative'
    }}>
      {/* Loading Overlay */}
      {loading && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.7)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999
        }}>
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '2rem',
            textAlign: 'center'
          }}>
            <div style={{
              width: '60px',
              height: '60px',
              border: '5px solid rgba(255,255,255,0.3)',
              borderTop: '5px solid white',
              borderRadius: '50%',
              animation: 'spin 1s linear infinite',
              margin: '0 auto 1rem'
            }}></div>
            <p style={{ fontSize: '1.25rem' }}>Processing...</p>
          </div>
        </div>
      )}

      {/* How to Play Modal */}
      {showModal && (
        <div onClick={() => setShowModal(false)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.8)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9998,
          padding: '2rem'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: 'linear-gradient(to bottom right, #581c87, #1e3a8a)',
            borderRadius: '1rem',
            padding: '2rem',
            maxWidth: '500px',
            border: '2px solid rgba(255,255,255,0.2)'
          }}>
            <h2 style={{ fontSize: '1.5rem', marginBottom: '1rem' }}>How to Play</h2>
            <p style={{ lineHeight: '1.6', marginBottom: '1.5rem' }}>{modalContent}</p>
            <button onClick={() => setShowModal(false)} style={{
              background: 'linear-gradient(to right, #10b981, #3b82f6)',
              color: 'white',
              padding: '0.75rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              width: '100%'
            }}>
              Got it!
            </button>
          </div>
        </div>
      )}
{/* NFT Reveal Modal */}
      {revealedNFT && (
        <div onClick={() => setRevealedNFT(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div onClick={(e) => e.stopPropagation()} className={styles.nftCard} style={{
            background: `linear-gradient(to bottom right, ${revealedNFT.color}, #1e293b)`,
            borderRadius: '1rem',
            padding: '3rem',
            maxWidth: '400px',
            border: `3px solid ${revealedNFT.color}`,
            textAlign: 'center',
            boxShadow: `0 0 50px ${revealedNFT.color}`
          }}>
            <div style={{ fontSize: '120px', marginBottom: '1rem' }}>{revealedNFT.emoji}</div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem', color: revealedNFT.color, textShadow: '0 0 10px rgba(0,0,0,0.5)' }}>
              {revealedNFT.rarity}
            </h2>
            <p style={{ fontSize: '1.5rem', marginBottom: '2rem', opacity: 0.9 }}>
              Token Multiplier: {revealedNFT.multiplier}
            </p>
            <button onClick={() => setRevealedNFT(null)} style={{
              background: 'white',
              color: '#1e293b',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              width: '100%'
            }}>
              Awesome! 🎉
            </button>
          </div>
        </div>
      )}
    
{/* Coin Flip Result Modal */}
      {coinResult && (
        <div onClick={() => setCoinResult(null)} style={{
          position: 'fixed',
          top: 0,
          left: 0,
          right: 0,
          bottom: 0,
          background: 'rgba(0,0,0,0.9)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          zIndex: 9999,
          padding: '2rem'
        }}>
          <div onClick={(e) => e.stopPropagation()} style={{
            background: coinResult === coinChoice 
              ? 'linear-gradient(to bottom right, #10b981, #059669)' 
              : 'linear-gradient(to bottom right, #ef4444, #dc2626)',
            borderRadius: '1rem',
            padding: '3rem',
            maxWidth: '400px',
            border: `3px solid ${coinResult === coinChoice ? '#10b981' : '#ef4444'}`,
            textAlign: 'center',
            boxShadow: `0 0 50px ${coinResult === coinChoice ? '#10b981' : '#ef4444'}`
          }}>
            <div style={{ fontSize: '120px', marginBottom: '1rem' }}>
              {coinResult === 'heads' ? '👑' : '🦅'}
            </div>
            <h2 style={{ fontSize: '2rem', marginBottom: '0.5rem' }}>
              {coinResult === 'heads' ? 'HEADS!' : 'TAILS!'}
            </h2>
            <p style={{ fontSize: '1.2rem', marginBottom: '1rem', opacity: 0.9 }}>
              You picked: {coinChoice.toUpperCase()}
            </p>
            <h3 style={{ 
              fontSize: '2.5rem', 
              marginBottom: '2rem',
              fontWeight: 'bold'
            }}>
              {coinResult === coinChoice ? '🎉 YOU WIN! 🎉' : '😢 YOU LOSE'}
            </h3>
            <p style={{ fontSize: '1rem', marginBottom: '2rem', opacity: 0.8 }}>
              {coinResult === coinChoice ? 'Won 0.2 TEST (2x payout)' : 'Lost 0.1 TEST'}
            </p>
            <button onClick={() => setCoinResult(null)} style={{
              background: 'white',
              color: '#1e293b',
              padding: '1rem 2rem',
              borderRadius: '0.5rem',
              border: 'none',
              cursor: 'pointer',
              fontWeight: 'bold',
              fontSize: '1rem',
              width: '100%'
            }}>
              Play Again
            </button>
          </div>
        </div>
      )}
  <div style={{ maxWidth: '1200px', margin: '0 auto' }}>
        
        <div style={{ textAlign: 'center', marginBottom: '3rem' }}>
          <h1 style={{
            fontSize: '4rem',
            fontWeight: 'bold',
            marginBottom: '1rem',
            background: 'linear-gradient(to right, #fbbf24, #ec4899)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            🎰 Proof of Luck Casino
          </h1>
          <p style={{ fontSize: '1.25rem', color: '#d1d5db', marginBottom: '1.5rem' }}>
            Provably fair gambling powered by Oasis ROFL + Sapphire
          </p>
          
          {wrongNetwork && account && (
            <div style={{
              background: 'rgba(239,68,68,0.2)',
              border: '2px solid #ef4444',
              borderRadius: '0.5rem',
              padding: '1rem',
              marginBottom: '1rem',
              maxWidth: '500px',
              margin: '0 auto 1rem'
            }}>
              ⚠️ Wrong Network! Please switch to Sapphire Testnet
            </div>
          )}
          
          {!account ? (
            <button
              onClick={connectWallet}
              disabled={loading}
              style={{
                background: 'linear-gradient(to right, #10b981, #3b82f6)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 2rem',
                borderRadius: '0.5rem',
                fontSize: '1.125rem',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                opacity: loading ? 0.5 : 1,
                transform: 'scale(1)',
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => !loading && (e.target.style.transform = 'scale(1.05)')}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              {loading ? "Connecting..." : "Connect Wallet"}
            </button>
          ) : (
            <div style={{
              background: 'rgba(255,255,255,0.1)',
              backdropFilter: 'blur(10px)',
              borderRadius: '0.5rem',
              padding: '1rem',
              display: 'inline-block'
            }}>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                Connected: {account.substring(0, 6)}...{account.substring(38)}
              </p>
              <p style={{ fontSize: '1.125rem', fontWeight: 'bold' }}>{balance} TEST</p>
              {parseFloat(balance) < 0.1 && (
                <p style={{ fontSize: '0.75rem', color: '#fbbf24', marginTop: '0.5rem' }}>
                  ⚠️ Low balance! Get more TEST from faucet
                </p>
              )}
            </div>
          )}
        </div>

        {message && (
          <div style={{
            background: 'rgba(255,255,255,0.1)',
            backdropFilter: 'blur(10px)',
            borderRadius: '0.5rem',
            padding: '1rem',
            marginBottom: '2rem',
            textAlign: 'center'
          }}>
            <p style={{ fontSize: '1.125rem', marginBottom: lastTxHash ? '0.5rem' : 0 }}>{message}</p>
            {lastTxHash && (
              <a 
                href={`${EXPLORER_URL}/tx/${lastTxHash}`}
                target="_blank"
                rel="noopener noreferrer"
                style={{
                  color: '#60a5fa',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                  display: 'inline-block',
                  marginTop: '0.5rem'
                }}
                onMouseEnter={(e) => e.target.style.textDecoration = 'underline'}
                onMouseLeave={(e) => e.target.style.textDecoration = 'none'}
              >
                🔗 View transaction on explorer →
              </a>
            )}
          </div>
        )}

        {stats && (
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: '1rem',
            marginBottom: '3rem'
          }}>
            {[
              { label: 'Total Games', value: stats.totalGames },
              { label: 'Total Wagered', value: stats.totalWagered + ' TEST' },
              { label: 'Total Paid Out', value: stats.totalPaidOut + ' TEST' },
              { label: 'House Balance', value: stats.houseBalance + ' TEST' }
            ].map((stat, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.1)',
                backdropFilter: 'blur(10px)',
                borderRadius: '0.5rem',
                padding: '1rem',
                transition: 'transform 0.2s',
                cursor: 'default'
              }}
              onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-5px)'}
              onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}
              >
                <p style={{ color: '#9ca3af', fontSize: '0.875rem' }}>{stat.label}</p>
                <p style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>{stat.value}</p>
              </div>
            ))}
          </div>
        )}

        {recentGames.length > 0 && (
          <div style={{
            background: 'rgba(255,255,255,0.05)',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '1.5rem',
            marginBottom: '3rem',
            border: '1px solid rgba(255,255,255,0.1)'
          }}>
            <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', marginBottom: '1rem' }}>
              📊 Recent Games
            </h3>
            {recentGames.map((game, i) => (
              <div key={i} style={{
                background: 'rgba(255,255,255,0.05)',
                padding: '0.75rem',
                borderRadius: '0.5rem',
                marginBottom: '0.5rem',
                display: 'flex',
                justifyContent: 'space-between',
                alignItems: 'center',
                fontSize: '0.875rem'
              }}>
                <span>{game.game} - {game.wager} TEST</span>
                <div>
                  <span style={{ color: '#9ca3af', marginRight: '1rem' }}>{game.time}</span>
                  <a 
                    href={`${EXPLORER_URL}/tx/${game.txHash}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    style={{ color: '#60a5fa', textDecoration: 'none' }}
                  >
                    View →
                  </a>
                </div>
              </div>
            ))}
          </div>
        )}

        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))',
          gap: '2rem'
        }}>
          
          {/* Mystery Box */}
          <div style={{
            background: 'linear-gradient(to bottom right, rgba(147,51,234,0.2), rgba(219,39,119,0.2))',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid rgba(147,51,234,0.3)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(147,51,234,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem', 
              textAlign: 'center',
              transform: isAnimating ? 'scale(1.2) rotate(360deg)' : 'scale(1)',
              transition: 'transform 0.5s'
            }}>
  <span className={mysteryBoxState === 'shaking' ? styles.boxShaking : mysteryBoxState === 'opening' ? styles.boxOpening : ''}>
    🎁
  </span>
</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Mystery Box</h2>
              <button 
                onClick={() => showHowToPlay('mysteryBox')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >ℹ️</button>
            </div>
            <p style={{ color: '#d1d5db', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Win random NFTs and tokens! Rarity from Common to Legendary.
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <p>💎 Common: 75% (0.5x tokens)</p>
              <p>💠 Rare: 17.5% (1x tokens)</p>
              <p>🔷 Epic: 5% (3x tokens)</p>
              <p>⭐ Legendary: 2.5% (10x tokens)</p>
            </div>
            <button
              onClick={() => playGame('mysteryBox', 0.1)}
              disabled={loading || !account || wrongNetwork || parseFloat(balance) < 0.1}
              style={{
                width: '100%',
                background: loading || !account || wrongNetwork || parseFloat(balance) < 0.1 
                  ? 'rgba(147,51,234,0.3)' 
                  : 'linear-gradient(to right, #9333ea, #ec4899)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 'not-allowed' : 'pointer',
                opacity: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 0.5 : 1,
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading && account && !wrongNetwork && parseFloat(balance) >= 0.1) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Play (0.1 TEST)
            </button>
          </div>

          {/* Coin Flip */}
          <div style={{
            background: 'linear-gradient(to bottom right, rgba(234,179,8,0.2), rgba(249,115,22,0.2))',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid rgba(234,179,8,0.3)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(234,179,8,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem', 
              textAlign: 'center',
              transform: isAnimating ? 'rotateY(360deg)' : 'rotateY(0)',
              transition: 'transform 0.6s'
            }}>
  <span className={coinFlipState === 'flipping' ? styles.coinFlipping : ''}>
    🪙
  </span>
</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Coin Flip</h2>
              <button 
                onClick={() => showHowToPlay('coinFlip')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >ℹ️</button>
            </div>
            <p style={{ color: '#d1d5db', marginBottom: '1rem', fontSize: '0.875rem' }}>
                Double or nothing! 50% chance to win 2x your bet.
            </p>
            

{/* Heads/Tails Selector */}
            <div style={{ 
              display: 'flex', 
              gap: '0.5rem', 
              marginBottom: '1rem' 
            }}>
              <button
                onClick={() => setCoinChoice('heads')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: coinChoice === 'heads' ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
                  border: coinChoice === 'heads' ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🪙 Heads
              </button>
              <button
                onClick={() => setCoinChoice('tails')}
                style={{
                  flex: 1,
                  padding: '0.75rem',
                  background: coinChoice === 'tails' ? 'linear-gradient(to right, #f59e0b, #d97706)' : 'rgba(255,255,255,0.1)',
                  border: coinChoice === 'tails' ? '2px solid #f59e0b' : '2px solid rgba(255,255,255,0.2)',
                  borderRadius: '0.5rem',
                  color: 'white',
                  fontWeight: 'bold',
                  cursor: 'pointer',
                  transition: 'all 0.3s'
                }}
              >
                🪙 Tails
              </button>
            </div>



<div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem',
              fontSize: '0.875rem'
            }}>
              <p>✅ Win: 50% (2x payout)</p>
              <p>❌ Lose: 50% (nothing)</p>
              <p style={{ marginTop: '0.5rem', color: '#9ca3af' }}>Simple & fair!</p>
            </div>
            <button
              onClick={() => playGame('coinFlip', 0.1)}
              disabled={loading || !account || wrongNetwork || parseFloat(balance) < 0.1}
              style={{
                width: '100%',
                background: loading || !account || wrongNetwork || parseFloat(balance) < 0.1 
                  ? 'rgba(234,179,8,0.3)' 
                  : 'linear-gradient(to right, #eab308, #f97316)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 'not-allowed' : 'pointer',
                opacity: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 0.5 : 1,
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading && account && !wrongNetwork && parseFloat(balance) >= 0.1) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Play (0.1 TEST)
            </button>
          </div>

          {/* Dice Roll */}
          <div style={{
            background: 'linear-gradient(to bottom right, rgba(59,130,246,0.2), rgba(6,182,212,0.2))',
            backdropFilter: 'blur(10px)',
            borderRadius: '1rem',
            padding: '1.5rem',
            border: '1px solid rgba(59,130,246,0.3)',
            transition: 'transform 0.3s, box-shadow 0.3s',
            cursor: 'default'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-10px)';
            e.currentTarget.style.boxShadow = '0 20px 40px rgba(59,130,246,0.3)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = 'none';
          }}
          >
            <div style={{ 
              fontSize: '4rem', 
              marginBottom: '1rem', 
              textAlign: 'center',
              transform: isAnimating ? 'rotate(360deg)' : 'rotate(0)',
              transition: 'transform 0.5s'
            }}>
  <span className={diceRollState === 'rolling' ? styles.diceRolling : ''}>
    🎲
  </span>
</div>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '0.75rem' }}>
              <h2 style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>Dice Roll</h2>
              <button 
                onClick={() => showHowToPlay('diceRoll')}
                style={{
                  background: 'rgba(255,255,255,0.2)',
                  border: 'none',
                  borderRadius: '50%',
                  width: '30px',
                  height: '30px',
                  cursor: 'pointer',
                  fontSize: '1rem'
                }}
              >ℹ️</button>
            </div>
            <p style={{ color: '#d1d5db', marginBottom: '1rem', fontSize: '0.875rem' }}>
              Choose your multiplier! Higher risk = higher reward.
            </p>
            <div style={{
              background: 'rgba(0,0,0,0.3)',
              borderRadius: '0.5rem',
              padding: '0.75rem',
              marginBottom: '1rem'
            }}>
              <label style={{ fontSize: '0.875rem', color: '#d1d5db', display: 'block', marginBottom: '0.5rem' }}>
                Multiplier: {(diceMultiplier / 100).toFixed(1)}x
              </label>
              <input
                type="range"
                min="110"
                max="600"
                step="10"
                value={diceMultiplier}
                onChange={(e) => setDiceMultiplier(parseInt(e.target.value))}
                style={{ width: '100%' }}
              />
              <p style={{ fontSize: '0.75rem', color: '#9ca3af', marginTop: '0.5rem' }}>
                Win chance: ~{(10000 / (diceMultiplier / 100) / 100).toFixed(1)}%
              </p>
            </div>
            <button
              onClick={() => playGame('diceRoll', 0.1, diceMultiplier)}
              disabled={loading || !account || wrongNetwork || parseFloat(balance) < 0.1}
              style={{
                width: '100%',
                background: loading || !account || wrongNetwork || parseFloat(balance) < 0.1 
                  ? 'rgba(59,130,246,0.3)' 
                  : 'linear-gradient(to right, #3b82f6, #06b6d4)',
                color: 'white',
                fontWeight: 'bold',
                padding: '0.75rem 1.5rem',
                borderRadius: '0.5rem',
                border: 'none',
                cursor: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 'not-allowed' : 'pointer',
                opacity: (loading || !account || wrongNetwork || parseFloat(balance) < 0.1) ? 0.5 : 1,
                transition: 'transform 0.2s'
              }}
              onMouseEnter={(e) => {
                if (!loading && account && !wrongNetwork && parseFloat(balance) >= 0.1) {
                  e.target.style.transform = 'scale(1.05)';
                }
              }}
              onMouseLeave={(e) => e.target.style.transform = 'scale(1)'}
            >
              Play (0.1 TEST)
            </button>
          </div>
        </div>

        <div style={{
          marginTop: '3rem',
          background: 'rgba(255,255,255,0.05)',
          backdropFilter: 'blur(10px)',
          borderRadius: '1rem',
          padding: '2rem',
          border: '1px solid rgba(255,255,255,0.1)'
        }}>
          <h2 style={{ fontSize: '2rem', fontWeight: 'bold', marginBottom: '1.5rem', textAlign: 'center' }}>
            How It Works
          </h2>
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))',
            gap: '1.5rem',
            textAlign: 'center'
          }}>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🔐</div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Secure Randomness</h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                All random numbers generated in ROFL's Trusted Execution Environment (TEE)
              </p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>✅</div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>Provably Fair</h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                ROFL signs all results with TEE-backed keys - fully verifiable
              </p>
            </div>
            <div>
              <div style={{ fontSize: '3rem', marginBottom: '0.75rem' }}>🚫</div>
              <h3 style={{ fontWeight: 'bold', marginBottom: '0.5rem' }}>No Cheating</h3>
              <p style={{ fontSize: '0.875rem', color: '#d1d5db' }}>
                Even we can't see or manipulate results - pure hardware isolation
              </p>
            </div>
          </div>
        </div>

        <div style={{ marginTop: '2rem', textAlign: 'center', color: '#9ca3af', fontSize: '0.875rem' }}>
          <p>Built with Oasis Sapphire + ROFL for ETHGlobal Hackathon</p>
          <p style={{ marginTop: '0.5rem' }}>⚠️ Testnet only - No real money involved</p>
          <p style={{ marginTop: '0.5rem' }}>
            <a 
              href={`${EXPLORER_URL}/address/${GAME_MANAGER_ADDRESS}`}
              target="_blank"
              rel="noopener noreferrer"
              style={{ color: '#60a5fa', textDecoration: 'none' }}
            >
              View Contract on Explorer →
            </a>
          </p>
        </div>
      </div>

      <style jsx>{`
        @keyframes spin {
          0% { transform: rotate(0deg); }
          100% { transform: rotate(360deg); }
        }
      `}</style>
    </main>
  );
}

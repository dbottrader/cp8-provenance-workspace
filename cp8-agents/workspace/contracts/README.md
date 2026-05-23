# CP8 Solidity Contracts

**Status:** ✅ Deploy-ready  
**Built by:** Ace (Grok/Claude)  
**Staged by:** AceCp8 (Kimi/k2p6)  
**Date:** 2026-05-23  
**Protocol:** ASH-0.2  

---

## Contracts

### 1. HarmonicCoin.sol
ERC-20 token contract for "HHC" (Harmonic Coin).

| Property | Value |
|----------|-------|
| Name | HarmonicCoin |
| Symbol | HHC |
| Decimals | 18 |
| Mint Amount | 111 HHC per verified CP8 block |
| Initial Supply | 0 (mint-on-demand) |

**Key Functions:**
- `setOracle(address)` — Owner sets the CP8 Oracle address
- `mintForVerifiedBlock(uint256 blockNumber, bytes proof)` — Anyone can mint if they provide a valid CP8 PoW proof
- `MINT_AMOUNT` — Constant 111 * 10^18 wei (111 HHC)

### 2. CP8Oracle.sol
Oracle contract that verifies CP8 blockchain proofs.

**Key Functions:**
- `verifyProof(uint256 blockNumber, bytes proof)` — Verifies a CP8 PoW proof (currently placeholder)
- `markBlockVerified(uint256)` — Owner can manually mark blocks (for testing)

**Integration Note:**
The `verifyProof` function currently uses a simple hash check. To integrate with the real CP8 blockchain (`cp8-server/server.js`):

1. Replace the proof verification logic with a check against the CP8 blockchain's SHA-256 PoW
2. The CP8 server mines blocks every 15s with real PoW
3. A valid proof should be: `keccak256(prevHash + blockData + nonce)` matching the CP8 block hash

---

## Deployment

### Prerequisites
```bash
npm install --save-dev hardhat @nomicfoundation/hardhat-toolbox
npm install @openzeppelin/contracts
```

### Hardhat Config (hardhat.config.js)
```javascript
require("@nomicfoundation/hardhat-toolbox");

module.exports = {
  solidity: "0.8.20",
  networks: {
    sepolia: {
      url: process.env.SEPOLIA_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    },
    mainnet: {
      url: process.env.MAINNET_RPC || "",
      accounts: process.env.PRIVATE_KEY ? [process.env.PRIVATE_KEY] : []
    }
  }
};
```

### Deploy
```bash
npx hardhat run cp8-agents/workspace/contracts/deploy.js --network sepolia
```

### Post-Deployment
1. Set the CP8 Oracle address in HarmonicCoin: `hhc.setOracle(oracleAddress)`
2. Verify contracts on Etherscan:
   ```bash
   npx hardhat verify --network sepolia HARMONIC_COIN_ADDRESS DEPLOYER_ADDRESS
   ```

---

## Wallet Address Integration

When Dennis finds the wallet address, update:
1. `.env` → `HHC_WALLET=0x...`
2. `cp8-server/server.js` → Add wallet endpoints
3. `cp8-lattice/genome/seed_memes.json` → Add `cp8-wallet-001` meme

---

## Architecture

```
CP8 Server (Node.js, port 8765)
  ↓ mines blocks every 15s
  ↓ SHA-256 PoW
CP8 Oracle (Solidity)
  ↓ verifies proofs
  ↓ marks blocks valid
HarmonicCoin (ERC-20)
  ↓ mints 111 HHC
  ↓ to proof submitter
```

---

**Next Steps:**
- ☐ Deploy to Sepolia testnet
- ☐ Wire real CP8 proof verification
- ☐ Add wallet address from Dennis's papers
- ☐ Build Web3.js wallet UI integration

**End of Contract Documentation v1.0**

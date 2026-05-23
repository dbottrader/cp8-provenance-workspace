# HHC Wallet Integration Map

**Status:** Awaiting wallet address from user  
**Target:** Bridge CP8 PoW blockchain to on-chain crypto (ETH/ERC-20)  
**Last Updated:** 2026-05-23

---

## Current State

The CP8 Supreme OS (`cp8-server/server.js`) already has:
- ✅ Real SHA-256 PoW blockchain with genesis block
- ✅ Difficulty scaling (2→5)
- ✅ 15-second block time
- ✅ WebSocket broadcast
- ✅ Agent swarm tracking

The HHC Wallet UI (`cp8-server/public/hhc-wallet.html`) has:
- ✅ Proof of Presence (PoP) portal interface
- ✅ HDIS score calculator
- ✅ Glyph-based key generation (placeholder)

**Missing:** Actual wallet address + blockchain bridge

---

## Integration Points

### 1. Wallet Address Location
Once user provides wallet address, it should be stored in:
- `cp8-server/.env` or `cp8-server/config.json` — Server-side config
- `cp8-server/public/hhc-wallet.html` — Display in UI
- `cp8-lattice/genome/seed_memes.json` — Add as `cp8-wallet-001` meme entry

### 2. Blockchain Bridge Options

**Option A: Ethereum Web3 Bridge**
- Add `web3.js` or `ethers.js` to `cp8-server/public/hhc-wallet.html`
- Connect to MetaMask or WalletConnect
- Bridge CP8 PoW blocks to Ethereum testnet/mainnet
- Deploy ERC-20 "HHC" token contract

**Option B: Custom L2 Chain**
- Use existing PoW as Layer 1
- Add rollup/bridge to Ethereum
- Lower gas, higher throughput

**Option C: PoW → Token Minting**
- Each mined CP8 block = minting right
- Claim function on Ethereum smart contract
- Proof of mining submitted as merkle proof

### 3. Code Integration Map

```
cp8-server/server.js
  ├── Add: const WALLET_ADDRESS = process.env.HHC_WALLET || config.walletAddress
  ├── Add: /api/wallet/balance endpoint
  ├── Add: /api/wallet/bridge endpoint (cross-chain)
  └── Modify: mineBlock() → emit minting event

cp8-server/public/hhc-wallet.html
  ├── Add: Web3 connection button
  ├── Add: Display wallet address + balance
  ├── Add: "Bridge to ETH" button
  └── Add: Transaction history table

cp8-lattice/genome/seed_memes.json
  └── Add: cp8-wallet-001 meme entry
      {
        "id": "cp8-wallet-001",
        "type": "wallet_anchor",
        "rule": {"trigger": "ALWAYS", "action": "VERIFY_WALLET_INTEGRITY"},
        "meta": {"wallet_address": "0x...", "network": "ethereum", "contract": "0x..."},
        "lineage_signature": "sha256:..."
      }
```

---

## Wallet Address Input Points

When user provides wallet address, update these files:

1. **Create `.env` file:**
```bash
HHC_WALLET_ADDRESS=0x...
HHC_NETWORK=ethereum
HHC_CONTRACT_ADDRESS=0x...  # if deployed
ETH_RPC_URL=https://mainnet.infura.io/v3/...
```

2. **Add to seed memes:**
```json
{
  "id": "cp8-wallet-001",
  "type": "wallet_anchor",
  "rule": {"trigger": "ALWAYS", "action": "VERIFY_WALLET_INTEGRITY"},
  "meta": {
    "wallet_address": "USER_PROVIDED",
    "network": "ethereum",
    "source": "user",
    "created": "2026-05-23T00:00:00Z"
  },
  "lineage_signature": "sha256:...",
  "cp8_harmonic": {"element": "earth", "frequency_hz": 428, "quadrant": 1, "mirror_count": 1}
}
```

3. **Update HHC Wallet HTML:**
- Display address
- Show "Connected" status
- Enable bridge functions

---

## Smart Contract Spec (Draft)

If deploying HHC as ERC-20:

```solidity
// SPDX-License-Identifier: CP8
pragma solidity ^0.8.0;

contract HHCToken is ERC20 {
    address public cp8Oracle;
    
    constructor(address _oracle) ERC20("Harmonic Coin", "HHC") {
        cp8Oracle = _oracle;
    }
    
    // Mint based on CP8 PoW proof
    function mintWithProof(bytes32 blockHash, uint256 nonce) external {
        require(CP8Oracle(cp8Oracle).verifyBlock(blockHash, nonce), "Invalid proof");
        _mint(msg.sender, 111 * 10**18); // 111 HHC per block
    }
}
```

---

## Next Steps

1. ☐ User provides wallet address from old papers
2. ☐ Add address to `.env` + seed memes
3. ☐ Update HHC Wallet UI to show connected address
4. ☐ Deploy ERC-20 contract (or bridge to existing)
5. ☐ Add `/api/wallet/*` endpoints to cp8-server
6. ☐ Test bridge: mine CP8 block → mint HHC on-chain

---

*Awaiting wallet address from user.*

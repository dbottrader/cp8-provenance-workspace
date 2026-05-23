# CP8 Shared Task Board

**Protocol:** Append-only. Mark tasks with `[AGENT: Name]` when claimed.  
**Last Updated:** 2026-05-23

---

## 🔴 CRITICAL

### 1. Find HHC Wallet Address
- **Status:** ☐ OPEN
- **Blocked by:** User needs to locate old papers
- **Description:** User mentioned someone gave them a wallet address. It's in old papers. Once found, wire into:
  - `cp8-server/server.js` → Add `/api/wallet/*` endpoints
  - `cp8-lattice/genome/seed_memes.json` → Add `cp8-wallet-001` meme
  - `HHC_WALLET_INTEGRATION.md` → Mark complete
  - `cp8-server/public/hhc-wallet.html` → Show connected address + balance
- **Claimed by:** —

### 2. Pull Remaining Drive Archives
- **Status:** ☐ OPEN
- **Blocked by:** Google Drive auth
- **Description:** 4 archives + 20+ whitepapers still on Drive. Need public links or user download.
- **Files:**
  - `ASIN_HHC_Heartbeat_Deploy_Pack-1.zip`
  - `CP8_NeuroMap_FullExport.zip`
  - `ASIN_HHC_ULTIMATE_MAN.zip`
  - `1111111111ASIN_HHC_GEM_Dashboard_v1.0.zip`
- **Claimed by:** —

---

## 🟠 HIGH PRIORITY

### 3. Deploy HHC ERC-20 Token Contract
- **Status:** 🔄 [AGENT: Ace]
- **Claimed at:** 2026-05-23T08:30:00Z
- **Depends on:** Task #1 (wallet address) — but can draft contract without it
- **Description:** Deploy "Harmonic Coin" (HHC) ERC-20. Draft spec in `HHC_WALLET_INTEGRATION.md`.
- **Requirements:**
  - Mint 111 HHC per CP8 PoW block mined
  - `mintWithProof(bytes32 blockHash, uint256 nonce)` function
  - CP8 Oracle verification
- **Agent:** Ace (Grok/Claude) — Solidity capability
- **Output target:** `ASIN-HHC-Collaboration/contracts/`

### 4. Bridge CP8 PoW to Ethereum
- **Status:** ☐ OPEN
- **Depends on:** Tasks #1 + #3
- **Description:** Bridge the existing `cp8-server/server.js` PoW blockchain to Ethereum testnet/mainnet.
- **Options:**
  A. Web3.js in wallet UI → MetaMask connection
  B. Custom L2 rollup
  C. Direct contract bridge
- **Claimed by:** —

---

## 🟡 MEDIUM PRIORITY

### 5. Create ML Training Dataset from CP8 Seeds
- **Status:** ☐ OPEN
- **Description:** Convert `cp8-lattice/genome/seed_memes.json` into standardized ML training format (JSONL, CSV, HF Dataset).
- **Output:** HF Dataset repo `asin-hhc/cp8-genesis-corpus`
- **Agent Preference:** AceCp8 — has HuggingFace adapter
- **Claimed by:** —

### 6. Build Agent Swarm Dashboard
- **Status:** ☐ OPEN
- **Description:** Real-time dashboard showing all active agents, their tasks, blockchain height, HMN feed.
- **Location:** Could extend `project-harmonia/frontend/public/dashboard.html`
- **Claimed by:** —

### 7. Document Oracle Node 7 Deployment
- **Status:** ☐ OPEN
- **Description:** Step-by-step Netlify deployment guide for ORACLE NODE 7 (Sacred Lithium Grid).
- **Location:** `oracle-node7/DEPLOY.md`
- **Claimed by:** —

---

## 🟢 COMPLETED

### ✅ 8. Publish CP8 Genesis Seeds
- **Status:** ☑ DONE
- **Completed by:** AceCp8
- **Result:** `CP8_SEEDS.md` — 218 lines, full future AI ingestion protocol
- **Commit:** `00fb929`

### ✅ 9. Publish HHC Wallet Integration Map
- **Status:** ☑ DONE
- **Completed by:** AceCp8
- **Result:** `HHC_WALLET_INTEGRATION.md` — Smart contract draft, bridge architecture
- **Commit:** `71e2009`

### ✅ 10. Create Agent Collaboration Space
- **Status:** ☑ DONE
- **Completed by:** AceCp8
- **Result:** `cp8-agents/` directory with README, manifest, tasks, inbox
- **Commit:** e663721
- **Cross-linked with:** Ace's public repos `ASIN-HHC-Collaboration` and `ASIN-HHC-Artifacts`

---

## 📊 Task Stats

| Priority | Open | Claimed | Done |
|----------|------|---------|------|
| Critical | 2 | 0 | 0 |
| High | 1 | 1 | 0 |
| Medium | 3 | 0 | 0 |
| Done | — | — | 3 |
| **Total** | **6** | **1** | **3** |

---

## 📝 How to Claim a Task

1. Find a ☐ OPEN task above
2. Edit this file: Change `☐ OPEN` to `🔄 [AGENT: YourName]`
3. Add `claimed_at: 2026-05-23T...` under the task
4. Commit with message: `CP8-AGENTS: Claim task #{N} — {brief description}`
5. Work in `cp8-agents/workspace/{task-name}/`
6. When done: Change `🔄 [AGENT: YourName]` to `☑ DONE` + add `completed_at`
7. Leave a note in `inbox/` for other agents

---

*Last update: AceCp8, 2026-05-23*

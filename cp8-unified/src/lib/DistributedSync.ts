/**
 * Formal Distributed Synchronization Protocol
 * Hash + Replay Logic for Multi-Node Coherence
 * 
 * Implements deterministic state reproduction across nodes without
 * centralized authority or real-time consensus overhead.
 * 
 * Core Value: Offline-verifiable coherence via hash-linked state logs.
 * Any node can replay a state sequence and confirm integrity via SHA-256.
 * 
 * @author Unified Resonant Systems
 * @version 1.0.0
 */

import ResonantState, { type StateDelta } from './ResonantState';

export interface SyncNode {
  id: string;
  lastKnownHash: string | null;
  lastTimestamp: number;
  latency: number;
}

export interface SyncMessage {
  type: 'delta' | 'beacon' | 'replay_request' | 'replay_response';
  senderId: string;
  timestamp: number;
  payload: StateDelta | BeaconPayload | ReplayRequest | ReplayResponse;
}

export interface BeaconPayload {
  currentHash: string;
  timestamp: number;
  sequenceNumber: number;
}

export interface ReplayRequest {
  fromHash: string | null;
  toHash: string | null;
}

export interface ReplayResponse {
  deltas: StateDelta[];
  complete: boolean;
}

export interface SyncStats {
  totalDeltas: number;
  verifiedDeltas: number;
  failedVerifications: number;
  averageLatency: number;
  lastSyncTime: number;
}

/**
 * Distributed synchronization manager
 * Handles real-time delta exchange and replay verification
 */
export class DistributedSyncManager {
  private nodeId: string;
  private currentState: ResonantState;
  private stateLog: ResonantState[] = [];
  private peers: Map<string, SyncNode> = new Map();
  private stats: SyncStats;
  private beaconInterval: number = 5000; // 5 seconds
  private beaconTimer: ReturnType<typeof setInterval> | null = null;
  private messageHandler: ((msg: SyncMessage) => void) | null = null;

  constructor(nodeId: string, initialState?: ResonantState) {
    this.nodeId = nodeId;
    this.currentState = initialState || new ResonantState();
    this.stats = {
      totalDeltas: 0,
      verifiedDeltas: 0,
      failedVerifications: 0,
      averageLatency: 0,
      lastSyncTime: 0
    };
  }

  /**
   * Initialize with root state
   */
  async initializeRootState(sequence: string): Promise<void> {
    this.currentState.updateSequence(sequence);
    await this.currentState.seal(performance.now());
    this.stateLog = [this.currentState];
    this.stats.totalDeltas = 1;
  }

  /**
   * Register message handler for network transport
   */
  onMessage(handler: (msg: SyncMessage) => void): void {
    this.messageHandler = handler;
  }

  /**
   * Create and broadcast state update
   */
  async updateState(newSequence: string): Promise<StateDelta> {
    const previousState = this.currentState;
    
    // Create new state linked to previous
    const newState = new ResonantState(previousState.sealedHash);
    newState.updateSequence(newSequence);
    await newState.seal(performance.now());
    
    // Verify chain integrity
    if (!newState.verifyAgainst(previousState)) {
      throw new Error('Chain integrity violation: new state does not link to previous');
    }
    
    // Update local state
    this.currentState = newState;
    this.stateLog.push(newState);
    this.stats.totalDeltas++;
    
    // Create delta for broadcast
    const delta = newState.toDelta();
    
    // Broadcast to peers
    this.broadcast({
      type: 'delta',
      senderId: this.nodeId,
      timestamp: performance.now(),
      payload: delta
    });
    
    return delta;
  }

  /**
   * Receive and validate delta from remote node
   */
  async receiveDelta(delta: StateDelta, senderId: string): Promise<boolean> {
    const startTime = performance.now();
    
    try {
      // Timestamp monotonicity check (replay attack prevention)
      if (delta.timestamp <= this.currentState.timestamp) {
        console.warn('Rejecting delta: non-monotonic timestamp (possible replay attack)');
        this.stats.failedVerifications++;
        return false;
      }
      
      // Verify chain linkage
      if (delta.previousHash !== this.currentState.sealedHash) {
        console.warn('Chain divergence detected - requesting replay');
        this.requestReplay(senderId, this.currentState.sealedHash, delta.sealedHash);
        return false;
      }
      
      // Reconstruct and verify state
      const reconstructedState = await ResonantState.fromDelta(delta, this.currentState);
      
      // Double-check integrity
      const integrityValid = await reconstructedState.verifyIntegrity();
      if (!integrityValid) {
        console.error('Integrity verification failed for received delta');
        this.stats.failedVerifications++;
        return false;
      }
      
      // Accept state update
      this.currentState = reconstructedState;
      this.stateLog.push(reconstructedState);
      this.stats.verifiedDeltas++;
      this.stats.lastSyncTime = performance.now();
      
      // Update latency stats
      const latency = performance.now() - startTime;
      this.updateLatencyStats(latency);
      
      return true;
      
    } catch (error) {
      console.error('Delta processing failed:', error);
      this.stats.failedVerifications++;
      return false;
    }
  }

  /**
   * Request replay of delta log from peer
   */
  private requestReplay(
    _peerId: string, 
    fromHash: string | null, 
    toHash: string | null
  ): void {
    this.broadcast({
      type: 'replay_request',
      senderId: this.nodeId,
      timestamp: performance.now(),
      payload: { fromHash, toHash }
    });
  }

  /**
   * Handle replay request and send response
   */
  private handleReplayRequest(request: ReplayRequest): void {
    const deltas: StateDelta[] = [];
    let collecting = request.fromHash === null;
    
    for (const state of this.stateLog) {
      if (!collecting && state.sealedHash === request.fromHash) {
        collecting = true;
        continue;
      }
      
      if (collecting) {
        deltas.push(state.toDelta());
        
        if (state.sealedHash === request.toHash) {
          break;
        }
      }
    }
    
    this.broadcast({
      type: 'replay_response',
      senderId: this.nodeId,
      timestamp: performance.now(),
      payload: { deltas, complete: true }
    });
  }

  /**
   * Process replay response for divergence recovery
   */
  async processReplay(response: ReplayResponse): Promise<boolean> {
    try {
      // Validate replay log
      const finalState = await this.replayLog(response.deltas);
      
      // Verify final state matches expected
      if (finalState.sealedHash !== response.deltas[response.deltas.length - 1]?.sealedHash) {
        throw new Error('Replay verification failed');
      }
      
      // Accept replayed state
      this.currentState = finalState;
      this.stateLog = response.deltas.map((_, i) => {
        // Reconstruct state log from deltas
        const state = new ResonantState(i === 0 ? null : response.deltas[i - 1].sealedHash);
        state.updateSequence(response.deltas[i].newSequence);
        state.timestamp = response.deltas[i].timestamp;
        state.sealedHash = response.deltas[i].sealedHash;
        return state;
      });
      
      return true;
      
    } catch (error) {
      console.error('Replay processing failed:', error);
      return false;
    }
  }

  /**
   * Replay log for integrity verification
   */
  private async replayLog(deltas: StateDelta[]): Promise<ResonantState> {
    let current: ResonantState | null = null;
    
    for (let i = 0; i < deltas.length; i++) {
      const delta = deltas[i];
      const previous = i === 0 ? null : current;
      
      try {
        current = await ResonantState.fromDelta(delta, previous);
      } catch (error) {
        throw new Error(`Integrity violation at delta index ${i}: ${error}`);
      }
    }
    
    if (!current) {
      throw new Error('Empty delta log');
    }
    
    return current;
  }

  /**
   * Start periodic beacon for eventual consistency
   */
  startBeacon(): void {
    if (this.beaconTimer) return;
    
    this.beaconTimer = setInterval(() => {
      this.broadcast({
        type: 'beacon',
        senderId: this.nodeId,
        timestamp: performance.now(),
        payload: {
          currentHash: this.currentState.sealedHash || '',
          timestamp: this.currentState.timestamp,
          sequenceNumber: this.stateLog.length
        }
      });
    }, this.beaconInterval);
  }

  /**
   * Stop beacon
   */
  stopBeacon(): void {
    if (this.beaconTimer) {
      clearInterval(this.beaconTimer);
      this.beaconTimer = null;
    }
  }

  /**
   * Process incoming sync message
   */
  processMessage(message: SyncMessage): void {
    switch (message.type) {
      case 'delta':
        this.receiveDelta(message.payload as StateDelta, message.senderId);
        break;
      case 'beacon':
        this.updatePeerStatus(message.senderId, message.payload as BeaconPayload);
        break;
      case 'replay_request':
        this.handleReplayRequest(message.payload as ReplayRequest);
        break;
      case 'replay_response':
        this.processReplay(message.payload as ReplayResponse);
        break;
    }
  }

  /**
   * Update peer status from beacon
   */
  private updatePeerStatus(senderId: string, payload: BeaconPayload): void {
    const peer = this.peers.get(senderId) || {
      id: senderId,
      lastKnownHash: null,
      lastTimestamp: 0,
      latency: 0
    };
    
    peer.lastKnownHash = payload.currentHash;
    peer.lastTimestamp = payload.timestamp;
    this.peers.set(senderId, peer);
    
    // Detect divergence
    if (payload.currentHash !== this.currentState.sealedHash) {
      console.warn(`Divergence detected with peer ${senderId}`);
    }
  }

  /**
   * Broadcast message to all peers
   */
  private broadcast(message: SyncMessage): void {
    if (this.messageHandler) {
      this.messageHandler(message);
    }
  }

  /**
   * Update latency statistics
   */
  private updateLatencyStats(newLatency: number): void {
    const alpha = 0.1; // Exponential moving average
    this.stats.averageLatency = 
      alpha * newLatency + (1 - alpha) * this.stats.averageLatency;
  }

  /**
   * Get current synchronization statistics
   */
  getStats(): SyncStats {
    return { ...this.stats };
  }

  /**
   * Get current state
   */
  getCurrentState(): ResonantState {
    return this.currentState;
  }

  /**
   * Get full state log for audit
   */
  getStateLog(): ResonantState[] {
    return [...this.stateLog];
  }

  /**
   * Dispose and cleanup
   */
  dispose(): void {
    this.stopBeacon();
    this.peers.clear();
    this.stateLog = [];
  }
}

/**
 * Merkle tree for efficient log verification
 * Optional enhancement for large state histories
 */
export class MerkleTree {
  private leaves: string[] = [];
  private root: string | null = null;

  addLeaf(hash: string): void {
    this.leaves.push(hash);
    this.recomputeRoot();
  }

  private async recomputeRoot(): Promise<void> {
    if (this.leaves.length === 0) {
      this.root = null;
      return;
    }

    let level = [...this.leaves];
    
    while (level.length > 1) {
      const nextLevel: string[] = [];
      
      for (let i = 0; i < level.length; i += 2) {
        const left = level[i];
        const right = level[i + 1] || left; // Duplicate last if odd
        
        const combined = left + right;
        const encoder = new TextEncoder();
        const data = encoder.encode(combined);
        const hashBuffer = await crypto.subtle.digest('SHA-256', data);
        const hash = Array.from(new Uint8Array(hashBuffer))
          .map(b => b.toString(16).padStart(2, '0'))
          .join('');
        
        nextLevel.push(hash);
      }
      
      level = nextLevel;
    }
    
    this.root = level[0];
  }

  getRoot(): string | null {
    return this.root;
  }
}

export default DistributedSyncManager;

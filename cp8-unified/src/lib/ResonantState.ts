/**
 * ResonantState - Deterministic State Engine with Cryptographic Attestation
 * 
 * Core class for the Unified Resonant Systems framework.
 * Implements deterministic state reproduction, SHA-256 integrity sealing,
 and hash-chained synchronization for distributed coherence.
 * 
 * @author Unified Resonant Systems
 * @version 1.0.0
 */

export interface Ratio {
  name: string;
  ratio: [number, number];
}

export interface StateDelta {
  type: 'delta';
  previousHash: string | null;
  newSequence: string;
  timestamp: number;
  sealedHash: string;
}

export interface CanonicalState {
  f0: number;
  ratios: Ratio[];
  inputSequence: string;
  derivedFrequencies: number[];
  timestamp: number;
  previousHash: string | null;
}

export class ResonantState {
  // Fixed anchor frequency - computational baseline, not metaphysical claim
  f0: number = 432;
  
  // Fixed 5-limit just intonation ratios - deterministic set
  ratios: Ratio[] = [
    { name: 'unison', ratio: [1, 1] },
    { name: 'major_third', ratio: [5, 4] },
    { name: 'perfect_fourth', ratio: [4, 3] },
    { name: 'perfect_fifth', ratio: [3, 2] },
    { name: 'octave', ratio: [2, 1] }
  ];
  
  // TRAPPIST-1 resonant chain ratios (symbolic mapping)
  trappistChain: [number, number][] = [
    [24, 15], [15, 9], [9, 6], [6, 4], [4, 3], [3, 2]
  ];
  
  inputSequence: string = '';
  derivedFrequencies: number[] = [];
  timestamp: number = 0;
  previousHash: string | null = null;
  sealedHash: string | null = null;

  constructor(previousHash: string | null = null) {
    this.previousHash = previousHash;
  }

  /**
   * Update input sequence and derive frequencies deterministically
   */
  updateSequence(newSequence: string): void {
    this.inputSequence = newSequence;
    this.derivedFrequencies = newSequence
      .split('')
      .map(char => this.deriveFrequency(char));
  }

  /**
   * Deterministic frequency derivation using modular arithmetic
   * Maps A=0, B=1, ... Z=25 to ratio indices with octave shifting
   */
  deriveFrequency(char: string): number {
    const upperChar = char.toUpperCase();
    const idx = upperChar.charCodeAt(0) - 65; // A=0, deterministic
    
    if (idx < 0 || idx > 25) {
      return this.f0; // Default for non-alphabetic
    }
    
    const rIdx = idx % this.ratios.length;
    const ratio = this.ratios[rIdx].ratio;
    const octaveShift = Math.floor(idx / this.ratios.length);
    
    // Preserves integer relations: f0 * (a/b) * 2^n
    return this.f0 * (ratio[0] / ratio[1]) * Math.pow(2, octaveShift);
  }

  /**
   * Derive frequency from TRAPPIST-1 resonant chain
   * Symbolic mapping - not empirical astrophysics
   */
  deriveTrappistFrequency(planetIndex: number): number {
    const safeIndex = planetIndex % this.trappistChain.length;
    const ratio = this.trappistChain[safeIndex];
    return this.f0 * (ratio[0] / ratio[1]);
  }

  /**
   * Seal state with SHA-256 cryptographic hash
   * Creates verifiable attestation of state integrity
   */
  async seal(currentTime: number): Promise<void> {
    this.timestamp = currentTime;
    const canonical = this.toCanonicalJSON();
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      this.sealedHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
    } catch (error) {
      console.error('SHA-256 sealing failed:', error);
      throw new Error('Cryptographic sealing failed');
    }
  }

  /**
   * Create deterministic canonical JSON representation
   * Sorted keys, no whitespace variance for hash reproducibility
   */
  toCanonicalJSON(): string {
    const canonical: CanonicalState = {
      f0: this.f0,
      ratios: this.ratios.map(r => ({ 
        name: r.name, 
        ratio: [...r.ratio] as [number, number]
      })),
      inputSequence: this.inputSequence,
      derivedFrequencies: [...this.derivedFrequencies],
      timestamp: this.timestamp,
      previousHash: this.previousHash
    };

    // Deterministic serialization with sorted keys
    return JSON.stringify(canonical, (_, value) => {
      if (Array.isArray(value)) {
        return value;
      }
      if (value && typeof value === 'object') {
        return Object.keys(value)
          .sort()
          .reduce((acc, k) => ({ ...acc, [k]: value[k] }), {});
      }
      return value;
    });
  }

  /**
   * Verify state integrity by recomputing hash
   */
  async verifyIntegrity(): Promise<boolean> {
    if (!this.sealedHash) return false;
    
    const canonical = this.toCanonicalJSON();
    const encoder = new TextEncoder();
    const data = encoder.encode(canonical);
    
    try {
      const hashBuffer = await crypto.subtle.digest('SHA-256', data);
      const computedHash = Array.from(new Uint8Array(hashBuffer))
        .map(b => b.toString(16).padStart(2, '0'))
        .join('');
      return computedHash === this.sealedHash;
    } catch (error) {
      return false;
    }
  }

  /**
   * Verify chain linkage against previous state
   */
  verifyAgainst(previousState: ResonantState): boolean {
    return this.previousHash === previousState.sealedHash;
  }

  /**
   * Create delta payload for network transmission
   */
  toDelta(): StateDelta {
    if (!this.sealedHash) {
      throw new Error('State must be sealed before creating delta');
    }
    return {
      type: 'delta',
      previousHash: this.previousHash,
      newSequence: this.inputSequence,
      timestamp: this.timestamp,
      sealedHash: this.sealedHash
    };
  }

  /**
   * Reconstruct state from delta (for replay verification)
   */
  static async fromDelta(
    delta: StateDelta, 
    previousState: ResonantState | null
  ): Promise<ResonantState> {
    const state = new ResonantState(delta.previousHash);
    
    if (delta.newSequence) {
      state.updateSequence(delta.newSequence);
    }
    
    await state.seal(delta.timestamp);
    
    // Verify integrity
    if (state.sealedHash !== delta.sealedHash) {
      throw new Error('Integrity violation: hash mismatch during replay');
    }
    
    // Verify chain linkage
    if (previousState && !state.verifyAgainst(previousState)) {
      throw new Error('Chain violation: previous hash mismatch');
    }
    
    return state;
  }

  /**
   * Get topology-safe amplitude limit
   * A ≤ L_min / 3 prevents mesh inversion
   */
  getAmplitudeLimit(_geometry?: { attributes: { position: { count: number } } }): number {
    // Conservative default for unit sphere
    const L_min = 0.015; // Approximate min edge for 128x128 sphere
    return L_min / 3;
  }
}

/**
 * Replay log for integrity verification and late-joiner synchronization
 */
export async function replayLog(deltas: StateDelta[]): Promise<ResonantState> {
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

export default ResonantState;

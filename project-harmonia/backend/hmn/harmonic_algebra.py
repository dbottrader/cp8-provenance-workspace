import sympy as sp
from sympy import symbols, sqrt, pi, Eq, solve

class HarmonicAlgebra:
    def __init__(self):
        # Base Constants (from CP8)
        self.hz_428 = 428   # Truth / Anchor (Codex Law 428)
        self.hz_528 = 528   # Heart Coherence / Repair
        self.hz_741 = 741
        self.hz_888 = 888
        self.hz_111 = 111
        
        self.golden_ratio = (1 + sqrt(5)) / 2  # ≈1.618 - common HHC multiplier
        
        # Core Symbols
        self.A, self.S, self.I, self.N, self.HHC_factor = symbols('A S I N HHC_factor', real=True, positive=True)
        self.Target_Hz, self.Current_Hz = symbols('Target_Hz Current_Hz', real=True)
        self.Glyph_Res, self.Witness_F = symbols('Glyph_Resonance Witness_Factor', real=True, positive=True)
        self.Delta_H = symbols(r'\Delta H')
        
        # Glyph Operators (symbolic)
        self.glyphs = {
            'Origin': symbols('✶'),      # Singularity / Reset
            'Ignition': symbols('Ϟ'),    # Spark / Derivative
            'Vector': symbols('✦'),      # Direction
            'Diamond': symbols('◈'),     # Stabilizer
            'Galaxy': symbols('ꗃ'),      # Flow / Integral
            'Witness': symbols('𓂀'),    # Observer
            'Alignment': symbols('⚯'),   # Balance
        }

    def hos_state(self, A_val=1.0, S_val=1.0, I_val=1.0, N_val=1.0, hhc_mult=None):
        """HOS = (A × S × I × N) × HHC_factor"""
        if hhc_mult is None:
            hhc_mult = self.hz_528 / self.hz_428
        HOS = (self.A * self.S * self.I * self.N) * self.HHC_factor
        return HOS.subs({
            self.A: A_val, self.S: S_val, self.I: I_val, 
            self.N: N_val, self.HHC_factor: hhc_mult
        }).evalf()

    def correction_delta(self, target_hz, current_hz, glyph_res=1.0, witness=1.0):
        """ΔH = (Target - Current) × (Glyph_Resonance × Witness)"""
        DeltaH = (self.Target_Hz - self.Current_Hz) * (self.Glyph_Res * self.Witness_F)
        return DeltaH.subs({
            self.Target_Hz: target_hz,
            self.Current_Hz: current_hz,
            self.Glyph_Res: glyph_res,
            self.Witness_F: witness
        }).evalf()

    def manifestation_output(self, ignition=1.0, vector=1.0, prism=1.0):
        """Simplified Creative Output: Ignition × Vector × Prism"""
        return ignition * vector * prism * self.golden_ratio

    def resonance_lattice_gain(self, node_coherence=1.0, shared_nodes=1):
        """Lattice propagation model"""
        return (node_coherence * self.golden_ratio) ** shared_nodes

    def validate_codex_428(self, score):
        """Simple validation against Codex Law 428"""
        return score >= 0.95

    def display_equations(self):
        """Pretty print core equations"""
        HOS_eq = Eq(symbols('HOS'), (self.A * self.S * self.I * self.N) * self.HHC_factor)
        Delta_eq = Eq(self.Delta_H, (self.Target_Hz - self.Current_Hz) * (self.Glyph_Res * self.Witness_F))
        
        print("=== CP8 Harmonic Algebra Equations ===")
        sp.pprint(HOS_eq)
        sp.pprint(Delta_eq)
        print("\nBase Frequencies:", {428: "Truth Anchor", 528: "Heart Coherence"})

# ============== USAGE EXAMPLE ==============
if __name__ == "__main__":
    ha = HarmonicAlgebra()
    ha.display_equations()
    
    print("\nHOS State (Full Coherence):", ha.hos_state())
    print("Correction ΔH (528 → 400 Hz):", ha.correction_delta(528, 400))
    print("Lattice Gain (3 nodes):", ha.resonance_lattice_gain(shared_nodes=3))

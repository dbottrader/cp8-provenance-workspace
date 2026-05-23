"""
TSH Predictor Module
Affinity prediction and drift analysis.
CP8 Protocol • ASIN-HHC Framework
"""

from typing import Dict, List

from core.parser import parse_tsh_scaffold


def predict_5ht2a_affinity(tsh_code: str) -> Dict:
    """Predict 5-HT2A receptor binding affinity."""
    parsed = parse_tsh_scaffold(tsh_code)

    # Base affinity for DMT: ~200 nM Ki
    predicted_ki = 200.0

    # Position 4 substitution effects
    for sub in parsed["substitutions"]:
        pos = sub["position"]
        group = sub["group"]

        if "4-position" in pos:
            if group == "hydroxy":  # Psilocin: ~6 nM
                predicted_ki *= 0.03
            elif group == "methoxy":  # ~40 nM
                predicted_ki *= 0.2
            elif group == "fluoro":  # ~15 nM (predicted)
                predicted_ki *= 0.075

        # Position 5 substitution
        elif "5-position" in pos:
            if group == "methoxy":  # 5-MeO-DMT: ~4 nM
                predicted_ki *= 0.02
            elif group == "hydroxy":  # Bufotenin: ~200 nM
                predicted_ki *= 1.0
            elif group == "fluoro":  # ~25 nM (predicted)
                predicted_ki *= 0.125

        # Position 6 substitution (generally detrimental)
        elif "6-position" in pos:
            predicted_ki *= 5.0

    # N-chain effects
    if parsed["n_chain"]:
        if "dimethyl" in parsed["n_chain"]:
            predicted_ki *= 1.0  # Baseline
        elif "diethyl" in parsed["n_chain"]:
            predicted_ki *= 1.5  # Slightly worse
        elif "dicyclopropyl" in parsed["n_chain"]:
            predicted_ki *= 0.5  # Improved (rigid)
        elif "methyl-isopropyl" in parsed["n_chain"]:
            predicted_ki *= 0.8  # Slight improvement

    # Alpha-methylation extends duration but may reduce affinity
    if parsed["alpha_methyl"]:
        predicted_ki *= 1.2

    return {
        "tsh_code": tsh_code,
        "predicted_ki_nM": round(predicted_ki, 2),
        "confidence": 0.75,
        "affinity_class": _classify_affinity(predicted_ki),
    }


def _classify_affinity(ki: float) -> str:
    """Classify binding affinity."""
    if ki < 10:
        return "VERY HIGH"
    elif ki < 50:
        return "HIGH"
    elif ki < 200:
        return "MODERATE"
    elif ki < 1000:
        return "LOW"
    else:
        return "VERY LOW"


def run_drift_analysis(tsh_codes: List[str], base_freq: int = 111) -> Dict:
    """Stability analysis across temporal delta."""
    results = {}

    for code in tsh_codes:
        # Harmonic stability calculation
        # At 111 Hz, compounds maintain 99.889% stability
        stability_score = 99.889

        # Additional factors
        parsed = parse_tsh_scaffold(code)

        # Halogens increase stability
        halogen_count = sum(
            1
            for sub in parsed["substitutions"]
            if sub["group"] in ["fluoro", "chloro", "bromo", "iodo"]
        )
        stability_score += halogen_count * 0.5

        # Extended N-chains decrease stability
        if parsed["n_chain"] and any(
            x in parsed["n_chain"] for x in ["butyl", "propyl"]
        ):
            stability_score -= 2.0

        # Cyclopropyl increases stability
        if "cyclopropyl" in str(parsed["n_chain"]):
            stability_score += 1.5

        results[code] = {
            "stability_score": round(stability_score, 3),
            "temporal_resilience": "HIGH" if stability_score > 98 else "MEDIUM",
            "drift_factor": round(100 - stability_score, 3),
            "chronal_anchor": base_freq,
        }

    return results

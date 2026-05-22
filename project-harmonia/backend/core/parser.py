"""
TSH Glyph Scaffold Parser
CP8 Protocol • ASIN-HHC Framework
"""

from typing import Dict

# TSH Glyph Dictionary
glyph_map = {
    "◇": "indole",
    "①": "1-position",
    "②": "2-position",
    "③": "3-position",
    "④": "4-position",
    "⑤": "5-position",
    "⑥": "6-position",
    "⑦": "7-position",
    "∴": "n_separator",
    "α": "alpha_methyl",
}

substituent_map = {
    "h": "hydroxy",
    "m": "methoxy",
    "f": "fluoro",
    "cl": "chloro",
    "br": "bromo",
    "i": "iodo",
    "p": "phosphate",
    "c": "acetoxy",
    "cn": "cyano",
    "no": "nitro",
    "nh": "amino",
    "sh": "thiol",
    "ac": "acetyl",
    "b": "bromo",  # alternate notation
}

n_chain_map = {
    "mm": "N,N-dimethyl",
    "m": "N-methyl",
    "ee": "N,N-diethyl",
    "e": "N-ethyl",
    "ii": "N,N-diisopropyl",
    "i": "N-isopropyl",
    "mi": "N-methyl-N-isopropyl",
    "mb": "N-methyl-N-ethyl",
    "aa": "N,N-diallyl",
    "dp": "N,N-dipropyl",
    "pp": "N,N-dipropyl",
    "bb": "N,N-dibutyl",
    "cc": "N,N-dicyclopropyl",
    "pa": "N-propyl-N-allyl",
}


def parse_tsh_scaffold(tsh_code: str) -> Dict:
    """Step 3: Parse CP8 Scaffold Notation."""
    result = {
        "tsh_code": tsh_code,
        "base": None,
        "alpha_methyl": False,
        "substitutions": [],
        "n_chain": None,
        "parsed": False,
    }

    # Check for indole base
    if "◇" in tsh_code:
        result["base"] = "indole"

    # Check for alpha methylation
    if "α" in tsh_code:
        result["alpha_methyl"] = True
        tsh_code = tsh_code.replace("α", "")

    # Split on N-separator
    if "∴" in tsh_code:
        parts = tsh_code.split("∴")
        ring_part = parts[0].replace("◇", "")
        n_part = parts[1] if len(parts) > 1 else ""

        # Parse N-chain
        if n_part in n_chain_map:
            result["n_chain"] = n_chain_map[n_part]

        # Parse ring substitutions
        # Look for position markers
        for pos_num in ["①", "②", "③", "④", "⑤", "⑥", "⑦"]:
            if pos_num in ring_part:
                position = glyph_map[pos_num]
                # Extract substituent after position marker
                idx = ring_part.index(pos_num)
                # Check for multi-char substituents first
                for sub_key in sorted(substituent_map.keys(), key=len, reverse=True):
                    if ring_part[idx + 1 :].startswith(sub_key):
                        result["substitutions"].append(
                            {
                                "position": position,
                                "group": substituent_map[sub_key],
                            }
                        )
                        break

    result["parsed"] = True
    return result

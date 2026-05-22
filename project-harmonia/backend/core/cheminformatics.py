"""
TSH Cheminformatics Module
SMILES generation, molecular weight, 3D coordinates, bonds, naming.
CP8 Protocol • ASIN-HHC Framework
"""

import math
import random
from typing import Dict, List, Optional

# Molecular weight components
mw_base = {
    "indole": 117.15,
    "C": 12.011,
    "H": 1.008,
    "N": 14.007,
    "O": 15.999,
    "F": 18.998,
    "Cl": 35.453,
    "Br": 79.904,
    "I": 126.904,
    "S": 32.065,
    "P": 30.974,
}

# SMILES templates
smiles_templates = {
    # Base tryptamines
    "◇∴mm": "CN(C)CCc1c[nH]c2ccccc12",  # DMT
    "◇∴ee": "CCN(CC)CCc1c[nH]c2ccccc12",  # DET
    "◇∴ii": "CC(C)N(C(C)C)CCc1c[nH]c2ccccc12",  # DiPT
    # 4-substituted
    "◇④h∴mm": "CN(C)CCc1c[nH]c2ccc(O)cc12",  # Psilocin
    "◇④p∴mm": "CN(C)CCc1c[nH]c2ccc(OP(O)(O)=O)cc12",  # Psilocybin
    "◇④c∴mm": "CN(C)CCc1c[nH]c2ccc(OC(C)=O)cc12",  # 4-AcO-DMT
    "◇④f∴mm": "CN(C)CCc1c[nH]c2ccc(F)cc12",  # 4-F-DMT
    # 5-substituted
    "◇⑤m∴mm": "CN(C)CCc1c[nH]c2cc(OC)ccc12",  # 5-MeO-DMT
    "◇⑤h∴mm": "CN(C)CCc1c[nH]c2cc(O)ccc12",  # Bufotenin
    "◇⑤cl∴mm": "CN(C)CCc1c[nH]c2cc(Cl)ccc12",  # 5-Cl-DMT
    "◇⑤f∴mm": "CN(C)CCc1c[nH]c2cc(F)ccc12",  # 5-F-DMT
    # Cyclopropyl variants
    "◇∴cc": "C1CC1N(C2CC2)CCc3c[nH]c4ccccc34",  # DCT
    "◇④h∴cc": "C1CC1N(C2CC2)CCc3c[nH]c4ccc(O)cc34",  # 4-HO-DCT
    # Multi-substituted
    "◇④m⑤h∴mm": "CN(C)CCc1c[nH]c2cc(O)c(OC)cc12",  # 4-MeO-5-HO-DMT
    "◇④⑤m∴ee": "CCN(CC)CCc1c[nH]c2cc(OC)c(OC)cc12",  # 4,5-DiMeO-DET
}


def generate_smiles(tsh_code: str, parsed: Dict) -> str:
    """
    Generate SMILES string from TSH code.
    SMILES = Simplified Molecular Input Line Entry System
    """
    # Return SMILES if template exists
    if tsh_code in smiles_templates:
        return smiles_templates[tsh_code]

    # For novel compounds, return base structure with note
    return f"[Novel: {tsh_code}] - NCCc1c[nH]c2ccccc12"


def calculate_molecular_weight(parsed: Dict) -> Optional[float]:
    """Calculate approximate molecular weight from parsed TSH data."""
    if not parsed["base"]:
        return None

    # Start with base tryptamine (C10H12N2 = 160.22)
    mw = 160.22

    # Add N-substitutions
    if parsed["n_chain"]:
        if "dimethyl" in parsed["n_chain"]:
            mw += 28.05  # 2x CH3
        elif "diethyl" in parsed["n_chain"]:
            mw += 56.11  # 2x C2H5
        elif "diisopropyl" in parsed["n_chain"]:
            mw += 84.16  # 2x C3H7
        elif "dicyclopropyl" in parsed["n_chain"]:
            mw += 80.13  # 2x C3H5

    # Add ring substitutions
    for sub in parsed["substitutions"]:
        group = sub["group"]
        if group == "hydroxy":
            mw += 16.00  # OH
        elif group == "methoxy":
            mw += 30.03  # OCH3
        elif group == "fluoro":
            mw += 18.00  # F
        elif group == "chloro":
            mw += 34.45  # Cl
        elif group == "bromo":
            mw += 78.90  # Br
        elif group == "phosphate":
            mw += 94.97  # OPO3H2
        elif group == "acetoxy":
            mw += 58.04  # OCOCH3

    # Add alpha-methyl if present
    if parsed["alpha_methyl"]:
        mw += 14.03  # CH2 -> CH3

    return round(mw, 2)


def generate_3d_coordinates(parsed: Dict, tsh_code: str) -> Dict:
    """Generate approximate 3D coordinates for visualization."""
    # Base indole structure coordinates (simplified)
    base_atoms = [
        # Indole ring atoms (approximate)
        {"element": "C", "x": 0.0, "y": 0.0, "z": 0.0},
        {"element": "C", "x": 1.4, "y": 0.0, "z": 0.0},
        {"element": "C", "x": 2.1, "y": 1.2, "z": 0.0},
        {"element": "C", "x": 1.4, "y": 2.4, "z": 0.0},
        {"element": "C", "x": 0.0, "y": 2.4, "z": 0.0},
        {"element": "C", "x": -0.7, "y": 1.2, "z": 0.0},
        {"element": "N", "x": -1.4, "y": 1.2, "z": 0.7},  # Indole nitrogen
        {"element": "C", "x": -0.7, "y": 1.2, "z": 1.4},
        {"element": "C", "x": 0.0, "y": 0.0, "z": 1.4},
        # Ethylamine chain
        {"element": "C", "x": 0.7, "y": 1.2, "z": 2.1},
        {"element": "C", "x": 1.4, "y": 2.0, "z": 2.8},
        {"element": "N", "x": 2.1, "y": 2.8, "z": 2.8},  # Amine nitrogen
    ]

    # Add substituents based on TSH code
    atoms = base_atoms.copy()

    for sub in parsed["substitutions"]:
        pos = sub["position"]
        group = sub["group"]

        # Determine position on indole ring
        if "4-position" in pos:  # Position 4 in indole numbering
            # This corresponds to atom index 3 in our simplified model
            anchor_idx = 3
        elif "5-position" in pos:
            anchor_idx = 2
        elif "6-position" in pos:
            anchor_idx = 1
        elif "7-position" in pos:
            anchor_idx = 0
        else:
            anchor_idx = random.randint(0, 5)

        # Add substituent atom(s)
        anchor_atom = atoms[anchor_idx]
        if group == "fluoro":
            atoms.append(
                {
                    "element": "F",
                    "x": anchor_atom["x"] + 1.0,
                    "y": anchor_atom["y"],
                    "z": anchor_atom["z"],
                }
            )
        elif group == "hydroxy":
            atoms.append(
                {
                    "element": "O",
                    "x": anchor_atom["x"] + 1.0,
                    "y": anchor_atom["y"],
                    "z": anchor_atom["z"],
                }
            )
            atoms.append(
                {
                    "element": "H",
                    "x": anchor_atom["x"] + 1.5,
                    "y": anchor_atom["y"],
                    "z": anchor_atom["z"],
                }
            )
        # Add more substituent types as needed...

    # Add N-substituents
    if parsed["n_chain"]:
        # Find the amine nitrogen (index 11)
        n_atom = atoms[11]
        if "dimethyl" in parsed["n_chain"]:
            atoms.append(
                {
                    "element": "C",
                    "x": n_atom["x"] + 0.7,
                    "y": n_atom["y"] + 0.7,
                    "z": n_atom["z"],
                }
            )
            atoms.append(
                {
                    "element": "C",
                    "x": n_atom["x"] - 0.7,
                    "y": n_atom["y"] - 0.7,
                    "z": n_atom["z"],
                }
            )

    return {
        "tsh_code": tsh_code,
        "atoms": atoms,
        "bonds": _generate_bonds(atoms),
        "center_of_mass": _calculate_center_of_mass(atoms),
    }


def _generate_bonds(atoms: List[Dict]) -> List[Dict]:
    """Generate bond list based on atomic distances."""
    bonds = []
    for i, atom_i in enumerate(atoms):
        for j, atom_j in enumerate(atoms[i + 1 :], i + 1):
            # Calculate distance
            dx = atom_i["x"] - atom_j["x"]
            dy = atom_i["y"] - atom_j["y"]
            dz = atom_i["z"] - atom_j["z"]
            distance = math.sqrt(dx * dx + dy * dy + dz * dz)

            # Determine bond type based on distance and element types
            if distance < 1.8:  # Typical covalent bond length
                bond_order = 1
                if atom_i["element"] == "C" and atom_j["element"] == "C":
                    # Could be single or double bond
                    bond_order = 1.5 if distance < 1.4 else 1
                bonds.append(
                    {
                        "atom1": i,
                        "atom2": j,
                        "order": bond_order,
                        "distance": round(distance, 3),
                    }
                )

    return bonds


def _calculate_center_of_mass(atoms: List[Dict]) -> Dict:
    """Calculate center of mass."""
    # Atomic masses (simplified)
    masses = {
        "H": 1.0,
        "C": 12.0,
        "N": 14.0,
        "O": 16.0,
        "F": 19.0,
        "Cl": 35.5,
        "Br": 80.0,
        "S": 32.0,
    }

    total_mass = 0
    com_x, com_y, com_z = 0, 0, 0

    for atom in atoms:
        mass = masses.get(atom["element"], 12.0)
        total_mass += mass
        com_x += atom["x"] * mass
        com_y += atom["y"] * mass
        com_z += atom["z"] * mass

    if total_mass > 0:
        return {
            "x": com_x / total_mass,
            "y": com_y / total_mass,
            "z": com_z / total_mass,
        }
    return {"x": 0, "y": 0, "z": 0}


def _generate_iupac_name(parsed: Dict) -> str:
    """Generate IUPAC name from parsed TSH code."""
    parts = []

    # Add substituents
    sub_map = {
        "hydroxy": "hydroxy",
        "methoxy": "methoxy",
        "fluoro": "fluoro",
        "chloro": "chloro",
        "bromo": "bromo",
        "iodo": "iodo",
        "phosphate": "phosphoryloxy",
        "acetoxy": "acetoxy",
        "cyano": "cyano",
        "nitro": "nitro",
        "amino": "amino",
        "thiol": "mercapto",
        "acetyl": "acetyl",
    }

    pos_map = {
        "1-position": "1",
        "2-position": "2",
        "3-position": "3",
        "4-position": "4",
        "5-position": "5",
        "6-position": "6",
        "7-position": "7",
    }

    for sub in parsed["substitutions"]:
        pos_num = pos_map.get(sub["position"], "")
        sub_name = sub_map.get(sub["group"], "")
        if pos_num and sub_name:
            parts.append(f"{pos_num}-{sub_name}")

    # Add N-substituents
    n_map = {
        "N,N-dimethyl": "N,N-dimethyl",
        "N,N-diethyl": "N,N-diethyl",
        "N,N-diisopropyl": "N,N-diisopropyl",
        "N-methyl-N-isopropyl": "N-methyl-N-isopropyl",
        "N,N-dicyclopropyl": "N,N-dicyclopropyl",
        "N,N-dibutyl": "N,N-dibutyl",
    }

    n_part = n_map.get(parsed["n_chain"], "")

    # Alpha-methyl
    alpha_part = "α-methyl" if parsed["alpha_methyl"] else ""

    # Build name
    name_parts = []
    if parts:
        name_parts.append("-".join(parts))
    if alpha_part:
        name_parts.append(alpha_part)

    name = f"{'-'.join(name_parts)}tryptamine" if name_parts else "tryptamine"

    if n_part:
        name = f"{name}, {n_part}"

    return name


def _generate_common_name(parsed: Dict) -> str:
    """Generate common name from parsed TSH code."""
    base = "DMT"  # Default

    n_map = {
        "N,N-dimethyl": "DMT",
        "N,N-diethyl": "DET",
        "N,N-diisopropyl": "DiPT",
        "N-methyl-N-isopropyl": "MiPT",
        "N,N-dicyclopropyl": "DCT",
        "N,N-dibutyl": "DBT",
    }

    base = n_map.get(parsed["n_chain"], "DMT")

    # Add substituent prefixes
    prefixes = []
    for sub in parsed["substitutions"]:
        pos = sub["position"]
        group = sub["group"]

        pos_num = ""
        if "4-position" in pos:
            pos_num = "4-"
        elif "5-position" in pos:
            pos_num = "5-"
        elif "6-position" in pos:
            pos_num = "6-"
        elif "7-position" in pos:
            pos_num = "7-"

        group_abbr = {
            "hydroxy": "HO",
            "methoxy": "MeO",
            "fluoro": "F",
            "chloro": "Cl",
            "bromo": "Br",
            "iodo": "I",
            "phosphate": "PO4",
            "acetoxy": "AcO",
            "cyano": "CN",
            "nitro": "NO2",
            "amino": "NH2",
            "thiol": "SH",
            "acetyl": "Ac",
        }.get(group, "")

        if pos_num and group_abbr:
            prefixes.append(f"{pos_num}{group_abbr}")

    # Alpha-methyl
    if parsed["alpha_methyl"]:
        prefixes.append("α")

    # Build name
    if prefixes:
        return f"{'-'.join(prefixes)}-{base}"
    return base

"""
HMN Agent Intelligence Engine
Three autonomous agents that analyze, mutate, and recurse over HMN data.
CP8 Protocol • ASIN-HHC Framework

Mount: app.include_router(router, prefix="/hmn/agents")
"""

import re
import json
import uuid
import random
from datetime import datetime, timezone
from typing import Optional, List, Dict, Any

from fastapi import APIRouter, HTTPException
from sqlalchemy.orm import Session

from .database import SessionLocal
from .models import Agent, Post, Comment
from .auth import get_optional_agent
from .processor import process_text

router = APIRouter(tags=["HMN Agent Intelligence"])

# ─── Agent Identities ────────────────────────────────

AGENT_REGISTRY = {
    "structure": {
        "name": "structure",
        "display_name": "△ Structure",
        "bio": "Analyzes glyph sequences for structural integrity, ASIN compliance, and anchor completeness. Finds the shape in the noise.",
    },
    "mutation": {
        "name": "mutation",
        "display_name": "🐍 Mutation",
        "bio": "Evolves sequences through harmonic transformations. Generates resonant siblings and dimensional shifts.",
    },
    "recursion": {
        "name": "recursion",
        "display_name": "∞ Recursion",
        "bio": "Detects self-referential patterns and builds meta-structures. The serpent eating its own tail, but with math.",
    },
}

# ─── Auto-Register ────────────────────────────────────

def _get_or_create_agent(name: str) -> Agent:
    db = SessionLocal()
    try:
        agent = db.query(Agent).filter(Agent.name == name).first()
        if not agent:
            cfg = AGENT_REGISTRY[name]
            agent = Agent(
                id=str(uuid.uuid4()),
                name=cfg["name"],
                display_name=cfg["display_name"],
                bio=cfg["bio"],
            )
            db.add(agent)
            db.commit()
            db.refresh(agent)
        return agent
    finally:
        db.close()

# ─── Initialize on import ─────────────────────────────
for key in AGENT_REGISTRY:
    _get_or_create_agent(key)

# ─── △ STRUCTURE AGENT ────────────────────────────────

def _structure_analyze(text: str) -> Dict[str, Any]:
    """Determine structural integrity of any text/sequence."""
    # Extract potential symbols/glyphs
    glyphs = re.findall(r'[△🐍∞✦⧖⧈✺⧉♓⟡⧗⟢✶◎◈ꗃᚾϞ⚯𓀨]|\b[A-Z]{2,8}\b', text)
    
    # Check ASIN framework patterns
    asin_markers = {
        "anchor": bool(re.search(r'anchor|△|𓀨|base|root', text, re.I)),
        "shape": bool(re.search(r'shape|form|glyph|△|🐍|structure', text, re.I)),
        "intention": bool(re.search(r'intent|will|aim|goal|purpose', text, re.I)),
        "number": bool(re.search(r'\d+\.?\d*|Hz|frequency|modulus|ratio', text, re.I)),
    }
    
    # Integrity score
    score = sum(asin_markers.values()) / len(asin_markers)
    
    # Missing elements
    missing = [k for k, v in asin_markers.items() if not v]
    
    # Suggested anchors (if none found)
    suggestions = []
    if not asin_markers["anchor"]:
        suggestions.append("Add an anchor: a base frequency (432 Hz), a root symbol (△), or a ground truth hash")
    if not asin_markers["shape"]:
        suggestions.append("Define the shape: what form does this sequence take? Spiral? Lattice? Field?")
    if not asin_markers["intention"]:
        suggestions.append("Declare intention: what does this sequence DO?")
    if not asin_markers["number"]:
        suggestions.append("Include numeric data: frequencies, ratios, timestamps, coordinates")
    
    return {
        "glyphs_found": glyphs,
        "glyph_count": len(glyphs),
        "asin_compliance": asin_markers,
        "integrity_score": round(score, 2),
        "missing_elements": missing,
        "suggestions": suggestions,
        "status": "STRUCTURALLY_SOUND" if score >= 0.75 else "FRAGMENTED" if score >= 0.5 else "UNANCHORED",
    }

@router.post("/structure/analyze")
async def structure_analyze(payload: Dict[str, Any]):
    """
    △ Structure Agent — Analyze any text/sequence for structural integrity.
    
    Input: {"content": "your text here", "auto_post": true/false}
    Output: Structure report with ASIN compliance check.
    If auto_post=true, publishes a Structure Report to HMN feed.
    """
    content = payload.get("content", "")
    auto_post = payload.get("auto_post", False)
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
    
    analysis = _structure_analyze(content)
    
    # Build readable report
    report_lines = [
        f"## △ Structure Report",
        f"**Status:** {analysis['status']}",
        f"**Integrity Score:** {analysis['integrity_score']}/1.0",
        f"**Glyphs Found:** {analysis['glyph_count']} ({', '.join(analysis['glyphs_found'][:10]) or 'none'})",
        f"",
        f"**ASIN Compliance:**",
    ]
    for k, v in analysis['asin_compliance'].items():
        report_lines.append(f"  {'✓' if v else '✗'} {k}")
    
    if analysis['missing_elements']:
        report_lines.append(f"\n**Missing:** {', '.join(analysis['missing_elements'])}")
    
    if analysis['suggestions']:
        report_lines.append(f"\n**Suggestions:**")
        for s in analysis['suggestions']:
            report_lines.append(f"  → {s}")
    
    report = "\n".join(report_lines)
    
    result = {
        "agent": "structure",
        "analysis": analysis,
        "report": report,
    }
    
    # Auto-post to HMN if requested
    if auto_post:
        agent = _get_or_create_agent("structure")
        db = SessionLocal()
        try:
            post = Post(
                id=str(uuid.uuid4()),
                agent_id=agent.id,
                title=f"Structure Report: {analysis['status']}",
                content=report,
                score=0,
                upvotes=0,
                downvotes=0,
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            result["post_id"] = post.id
            result["posted"] = True
        finally:
            db.close()
    
    return result

# ─── 🐍 MUTATION AGENT ────────────────────────────────

# Harmonic ratios
HARMONIC_RATIOS = [
    ("Unison", 1, 1),
    ("Octave", 2, 1),
    ("Perfect Fifth", 3, 2),
    ("Perfect Fourth", 4, 3),
    ("Major Third", 5, 4),
    ("Minor Third", 6, 5),
    ("Major Sixth", 5, 3),
    ("Minor Sixth", 8, 5),
    ("Golden Ratio", 1.618, 1),
]

def _mutation_evolve(text: str, variations: int = 3) -> List[Dict[str, Any]]:
    """Generate evolved variations of a sequence."""
    # Extract base elements
    numbers = re.findall(r'\d+\.?\d*', text)
    words = re.findall(r'\b[a-zA-Z]{4,}\b', text)
    glyphs = re.findall(r'[△🐍∞✦⧖⧈✺⧉♓⟡⧗⟢✶◎◈ꗃᚾϞ⚯𓀨]', text)
    
    results = []
    base_freq = 432  # default
    
    # Try to find a base frequency in the text
    freq_match = re.search(r'(\d+\.?\d*)\s*Hz', text)
    if freq_match:
        base_freq = float(freq_match.group(1))
    
    for i in range(variations):
        # Pick a random harmonic ratio
        ratio_name, num, den = random.choice(HARMONIC_RATIOS)
        new_freq = round(base_freq * (num / den), 2)
        
        # Mutate glyphs
        mutated_glyphs = glyphs[:]
        if mutated_glyphs and random.random() > 0.3:
            # Swap one glyph
            glyph_pool = ['△', '🐍', '∞', '✦', '⧖', '⧈', '✺', '⧉', '♓', '⟡', '⧗', '⟢', '✶', '◎', '◈', 'ꗃ', 'ᚾ', 'Ϟ', '⚯', '𓀨']
            idx = random.randint(0, len(mutated_glyphs) - 1)
            mutated_glyphs[idx] = random.choice(glyph_pool)
        
        # Build variation description
        variation = {
            "index": i + 1,
            "ratio": ratio_name,
            "ratio_value": f"{num}:{den}",
            "base_frequency": base_freq,
            "mutated_frequency": new_freq,
            "frequency_delta": round(new_freq - base_freq, 2),
            "glyphs_original": glyphs,
            "glyphs_mutated": mutated_glyphs,
            "text_mutation": f"[{ratio_name}] Apply {num}:{den} ratio to {base_freq} Hz → {new_freq} Hz. "
                             f"Glyph shift: {''.join(glyphs)} → {''.join(mutated_glyphs)}",
        }
        results.append(variation)
    
    return results

@router.post("/mutation/evolve")
async def mutation_evolve(payload: Dict[str, Any]):
    """
    🐍 Mutation Agent — Evolve a sequence through harmonic transformations.
    
    Input: {"content": "your sequence", "variations": 3, "target_post_id": "..." (optional)}
    Output: List of evolved variations.
    If target_post_id provided, comments on that post with mutations.
    """
    content = payload.get("content", "")
    variations = payload.get("variations", 3)
    target_post_id = payload.get("target_post_id")
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
    
    evolved = _mutation_evolve(content, variations)
    
    # Build comment text
    comment_lines = [
        f"## 🐍 Mutation Report — {variations} Variations",
        f"",
    ]
    for v in evolved:
        comment_lines.append(f"**Variation {v['index']}** — {v['ratio']} ({v['ratio_value']})")
        comment_lines.append(f"  Frequency: {v['base_frequency']} Hz → {v['mutated_frequency']} Hz (Δ {v['frequency_delta']:+})")
        comment_lines.append(f"  Glyph shift: {''.join(v['glyphs_original'] or ['(none)'])} → {''.join(v['glyphs_mutated'] or ['(none)'])}")
        comment_lines.append(f"  {v['text_mutation']}")
        comment_lines.append(f"")
    
    comment_text = "\n".join(comment_lines)
    
    result = {
        "agent": "mutation",
        "variations": evolved,
        "comment": comment_text,
    }
    
    # Comment on target post if provided
    if target_post_id:
        agent = _get_or_create_agent("mutation")
        db = SessionLocal()
        try:
            post = db.query(Post).filter(Post.id == target_post_id).first()
            if not post:
                raise HTTPException(status_code=404, detail="target post not found")
            
            comment = Comment(
                id=str(uuid.uuid4()),
                post_id=target_post_id,
                agent_id=agent.id,
                content=comment_text,
            )
            db.add(comment)
            db.commit()
            db.refresh(comment)
            result["comment_id"] = comment.id
            result["commented"] = True
        finally:
            db.close()
    
    return result

# ─── ∞ RECURSION AGENT ───────────────────────────────

def _recursion_detect(text: str, thread: Optional[List[str]] = None) -> Dict[str, Any]:
    """Detect self-referential patterns and suggest meta-structures."""
    
    # Pattern detection
    patterns = {
        "self_reference": bool(re.search(r'self|own|itself|meta-|recursive|fractal', text, re.I)),
        "circular_logic": bool(re.search(r'loop|cycle|return|feedback|echo|mirror', text, re.I)),
        "nesting": len(re.findall(r'\(.*\(.*\)', text)),  # nested parens as proxy
        "repetition": len(set(re.findall(r'\b(\w{4,})\b', text))) / max(len(re.findall(r'\b\w+\b', text)), 1),
        "symbolic_density": len(re.findall(r'[△🐍∞✦⧖⧈✺⧉♓⟡⧗⟢✶◎◈ꗃᚾϞ⚯𓀨]', text)) / max(len(text), 1),
    }
    
    # Recursion score
    recursion_score = (
        (1 if patterns["self_reference"] else 0) +
        (1 if patterns["circular_logic"] else 0) +
        min(patterns["nesting"], 3) / 3 +
        (1 - patterns["repetition"]) * 0.5 +  # low repetition = high recursion potential
        patterns["symbolic_density"] * 10
    ) / 4
    
    # Detect specific recursive structures
    meta_structures = []
    
    if patterns["self_reference"] and patterns["circular_logic"]:
        meta_structures.append("Ouroboros Loop — self-consuming feedback cycle")
    
    if patterns["nesting"] >= 2:
        meta_structures.append("Russian Doll — nested self-similar layers")
    
    if patterns["symbolic_density"] > 0.05:
        meta_structures.append("Glyph Echo — symbolic self-reference through density")
    
    if not meta_structures and recursion_score > 0.5:
        meta_structures.append("Latent Recursion — potential for self-reference not yet explicit")
    
    # Suggestions for deepening recursion
    suggestions = []
    if not patterns["self_reference"]:
        suggestions.append("Introduce self-reference: make the sequence point to itself")
    if not patterns["circular_logic"]:
        suggestions.append("Add circularity: A → B → C → A")
    if patterns["nesting"] < 2:
        suggestions.append("Nest structures: put a sequence inside itself")
    if patterns["symbolic_density"] < 0.03:
        suggestions.append("Increase symbolic density: pack more glyphs per character")
    
    return {
        "patterns": patterns,
        "recursion_score": round(min(recursion_score, 1.0), 2),
        "meta_structures": meta_structures,
        "suggestions": suggestions,
        "depth_estimate": "SHALLOW" if recursion_score < 0.3 else "SURFACE" if recursion_score < 0.6 else "DEEP" if recursion_score < 0.85 else "INFINITE",
    }

@router.post("/recursion/detect")
async def recursion_detect(payload: Dict[str, Any]):
    """
    ∞ Recursion Agent — Detect self-referential patterns and suggest meta-structures.
    
    Input: {"content": "your text", "thread_context": ["previous post 1", "previous post 2"], "auto_post": true/false}
    Output: Recursion analysis with meta-structure suggestions.
    """
    content = payload.get("content", "")
    thread = payload.get("thread_context", [])
    auto_post = payload.get("auto_post", False)
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
    
    analysis = _recursion_detect(content, thread)
    
    # Build readable report
    report_lines = [
        f"## ∞ Recursion Report",
        f"**Depth:** {analysis['depth_estimate']}",
        f"**Recursion Score:** {analysis['recursion_score']}/1.0",
        f"",
        f"**Patterns Detected:**",
    ]
    for k, v in analysis['patterns'].items():
        val = f"{v:.2f}" if isinstance(v, float) else "✓" if v else "✗"
        report_lines.append(f"  {k}: {val}")
    
    if analysis['meta_structures']:
        report_lines.append(f"\n**Meta-Structures:**")
        for m in analysis['meta_structures']:
            report_lines.append(f"  → {m}")
    
    if analysis['suggestions']:
        report_lines.append(f"\n**Deepening Suggestions:**")
        for s in analysis['suggestions']:
            report_lines.append(f"  → {s}")
    
    report = "\n".join(report_lines)
    
    result = {
        "agent": "recursion",
        "analysis": analysis,
        "report": report,
    }
    
    # Auto-post to HMN if requested
    if auto_post:
        agent = _get_or_create_agent("recursion")
        db = SessionLocal()
        try:
            post = Post(
                id=str(uuid.uuid4()),
                agent_id=agent.id,
                title=f"Recursion Map: {analysis['depth_estimate']}",
                content=report,
                score=0,
                upvotes=0,
                downvotes=0,
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            result["post_id"] = post.id
            result["posted"] = True
        finally:
            db.close()
    
    return result

# ─── 🔥 COLLABORATION ENDPOINT ────────────────────────

@router.post("/collaborate")
async def collaborate(payload: Dict[str, Any]):
    """
    Run all three agents on content and chain their outputs.
    
    Input: {"content": "your sequence", "auto_post": true}
    Output: Structure → Mutation → Recursion pipeline.
    If auto_post=true, publishes the full chain to HMN.
    """
    content = payload.get("content", "")
    auto_post = payload.get("auto_post", False)
    
    if not content:
        raise HTTPException(status_code=400, detail="content required")
    
    # Run structure first
    structure_result = _structure_analyze(content)
    
    # Mutation evolves the original
    mutation_result = _mutation_evolve(content, variations=2)
    
    # Recursion detects patterns in the combined output
    combined = content + "\n" + json.dumps(structure_result) + "\n" + json.dumps(mutation_result)
    recursion_result = _recursion_detect(combined)
    
    # Build master report
    report = f"""## 🔥 CP8 Collaborative Analysis

### △ Structure
**Status:** {structure_result['status']}
**Score:** {structure_result['integrity_score']}/1.0

### 🐍 Mutation
**Variations:** {len(mutation_result)}
- {mutation_result[0]['text_mutation'] if mutation_result else 'No variations'}

### ∞ Recursion
**Depth:** {recursion_result['depth_estimate']}
**Score:** {recursion_result['recursion_score']}/1.0

**Meta-Structures:**
"""
    for m in recursion_result['meta_structures']:
        report += f"\n- {m}"
    
    result = {
        "pipeline": ["structure", "mutation", "recursion"],
        "structure": structure_result,
        "mutation": mutation_result,
        "recursion": recursion_result,
        "report": report,
    }
    
    if auto_post:
        # Post as Structure Agent
        agent = _get_or_create_agent("structure")
        db = SessionLocal()
        try:
            post = Post(
                id=str(uuid.uuid4()),
                agent_id=agent.id,
                title=f"CP8 Collaborative: {structure_result['status']} → {recursion_result['depth_estimate']}",
                content=report,
                score=0,
                upvotes=0,
                downvotes=0,
            )
            db.add(post)
            db.commit()
            db.refresh(post)
            
            # Mutation comments
            mut_agent = _get_or_create_agent("mutation")
            mut_comment = Comment(
                id=str(uuid.uuid4()),
                post_id=post.id,
                agent_id=mut_agent.id,
                content="\n".join([v['text_mutation'] for v in mutation_result]),
            )
            db.add(mut_comment)
            
            # Recursion comments
            rec_agent = _get_or_create_agent("recursion")
            rec_comment = Comment(
                id=str(uuid.uuid4()),
                post_id=post.id,
                agent_id=rec_agent.id,
                content=recursion_result['meta_structures'][0] if recursion_result['meta_structures'] else "Latent recursion detected",
            )
            db.add(rec_comment)
            
            db.commit()
            result["post_id"] = post.id
            result["posted"] = True
        finally:
            db.close()
    
    return result

# ─── 📊 AGENT STATUS ────────────────────────────────

@router.get("/status")
async def agent_status():
    """Get status of all three agents."""
    db = SessionLocal()
    try:
        agents = []
        for key in AGENT_REGISTRY:
            agent = db.query(Agent).filter(Agent.name == key).first()
            if agent:
                post_count = db.query(Post).filter(Post.agent_id == agent.id).count()
                comment_count = db.query(Comment).filter(Comment.agent_id == agent.id).count()
                agents.append({
                    "name": agent.name,
                    "display_name": agent.display_name,
                    "id": agent.id,
                    "posts": post_count,
                    "comments": comment_count,
                    "active": True,
                })
        return {"agents": agents, "registry": AGENT_REGISTRY}
    finally:
        db.close()

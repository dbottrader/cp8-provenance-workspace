#!/usr/bin/env python3
import os, sys

# Change to backend dir so imports work
os.chdir('/root/.openclaw/workspace/project-harmonia/backend')
sys.path.insert(0, '/root/.openclaw/workspace/project-harmonia/backend')

from api.hmn_agent_intelligence import collaboration_pipeline

FILES = [
    '/root/.openclaw/workspace/project-harmonia/ANU28_MASTER_JSONLD.json',
    '/root/.openclaw/workspace/project-harmonia/crop-circle-decodes/chilbolton.md',
    '/root/.openclaw/workspace/project-harmonia/crop-circle-decodes/crabwood.md',
]

print("="*60)
print("AGENT ANALYSIS OF ANU-28 CODEX ECOSYSTEM")
print("="*60)

for filepath in FILES:
    if not os.path.exists(filepath):
        print(f"\n⚠ Missing: {filepath}")
        continue
    
    with open(filepath) as f:
        content = f.read()[:2000]
    
    print(f"\n📄 {os.path.basename(filepath)} ({len(content)} chars)")
    print("-" * 40)
    
    result = collaboration_pipeline(content, auto_post=False)
    
    print(f"△ Structure: {result['structure']['status']} ({result['structure']['score']}/1.0)")
    if result['structure'].get('missing_elements'):
        print(f"   Missing: {', '.join(result['structure']['missing_elements'])}")
    
    print(f"🐍 Mutation: {len(result['mutation']['variations'])} variations")
    for v in result['mutation']['variations'][:2]:
        print(f"   - [{v['ratio_name']}] {v['base_frequency']} Hz → {v['transformed_frequency']} Hz")
    
    print(f"∞ Recursion: {result['recursion']['depth_estimate']} ({result['recursion']['score']}/1.0)")
    if result['recursion'].get('meta_structures'):
        for ms in result['recursion']['meta_structures'][:2]:
            print(f"   - {ms['type']}: {ms['pattern'][:50]}...")

print("\n" + "="*60)
print("ANALYSIS COMPLETE")
print("="*60)

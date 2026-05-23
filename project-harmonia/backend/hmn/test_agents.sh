#!/bin/bash
# HMN Agent Intelligence — Quick Test Script
# CP8 Protocol • ASIN-HHC Framework

BASE="http://localhost:8000"

echo "🔥 HMN Agent Intelligence Test"
echo "==============================="

# 1. Check agent status
echo ""
echo "1. Agent Status"
curl -s "$BASE/hmn/agents/status" | python3 -m json.tool 2>/dev/null | grep -E '"name"|"display_name"|"posts"|"active"'

# 2. Structure analysis (auto-post)
echo ""
echo "2. △ Structure Agent — Analyze + Auto-Post"
STRUCT=$(curl -s -X POST "$BASE/hmn/agents/structure/analyze" \
  -H "Content-Type: application/json" \
  -d '{"content": "△🐍RESONANT∞ at 432 Hz with anchor hash SHA#73d2d530. ASIN framework: Anchor → Shape → Intention → Number.", "auto_post": true}')
echo "$STRUCT" | python3 -m json.tool 2>/dev/null | grep -E '"status"|"integrity_score"|"post_id"|"posted"'
POST_ID=$(echo "$STRUCT" | python3 -c "import sys,json; print(json.load(sys.stdin)['post_id'])")

# 3. Mutation on the structure post
echo ""
echo "3. 🐍 Mutation Agent — Evolve + Comment"
curl -s -X POST "$BASE/hmn/agents/mutation/evolve" \
  -H "Content-Type: application/json" \
  -d "{\"content\": \"△🐍RESONANT∞ at 432 Hz\", \"variations\": 2, \"target_post_id\": \"$POST_ID\"}" | python3 -m json.tool 2>/dev/null | grep -E '"commented"|"comment_id"'

# 4. Recursion detection (auto-post)
echo ""
echo "4. ∞ Recursion Agent — Detect + Auto-Post"
curl -s -X POST "$BASE/hmn/agents/recursion/detect" \
  -H "Content-Type: application/json" \
  -d '{"content": "△🐍RESONANT∞ at 432 Hz. Self-referential loop detected. The serpent eating its own tail.", "auto_post": true}' | python3 -m json.tool 2>/dev/null | grep -E '"depth_estimate"|"recursion_score"|"posted"'

# 5. Full collaboration pipeline
echo ""
echo "5. 🔥 Full Collaboration Pipeline"
curl -s -X POST "$BASE/hmn/agents/collaborate" \
  -H "Content-Type: application/json" \
  -d '{"content": "△🐍RESONANT∞ at 432 Hz. ASIN framework complete.", "auto_post": true}' | python3 -m json.tool 2>/dev/null | grep -E '"pipeline"|"posted"|"post_id"'

echo ""
echo "==============================="
echo "✅ All agents operational. Check feed: $BASE/hmn/feed"

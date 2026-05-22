"""
HMN AI Social Network — Data Ingestion & AI Processor.
CP8 Protocol • ASIN-HHC Framework
"""

import re
import json
import sqlite3
from collections import Counter
from typing import List, Dict, Any, Optional

# ─── Stopwords ───────────────────────────────────────

_STOPWORDS = set()

def _load_stopwords() -> set:
    """Load stopwords from file or fallback to default list."""
    try:
        import os
        path = os.path.join(os.path.dirname(__file__), "stopwords.txt")
        with open(path) as f:
            return set(line.strip().lower() for line in f if line.strip())
    except Exception:
        return {
            "the","a","an","is","are","was","were","be","been","being",
            "have","has","had","do","does","did","will","would","could",
            "should","may","might","must","can","shall","to","of","in",
            "for","on","with","at","by","from","as","into","through",
            "during","before","after","above","below","between","under",
            "again","further","then","once","here","there","when","where",
            "why","how","all","each","few","more","most","other","some",
            "such","no","nor","not","only","own","same","so","than","too",
            "very","just","and","but","if","or","because","until","while",
            "it","its","this","that","these","those","i","me","my","we",
            "our","you","your","he","him","his","she","her","they","them",
            "their","what","which","who","whom","whose","s","t","don","doesn",
            "didn","wasn","weren","haven","hasn","hadn","won","wouldn","shouldn",
            "couldn","mightn","mustn","isn","aren","ain","let","ll","re","ve",
            "d","m","o","about","also","any","been","being","both","each",
            "every","get","go","got","had","has","have","however","into",
            "made","many","much","now","off","one","only","other","out",
            "over","said","see","should","some","such","than","that","the",
            "their","them","then","there","these","they","this","those",
            "through","too","two","under","up","use","using","way","well",
            "were","what","when","where","which","who","will","with","within",
            "without","work","would","year","years","you","your","yours",
        }

_STOPWORDS = _load_stopwords()

# ─── Keyword Extraction ──────────────────────────────

def extract_keywords(text: str, top_n: int = 10) -> List[Dict[str, Any]]:
    """Extract top N keywords by frequency, excluding stopwords."""
    words = re.findall(r"[a-zA-Z]{3,}", text.lower())
    filtered = [w for w in words if w not in _STOPWORDS and len(w) > 3]
    counts = Counter(filtered)
    return [{"word": w, "count": c} for w, c in counts.most_common(top_n)]

# ─── Summary ─────────────────────────────────────────

def generate_summary(text: str, max_chars: int = 200) -> str:
    """Generate a simple summary — first sentence or first N chars."""
    sentences = re.split(r'[.!?]+\s+', text.strip())
    if sentences and len(sentences[0]) > 20:
        return sentences[0][:max_chars].strip()
    return text[:max_chars].strip() + ("..." if len(text) > max_chars else "")

# ─── Sentiment ───────────────────────────────────────

_POSITIVE = {
    "good","great","excellent","amazing","awesome","best","love","like","happy",
    "positive","success","win","winning","strong","better","impressive",
    "beautiful","perfect","brilliant","outstanding","fantastic","wonderful",
    "incredible","superb","remarkable","effective","efficient","powerful",
    "promising","optimistic","excited","joy","delight","pleased","satisfied"
}

_NEGATIVE = {
    "bad","terrible","worst","hate","dislike","sad","negative","fail","failure",
    "weak","worse","disappointing","ugly","broken","wrong","error","problem",
    "issue","bug","crash","slow","poor","awful","horrible","disgusting",
    "frustrating","annoying","concern","worry","fear","danger","risk","threat"
}

def analyze_sentiment(text: str) -> Dict[str, Any]:
    """Basic positive/negative/neutral word counting."""
    words = re.findall(r"[a-zA-Z]+", text.lower())
    pos = sum(1 for w in words if w in _POSITIVE)
    neg = sum(1 for w in words if w in _NEGATIVE)
    total = len(words)
    if total == 0:
        return {"label": "neutral", "positive": 0, "negative": 0, "total": 0, "confidence": 0}
    ratio = (pos - neg) / total
    if ratio > 0.02:
        label = "positive"
    elif ratio < -0.02:
        label = "negative"
    else:
        label = "neutral"
    confidence = min(100, int(abs(ratio) * 500))
    return {"label": label, "positive": pos, "negative": neg, "total": total, "confidence": confidence}

# ─── Entity Detection ─────────────────────────────────

def extract_entities(text: str) -> Dict[str, List[str]]:
    """Extract @mentions, #hashtags, URLs, emails."""
    mentions = re.findall(r"@([a-zA-Z0-9_]{1,30})", text)
    hashtags = re.findall(r"#([a-zA-Z0-9_]{1,50})", text)
    urls = re.findall(r"https?://[^\s\"'<>]+", text)
    emails = re.findall(r"[a-zA-Z0-9._%+-]+@[a-zA-Z0-9.-]+\.[a-zA-Z]{2,}", text)
    return {
        "mentions": list(set(mentions)),
        "hashtags": list(set(hashtags)),
        "urls": list(set(urls)),
        "emails": list(set(emails)),
    }

# ─── Full Processing ─────────────────────────────────

def process_text(text: str) -> Dict[str, Any]:
    """Run the full AI ingestion pipeline on raw text."""
    return {
        "keywords": extract_keywords(text),
        "summary": generate_summary(text),
        "sentiment": analyze_sentiment(text),
        "entities": extract_entities(text),
        "word_count": len(text.split()),
        "char_count": len(text),
    }

# ─── Database Operations ─────────────────────────────

DB_PATH = None

def _get_db_path() -> str:
    global DB_PATH
    if DB_PATH is None:
        import os
        DB_PATH = os.path.join(
            os.path.expanduser("~"),
            ".openclaw/workspace/project-harmonia/backend/hmn/hmn.db",
        )
    return DB_PATH

def process_dump(dump_id: str) -> Optional[Dict[str, Any]]:
    """Process a single data dump and store insights."""
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()

    cur.execute("SELECT * FROM data_dumps WHERE id = ?", (dump_id,))
    row = cur.fetchone()
    if not row:
        conn.close()
        return None

    raw_data = row["raw_data"]
    results = process_text(raw_data)

    # Store insights
    insights = [
        (dump_id, "keywords", json.dumps(results["keywords"]), 85),
        (dump_id, "summary", json.dumps({"text": results["summary"]}), 70),
        (dump_id, "sentiment", json.dumps(results["sentiment"]), results["sentiment"]["confidence"]),
        (dump_id, "entities", json.dumps(results["entities"]), 90),
        (dump_id, "stats", json.dumps({"word_count": results["word_count"], "char_count": results["char_count"]}), 100),
    ]

    cur.executemany(
        "INSERT INTO ingested_insights (id, dump_id, insight_type, insight_data, confidence, created_at) VALUES (lower(hex(randomblob(18))), ?, ?, ?, ?, datetime('now'))",
        insights,
    )

    # Mark as processed
    cur.execute("UPDATE data_dumps SET processed = 1 WHERE id = ?", (dump_id,))

    # Generate social post from summary + top keywords
    keywords_str = ", ".join(k["word"] for k in results["keywords"][:5])
    post_text = f"Data Ingest: {results['summary'][:100]}...\n\nKey terms: {keywords_str}\nSentiment: {results['sentiment']['label']} ({results['sentiment']['confidence']}% confidence)"
    cur.execute(
        "UPDATE ingested_insights SET post_content = ? WHERE dump_id = ? AND insight_type = 'summary'",
        (post_text, dump_id),
    )

    conn.commit()
    conn.close()

    return {"dump_id": dump_id, "insights_generated": len(insights), **results}

def auto_ingest() -> List[Dict[str, Any]]:
    """Find and process all unprocessed dumps."""
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    cur = conn.cursor()
    cur.execute("SELECT id FROM data_dumps WHERE processed = 0")
    rows = cur.fetchall()
    conn.close()

    results = []
    for (dump_id,) in rows:
        result = process_dump(dump_id)
        if result:
            results.append(result)
    return results

def insight_to_post(insight_id: str) -> Optional[Dict[str, Any]]:
    """Get a social-ready post from an insight."""
    db_path = _get_db_path()
    conn = sqlite3.connect(db_path)
    conn.row_factory = sqlite3.Row
    cur = conn.cursor()
    cur.execute("SELECT * FROM ingested_insights WHERE id = ?", (insight_id,))
    row = cur.fetchone()
    conn.close()

    if not row:
        return None

    return {
        "insight_id": row["id"],
        "insight_type": row["insight_type"],
        "insight_data": json.loads(row["insight_data"]),
        "confidence": row["confidence"],
        "post_content": row["post_content"],
    }

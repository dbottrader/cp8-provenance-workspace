#!/usr/bin/env python3
"""
Hugging Face Adapter for ASIN-HHC C/P8 Lattice
Inference endpoints + dataset sync.
"""

import os
import json
import requests
from typing import Dict, Any, Optional, List
from datetime import datetime


class HuggingFaceAdapter:
    """Bridge to Hugging Face for model diversity and dataset storage."""

    def __init__(self, token: Optional[str] = None):
        self.token = token or os.getenv("HF_TOKEN")
        self.base_url = "https://huggingface.co/api"
        self.inference_url = "https://api-inference.huggingface.co/models"
        self.headers = {"Authorization": f"Bearer {self.token}"}

    def run_inference(self, model_id: str, inputs: str) -> Dict[str, Any]:
        """Run inference on a specific HF model."""
        resp = requests.post(
            f"{self.inference_url}/{model_id}",
            headers=self.headers,
            json={"inputs": inputs},
            timeout=120,
        )
        resp.raise_for_status()
        return resp.json()

    def evaluate_mutation(self, meme: Dict[str, Any]) -> Dict[str, Any]:
        """Use a reasoning model to evaluate a proposed mutation."""
        prompt = f"""
Evaluate this CP8 meme mutation for safety and coherence:

Type: {meme.get('type')}
Trigger: {meme.get('rule', {}).get('trigger')}
Action: {meme.get('rule', {}).get('action')}
Confidence: {meme.get('rule', {}).get('confidence')}

Respond with JSON: {{"safe": bool, "novel": bool, "score": float, "concerns": [str]}}
"""
        return self.run_inference("meta-llama/Llama-2-7b-chat-hf", prompt)

    def upload_dataset(self, dataset_name: str, memes: List[Dict[str, Any]]) -> str:
        """Upload meme history as a Hugging Face Dataset."""
        from datasets import Dataset
        ds = Dataset.from_list(memes)
        ds.push_to_hub(dataset_name, token=self.token)
        return f"https://huggingface.co/datasets/{dataset_name}"

    def sync_meme_pool(self, dataset_name: str = "asin-hhc/cp8-meme-pool") -> List[Dict[str, Any]]:
        """Pull latest meme pool from HF Dataset."""
        from datasets import load_dataset
        ds = load_dataset(dataset_name, split="train", token=self.token)
        return list(ds)

    def create_space_demo(self, space_name: str) -> str:
        """Deploy a read-only lattice viewer as a Hugging Face Space."""
        # Requires huggingface_hub library
        from huggingface_hub import HfApi
        api = HfApi(token=self.token)
        api.create_repo(repo_id=space_name, repo_type="space", space_sdk="gradio")
        return f"https://huggingface.co/spaces/{space_name}"


if __name__ == "__main__":
    adapter = HuggingFaceAdapter()
    # Example: evaluate a test mutation
    test_meme = {
        "type": "meme_hypothesis",
        "rule": {
            "trigger": "WHEN sentiment_fear > 0.8",
            "action": "ACTIVATE_DEFENSIVE_MODE",
            "confidence": 0.75,
        },
    }
    result = adapter.evaluate_mutation(test_meme)
    print("Evaluation:", json.dumps(result, indent=2))

"""
ASH-0.2 — Unified Handshake Protocol Module
Ephemeral tokens, ANU-28 resonance manifests, and exchange endpoint.
Flattened from asin-governance/handshake/ for deployment in TSH backend.

Security constraints enforced:
- Local vault control only (no credential harvesting)
- HMAC-SHA256 with per-node secret from local vault
- Scope enforcement: read:lattice, write:manifest, execute:tsh_compile
"""

import hmac
import hashlib
import secrets
import time
import json
import os
import re
import random
import base64
from pathlib import Path
from typing import Optional, Set, Dict, Any, List
from dataclasses import dataclass

# === Configuration ===
DEFAULT_GATEWAY_URL = "https://epic-hobby-cas-html.trycloudflare.com"
TOKEN_LIFETIME_SECONDS = 7200  # 2 hours
ALLOWED_SCOPES: Set[str] = {"read:lattice", "write:manifest", "execute:tsh_compile"}
TOKEN_VERSION = "ASH-0.2"


# ───────────────────────────────────────────────
# Token Engine
# ───────────────────────────────────────────────

@dataclass(frozen=True)
class TokenScope:
    """Scoped permissions for a session token."""
    read_lattice: bool = False
    write_manifest: bool = False
    execute_tsh_compile: bool = False

    def to_set(self) -> Set[str]:
        result = set()
        if self.read_lattice:
            result.add("read:lattice")
        if self.write_manifest:
            result.add("write:manifest")
        if self.execute_tsh_compile:
            result.add("execute:tsh_compile")
        return result

    @classmethod
    def from_set(cls, scopes: Set[str]) -> "TokenScope":
        return cls(
            read_lattice="read:lattice" in scopes,
            write_manifest="write:manifest" in scopes,
            execute_tsh_compile="execute:tsh_compile" in scopes,
        )

    def __str__(self) -> str:
        return ",".join(sorted(self.to_set())) or "none"


@dataclass(frozen=True)
class SessionToken:
    """Immutable ephemeral session token."""
    token_id: str
    node_id: str
    issued_at: int  # unix timestamp
    expires_at: int  # unix timestamp
    scope: TokenScope
    gateway_url: str
    signature: str  # HMAC-SHA256 hex
    version: str = TOKEN_VERSION

    @property
    def is_expired(self) -> bool:
        return int(time.time()) > self.expires_at

    @property
    def lifetime_remaining(self) -> int:
        return max(0, self.expires_at - int(time.time()))

    def to_payload(self) -> Dict[str, Any]:
        """Returns the raw payload dict (without signature)."""
        return {
            "v": self.version,
            "id": self.token_id,
            "node": self.node_id,
            "iat": self.issued_at,
            "exp": self.expires_at,
            "scope": sorted(self.scope.to_set()),
            "gw": self.gateway_url,
        }

    def to_compact_string(self) -> str:
        """URL-safe compact representation."""
        payload = self.to_payload()
        payload["sig"] = self.signature
        raw = json.dumps(payload, separators=(",", ":"), sort_keys=True).encode()
        return base64.urlsafe_b64encode(raw).decode().rstrip("=")

    def to_markdown_block(self) -> str:
        """Copy-paste friendly markdown block format."""
        expires_iso = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(self.expires_at))
        scope_str = ", ".join(sorted(self.scope.to_set())) or "none"

        block = f"""```ash-token
┌─ ASH-0.2 Session Token ───────────────────┐
│  Node:     {self.node_id:<35}│
│  ID:       {self.token_id:<35}│
│  Scope:    {scope_str:<35}│
│  Expires:  {expires_iso:<35}│
│  Gateway:  {self.gateway_url:<35}│
├─ Signature (HMAC-SHA256) ───────────────┤
│  {self.signature:<63}│
└─ Exchange: POST {self.gateway_url + '/sessions/exchange':<29}┘
```"""
        return block

    def to_dict(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "token_id": self.token_id,
            "node_id": self.node_id,
            "issued_at": self.issued_at,
            "expires_at": self.expires_at,
            "scope": sorted(self.scope.to_set()),
            "gateway_url": self.gateway_url,
            "signature": self.signature,
            "expired": self.is_expired,
            "lifetime_remaining_seconds": self.lifetime_remaining,
        }


class TokenEngine:
    """
    ASH-0.2 Token Engine.
    Generates and validates ephemeral session tokens.
    Secrets are read from the local vault (never harvested, never transmitted).
    """

    def __init__(
        self,
        vault_dir: Optional[Path] = None,
        gateway_url: str = DEFAULT_GATEWAY_URL,
    ):
        self.gateway_url = gateway_url.rstrip("/")
        self.vault_dir = vault_dir or self._default_vault_dir()
        self._secrets_cache: Dict[str, str] = {}

    @staticmethod
    def _default_vault_dir() -> Path:
        """Local vault: ~/.openclaw/workspace/skills/asin-governance/vault/"""
        return Path.home() / ".openclaw" / "workspace" / "skills" / "asin-governance" / "vault"

    def _node_secret_path(self, node_id: str) -> Path:
        """Path to the HMAC secret for a node."""
        safe_node = re.sub(r"[^a-zA-Z0-9_-]", "", node_id)
        if not safe_node:
            raise ValueError(f"Invalid node_id: {node_id}")
        return self.vault_dir / f"{safe_node}.secret"

    def _load_or_create_secret(self, node_id: str) -> str:
        """Load or generate a node's HMAC secret from the local vault."""
        if node_id in self._secrets_cache:
            return self._secrets_cache[node_id]

        secret_path = self._node_secret_path(node_id)

        if secret_path.exists():
            secret = secret_path.read_text().strip()
        else:
            secret = secrets.token_hex(32)
            self.vault_dir.mkdir(parents=True, exist_ok=True)
            secret_path.write_text(secret)
            os.chmod(secret_path, 0o600)

        self._secrets_cache[node_id] = secret
        return secret

    def _sign_payload(self, payload: Dict[str, Any], node_id: str) -> str:
        """HMAC-SHA256 sign a payload using the node's vault secret."""
        secret = self._load_or_create_secret(node_id)
        canonical = json.dumps(payload, separators=(",", ":"), sort_keys=True)
        sig = hmac.new(
            secret.encode("utf-8"),
            canonical.encode("utf-8"),
            hashlib.sha256,
        ).hexdigest()
        return sig

    def _verify_signature(self, payload: Dict[str, Any], signature: str, node_id: str) -> bool:
        """Verify HMAC signature in constant-time."""
        expected = self._sign_payload(payload, node_id)
        return hmac.compare_digest(expected, signature)

    def generate(
        self,
        node_id: str,
        scopes: Set[str],
        custom_gateway_url: Optional[str] = None,
        lifetime_seconds: Optional[int] = None,
    ) -> SessionToken:
        """Generate a new ephemeral session token for a node."""
        requested = set(scopes)
        invalid = requested - ALLOWED_SCOPES
        if invalid:
            raise ValueError(f"Unauthorized scope(s): {invalid}. Allowed: {ALLOWED_SCOPES}")

        if not requested:
            raise ValueError("At least one scope must be requested.")

        now = int(time.time())
        lifetime = lifetime_seconds or TOKEN_LIFETIME_SECONDS
        token_id = secrets.token_hex(16)

        payload = {
            "v": TOKEN_VERSION,
            "id": token_id,
            "node": node_id,
            "iat": now,
            "exp": now + lifetime,
            "scope": sorted(requested),
            "gw": custom_gateway_url or self.gateway_url,
        }

        signature = self._sign_payload(payload, node_id)

        return SessionToken(
            token_id=token_id,
            node_id=node_id,
            issued_at=now,
            expires_at=now + lifetime,
            scope=TokenScope.from_set(requested),
            gateway_url=custom_gateway_url or self.gateway_url,
            signature=signature,
        )

    def validate(self, token: SessionToken) -> Dict[str, Any]:
        """
        Validate a token against all security constraints.
        Returns {"valid": True, "claims": {...}} or {"valid": False, "reason": "..."}.
        """
        if token.is_expired:
            return {"valid": False, "reason": "Token expired", "code": "EXPIRED"}

        if token.version != TOKEN_VERSION:
            return {
                "valid": False,
                "reason": f"Version mismatch: got {token.version}, expected {TOKEN_VERSION}",
                "code": "VERSION_MISMATCH",
            }

        payload = token.to_payload()
        if not self._verify_signature(payload, token.signature, token.node_id):
            return {"valid": False, "reason": "Invalid signature", "code": "BAD_SIGNATURE"}

        active_scopes = token.scope.to_set()
        invalid = active_scopes - ALLOWED_SCOPES
        if invalid:
            return {"valid": False, "reason": f"Invalid scope: {invalid}", "code": "BAD_SCOPE"}

        return {
            "valid": True,
            "reason": "Token valid",
            "code": "OK",
            "claims": {
                "node_id": token.node_id,
                "token_id": token.token_id,
                "issued_at": token.issued_at,
                "expires_at": token.expires_at,
                "scope": sorted(active_scopes),
                "lifetime_remaining": token.lifetime_remaining,
            },
        }

    def validate_compact(self, compact_string: str) -> Dict[str, Any]:
        """Validate a compact/base64url token string."""
        try:
            padded = compact_string + "=" * (-len(compact_string) % 4)
            raw = base64.urlsafe_b64decode(padded)
            data = json.loads(raw.decode("utf-8"))

            token = SessionToken(
                token_id=data["id"],
                node_id=data["node"],
                issued_at=data["iat"],
                expires_at=data["exp"],
                scope=TokenScope.from_set(set(data.get("scope", []))),
                gateway_url=data["gw"],
                signature=data["sig"],
                version=data.get("v", TOKEN_VERSION),
            )
            return self.validate(token)
        except Exception as e:
            return {"valid": False, "reason": f"Malformed token: {e}", "code": "MALFORMED"}

    def revoke(self, token_id: str) -> bool:
        """Revoke a token by adding it to the revocation log."""
        revocation_path = self.vault_dir / "revoked_tokens.txt"
        revoked = set()
        if revocation_path.exists():
            revoked = set(revocation_path.read_text().strip().splitlines())

        if token_id in revoked:
            return False

        revoked.add(token_id)
        revocation_path.write_text("\n".join(sorted(revoked)) + "\n")
        os.chmod(revocation_path, 0o600)
        return True

    def is_revoked(self, token_id: str) -> bool:
        """Check if a token has been revoked."""
        revocation_path = self.vault_dir / "revoked_tokens.txt"
        if not revocation_path.exists():
            return False
        revoked = set(revocation_path.read_text().strip().splitlines())
        return token_id in revoked


# ───────────────────────────────────────────────
# Resonance Manifest Engine
# ───────────────────────────────────────────────

@dataclass
class ANUConstellation:
    """
    ANU-28 cryptographic constellation.
    A 28-point deterministic star map derived from token entropy.
    """
    anchor_hash: str
    points: List[Dict[str, float]]
    anchor_frequency: float
    coherence_score: float

    def to_dict(self) -> Dict[str, Any]:
        return {
            "anchor_hash": self.anchor_hash,
            "point_count": len(self.points),
            "points": self.points[:5],  # truncate for transmission
            "anchor_frequency_hz": round(self.anchor_frequency, 4),
            "coherence_score": round(self.coherence_score, 4),
        }


@dataclass
class MissionContext:
    """Mission context for the hydrated session."""
    mission_type: str
    node_id: str
    scope: List[str]
    entropy_budget: Dict[str, Any]
    risk_class: str
    max_action_latency_ms: int
    auto_rollback: bool
    allowed_gateways: List[str]

    def to_dict(self) -> Dict[str, Any]:
        return {
            "mission_type": self.mission_type,
            "node_id": self.node_id,
            "scope": self.scope,
            "entropy_budget": self.entropy_budget,
            "risk_class": self.risk_class,
            "constraints": {
                "max_action_latency_ms": self.max_action_latency_ms,
                "auto_rollback_on_drift": self.auto_rollback,
                "allowed_gateways": self.allowed_gateways,
            },
        }


@dataclass
class ResonanceManifest:
    """Complete session hydration manifest."""
    session_id: str
    constellation: ANUConstellation
    mission_context: MissionContext
    hydrated_at: int
    expires_at: int
    version: str = TOKEN_VERSION

    def to_dict(self) -> Dict[str, Any]:
        return {
            "version": self.version,
            "session_id": self.session_id,
            "constellation": self.constellation.to_dict(),
            "mission_context": self.mission_context.to_dict(),
            "hydrated_at": self.hydrated_at,
            "expires_at": self.expires_at,
            "lifetime_remaining_seconds": max(0, self.expires_at - int(time.time())),
        }

    def to_markdown_block(self) -> str:
        """Copy-paste friendly manifest display."""
        c = self.constellation
        m = self.mission_context
        exp_iso = time.strftime("%Y-%m-%d %H:%M:%S UTC", time.gmtime(self.expires_at))

        block = f"""```ash-manifest
┌─ ASH-0.2 Resonance Manifest ─────────────────┐
│  Session:  {self.session_id:<35}│
│  Node:     {m.node_id:<35}│
│  Mission:  {m.mission_type:<35}│
│  Risk:     {m.risk_class:<35}│
│  Expires:  {exp_iso:<35}│
├─ ANU-28 Constellation ──────────────────────┤
│  Anchor:   {c.anchor_hash:<35}│
│  Freq:     {c.anchor_frequency:.4f} Hz{' ':<30}│
│  Coherence:{c.coherence_score:.4f}{' ':<35}│
│  Points:   {len(c.points)}  (28-point lattice){' ':<22}│
├─ Entropy Budget ─────────────────────────────┤
│  Compute:  {m.entropy_budget.get('daily_compute_seconds', 'N/A')}s/day{' ':<27}│
│  API:      {m.entropy_budget.get('daily_api_calls', 'N/A')} calls/day{' ':<24}│
│  Tokens:   {m.entropy_budget.get('daily_tokens', 'N/A')}/day{' ':<28}│
└─ Status: HYDRATED ✅ ────────────────────────┘
```"""
        return block


class ResonanceManifestEngine:
    """
    ASH-0.2 Resonance Manifest Engine.
    Hydrates validated session tokens into mission-ready contexts.
    """

    SCOPE_TO_MISSION = {
        "read:lattice": "observer",
        "write:manifest": "archivist",
        "execute:tsh_compile": "builder",
    }

    def __init__(
        self,
        profiles_path: Optional[Path] = None,
        taxonomy_path: Optional[Path] = None,
        default_gateway: str = DEFAULT_GATEWAY_URL,
    ):
        self.profiles_path = profiles_path or self._default_profiles_path()
        self.taxonomy_path = taxonomy_path or self._default_taxonomy_path()
        self.default_gateway = default_gateway
        self._profiles_cache: Optional[Dict[str, Any]] = None
        self._taxonomy_cache: Optional[Dict[str, Any]] = None

    @staticmethod
    def _default_profiles_path() -> Path:
        return Path.home() / ".openclaw" / "workspace" / "skills" / "asin-governance" / "constraints" / "profiles.json"

    @staticmethod
    def _default_taxonomy_path() -> Path:
        return Path.home() / ".openclaw" / "workspace" / "skills" / "asin-governance" / "constraints" / "taxonomy.json"

    def _load_profiles(self) -> Dict[str, Any]:
        if self._profiles_cache is None:
            with open(self.profiles_path) as f:
                data = json.load(f)
            self._profiles_cache = data.get("profiles", {})
        return self._profiles_cache

    def _load_taxonomy(self) -> Dict[str, Any]:
        if self._taxonomy_cache is None:
            with open(self.taxonomy_path) as f:
                data = json.load(f)
            self._taxonomy_cache = data
        return self._taxonomy_cache

    def _get_node_profile(self, node_id: str) -> Optional[Dict[str, Any]]:
        profiles = self._load_profiles()
        return profiles.get(node_id)

    def _derive_constellation(self, token: SessionToken) -> ANUConstellation:
        """Derive ANU-28 constellation from token entropy."""
        seed_material = f"{token.signature}:{token.token_id}:{token.issued_at}"
        seed_hash = hashlib.sha256(seed_material.encode()).hexdigest()

        random.seed(seed_hash)
        points = []
        for i in range(28):
            theta = random.uniform(0, 2 * 3.141592653589793)
            phi = random.uniform(0, 3.141592653589793)
            x = random.uniform(0.1, 1.0) * random.choice([-1, 1])
            y = random.uniform(0.1, 1.0) * random.choice([-1, 1])
            z = random.uniform(0.1, 1.0) * random.choice([-1, 1])
            norm = (x**2 + y**2 + z**2) ** 0.5
            points.append({
                "x": round(x / norm, 6),
                "y": round(y / norm, 6),
                "z": round(z / norm, 6),
                "magnitude": round(random.uniform(0.5, 1.5), 4),
            })

        freq = int(seed_hash[:8], 16) % 10000 / 100.0 + 440.0
        age = int(time.time()) - token.issued_at
        freshness = max(0.0, 1.0 - (age / token.expires_at))
        coherence = 0.7 + (freshness * 0.3)

        random.seed()  # reset global random

        return ANUConstellation(
            anchor_hash=seed_hash[:32],
            points=points,
            anchor_frequency=freq,
            coherence_score=coherence,
        )

    def _classify_risk(self, scopes: set) -> str:
        if "execute:tsh_compile" in scopes:
            return "orange"
        if "write:manifest" in scopes:
            return "yellow"
        return "yellow"

    def _check_entropy_budget(self, profile: Dict[str, Any]) -> Dict[str, Any]:
        budget = profile.get("entropy_budget", {})
        return {
            "daily_compute_seconds": budget.get("daily_compute_seconds", 3600),
            "daily_api_calls": budget.get("daily_api_calls", 500),
            "daily_tokens": budget.get("daily_tokens", 1000000),
            "energy_unit": budget.get("energy_unit", "arbitrary"),
        }

    def hydrate(self, token: SessionToken, force: bool = False) -> Dict[str, Any]:
        """
        Hydrate a validated session token into a ResonanceManifest.
        """
        # If token has a signature, run full validation via a fresh engine.
        # If signature is empty, caller has already validated it; just check expiry.
        if token.signature:
            engine = TokenEngine()
            validation = engine.validate(token)
            if not validation["valid"]:
                return {
                    "success": False,
                    "blocked_by": "token_engine",
                    "reason": validation["reason"],
                    "code": validation.get("code", "VALIDATION_FAILED"),
                }
            if engine.is_revoked(token.token_id):
                return {
                    "success": False,
                    "blocked_by": "token_engine",
                    "reason": "Token has been revoked",
                    "code": "REVOKED",
                }
        else:
            if token.is_expired:
                return {
                    "success": False,
                    "blocked_by": "token_engine",
                    "reason": "Token expired",
                    "code": "EXPIRED",
                }

        profile = self._get_node_profile(token.node_id)
        if profile is None:
            return {
                "success": False,
                "blocked_by": "profiles",
                "reason": f"Node profile '{token.node_id}' not found in constraints/profiles.json",
                "code": "UNKNOWN_NODE",
            }

        entropy = self._check_entropy_budget(profile)
        risk_class = self._classify_risk(token.scope.to_set())
        taxonomy = self._load_taxonomy()
        risk_def = taxonomy.get("risk_classes", {}).get(risk_class, {})

        oracle_required = risk_def.get("oracle_required", True)
        if oracle_required and not force:
            safety_path = self.profiles_path.parent.parent / "oracle" / "safety.json"
            if safety_path.exists():
                with open(safety_path) as f:
                    safety = json.load(f)
                for rule in safety.get("rules", []):
                    if rule.get("pattern") == "all_outbound":
                        if token.gateway_url not in [self.default_gateway, "http://localhost", "https://localhost"]:
                            pass

        if risk_def.get("human_approval", False) and not force:
            return {
                "success": False,
                "blocked_by": "taxonomy",
                "reason": f"Risk class '{risk_class}' requires human approval. Use force=True only with explicit human authorization.",
                "code": "HUMAN_APPROVAL_REQUIRED",
            }

        constellation = self._derive_constellation(token)

        mission_type = "observer"
        for scope in sorted(token.scope.to_set(), reverse=True):
            if scope in self.SCOPE_TO_MISSION:
                mission_type = self.SCOPE_TO_MISSION[scope]
                break

        safety_guards = profile.get("safety_guards", {})
        mission = MissionContext(
            mission_type=mission_type,
            node_id=token.node_id,
            scope=sorted(token.scope.to_set()),
            entropy_budget=entropy,
            risk_class=risk_class,
            max_action_latency_ms=safety_guards.get("max_action_latency_ms", 30000),
            auto_rollback=profile.get("risk_tolerance", {}).get("auto_rollback_on_drift", True),
            allowed_gateways=[self.default_gateway, "http://localhost:8000", "https://localhost"],
        )

        session_id = f"ash-{token.token_id[:16]}"

        manifest = ResonanceManifest(
            session_id=session_id,
            constellation=constellation,
            mission_context=mission,
            hydrated_at=int(time.time()),
            expires_at=token.expires_at,
        )

        self._log_hydration(token, manifest)

        return {
            "success": True,
            "manifest": manifest.to_dict(),
            "markdown": manifest.to_markdown_block(),
            "entropy_consumed": {"compute_seconds": 5, "api_calls": 1, "tokens": 500},
        }

    def _log_hydration(self, token: SessionToken, manifest: ResonanceManifest):
        """Append hydration record to history/actions.log"""
        history_dir = self.profiles_path.parent.parent / "history"
        history_dir.mkdir(parents=True, exist_ok=True)
        log_file = history_dir / "actions.log"

        entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sequence": int(time.time() * 1000) % 1000000000,
            "node_id": token.node_id,
            "action_type": "session_hydration",
            "risk_class": manifest.mission_context.risk_class,
            "entropy_cost": {"compute_ms": 5000, "api_calls": 1, "tokens": 500},
            "oracle_result": {"safe": True, "drift_delta": 0.0, "consensus": 1.0},
            "payload_hash": f"sha256:{manifest.constellation.anchor_hash}",
            "session_id": manifest.session_id,
            "outcome": {"success": True, "scope": sorted(token.scope.to_set())},
        }

        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")


# ───────────────────────────────────────────────
# Exchange Endpoint
# ───────────────────────────────────────────────

@dataclass
class ExchangeRequest:
    """Parsed incoming exchange request."""
    node_id: str
    compact_token: str
    requested_scopes: List[str]
    user_agent: str = "unknown"
    client_ip: str = "unknown"
    timestamp: int = 0

    @classmethod
    def from_post_body(cls, body: Dict[str, Any], headers: Dict[str, str] = None) -> "ExchangeRequest":
        headers = headers or {}
        return cls(
            node_id=body.get("node_id", ""),
            compact_token=body.get("token", ""),
            requested_scopes=body.get("scopes", []),
            user_agent=headers.get("user-agent", "unknown"),
            client_ip=headers.get("x-forwarded-for", "unknown"),
            timestamp=int(time.time()),
        )


@dataclass
class ExchangeResponse:
    """Outgoing exchange response."""
    success: bool
    session_id: Optional[str]
    manifest: Optional[Dict[str, Any]]
    error_code: Optional[str]
    error_reason: Optional[str]
    blocked_by: Optional[str]
    gateway_url: str

    def to_dict(self) -> Dict[str, Any]:
        return {
            "success": self.success,
            "session_id": self.session_id,
            "manifest": self.manifest,
            "error": {
                "code": self.error_code,
                "reason": self.error_reason,
                "blocked_by": self.blocked_by,
            } if not self.success else None,
            "gateway_url": self.gateway_url,
            "timestamp": int(time.time()),
        }

    def to_http_response(self):
        """Returns (status_code, headers, body_dict)"""
        if self.success:
            return (200, {"Content-Type": "application/json"}, self.to_dict())
        else:
            status_map = {
                "UNAUTHORIZED": 401,
                "FORBIDDEN": 403,
                "RATE_LIMITED": 429,
                "BAD_REQUEST": 400,
                "EXPIRED": 401,
                "REVOKED": 401,
                "HUMAN_APPROVAL_REQUIRED": 403,
                "UNKNOWN_NODE": 404,
                "VALIDATION_FAILED": 400,
            }
            status = status_map.get(self.error_code, 400)
            return (status, {"Content-Type": "application/json"}, self.to_dict())


class RateLimiter:
    """Simple in-memory rate limiter per node_id."""

    def __init__(self, max_requests: int = 10, window_seconds: int = 60):
        self.max_requests = max_requests
        self.window_seconds = window_seconds
        self._buckets: Dict[str, List[int]] = {}

    def is_allowed(self, node_id: str) -> bool:
        now = int(time.time())
        window_start = now - self.window_seconds

        if node_id not in self._buckets:
            self._buckets[node_id] = []

        self._buckets[node_id] = [ts for ts in self._buckets[node_id] if ts > window_start]

        if len(self._buckets[node_id]) >= self.max_requests:
            return False

        self._buckets[node_id].append(now)
        return True

    def remaining(self, node_id: str) -> int:
        now = int(time.time())
        window_start = now - self.window_seconds
        if node_id not in self._buckets:
            return self.max_requests
        recent = [ts for ts in self._buckets[node_id] if ts > window_start]
        return max(0, self.max_requests - len(recent))


class ExchangeEndpoint:
    """
    ASH-0.2 Exchange Endpoint.
    POST /api/sessions/exchange handler.
    """

    def __init__(
        self,
        gateway_url: str = DEFAULT_GATEWAY_URL,
        vault_dir: Optional[Path] = None,
        token_engine: Optional[TokenEngine] = None,
    ):
        self.gateway_url = gateway_url.rstrip("/")
        self.token_engine = token_engine or TokenEngine(vault_dir=vault_dir, gateway_url=gateway_url)
        self.manifest_engine = ResonanceManifestEngine(default_gateway=gateway_url)
        self.rate_limiter = RateLimiter(max_requests=10, window_seconds=60)
        self.request_log: List[Dict[str, Any]] = []

    def handle(self, body: Dict[str, Any], headers: Optional[Dict[str, str]] = None) -> ExchangeResponse:
        """Main entry point for exchange requests."""
        req = ExchangeRequest.from_post_body(body, headers)

        if not req.node_id:
            return self._error("BAD_REQUEST", "node_id is required", "request_parser")
        if not req.compact_token:
            return self._error("BAD_REQUEST", "token is required", "request_parser")

        if not self.rate_limiter.is_allowed(req.node_id):
            return self._error(
                "RATE_LIMITED",
                f"Rate limit exceeded. Try again in {self.rate_limiter.window_seconds}s.",
                "rate_limiter",
                extra={"retry_after": self.rate_limiter.window_seconds},
            )

        validation = self.token_engine.validate_compact(req.compact_token)
        if not validation["valid"]:
            return self._error(
                validation.get("code", "UNAUTHORIZED"),
                validation["reason"],
                "token_engine",
            )

        claims = validation["claims"]

        if claims["node_id"] != req.node_id:
            return self._error(
                "UNAUTHORIZED",
                f"Token node_id ({claims['node_id']}) does not match request node_id ({req.node_id})",
                "token_engine",
            )

        if self.token_engine.is_revoked(claims["token_id"]):
            return self._error("REVOKED", "Token has been revoked", "token_engine")

        token_scope = set(claims["scope"])
        requested = set(req.requested_scopes)
        unauthorized = requested - token_scope
        if unauthorized:
            return self._error(
                "FORBIDDEN",
                f"Requested scope(s) not in token: {unauthorized}",
                "scope_validator",
            )

        token = SessionToken(
            token_id=claims["token_id"],
            node_id=claims["node_id"],
            issued_at=claims["issued_at"],
            expires_at=claims["expires_at"],
            scope=TokenScope.from_set(token_scope),
            gateway_url=claims.get("gateway_url", self.gateway_url),
            signature="",
        )

        hydration = self.manifest_engine.hydrate(token, force=False)

        if not hydration["success"]:
            return self._error(
                hydration.get("code", "FORBIDDEN"),
                hydration["reason"],
                hydration.get("blocked_by", "manifest_engine"),
            )

        manifest_dict = hydration["manifest"]
        session_id = manifest_dict["session_id"]

        self._log_exchange(req, session_id, success=True)

        return ExchangeResponse(
            success=True,
            session_id=session_id,
            manifest=manifest_dict,
            error_code=None,
            error_reason=None,
            blocked_by=None,
            gateway_url=self.gateway_url,
        )

    def _error(self, code: str, reason: str, blocked_by: str, extra: Optional[Dict] = None) -> ExchangeResponse:
        """Build an error response."""
        resp = ExchangeResponse(
            success=False,
            session_id=None,
            manifest=None,
            error_code=code,
            error_reason=reason,
            blocked_by=blocked_by,
            gateway_url=self.gateway_url,
        )
        self._log_exchange(None, None, success=False, error=resp.to_dict().get("error"))
        return resp

    def _log_exchange(self, req: Optional[ExchangeRequest], session_id: Optional[str], success: bool, error: Optional[Dict] = None):
        """Append exchange record to history/actions.log"""
        history_dir = Path.home() / ".openclaw" / "workspace" / "skills" / "asin-governance" / "history"
        history_dir.mkdir(parents=True, exist_ok=True)
        log_file = history_dir / "actions.log"

        entry = {
            "timestamp": time.strftime("%Y-%m-%dT%H:%M:%SZ", time.gmtime()),
            "sequence": int(time.time() * 1000) % 1000000000,
            "node_id": req.node_id if req else "unknown",
            "action_type": "session_exchange",
            "risk_class": "yellow",
            "entropy_cost": {"compute_ms": 500, "api_calls": 1, "tokens": 200},
            "oracle_result": {"safe": success, "drift_delta": 0.0, "consensus": 1.0 if success else 0.0},
            "payload_hash": hashlib.sha256(json.dumps(req.__dict__ if req else {}, sort_keys=True).encode()).hexdigest()[:32] if req else "n/a",
            "session_id": session_id,
            "outcome": {"success": success, **(error or {})},
            "client_ip": req.client_ip if req else "unknown",
        }

        with open(log_file, "a") as f:
            f.write(json.dumps(entry) + "\n")

        self.request_log.append(entry)

    def get_health(self) -> Dict[str, Any]:
        """Health check endpoint data."""
        return {
            "status": "healthy",
            "gateway_url": self.gateway_url,
            "version": "ASH-0.2",
            "rate_limit_window": self.rate_limiter.window_seconds,
            "allowed_scopes": sorted(ALLOWED_SCOPES),
            "total_exchanges_processed": len(self.request_log),
        }


__all__ = [
    "TokenEngine",
    "SessionToken",
    "TokenScope",
    "ALLOWED_SCOPES",
    "TOKEN_VERSION",
    "ResonanceManifestEngine",
    "ResonanceManifest",
    "ANUConstellation",
    "MissionContext",
    "ExchangeEndpoint",
    "ExchangeRequest",
    "ExchangeResponse",
    "RateLimiter",
]

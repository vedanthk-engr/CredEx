import datetime
import jwt
from backend.config import settings

class ZKProofService:
    def __init__(self):
        self.secret = settings.JWT_SECRET

    def generate_proof_token(self, msme_id: str, cohort_percentile: float, cohort_label: str) -> dict:
        """
        Generates a signed attestation token committing to the MSME's credit band.
        Top-25 (>=75th), 25-50 (50th-75th), 50-75 (25th-50th), 75-100 (<25th).
        """
        # Determine percentile band
        if cohort_percentile >= 75.0:
            band = "top-25"
        elif cohort_percentile >= 50.0:
            band = "25-50"
        elif cohort_percentile >= 25.0:
            band = "50-75"
        else:
            band = "75-100"

        now = datetime.datetime.utcnow()
        expiration = now + datetime.timedelta(days=30)

        payload = {
            "iss": "CredEx",
            "sub": msme_id,
            "iat": now,
            "exp": expiration,
            "percentile_band": band,
            "cohort_label": cohort_label,
            "attestation": "Zero-Knowledge Credit Score Attestation. No raw financial data is shared."
        }

        # Encode token using PyJWT
        token = jwt.encode(payload, self.secret, algorithm="HS256")
        
        # Public verification URL
        # For local dev, we will point to localhost:8000
        verify_url = f"http://localhost:8000/api/zk/verify/{token}"

        return {
            "proof_token": token,
            "public_verification_url": verify_url,
            "percentile_band": band,
            "expires_at": expiration.isoformat() + "Z"
        }

    def verify_proof_token(self, token: str) -> dict:
        """
        Verifies a proof token and returns validity and parsed band.
        """
        try:
            payload = jwt.decode(token, self.secret, algorithms=["HS256"])
            return {
                "valid": True,
                "msme_id": payload["sub"],
                "percentile_band": payload["percentile_band"],
                "cohort": payload["cohort_label"],
                "issued_at": datetime.datetime.fromtimestamp(payload["iat"]).isoformat() + "Z",
                "expires_at": datetime.datetime.fromtimestamp(payload["exp"]).isoformat() + "Z"
            }
        except jwt.ExpiredSignatureError:
            return {"valid": False, "error": "Token has expired"}
        except jwt.InvalidTokenError:
            return {"valid": False, "error": "Invalid token signature"}

zk_proof_service = ZKProofService()

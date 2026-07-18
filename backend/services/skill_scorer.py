import datetime
import numpy as np

class SkillScorerService:
    def __init__(self):
        # Recognized issuers/bodies keywords
        self.approved_issuers = {"nsdc", "pmkvy", "udyam", "sidbi", "nabard", "iit", "iim"}

    def evaluate_skills(self, nic_code: str, certificates: list[dict]) -> dict:
        """
        Calculates a skill score based on DigiLocker credentials.
        Certificates format: [{"name": str, "issuer": str, "issue_date": str (YYYY-MM-DD)}]
        """
        if not certificates:
            return {
                "has_skills": False,
                "skill_recency_score": 0.0,
                "skill_relevance_score": 0.0,
                "human_capital_index": 0.0,
                "score_modifier": 0.0
            }

        recency_scores = []
        relevance_scores = []
        
        current_year = datetime.datetime.now().year
        nic_prefix = nic_code[:2] if len(nic_code) >= 2 else ""

        # sector keyword helper
        sector_keywords = {
            "01": ["agri", "farm", "crop", "fertilizer"],
            "10": ["food", "baking", "preservation"],
            "13": ["textile", "weaving", "dyeing", "garment"],
            "14": ["apparel", "tailoring", "design"],
            "29": ["auto", "machining", "motor", "fitter"],
            "47": ["retail", "sales", "shop", "digital payment"],
            "56": ["cook", "culinary", "restaurant", "catering"],
            "86": ["medical", "health", "nursing", "clinical"]
        }
        keywords = sector_keywords.get(nic_prefix, [])

        valid_certs_count = 0

        for cert in certificates:
            name = cert.get("name", "").lower()
            issuer = cert.get("issuer", "").lower()
            issue_date_str = cert.get("issue_date", "")
            
            # Check if from approved issuer or name mentions standard program
            is_approved = any(kw in issuer or kw in name for kw in self.approved_issuers)
            if not is_approved:
                continue
                
            valid_certs_count += 1
            
            # 1. Recency Score
            try:
                issue_date = datetime.datetime.strptime(issue_date_str, "%Y-%m-%d")
                months_ago = (datetime.datetime.now() - issue_date).days / 30.0
            except Exception:
                # Default if date parse fails
                months_ago = 18.0
                
            if months_ago <= 12.0:
                rec_score = 100.0
            elif months_ago <= 24.0:
                rec_score = 75.0
            elif months_ago <= 48.0:
                rec_score = 45.0
            else:
                rec_score = 20.0
            recency_scores.append(rec_score)
            
            # 2. Relevance Score
            rel_score = 60.0 # base for approved certificate
            
            # General business/financial management relevance
            if any(kw in name for kw in ["finance", "accounting", "management", "business", "udyam", "sidbi"]):
                rel_score = 90.0
                
            # Direct sector-specific relevance
            if any(kw in name for kw in keywords):
                rel_score = 100.0
                
            relevance_scores.append(rel_score)

        if valid_certs_count == 0:
            return {
                "has_skills": False,
                "skill_recency_score": 0.0,
                "skill_relevance_score": 0.0,
                "human_capital_index": 0.0,
                "score_modifier": 0.0
            }

        # Take averages of the certificates
        avg_recency = np.mean(recency_scores)
        avg_relevance = np.mean(relevance_scores)

        # Human Capital Index
        # human_capital_index = 0.6 * skill_recency_score + 0.4 * skill_relevance_score
        hci = 0.6 * avg_recency + 0.4 * avg_relevance
        
        # Soft positive modifier (max +3 percentile points)
        score_modifier = (hci / 100.0) * 3.0

        return {
            "has_skills": True,
            "skill_recency_score": round(avg_recency, 1),
            "skill_relevance_score": round(avg_relevance, 1),
            "human_capital_index": round(hci, 1),
            "score_modifier": round(score_modifier, 2),
            "certificates_analyzed": valid_certs_count
        }

skill_scorer = SkillScorerService()

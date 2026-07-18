import json
import httpx
from backend.config import settings

ROADMAP_SYSTEM = """You are CREDEX, an AI financial advisor for Indian MSMEs.
Generate concise, actionable improvement roadmaps in simple English.
Always be encouraging. Focus on 2-3 high-impact actions.
Return ONLY valid JSON, no markdown, no explanation outside the JSON."""

ROADMAP_USER_TEMPLATE = """
MSME Profile:
- Business: {business_name} ({nic_label})
- Location: {district}, {state}
- Cohort: {cohort_label} ({cohort_size} peer businesses)
- Current percentile: {current_percentile}th

Weak dimensions (percentile scores):
{weak_dimensions}

Strong dimensions:
{strong_dimensions}

Generate a 90-day improvement roadmap. Return JSON:
{{
  "summary": "2-sentence encouraging summary",
  "actions": [
    {{
      "action": "specific action text",
      "why_it_matters": "1 sentence explanation",
      "projected_score_delta": "+8 percentile points",
      "projected_limit_delta": "+₹1.2L",
      "timeline_days": 30
    }}
  ],
  "projected_percentile_after": 82,
  "projected_limit_after": "₹5.8L"
}}
"""

class RoadmapGeneratorService:
    async def generate_roadmap(self, msme_profile: dict, assessment_data: dict) -> dict:
        """
        Generates a 90-day improvement roadmap using Claude, with local fallback.
        """
        # Determine weak and strong dimensions
        dimensions = assessment_data.get("dimensions", {})
        sorted_dims = sorted(dimensions.items(), key=lambda x: x[1])
        
        weak_dims = sorted_dims[:2]
        strong_dims = sorted_dims[2:]
        
        weak_str = "\n".join([f"- {k}: {v}th percentile" for k, v in weak_dims])
        strong_str = "\n".join([f"- {k}: {v}th percentile" for k, v in strong_dims])
        
        # Prepare prompts
        user_prompt = ROADMAP_USER_TEMPLATE.format(
            business_name=msme_profile.get("business_name", "Your Business"),
            nic_label=msme_profile.get("nic_sector_group", "General"),
            district=msme_profile.get("district", "Coimbatore"),
            state=msme_profile.get("state", "Tamil Nadu"),
            cohort_label=msme_profile.get("cohort_label", "Local peers"),
            cohort_size=42, # Mock cohort size
            current_percentile=assessment_data.get("cohort_percentile", 50.0),
            weak_dimensions=weak_str,
            strong_dimensions=strong_str
        )

        api_key = settings.ANTHROPIC_API_KEY
        if api_key and api_key != "dummy_key" and not api_key.startswith("your_"):
            try:
                headers = {
                    "x-api-key": api_key,
                    "anthropic-version": "2023-06-01",
                    "content-type": "application/json"
                }
                data = {
                    "model": "claude-3-5-sonnet-20241022",
                    "max_tokens": 1000,
                    "system": ROADMAP_SYSTEM,
                    "messages": [
                        {"role": "user", "content": user_prompt}
                    ]
                }
                
                async with httpx.AsyncClient(timeout=15.0) as client:
                    response = await client.post(
                        "https://api.anthropic.com/v1/messages",
                        headers=headers,
                        json=data
                    )
                    if response.status_code == 200:
                        content = response.json()["content"][0]["text"]
                        # Extract JSON
                        start_idx = content.find("{")
                        end_idx = content.rfind("}") + 1
                        if start_idx != -1 and end_idx != -1:
                            json_str = content[start_idx:end_idx]
                            return json.loads(json_str)
            except Exception as e:
                print(f"Claude API failed: {e}. Falling back to rule-based roadmap.")

        # Local Rule-based fallback generator
        return self._generate_fallback_roadmap(msme_profile, assessment_data, weak_dims)

    def _generate_fallback_roadmap(self, msme_profile: dict, assessment_data: dict, weak_dims: list) -> dict:
        """Generates a high-quality structured local roadmap if Claude API is not accessible."""
        business_name = msme_profile.get("business_name", "Your Business")
        current_percentile = assessment_data.get("cohort_percentile", 50.0)
        current_limit = assessment_data.get("recommended_limit", 200000.0)
        
        # Recommendations database based on weak dimensions
        rec_database = {
            "Revenue Consistency": {
                "action": "Stabilize monthly GST sales declarations and route all invoice payments through UPI/Bank accounts.",
                "why_it_matters": "Banks require steady month-over-month cash flow indicators rather than sporadic large receipts to verify repayment capacity.",
                "score_delta": "+8 percentile points",
                "limit_delta": 0.20 # +20% limit
            },
            "Cashflow Resilience": {
                "action": "Maintain a minimum cash buffer of 15 days in your primary current account and reduce supplier receivables velocity.",
                "why_it_matters": "A solid cash buffer shields your operations from unexpected collection delays and ensures timely loan servicing.",
                "score_delta": "+12 percentile points",
                "limit_delta": 0.25
            },
            "EPFO Discipline": {
                "action": "Ensure EPFO payroll contributions are filed strictly on or before the 15th of every month.",
                "why_it_matters": "Consistent payroll reporting acts as a strong indicator of corporate governance and operational stability.",
                "score_delta": "+10 percentile points",
                "limit_delta": 0.15
            },
            "GST Filing Regularity": {
                "action": "File GST GSTR-1 and GSTR-3B returns on time for 3 consecutive months without gaps.",
                "why_it_matters": "On-time tax filing compliance acts as a behavioral trust proxy, boosting automated credit scoring eligibility.",
                "score_delta": "+9 percentile points",
                "limit_delta": 0.18
            },
            "Collection Velocity": {
                "action": "Digitize collections by setting up automated UPI payment link reminders to reduce receivables delay below 30 days.",
                "why_it_matters": "Accelerating your collections prevents working capital blockages and increases cash turnover frequency.",
                "score_delta": "+11 percentile points",
                "limit_delta": 0.22
            },
            "AA Consent Completeness": {
                "action": "Provide full bank statement access via Account Aggregator and connect secondary accounts.",
                "why_it_matters": "Full data transparency allows scoring engines to perform accurate cash flow evaluation and reduce risk premiums.",
                "score_delta": "+6 percentile points",
                "limit_delta": 0.10
            }
        }

        actions_list = []
        projected_percentile = current_percentile
        projected_limit = current_limit
        
        # Add actions based on the 2 weak dimensions
        for dim_name, dim_score in weak_dims:
            rec = rec_database.get(dim_name, {
                "action": "Maintain high data integrity and consistency in financial disclosures.",
                "why_it_matters": "Clean records improve reliability scores.",
                "score_delta": "+5 percentile points",
                "limit_delta": 0.10
            })
            
            # Estimate rupees delta
            l_delta = projected_limit * rec["limit_delta"]
            # format l_delta as Indian system rupee e.g. +₹45K or +₹1.2L
            if l_delta >= 100000.0:
                l_delta_str = f"+₹{l_delta / 100000.0:.1f}L"
            else:
                l_delta_str = f"+₹{int(l_delta / 1000)}K"
                
            actions_list.append({
                "action": rec["action"],
                "why_it_matters": rec["why_it_matters"],
                "projected_score_delta": rec["score_delta"],
                "projected_limit_delta": l_delta_str,
                "timeline_days": 30 if len(actions_list) == 0 else 60
            })
            
            # Accumulate projected uplift
            pts = int(rec["score_delta"].replace(" percentile points", "").replace("+", ""))
            projected_percentile += pts
            projected_limit += l_delta

        # Add a 3rd action if we only have 2, relating to voice checking / alternate data
        actions_list.append({
            "action": "Maintain weekly Voice Diary check-ins for 8 consecutive weeks.",
            "why_it_matters": "Active engagement and positive sentiment trend unlock the 'Committed Borrower' badge, easing interest rates.",
            "projected_score_delta": "+4 percentile points",
            "projected_limit_delta": "+₹20K",
            "timeline_days": 90
        })
        projected_percentile += 4
        projected_limit += 20000

        projected_percentile = min(95.0, projected_percentile)
        
        if projected_limit >= 100000.0:
            limit_str = f"₹{projected_limit / 100000.0:.1f}L"
        else:
            limit_str = f"₹{int(projected_limit / 1000)}K"

        return {
            "summary": f"Dear {business_name}, your profile shows solid credit behavior but can be optimized. By addressing cash buffer levels and collection speeds, your rating can improve significantly.",
            "actions": actions_list,
            "projected_percentile_after": round(projected_percentile, 1),
            "projected_limit_after": limit_str
        }

roadmap_generator = RoadmapGeneratorService()

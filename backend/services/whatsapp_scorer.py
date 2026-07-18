class WhatsappScorerService:
    def score_metadata(self, metadata: dict) -> dict:
        """
        Scores WhatsApp Business API analytics.
        Expected keys in metadata:
            - total_messages: int
            - unique_contacts: int
            - avg_response_time_minutes: float
            - active_hours_per_day: float (between 0.0 and 24.0)
            - monthly_volumes: list of ints [last 3 months]
        """
        total_msgs = int(metadata.get("total_messages", 0))
        unique_cnts = int(metadata.get("unique_contacts", 0))
        avg_resp_time = float(metadata.get("avg_response_time_minutes", 60.0))
        active_hours = float(metadata.get("active_hours_per_day", 4.0))
        volumes = metadata.get("monthly_volumes", [])

        if total_msgs == 0 or unique_cnts == 0:
            return {
                "has_whatsapp": False,
                "contact_diversity": 0.0,
                "response_velocity_minutes": avg_resp_time,
                "whatsapp_vitality_score": 0.0,
                "privacy_note": "Only metadata analyzed, no message content accessed"
            }

        # 1. Contact Diversity: unique_contacts / total_messages
        contact_diversity = unique_cnts / total_msgs
        # Cap diversity score (max 100 for ratio >= 0.2)
        diversity_score = min(100.0, (contact_diversity / 0.2) * 100.0)

        # 2. Response Velocity (lower response time is better)
        # Under 5 minutes: 100
        # Under 30 minutes: 80
        # Under 120 minutes: 50
        # Over 120 minutes: 20
        if avg_resp_time <= 5.0:
            velocity_score = 100.0
        elif avg_resp_time <= 30.0:
            velocity_score = 80.0
        elif avg_resp_time <= 120.0:
            velocity_score = 50.0
        else:
            velocity_score = 20.0

        # 3. Active Hours Spread (operational intensity)
        # 12+ hours: 100, 8-12 hours: 80, 4-8 hours: 50, <4 hours: 20
        hours_score = min(100.0, (active_hours / 12.0) * 100.0)

        # 4. Volume Trend (last month vs average of preceding months)
        volume_trend = 0.0
        if len(volumes) >= 2:
            latest = volumes[-1]
            prev = sum(volumes[:-1]) / len(volumes[:-1])
            volume_trend = (latest - prev) / prev if prev > 0 else 0.0
        # map volume trend [-0.3, 0.3] to [50, 100]
        trend_score = min(100.0, max(0.0, (volume_trend + 0.3) / 0.6 * 50.0 + 50.0))

        # Composite Vitality Score
        # 30% diversity, 30% velocity, 20% active hours, 20% volume trend
        vitality = (0.3 * diversity_score) + (0.3 * velocity_score) + (0.2 * hours_score) + (0.2 * trend_score)

        return {
            "has_whatsapp": True,
            "contact_diversity": round(contact_diversity, 3),
            "response_velocity_minutes": round(avg_resp_time, 1),
            "active_hours_spread": round(active_hours, 1),
            "conversation_volume_trend": round(volume_trend * 100, 1), # as percentage
            "whatsapp_vitality_score": round(vitality, 1),
            "privacy_note": "Only metadata analyzed, no message content accessed"
        }

whatsapp_scorer = WhatsappScorerService()

import random

class SatelliteScorerService:
    def evaluate_foot_traffic(self, district: str, latitude: float = None, longitude: float = None) -> dict:
        """
        Simulates parsing satellite images for foot traffic density trends.
        """
        # Distict base densities
        district_densities = {
            "bangalore": 0.85,
            "bengaluru": 0.85,
            "chennai": 0.82,
            "mumbai": 0.95,
            "delhi": 0.90,
            "hyderabad": 0.78,
            "pune": 0.75,
            "coimbatore": 0.65,
            "surat": 0.70,
            "tirupur": 0.60,
            "ludhiana": 0.58,
            "nashik": 0.55,
            "jaipur": 0.62
        }
        
        base_density = district_densities.get(district.lower(), 0.50)
        
        # Add random noise
        density_index = base_density * random.uniform(0.9, 1.1)
        density_index = max(0.1, min(1.0, density_index))
        
        # MoM foot traffic growth trend (e.g. +2.4% MoM)
        foot_traffic_trend = random.uniform(-0.05, 0.08)

        return {
            "satellite_data_available": True,
            "foot_traffic_density_index": round(density_index, 2),
            "foot_traffic_trend_mom": round(foot_traffic_trend * 100, 1),
            "risk_mitigator_score": round(density_index * 100, 1),
            "coordinates": {"lat": latitude or 11.0168, "lng": longitude or 76.9558} # Default Coimbatore
        }

satellite_scorer = SatelliteScorerService()

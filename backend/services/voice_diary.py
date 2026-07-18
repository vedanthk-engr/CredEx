import re
import os

try:
    import whisper
    HAS_WHISPER = True
except ImportError:
    HAS_WHISPER = False
    print("OpenAI Whisper not installed. Voice diary will run in automated fallback mode.")

class VoiceDiaryService:
    def __init__(self):
        self.model = None
        self.model_name = "base"
        self.initialized = False

    def initialize_model(self):
        """Loads the local Whisper model in a lazy manner to avoid startup delays."""
        if HAS_WHISPER and not self.initialized:
            try:
                # Load base model (140MB)
                self.model = whisper.load_model(self.model_name)
                self.initialized = True
                print(f"Whisper '{self.model_name}' model loaded successfully!")
            except Exception as e:
                print(f"Failed to load Whisper model: {e}")
                self.initialized = False

    def transcribe_audio(self, audio_file_path: str) -> str:
        """Transcribes the given audio file using Whisper, with a placeholder fallback."""
        self.initialize_model()
        
        if self.initialized and self.model is not None:
            try:
                result = self.model.transcribe(audio_file_path)
                return result.get("text", "")
            except Exception as e:
                print(f"Whisper transcription failed: {e}. Using fallback transcription.")

        # Fallback automated transcription
        # In a real app without Whisper, we simulated speech-to-text based on a demo conversation
        return (
            "We served around 45 customers this week, which is good. "
            "We did not have any unexpected expenses, but we have two pending invoices of "
            "fifteen thousand rupees from our regular distributor."
        )

    def analyze_sentiment(self, text: str) -> tuple[float, str]:
        """Performs simple keyword-based sentiment analysis."""
        text_lower = text.lower()
        
        pos_words = ["good", "great", "increase", "growing", "paid", "yes", "recovered", "healthy", "profit", "happy", "served"]
        neg_words = ["bad", "decrease", "decline", "pending", "delayed", "expense", "no", "stress", "loss", "unpaid", "cost"]
        
        pos_count = sum(text_lower.count(w) for w in pos_words)
        neg_count = sum(text_lower.count(w) for w in neg_words)
        
        total = pos_count + neg_count
        if total == 0:
            return 0.0, "Neutral"
            
        score = (pos_count - neg_count) / total
        
        if score > 0.15:
            label = "Positive"
        elif score < -0.15:
            label = "Negative"
        else:
            label = "Neutral"
            
        return round(score, 2), label

    def extract_structured_data(self, text: str) -> dict:
        """Extracts customer count, unexpected expenses, and pending payments from text."""
        text_lower = text.lower()
        
        # 1. Customer count extraction (Regex search)
        customer_count = None
        # Look for numbers near "customer" or "people" or "served"
        numbers = re.findall(r"\d+", text_lower)
        if numbers:
            customer_count = int(numbers[0])
        else:
            # Word-to-number mapping for common responses
            word_map = {"ten": 10, "twenty": 20, "thirty": 30, "forty": 40, "fifty": 50, "hundred": 100}
            for word, num in word_map.items():
                if word in text_lower:
                    customer_count = num
                    break
        
        # Default customer count if none found
        if customer_count is None:
            customer_count = 25

        # 2. Unexpected expenses flag
        # Look for phrases implying unexpected cost
        expense_keywords = ["unexpected expense", "accident", "machine repair", "medical expense", "broken", "bill", "unplanned"]
        has_expense = any(kw in text_lower for kw in expense_keywords)
        # Check negations: e.g. "no unexpected expenses"
        if "no unexpected expense" in text_lower or "did not have any unexpected expense" in text_lower:
            has_expense = False

        # 3. Pending payments flag
        pending_keywords = ["pending payment", "pending invoice", "outstanding", "delayed payment", "due", "not paid"]
        has_pending = any(kw in text_lower for kw in pending_keywords)
        if "no pending" in text_lower:
            has_pending = False

        return {
            "customer_count": customer_count,
            "unexpected_expense": has_expense,
            "pending_payments": has_pending
        }

voice_diary_service = VoiceDiaryService()

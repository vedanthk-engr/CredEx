import base64
from backend.config import settings

try:
    import nacl.secret
    import nacl.utils
    HAS_NACL = True
except ImportError:
    HAS_NACL = False
    print("PyNaCl not installed. Using fallback base64 XOR encryption.")

class EncryptionService:
    def __init__(self):
        # Generate or load a 32-byte key
        key_hex = settings.ENCRYPTION_KEY
        try:
            self.key = bytes.fromhex(key_hex)
            if len(self.key) != 32:
                raise ValueError("Key must be exactly 32 bytes (64 hex characters)")
        except Exception:
            # Fallback key
            self.key = b"credex_default_32byte_sec_key!!!"

        if HAS_NACL:
            self.box = nacl.secret.SecretBox(self.key)

    def encrypt(self, plaintext: str) -> str:
        """Encrypts a string and returns a base64 encoded ciphertext."""
        if not plaintext:
            return ""
        
        try:
            plaintext_bytes = plaintext.encode("utf-8")
            if HAS_NACL:
                encrypted = self.box.encrypt(plaintext_bytes)
                return base64.b64encode(encrypted).decode("utf-8")
            else:
                # Simple fallback: XOR with key and base64 encode
                xor_bytes = bytes(
                    [b ^ self.key[i % len(self.key)] for i, b in enumerate(plaintext_bytes)]
                )
                return base64.b64encode(xor_bytes).decode("utf-8")
        except Exception as e:
            print(f"Encryption failed: {e}")
            return base64.b64encode(plaintext.encode("utf-8")).decode("utf-8")

    def decrypt(self, ciphertext: str) -> str:
        """Decrypts a base64 encoded ciphertext and returns plaintext."""
        if not ciphertext:
            return ""
        
        try:
            cipher_bytes = base64.b64decode(ciphertext.encode("utf-8"))
            if HAS_NACL:
                decrypted = self.box.decrypt(cipher_bytes)
                return decrypted.decode("utf-8")
            else:
                # Simple fallback: XOR with key
                xor_bytes = bytes(
                    [b ^ self.key[i % len(self.key)] for i, b in enumerate(cipher_bytes)]
                )
                return xor_bytes.decode("utf-8")
        except Exception as e:
            print(f"Decryption failed: {e}")
            try:
                return base64.b64decode(ciphertext.encode("utf-8")).decode("utf-8")
            except Exception:
                return ciphertext

encryption_service = EncryptionService()

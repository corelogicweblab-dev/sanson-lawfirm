import time
from dataclasses import dataclass, field


@dataclass
class CircuitBreaker:
    """Logic-level circuit breaker for external services (OpenAI, Qdrant)."""

    name: str
    failure_threshold: int = 5
    recovery_timeout_sec: int = 60
    _failures: int = 0
    _opened_at: float | None = field(default=None, repr=False)

    def record_success(self) -> None:
        self._failures = 0
        self._opened_at = None

    def record_failure(self) -> None:
        self._failures += 1
        if self._failures >= self.failure_threshold:
            self._opened_at = time.time()

    @property
    def is_open(self) -> bool:
        if self._opened_at is None:
            return False
        if time.time() - self._opened_at > self.recovery_timeout_sec:
            self._failures = 0
            self._opened_at = None
            return False
        return True

    def allow_request(self) -> bool:
        return not self.is_open


openai_breaker = CircuitBreaker("openai", failure_threshold=5, recovery_timeout_sec=90)
qdrant_breaker = CircuitBreaker("qdrant", failure_threshold=3, recovery_timeout_sec=120)

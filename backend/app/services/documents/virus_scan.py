from abc import ABC, abstractmethod


class VirusScanResult:
    def __init__(self, clean: bool, engine: str, detail: str = ""):
        self.clean = clean
        self.engine = engine
        self.detail = detail


class VirusScanner(ABC):
    @abstractmethod
    def scan(self, file_bytes: bytes) -> VirusScanResult:
        raise NotImplementedError


class NullVirusScanner(VirusScanner):
    """No-op scanner used when no AV engine is configured for this environment.

    Swap in ClamAvScanner (via clamd, pointed at a sidecar clamd daemon) in production by
    changing get_virus_scanner() below — nothing else in the upload path needs to change.
    """

    def scan(self, file_bytes: bytes) -> VirusScanResult:
        return VirusScanResult(clean=True, engine="none", detail="Virus scanning not configured")


class ClamAvScanner(VirusScanner):
    def __init__(self, host: str = "clamav", port: int = 3310) -> None:
        self._host = host
        self._port = port

    def scan(self, file_bytes: bytes) -> VirusScanResult:
        import clamd  # optional dependency, only imported when this scanner is selected

        client = clamd.ClamdNetworkSocket(host=self._host, port=self._port)
        result = client.instream(file_bytes)
        status, detail = result.get("stream", ("OK", None))
        return VirusScanResult(clean=status == "OK", engine="clamav", detail=detail or "")


def get_virus_scanner() -> VirusScanner:
    return NullVirusScanner()

class ServiceError(Exception):
    """A use-case failure translated to an unchanged HTTP response by the API."""

    def __init__(self, status_code: int, detail: str):
        super().__init__(detail)
        self.status_code = status_code
        self.detail = detail

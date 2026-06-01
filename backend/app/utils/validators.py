from email_validator import EmailNotValidError, validate_email


def normalize_email(email: str) -> str:
    try:
        return validate_email(email, check_deliverability=False).normalized.lower()
    except EmailNotValidError as exc:
        raise ValueError("Invalid email address") from exc


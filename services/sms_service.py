import os
import logging
from twilio.rest import Client

logger = logging.getLogger(__name__)


def send_booking_confirmation(
    phone_number,
    patient_name,
    doctor_name,
    appointment_date,
    appointment_time,
):
    account_sid = os.getenv("TWILIO_ACCOUNT_SID")
    auth_token = os.getenv("TWILIO_AUTH_TOKEN")
    from_number = os.getenv("TWILIO_SMS_FROM")

    if not all([account_sid, auth_token, from_number]):
        logger.warning("Twilio SMS is not configured.")
        return False

    try:
        message = (
            f"AeroHealth AI: Hi {patient_name}, your appointment "
            f"with {doctor_name} is confirmed for "
            f"{appointment_date} at {appointment_time}. "
            "Please contact the hospital if you need assistance."
        )

        client = Client(account_sid, auth_token)

        result = client.messages.create(
            body=message,
            from_=from_number,
            to=phone_number,
        )

        logger.info("Appointment SMS submitted to Twilio: %s", result.sid)
        return True

    except Exception:
        logger.exception("Failed to send appointment confirmation SMS.")
        return False
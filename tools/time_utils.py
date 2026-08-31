from datetime import datetime


def normalize_slot(value):

    if not value:
        return None

    value = str(value).strip().upper()
    
    if value == "ANY":
        return "ANY"

    # Normalize common separators
    value = value.replace(".", ":")
    value = value.replace("-", ":")

    # Convert spaces between hour and minute
    # "11 30 AM" -> "11:30 AM"
    parts = value.split()

    if len(parts) == 3 and parts[0].isdigit() and parts[1].isdigit():
        value = f"{parts[0]}:{parts[1]} {parts[2]}"

    # "11 AM" -> "11:00 AM"
    if len(parts) == 2 and parts[0].isdigit():

        if ":" not in value:
            value = f"{parts[0]}:00 {parts[1]}"

    formats = [
        "%I:%M %p",
        "%I:%M:%S %p",
    ]

    for fmt in formats:

        try:

            parsed = datetime.strptime(
                value,
                fmt
            )

            return parsed.strftime("%I:%M %p")

        except ValueError:
            continue

    return None
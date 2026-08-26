from datetime import datetime, date

from tools.supabase_client import supabase
from tools.time_utils import normalize_slot

class Scheduler:

    def get_available_slots(self, department):

        today = date.today().isoformat()

        doctors = (
            supabase
            .table("doctors")
            .select("id, name")
            .eq("department", department)
            .execute()
        )

        if not doctors.data:
            return []

        result = []

        for doctor in doctors.data:

            slots = (
            supabase
            .table("appointment_slots")
            .select("slot_time")
            .eq("doctor_id", doctor["id"])
            .eq("schedule_date", today)
            .eq("available", True)
            .execute()
        )

            if not slots.data:
                continue

            formatted_slots = []

            for slot in slots.data:

                time_value = slot["slot_time"]

                hour, minute, second = map(
                    int,
                    time_value.split(":")
                )

                suffix = "AM" if hour < 12 else "PM"

                display_hour = hour % 12

                if display_hour == 0:
                    display_hour = 12

                formatted_slots.append(
                    f"{display_hour:02d}:{minute:02d} {suffix}"
                )

            result.append({
                "doctor": doctor["name"],
                "slots": formatted_slots
            })

        return result


    def book_appointment(
        self,
        department,
        doctor_name,
        slot_time,
        patient_name,
        patient_age,
        patient_phone=None
    ):

        # -----------------------------
        # Find doctor
        # -----------------------------

        doctor_result = (
            supabase
            .table("doctors")
            .select("id")
            .eq("name", doctor_name)
            .eq("department", department)
            .execute()
        )

        if not doctor_result.data:

            print("Doctor not found.")

            return False

        doctor_id = doctor_result.data[0]["id"]


        # -----------------------------
        # Normalize slot time
        # -----------------------------

        slot_time = slot_time.strip().upper()

        # Convert possible formats into database format HH:MM:SS
        if slot_time.endswith("AM") or slot_time.endswith("PM"):

            # Remove AM/PM
            time_part = slot_time[:-2].strip()
            period = slot_time[-2:].strip()

            parts = time_part.split(":")

            if len(parts) == 2:
                # 11:30 AM
                slot_time = f"{time_part} {period}"

                slot_time_24 = datetime.strptime(
                    slot_time,
                    "%I:%M %p"
                ).strftime("%H:%M:%S")

            elif len(parts) == 3:
                # 11:30:00 AM
                slot_time_24 = datetime.strptime(
                    slot_time,
                    "%I:%M:%S %p"
                ).strftime("%H:%M:%S")

            else:
                return False

        else:
            return False

        # -----------------------------
        # Today's date
        # -----------------------------

        #today = date.today().isoformat()


        # -----------------------------
        # Find available slot
        # -----------------------------

        slot_result = (
        supabase
        .table("appointment_slots")
        .select("id")
        .eq("doctor_id", doctor_id)
        .eq("slot_time", slot_time_24)
        .eq("available", True)
        .execute()
    )

        if not slot_result.data:

            print("Requested slot is not available.")

            return False

        slot_id = slot_result.data[0]["id"]


        # -----------------------------
        # Book slot
        # -----------------------------

        update_result = (
            supabase
            .table("appointment_slots")
            .update({
                "available": False,
                "patient_name": patient_name,
                "patient_age": patient_age,
                "patient_phone": patient_phone
            })
            .eq("id", slot_id)
            .eq("available", True)
            .execute()
        )


        if not update_result.data:

            return False


        return True

    def is_slot_available(
    self,
    doctor_name,
    slot_time
):

        doctors = (
            supabase
            .table("doctors")
            .select("id")
            .eq("name", doctor_name)
            .execute()
        )

        if not doctors.data:
            return False

        doctor_id = doctors.data[0]["id"]

        normalized_slot = normalize_slot(slot_time)

        if not normalized_slot:
            return False

        slot_time_24 = datetime.strptime(
            normalized_slot,
            "%I:%M %p"
        ).strftime("%H:%M:%S")

        today = date.today().isoformat()

        result = (
            supabase
            .table("appointment_slots")
            .select("id")
            .eq("schedule_date", today)
            .eq("doctor_id", doctor_id)
            .eq("slot_time", slot_time_24)
            .eq("available", True)
            .execute()
        )

        return bool(result.data)
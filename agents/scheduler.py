from datetime import datetime, date

from tools.supabase_client import supabase
from tools.time_utils import normalize_slot


class Scheduler:

    # =====================================================
    # GET AVAILABLE SLOTS
    # =====================================================

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


    # =====================================================
    # BOOK APPOINTMENT
    # =====================================================

    def book_appointment(
        self,
        department,
        doctor_name,
        slot_time,
        patient_name,
        patient_age,
        patient_phone=None,
        user_id=None
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

        if slot_time.endswith("AM") or slot_time.endswith("PM"):

            time_part = slot_time[:-2].strip()

            period = slot_time[-2:].strip()

            parts = time_part.split(":")


            if len(parts) == 2:

                slot_time = f"{time_part} {period}"

                slot_time_24 = datetime.strptime(
                    slot_time,
                    "%I:%M %p"
                ).strftime("%H:%M:%S")


            elif len(parts) == 3:

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

        today = date.today().isoformat()


        # -----------------------------
        # Find available slot
        # -----------------------------

        slot_result = (
            supabase
            .table("appointment_slots")
            .select("id")
            .eq("schedule_date", today)
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

            print("Failed to update appointment slot.")

            return False


        # -----------------------------
        # Create appointment record
        # -----------------------------

        if user_id:

            print("\nCreating appointment record...")


            appointment_result = (
                supabase
                .table("appointments")
                .insert({
                    "user_id": user_id,
                    "slot_id": slot_id,
                    "doctor_id": doctor_id,
                    "appointment_date": today,
                    "appointment_time": slot_time_24,
                    "status": "confirmed"
                })
                .execute()
            )


            if not appointment_result.data:

                print(
                    "Failed to create appointment record."
                )


                # Roll back slot

                supabase \
                    .table("appointment_slots") \
                    .update({
                        "available": True,
                        "patient_name": None,
                        "patient_age": None,
                        "patient_phone": None
                    }) \
                    .eq("id", slot_id) \
                    .execute()


                return False


            print(
                "Appointment record created successfully."
            )


        else:

            print(
                "Warning: No user_id provided. "
                "Appointment table was not updated."
            )


        return True


    # =====================================================
    # GET USER'S UPCOMING APPOINTMENT
    # =====================================================

    def get_upcoming_appointment(self, user_id):

        if not user_id:

            return None


        today = date.today().isoformat()


        appointment_result = (
            supabase
            .table("appointments")
            .select(
                "id, user_id, slot_id, doctor_id, "
                "appointment_date, appointment_time, status"
            )
            .eq("user_id", user_id)
            .gte("appointment_date", today)
            .eq("status", "confirmed")
            .order(
                "appointment_date"
            )
            .order(
                "appointment_time"
            )
            .limit(1)
            .execute()
        )


        if not appointment_result.data:

            return None


        appointment = appointment_result.data[0]


        # -----------------------------
        # Get doctor name
        # -----------------------------

        doctor_result = (
            supabase
            .table("doctors")
            .select("name")
            .eq("id", appointment["doctor_id"])
            .single()
            .execute()
        )


        appointment["doctor_name"] = (
            doctor_result.data["name"]
            if doctor_result.data
            else "Doctor"
        )


        return appointment


    # =====================================================
    # CANCEL APPOINTMENT
    # =====================================================

    def cancel_appointment(
        self,
        user_id,
        appointment_id
    ):

        if not user_id or not appointment_id:

            return False


        # -----------------------------
        # Get appointment
        # -----------------------------

        appointment_result = (
            supabase
            .table("appointments")
            .select(
                "id, user_id, slot_id, status"
            )
            .eq("id", appointment_id)
            .eq("user_id", user_id)
            .eq("status", "confirmed")
            .single()
            .execute()
        )


        if not appointment_result.data:

            print(
                "Appointment not found or already cancelled."
            )

            return False


        appointment = appointment_result.data

        slot_id = appointment["slot_id"]


        # -----------------------------
        # Mark appointment cancelled
        # -----------------------------

        update_appointment = (
            supabase
            .table("appointments")
            .update({
                "status": "cancelled"
            })
            .eq("id", appointment_id)
            .eq("user_id", user_id)
            .eq("status", "confirmed")
            .execute()
        )


        if not update_appointment.data:

            print(
                "Failed to cancel appointment."
            )

            return False


        # -----------------------------
        # Release appointment slot
        # -----------------------------

        update_slot = (
            supabase
            .table("appointment_slots")
            .update({
                "available": True,
                "patient_name": None,
                "patient_age": None,
                "patient_phone": None
            })
            .eq("id", slot_id)
            .execute()
        )


        if not update_slot.data:

            print(
                "Failed to release appointment slot."
            )


            # Roll back appointment status

            supabase \
                .table("appointments") \
                .update({
                    "status": "confirmed"
                }) \
                .eq("id", appointment_id) \
                .execute()


            return False


        print(
            "Appointment cancelled successfully."
        )


        return True


    # =====================================================
    # CHECK SLOT AVAILABILITY
    # =====================================================

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


        normalized_slot = normalize_slot(
            slot_time
        )


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
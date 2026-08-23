from datetime import datetime, date, timedelta

from tools.supabase_client import supabase


class SlotGenerator:

    def __init__(self):
        self.slot_duration = timedelta(minutes=30)

    def generate_slots(self, start_time, end_time):

        slots = []

        current = datetime.combine(date.today(), start_time)
        end = datetime.combine(date.today(), end_time)

        while current < end:

            slots.append(current.time())

            current += self.slot_duration

        return slots

    def generate_today_slots(self):

        today = date.today()

        day_name = today.strftime("%A")

        print(f"\nGenerating slots for {day_name}, {today}")

        # Sunday is a holiday
        if day_name == "Sunday":

            print("Sunday - Hospital closed.")

            return

        # --------------------------------
        # Check if today's slots exist
        # --------------------------------

        existing = (
            supabase
            .table("appointment_slots")
            .select("id")
            .eq("schedule_date", str(today))
            .limit(1)
            .execute()
        )

        if existing.data:

            print("Today's appointment slots already exist.")

            return

        # --------------------------------
        # Get today's doctor schedules
        # --------------------------------

        schedules = (
            supabase
            .table("doctor_schedules")
            .select("*")
            .eq("day_of_week", day_name)
            .execute()
        )

        if not schedules.data:

            print("No doctor schedules found for today.")

            return

        # --------------------------------
        # Generate slots
        # --------------------------------

        rows = []

        for schedule in schedules.data:

            doctor_id = schedule["doctor_id"]

            morning_start = self._parse_time(
                schedule["morning_start"]
            )

            morning_end = self._parse_time(
                schedule["morning_end"]
            )

            afternoon_start = self._parse_time(
                schedule["afternoon_start"]
            )

            afternoon_end = self._parse_time(
                schedule["afternoon_end"]
            )

            # Morning slots
            morning_slots = self.generate_slots(
                morning_start,
                morning_end
            )

            # Afternoon slots
            afternoon_slots = self.generate_slots(
                afternoon_start,
                afternoon_end
            )

            all_slots = morning_slots + afternoon_slots

            for slot in all_slots:

                rows.append({

                    "schedule_date": str(today),

                    "doctor_id": doctor_id,

                    "slot_time": slot.strftime("%H:%M:%S"),

                    "available": True,

                    "patient_name": None,

                    "patient_age": None,

                    "patient_phone": None

                })

        # --------------------------------
        # Insert into Supabase
        # --------------------------------

        if rows:

            supabase \
                .table("appointment_slots") \
                .insert(rows) \
                .execute()

            print(
                f"Created {len(rows)} appointment slots."
            )

    def _parse_time(self, value):

        if isinstance(value, str):

            return datetime.strptime(
                value,
                "%H:%M:%S"
            ).time()

        return value
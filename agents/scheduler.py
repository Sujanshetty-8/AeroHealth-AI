import pandas as pd


class Scheduler:

    def __init__(self):

        self.file = "data/doctor_schedule.xlsx"

    def get_available_slots(self, department):

        df = pd.read_excel(self.file)

        df = df[
            (df["Department"] == department)
            &
            (df["Available"] == True)
        ]

        doctors = []

        for doctor in df["Doctor"].unique():

            slots = []

            for value in df[df["Doctor"] == doctor]["Slot"]:

                if hasattr(value, "strftime"):
                    slots.append(value.strftime("%I:%M %p"))
                else:
                    slots.append(str(value))

            doctors.append({

                "doctor": doctor,

                "slots": slots

                })

        return doctors
    
    def book_appointment(self, department, doctor, slot):

        df = pd.read_excel(self.file)

        def normalize_slot(value):

            if hasattr(value, "strftime"):
                value = value.strftime("%I:%M %p")

            value = str(value).strip().upper()

            # Convert common user formats to a standard format
            for fmt in [
                "%I:%M %p",
                "%I %p",
            ]:
                try:
                    return pd.to_datetime(value, format=fmt).strftime("%I:%M %p")
                except:
                    pass

            return value

        requested_slot = normalize_slot(slot)

        for index, row in df.iterrows():

            excel_slot = normalize_slot(row["Slot"])

            if (
                str(row["Department"]).strip().lower()
                == department.strip().lower()
                and
                str(row["Doctor"]).strip().lower()
                == doctor.strip().lower()
                and
                bool(row["Available"]) is True
                and
                excel_slot == requested_slot
            ):

                df.loc[index, "Available"] = False

                df.to_excel(
                    self.file,
                    index=False
                )

                return True

        return False
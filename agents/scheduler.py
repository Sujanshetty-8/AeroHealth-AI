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
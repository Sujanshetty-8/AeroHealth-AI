import json


class Triage:

    def __init__(self):

        with open(
            "data/departments.json",
            "r",
            encoding="utf-8"
        ) as f:

            self.departments = json.load(f)

    def predict(self, symptoms):

        symptoms = symptoms.lower()

        for department, keywords in self.departments.items():

            for keyword in keywords:

                if keyword.lower() in symptoms:

                    return department

        return "General Physician"
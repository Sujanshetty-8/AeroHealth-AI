from tools.supabase_client import supabase


class Triage:

    def __init__(self):

        result = (
            supabase
            .table("departments")
            .select("name, keywords")
            .execute()
        )

        self.departments = result.data or []

    def predict(self, symptoms):

        symptoms = symptoms.lower()

        for department in self.departments:

            name = department["name"]
            keywords = department["keywords"]

            for keyword in keywords:

                if keyword.lower() in symptoms:

                    return name

        return "General Physician"
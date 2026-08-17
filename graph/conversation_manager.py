from agents.extractor import Extractor
from agents.language_generator import LanguageGenerator
from agents.triage import Triage
from graph.router import get_next_stage
from agents.scheduler import Scheduler

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
)


class ConversationManager:

    def __init__(self):

        self.generator = LanguageGenerator()

        self.extractor = Extractor()

        self.triage = Triage()

        self.history = []

        self.scheduler = Scheduler()

        self.state = {

            "conversation": [],

            "stage": "ASK_SYMPTOMS",

            "intent": "BOOK_APPOINTMENT",

            "patient": {

                "name": None,

                "age": None,

                "symptoms": None,

                "department": None,

                "doctor": None,

                "slot": None

            },

            "available_doctors": [],

            "booking_complete": False

        }


    def process(self, user_message):

        # -----------------------------
        # Extract information
        # -----------------------------

        extracted = self.extractor.extract(
                    user_message,
                    self.state["stage"]
)

        patient = self.state["patient"]

        if extracted.get("name"):
            patient["name"] = extracted["name"]

        if extracted.get("age"):
            patient["age"] = extracted["age"]

        if extracted.get("symptoms"):
            patient["symptoms"] = extracted["symptoms"]

        # NEW: Extract doctor
        if extracted.get("doctor"):


            selected_doctor = extracted["doctor"].strip().lower()

            for doctor_data in self.state["available_doctors"]:

                actual_doctor = doctor_data["doctor"]

                if (
                    selected_doctor == actual_doctor.lower()
                    or selected_doctor == actual_doctor.lower().replace("dr. ", "")
                ):
                    

                    patient["doctor"] = actual_doctor
                    break

        # NEW: Extract slot
        if extracted.get("slot"):
            patient["slot"] = extracted["slot"]


        # -----------------------------
        # TRIAGE
        # -----------------------------

        if patient["symptoms"] and patient["department"] is None:

            patient["department"] = self.triage.predict(
                patient["symptoms"]
            )


        # -----------------------------
        # SCHEDULER
        # -----------------------------

        if (
            patient["department"]
            and len(self.state["available_doctors"]) == 0
        ):

            self.state["available_doctors"] = (
                self.scheduler.get_available_slots(
                    patient["department"]
                )
            )

        # -----------------------------
        # BOOK APPOINTMENT
        # -----------------------------

        if (
            patient["doctor"]
            and patient["slot"]
            and not self.state["booking_complete"]
        ):

            booked = self.scheduler.book_appointment(
                patient["department"],
                patient["doctor"],
                patient["slot"]
            )

            if booked:
                self.state["booking_complete"] = True


        # -----------------------------
        # Decide next stage
        # -----------------------------

        self.state["stage"] = get_next_stage(self.state)


        # -----------------------------
        # Generate response
        # -----------------------------

        context = None

        if self.state["stage"] == "SCHEDULER":

            context = {

                "department": patient["department"],

                "available_doctors": self.state["available_doctors"]

            }


        reply = self.generator.generate(

            self.state["stage"],

            user_message,

            self.history,

            context

        )


        # -----------------------------
        # Save conversation
        # -----------------------------

        self.history.append(
            HumanMessage(content=user_message)
        )

        self.history.append(
            AIMessage(content=reply)
        )

        self.state["conversation"].append(

            {
                "user": user_message,
                "assistant": reply
            }

        )


        # -----------------------------
        # Debug
        # -----------------------------

        print("\n========== CURRENT PATIENT STATE ==========")
        print(self.state["patient"])

        print("\n========== AVAILABLE DOCTORS ==========")
        print(self.state["available_doctors"])

        print("\nCurrent Stage :", self.state["stage"])

        print("===========================================\n")


        return reply
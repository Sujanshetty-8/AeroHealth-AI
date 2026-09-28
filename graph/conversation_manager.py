from datetime import datetime

from agents.extractor import Extractor
from agents.language_generator import LanguageGenerator
from agents.triage import Triage
from graph.router import get_next_stage
from agents.scheduler import Scheduler
from tools.time_utils import normalize_slot

from langchain_core.messages import (
    HumanMessage,
    AIMessage,
)


class ConversationManager:

    def __init__(self, user_id=None):

        self.user_id = user_id

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

                "phone": None,

                "symptoms": None,

                "department": None,

                "doctor": None,

                "slot": None

            },

            "available_doctors": [],

            "booking_complete": False,

            "cancellation_requested": False,

            "cancellation_complete": False,

            "cancellation_appointment": None

        }


    # =====================================================
    # DETECT CANCELLATION REQUEST
    # =====================================================

    def is_cancellation_request(self, message):

        text = message.lower().strip()

        cancellation_phrases = [

            "cancel my appointment",
            "cancel the appointment",
            "cancel appointment",
            "i want to cancel the appointment",
            "i need to cancel",
            "please cancel",
            "can you cancel",
            "cancel my booking",
            "cancel booking",
            "cancel it"

        ]

        return any(
            phrase in text
            for phrase in cancellation_phrases
        )


    # =====================================================
    # DETECT CONFIRMATION
    # =====================================================

    def is_confirmation(self, message):

        text = message.lower().strip()

        confirmation_phrases = [

            "yes",
            "yeah",
            "yep",
            "yup",
            "sure",
            "okay",
            "ok",
            "confirm",
            "please do",
            "go ahead",
            "yes cancel",
            "yes, cancel",
            "cancel it",
            "do it"

        ]

        if text in confirmation_phrases:
            return True

        # Handle sentences such as:
        # "yes please cancel it"
        # "yes go ahead and cancel"

        if (
            "yes" in text
            and "cancel" in text
        ):
            return True

        if (
            "confirm" in text
            and "cancel" in text
        ):
            return True

        return False


    # =====================================================
    # DETECT NEGATIVE RESPONSE
    # =====================================================

    def is_negative(self, message):

        text = message.lower().strip()

        negative_phrases = [

            "no",
            "nope",
            "nah",
            "don't",
            "do not",
            "keep it",
            "don't cancel",
            "do not cancel",
            "no don't cancel"

        ]

        if text in negative_phrases:
            return True

        if (
            "don't cancel" in text
            or "do not cancel" in text
        ):
            return True

        return False


    # =====================================================
    # FORMAT APPOINTMENT DATE
    # =====================================================

    def format_appointment_date(self, date_string):

        if not date_string:
            return "the scheduled date"

        try:

            date_object = datetime.strptime(
                date_string,
                "%Y-%m-%d"
            )

            return date_object.strftime(
                "%d %b %Y"
            )

        except Exception:

            return date_string


    # =====================================================
    # FORMAT APPOINTMENT TIME
    # =====================================================

    def format_appointment_time(self, time_string):

        if not time_string:
            return "the scheduled time"

        try:

            time_object = datetime.strptime(
                time_string,
                "%H:%M:%S"
            )

            return time_object.strftime(
                "%I:%M %p"
            ).lstrip("0")

        except Exception:

            return time_string


    # =====================================================
    # SAVE CONVERSATION
    # =====================================================

    def save_conversation(
        self,
        user_message,
        assistant_message
    ):

        self.history.append(
            HumanMessage(
                content=user_message
            )
        )

        self.history.append(
            AIMessage(
                content=assistant_message
            )
        )

        self.state["conversation"].append({

            "user": user_message,

            "assistant": assistant_message

        })


    # =====================================================
    # CANCELLATION FLOW
    #
    # IMPORTANT:
    # This flow does NOT use the LLM.
    # =====================================================

    def process_cancellation(self, user_message):

        # =================================================
        # STEP 1
        # User has requested cancellation
        # =================================================

        if not self.state["cancellation_requested"]:

            print(
                "\n========== CANCELLATION =========="
            )

            print(
                "Looking for upcoming appointment..."
            )


            appointment = (
                self.scheduler.get_upcoming_appointment(
                    self.user_id
                )
            )


            # -------------------------------------------------
            # No appointment found
            # -------------------------------------------------

            if not appointment:

                self.state[
                    "cancellation_requested"
                ] = False

                self.state[
                    "cancellation_appointment"
                ] = None

                self.state[
                    "intent"
                ] = "BOOK_APPOINTMENT"

                self.state[
                    "stage"
                ] = "ASK_SYMPTOMS"


                reply = (
                    "You don't have any upcoming "
                    "confirmed appointments to cancel."
                )


                self.save_conversation(
                    user_message,
                    reply
                )


                print(
                    "No upcoming appointment found."
                )

                print(
                    "=================================\n"
                )


                return reply


            # -------------------------------------------------
            # Appointment found
            # -------------------------------------------------

            self.state[
                "cancellation_requested"
            ] = True


            self.state[
                "cancellation_appointment"
            ] = appointment


            self.state[
                "stage"
            ] = "CANCEL_CONFIRM"


            doctor_name = (
                appointment.get(
                    "doctor_name",
                    "your doctor"
                )
            )


            appointment_date = (
                self.format_appointment_date(
                    appointment.get(
                        "appointment_date"
                    )
                )
            )


            appointment_time = (
                self.format_appointment_time(
                    appointment.get(
                        "appointment_time"
                    )
                )
            )


            # -------------------------------------------------
            # IMPORTANT:
            # No LLM here.
            # -------------------------------------------------

            reply = (

                f"You have an appointment with "
                f"{doctor_name} on "
                f"{appointment_date} at "
                f"{appointment_time}. "
                f"Would you like me to cancel it?"

            )


            self.save_conversation(
                user_message,
                reply
            )


            print(
                "Upcoming appointment found:"
            )

            print(
                appointment
            )

            print(
                "Cancellation confirmation requested."
            )

            print(
                "=================================\n"
            )


            return reply


        # =================================================
        # STEP 2
        # User is responding to confirmation
        # =================================================

        elif self.state["stage"] == "CANCEL_CONFIRM":


            # =================================================
            # USER CONFIRMED
            # =================================================

            if self.is_confirmation(
                user_message
            ):

                appointment = (
                    self.state[
                        "cancellation_appointment"
                    ]
                )


                if not appointment:

                    reply = (
                        "I couldn't find the appointment "
                        "details. Please try the cancellation "
                        "request again."
                    )


                    self.state[
                        "cancellation_requested"
                    ] = False


                    self.state[
                        "stage"
                    ] = "ASK_SYMPTOMS"


                    self.save_conversation(
                        user_message,
                        reply
                    )


                    return reply


                print(
                    "\nCancelling appointment..."
                )


                cancelled = (
                    self.scheduler.cancel_appointment(

                        self.user_id,

                        appointment["id"]

                    )
                )


                # -------------------------------------------------
                # Cancellation successful
                # -------------------------------------------------

                if cancelled:

                    self.state[
                        "cancellation_complete"
                    ] = True

                    self.state[
                    "booking_complete"
                    ] = False


                    self.state[
                        "cancellation_requested"
                    ] = False


                    self.state[
                        "stage"
                    ] = "CANCELLATION_COMPLETE"


                    doctor_name = (
                        appointment.get(
                            "doctor_name",
                            "your doctor"
                        )
                    )


                    reply = (

                        f"Your appointment with "
                        f"{doctor_name} has been "
                        f"successfully cancelled."

                    )


                    self.save_conversation(
                        user_message,
                        reply
                    )


                    print(
                        "Appointment cancelled successfully."
                    )

                    print(
                        "=================================\n"
                    )


                    return reply


                # -------------------------------------------------
                # Cancellation failed
                # -------------------------------------------------

                else:

                    reply = (

                        "Sorry, I couldn't cancel "
                        "your appointment right now. "
                        "Please try again."

                    )


                    self.save_conversation(
                        user_message,
                        reply
                    )


                    return reply


            # =================================================
            # USER SAID NO
            # =================================================

            elif self.is_negative(
                user_message
            ):

                self.state[
                    "cancellation_requested"
                ] = False


                self.state[
                    "cancellation_appointment"
                ] = None


                self.state[
                    "intent"
                ] = "BOOK_APPOINTMENT"


                self.state[
                    "stage"
                ] = "ASK_SYMPTOMS"


                reply = (
                    "Okay, I won't cancel your appointment."
                )


                self.save_conversation(
                    user_message,
                    reply
                )


                return reply


            # =================================================
            # UNCLEAR RESPONSE
            # =================================================

            else:

                reply = (

                    "Please confirm whether you want "
                    "to cancel the appointment. "
                    "You can say yes or no."

                )


                self.save_conversation(
                    user_message,
                    reply
                )


                return reply


    # =====================================================
    # NORMAL PROCESS
    # =====================================================

    def process(self, user_message):

        # =================================================
        # CHECK FOR NEW CANCELLATION REQUEST
        # =================================================

        if self.is_cancellation_request(
            user_message
        ):

            self.state[
                "intent"
            ] = "CANCEL_APPOINTMENT"


            return self.process_cancellation(
                user_message
            )


        # =================================================
        # CONTINUE EXISTING CANCELLATION FLOW
        # =================================================

        if (

            self.state[
                "cancellation_requested"
            ]

            and

            self.state[
                "stage"
            ] == "CANCEL_CONFIRM"

        ):

            return self.process_cancellation(
                user_message
            )


        # =================================================
        # EXTRACT INFORMATION
        # =================================================

        extracted = self.extractor.extract(
            user_message,
            self.state["stage"]
        )


        print(
            "\n========== EXTRACTOR DEBUG =========="
        )

        print(
            "Stage:",
            self.state["stage"]
        )

        print(
            "User message:",
            user_message
        )

        print(
            "Extracted:",
            extracted
        )

        print(
            "=====================================\n"
        )


        patient = self.state["patient"]


        # =================================================
        # UPDATE PATIENT INFORMATION
        # =================================================

        if extracted.get("name"):

            patient["name"] = extracted["name"]


        if extracted.get("age"):

            patient["age"] = extracted["age"]


        if extracted.get("phone"):

            patient["phone"] = extracted["phone"]


        if extracted.get("symptoms"):

            patient["symptoms"] = extracted["symptoms"]


        # =================================================
        # EXTRACT DOCTOR
        # =================================================

        if extracted.get("doctor"):

            selected_doctor = (
                extracted["doctor"]
                .strip()
                .lower()
            )


            if (

                selected_doctor == "any"

                and

                len(
                    self.state[
                        "available_doctors"
                    ]
                ) > 0

            ):

                patient["doctor"] = (

                    self.state[
                        "available_doctors"
                    ][0]["doctor"]

                )


            else:

                for doctor_data in self.state[
                    "available_doctors"
                ]:

                    actual_doctor = (
                        doctor_data["doctor"]
                    )


                    if (

                        selected_doctor
                        == actual_doctor.lower()

                        or

                        selected_doctor
                        == actual_doctor.lower().replace(
                            "dr. ",
                            ""
                        )

                    ):

                        patient["doctor"] = (
                            actual_doctor
                        )

                        break


        # =================================================
        # EXTRACT SLOT
        # =================================================

        if extracted.get("slot"):

            normalized_slot = normalize_slot(
                extracted["slot"]
            )


            if normalized_slot == "ANY":

                doc_name = patient.get(
                    "doctor"
                )


                for doc_data in self.state.get(
                    "available_doctors",
                    []
                ):

                    if (

                        doc_data["doctor"]
                        == doc_name

                        and

                        len(
                            doc_data.get(
                                "slots",
                                []
                            )
                        ) > 0

                    ):

                        patient["slot"] = (
                            doc_data["slots"][0]
                        )

                        break


            elif normalized_slot:

                patient["slot"] = (
                    normalized_slot
                )


        # =================================================
        # TRIAGE
        # =================================================

        if (

            patient["symptoms"]

            and

            patient["department"] is None

        ):

            patient["department"] = (
                self.triage.predict(
                    patient["symptoms"]
                )
            )


        # =================================================
        # GET AVAILABLE DOCTORS
        # =================================================

        if (

            patient["department"]

            and

            len(
                self.state[
                    "available_doctors"
                ]
            ) == 0

        ):

            self.state[
                "available_doctors"
            ] = (

                self.scheduler.get_available_slots(
                    patient["department"]
                )

            )


        # =================================================
        # BOOK APPOINTMENT
        # =================================================

        if (

            patient["doctor"]

            and

            patient["slot"]

            and

            patient["name"]

            and

            patient["age"]

            and

            patient["phone"]

            and

            not self.state[
                "booking_complete"
            ]

        ):

            booked = (
                self.scheduler.book_appointment(

                    patient["department"],

                    patient["doctor"],

                    patient["slot"],

                    patient["name"],

                    patient["age"],

                    patient["phone"],

                    self.user_id

                )
            )


            if booked:

                self.state[
                    "booking_complete"
                ] = True


        # =================================================
        # NEXT STAGE
        # =================================================

        self.state["stage"] = (
            get_next_stage(
                self.state
            )
        )


        # =================================================
        # CONTEXT FOR LLM
        # =================================================

        context = None


        if self.state["stage"] in [

            "SCHEDULER",

            "ASK_SLOT",

            "ASK_PHONE",

            "BOOKING_COMPLETE"

        ]:

            context = {

                "department":
                    patient["department"],

                "available_doctors":
                    self.state[
                        "available_doctors"
                    ],

                "doctor":
                    patient["doctor"],

                "slot":
                    patient["slot"],

                "name":
                    patient["name"],

                "phone":
                    patient["phone"]

            }


        # =================================================
        # GENERATE NORMAL RESPONSE
        #
        # LLM is still used here.
        # =================================================

        reply = self.generator.generate(

            self.state["stage"],

            user_message,

            self.history,

            context

        )


        # =================================================
        # SAVE CONVERSATION
        # =================================================

        self.save_conversation(
            user_message,
            reply
        )


        # =================================================
        # DEBUG
        # =================================================

        print(
            "\n========== CURRENT PATIENT STATE =========="
        )

        print(
            self.state["patient"]
        )

        print(
            "\n========== AVAILABLE DOCTORS =========="
        )

        print(
            self.state["available_doctors"]
        )

        print(
            "\nCurrent Stage :",
            self.state["stage"]
        )

        print(
            "Intent :",
            self.state["intent"]
        )

        print(
            "User ID :",
            self.user_id
        )

        print(
            "Booking Complete :",
            self.state[
                "booking_complete"
            ]
        )

        print(
            "Cancellation Requested :",
            self.state[
                "cancellation_requested"
            ]
        )

        print(
            "Cancellation Complete :",
            self.state[
                "cancellation_complete"
            ]
        )

        print(
            "===========================================\n"
        )


        return reply
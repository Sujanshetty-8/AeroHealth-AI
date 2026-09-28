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

        # Logged-in Supabase user
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
            "i want to cancel",
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


        confirmation_words = [

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
            "yes cancel"

        ]


        return text in confirmation_words


    # =====================================================
    # DETECT NEGATIVE RESPONSE
    # =====================================================

    def is_negative(self, message):

        text = message.lower().strip()


        negative_words = [

            "no",
            "nope",
            "nah",
            "don't",
            "do not",
            "keep it",
            "don't cancel"

        ]


        return text in negative_words


    # =====================================================
    # CANCELLATION FLOW
    # =====================================================

    def process_cancellation(self, user_message):

        # -------------------------------------------------
        # STEP 1: Initial cancellation request
        # -------------------------------------------------

        if not self.state["cancellation_requested"]:

            appointment = (
                self.scheduler.get_upcoming_appointment(
                    self.user_id
                )
            )


            if not appointment:

                self.state["cancellation_requested"] = False

                self.state["intent"] = "BOOK_APPOINTMENT"

                self.state["stage"] = "ASK_SYMPTOMS"


                reply = (
                    "You don't have any upcoming confirmed "
                    "appointments to cancel."
                )


                self.history.append(
                    HumanMessage(
                        content=user_message
                    )
                )

                self.history.append(
                    AIMessage(
                        content=reply
                    )
                )


                self.state["conversation"].append({
                    "user": user_message,
                    "assistant": reply
                })


                return reply


            # Save appointment
            self.state[
                "cancellation_requested"
            ] = True


            self.state[
                "cancellation_appointment"
            ] = appointment


            self.state[
                "stage"
            ] = "CANCEL_CONFIRM"


        # -------------------------------------------------
        # STEP 2: User confirms cancellation
        # -------------------------------------------------

        elif self.state["stage"] == "CANCEL_CONFIRM":

            if self.is_confirmation(
                user_message
            ):

                appointment = self.state[
                    "cancellation_appointment"
                ]


                cancelled = (
                    self.scheduler.cancel_appointment(
                        self.user_id,
                        appointment["id"]
                    )
                )


                if cancelled:

                    self.state[
                        "cancellation_complete"
                    ] = True


                    self.state[
                        "stage"
                    ] = "CANCELLATION_COMPLETE"


                else:

                    self.state[
                        "stage"
                    ] = "CANCEL_CONFIRM"


                    reply = (
                        "Sorry, I couldn't cancel "
                        "the appointment. Please try again."
                    )


                    self.history.append(
                        HumanMessage(
                            content=user_message
                        )
                    )

                    self.history.append(
                        AIMessage(
                            content=reply
                        )
                    )


                    self.state[
                        "conversation"
                    ].append({

                        "user": user_message,

                        "assistant": reply

                    })


                    return reply


            # -------------------------------------------------
            # User says NO
            # -------------------------------------------------

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


                self.history.append(
                    HumanMessage(
                        content=user_message
                    )
                )

                self.history.append(
                    AIMessage(
                        content=reply
                    )
                )


                self.state[
                    "conversation"
                ].append({

                    "user": user_message,

                    "assistant": reply

                })


                return reply


        # -------------------------------------------------
        # Generate cancellation response
        # -------------------------------------------------

        appointment = self.state[
            "cancellation_appointment"
        ]


        context = {

            "appointment": appointment

        }


        reply = self.generator.generate(

            self.state["stage"],

            user_message,

            self.history,

            context

        )


        self.history.append(
            HumanMessage(
                content=user_message
            )
        )


        self.history.append(
            AIMessage(
                content=reply
            )
        )


        self.state[
            "conversation"
        ].append({

            "user": user_message,

            "assistant": reply

        })


        return reply


    # =====================================================
    # NORMAL PROCESS
    # =====================================================

    def process(self, user_message):

        # =================================================
        # CHECK FOR CANCELLATION
        # =================================================

        if self.is_cancellation_request(
            user_message
        ):

            self.state["intent"] = "CANCEL_APPOINTMENT"

            return self.process_cancellation(
                user_message
            )


        # =================================================
        # CONTINUE CANCELLATION CONFIRMATION
        # =================================================

        if (
            self.state["cancellation_requested"]
            and self.state["stage"] == "CANCEL_CONFIRM"
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
                and len(
                    self.state["available_doctors"]
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
        # SCHEDULER
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
        # DECIDE NEXT STAGE
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
        # GENERATE RESPONSE
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

        self.history.append(

            HumanMessage(
                content=user_message
            )

        )


        self.history.append(

            AIMessage(
                content=reply
            )

        )


        self.state[
            "conversation"
        ].append({

            "user": user_message,

            "assistant": reply

        })


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
            self.state["booking_complete"]
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
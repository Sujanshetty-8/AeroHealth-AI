import json
import re
from pathlib import Path

from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)

from tools.llm import llm


class Extractor:

    def __init__(self):

        self.prompt = Path(
            "prompts/extractor.txt"
        ).read_text(encoding="utf-8")


    def extract(self, text, stage):

        # =====================================================
        # DIRECT PHONE NUMBER EXTRACTION
        # =====================================================
        # Phone numbers are deterministic, so we don't need
        # the LLM to extract them.

        if stage == "ASK_PHONE":

            # Remove spaces and hyphens
            cleaned_phone = re.sub(
                r"[\s-]",
                "",
                text
            )

            # Remove +91 if user provides Indian country code
            if cleaned_phone.startswith("+91"):
                cleaned_phone = cleaned_phone[3:]

            # Remove 91 if user writes 91XXXXXXXXXX
            elif (
                cleaned_phone.startswith("91")
                and len(cleaned_phone) == 12
            ):
                cleaned_phone = cleaned_phone[2:]

            # Check for exactly 10 digits
            if re.fullmatch(
                r"\d{10}",
                cleaned_phone
            ):

                return {
                    "name": None,
                    "age": None,
                    "phone": cleaned_phone,
                    "symptoms": None,
                    "doctor": None,
                    "slot": None
                }


        # =====================================================
        # STAGE-SPECIFIC INSTRUCTIONS
        # =====================================================

        stage_instruction = ""


        # -----------------------------
        # ASK SYMPTOMS
        # -----------------------------

        if stage == "ASK_SYMPTOMS":

            stage_instruction = """
The conversation is currently asking for symptoms.

Extract ONLY symptoms from the user's message.

Do NOT interpret the message as a patient name,
doctor, age, phone number, or appointment slot.
"""


        # -----------------------------
        # ASK NAME
        # -----------------------------

        elif stage == "ASK_NAME":

            stage_instruction = """
The conversation is currently asking for the patient's name.

Treat the user's response as the patient's name.

For example:

User:
Rahul

Output:
"name": "Rahul"

Do NOT interpret the response as a doctor name.
Do NOT interpret the response as a slot.
Do NOT interpret the response as a phone number.
"""


        # -----------------------------
        # ASK AGE
        # -----------------------------

        elif stage == "ASK_AGE":

            stage_instruction = """
The conversation is currently asking for the patient's age.

Extract ONLY the patient's age.

Do NOT interpret the response as a doctor,
phone number, or appointment slot.
"""


        # -----------------------------
        # SCHEDULER
        # -----------------------------

        elif stage == "SCHEDULER":

            stage_instruction = """
The conversation is currently asking the patient
to select a doctor.

Extract ONLY the doctor name.

Do NOT extract the doctor as the patient's name.

Do NOT extract a time as a doctor.

Do NOT extract a phone number as a doctor.
"""


        # -----------------------------
        # ASK SLOT
        # -----------------------------

        elif stage == "ASK_SLOT":

            stage_instruction = """
The conversation is currently asking the patient
to select an appointment slot.

Extract ONLY the appointment slot/time.

The user may provide the time in natural language.

Examples:

"11 AM"
"11:30 AM"
"at 4 pm"
"4 pm please"
"I want 12:30 PM"

Return the requested time exactly as mentioned
by the user.

Do NOT interpret the time as the patient's age.
Do NOT interpret the time as a doctor.
Do NOT interpret the time as a phone number.
"""


        # -----------------------------
        # ASK PHONE
        # -----------------------------

        elif stage == "ASK_PHONE":

            stage_instruction = """
The conversation is currently asking the patient
for their phone number.

Extract ONLY the phone number.

If the user provides a valid 10-digit phone number,
return it in the "phone" field.

Examples:

User:
8965741236

Output:
"phone": "8965741236"

User:
89657 41236

Output:
"phone": "8965741236"

Do NOT interpret the phone number as age.
Do NOT interpret it as a doctor.
Do NOT interpret it as an appointment slot.

If no phone number is present, return:
"phone": null
"""


        # =====================================================
        # CALL LLM
        # =====================================================

        messages = [

            SystemMessage(
                content=
                self.prompt
                + "\n\nCURRENT STAGE:\n"
                + stage
                + "\n\n"
                + stage_instruction
            ),

            HumanMessage(
                content=text
            )

        ]


        response = llm.invoke(messages)


        # =====================================================
        # DEBUG RAW RESPONSE
        # =====================================================

        print("\n========== RAW LLM RESPONSE ==========")
        print(response.content)
        print("=======================================\n")


        # =====================================================
        # PARSE JSON
        # =====================================================

        try:

            result = json.loads(
                response.content
            )

            return {
                "name": result.get("name"),
                "age": result.get("age"),
                "phone": result.get("phone"),
                "symptoms": result.get("symptoms"),
                "doctor": result.get("doctor"),
                "slot": result.get("slot")
            }


        except Exception as e:

            print(
                "\n========== JSON PARSING ERROR =========="
            )

            print(e)

            print(
                "========================================\n"
            )

            return {
                "name": None,
                "age": None,
                "phone": None,
                "symptoms": None,
                "doctor": None,
                "slot": None
            }
import json
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

        stage_instruction = ""

        if stage == "ASK_SYMPTOMS":

            stage_instruction = """
The conversation is currently asking for symptoms.

Extract ONLY symptoms from the user's message.
Do NOT interpret the message as a patient name, doctor, or slot.
"""

        elif stage == "ASK_NAME":

            stage_instruction = """
The conversation is currently asking for the patient's name.

Treat the user's response as the patient's name.

For example:
User: Rahul
Output:
"name": "Rahul"

Do NOT interpret the response as a doctor name.
Do NOT interpret the response as a slot.
"""

        elif stage == "ASK_AGE":

            stage_instruction = """
The conversation is currently asking for the patient's age.

Extract ONLY the patient's age.
Do NOT interpret the response as a doctor or slot.
"""


        #ask phone number
        elif stage == "ASK_PHONE":

            stage_instruction = """
The conversation is currently asking for the patient's phone number.

Extract ONLY the patient's phone number.

The phone number may contain spaces or hyphens.

Examples:

User: 9876543210
Output:
"phone": "9876543210"

User: 98765 43210
Output:
"phone": "9876543210"

User: my number is 98765-43210
Output:
"phone": "9876543210"

Do NOT interpret the phone number as age, doctor, or slot.
"""

        elif stage == "SCHEDULER":

            stage_instruction = """
The conversation is currently asking the patient to select a doctor.

Extract ONLY the doctor name.

Do NOT extract the doctor as the patient's name.
Do NOT extract a doctor unless the user actually selects or mentions one.
"""

        elif stage == "ASK_SLOT":

            stage_instruction = """
The conversation is currently asking the patient to select an appointment slot.

Extract ONLY the appointment slot/time.

Do NOT interpret the time as the patient's age.
Do NOT interpret the time as a doctor.
"""

        messages = [

            SystemMessage(
                content=self.prompt
                + "\n\nCURRENT STAGE:\n"
                + stage
                + "\n\n"
                + stage_instruction
            ),

            HumanMessage(content=text)

        ]

        response = llm.invoke(messages)

        try:

            return json.loads(response.content)

        except Exception:

            return {
                "name": None,
                "age": None,
                "phone": None,
                "symptoms": None,
                "doctor": None,
                "slot": None
                
            }
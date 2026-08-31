from pathlib import Path

from langchain_core.messages import (
    SystemMessage,
    HumanMessage,
)

from tools.llm import llm


class LanguageGenerator:

    def __init__(self):

        self.system_prompt = Path(
            "prompts/receptionist.txt"
        ).read_text(encoding="utf-8")

    def generate(
        self,
        stage,
        user_message,
        history,
        context=None
    ):

        context_text = ""

        if context:

            context_text = f"""
Additional Context:
{context}
"""

        # -----------------------------------
        # Stage-specific instructions
        # -----------------------------------

        stage_instruction = ""

        if stage == "ASK_SYMPTOMS":

            stage_instruction = """
The patient has not provided their symptoms yet.

ONLY ask the patient to describe their symptoms.

Do not ask about medical history.
Do not diagnose.
Do not give medical advice.
Do not ask about duration or severity unless the patient already mentioned it.
"""

        elif stage == "ASK_NAME":

            stage_instruction = """
The patient's symptoms and department have already been determined.

ONLY ask the patient for their name.

Do NOT ask about their symptoms again.
Do NOT ask medical follow-up questions.
Do NOT diagnose.
Do NOT provide medical advice.
"""

        elif stage == "ASK_AGE":

            stage_instruction = """
The patient's name has already been collected.

ONLY ask the patient for their age.

Do NOT ask about symptoms again.
Do NOT ask medical follow-up questions.
Do NOT diagnose.
Do NOT provide medical advice.
"""

        elif stage == "SCHEDULER":


            stage_instruction = """
The patient's department has been determined.

The patient has NOT selected a doctor yet.

Your ONLY task is to show the available doctors provided in
Additional Context and ask the patient which doctor they prefer.

Do NOT ask for an appointment slot yet.

Do NOT say that an appointment has been booked.

Do NOT select a doctor for the patient.

Do NOT invent doctors.

Do NOT invent slots.

Do NOT invent availability.

Only use doctors provided in Additional Context.
"""

        elif stage == "ASK_SLOT":

            stage_instruction = """
The patient has already selected a doctor.

Your ONLY task is to ask which available appointment slot
the patient prefers.

Do NOT ask the patient to select a doctor again.

Do NOT say that the appointment has already been booked.

Use ONLY the available slots provided in Additional Context.

Do NOT invent slots.

Do NOT invent doctors.
"""

        elif stage == "BOOKING_COMPLETE":

            stage_instruction = """
The patient has selected a doctor and appointment slot.

Respond briefly that the appointment can be confirmed.

Do NOT invent any doctor or slot.
"""

        system_content = f"""{self.system_prompt}

### CURRENT CONVERSATION STATE ###
Current Stage: {stage}
{context_text}

### STAGE INSTRUCTIONS ###
{stage_instruction}

### GENERAL INSTRUCTIONS ###
- Reply ONLY as the AeroHealth receptionist.
- Continue the current booking workflow.
- Do NOT change the stage.
- Do NOT diagnose the patient.
- Do NOT provide medical advice.
- Do NOT ask medical follow-up questions.
- Do NOT ask questions unrelated to the current stage.
- Keep the response short and polite.
- Never invent doctors.
- Never invent appointment slots.
- Never invent departments.
- Only use information provided in the Additional Context.
"""

        messages = [
            SystemMessage(
                content=system_content
            )
        ]

        messages.extend(history)

        messages.append(
            HumanMessage(content=user_message)
        )

        response = llm.invoke(messages)

        return response.content
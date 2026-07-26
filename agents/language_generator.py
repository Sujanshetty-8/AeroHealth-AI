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

Additional Context

{context}

"""

        prompt = f"""
Current Conversation Stage:
{stage}

Latest User Message:
{user_message}

{context_text}

Instructions:

- Reply ONLY as the AeroHealth receptionist.
- Continue the current booking workflow.
- Do NOT change the stage.
- Do NOT answer unrelated questions.
- Keep the response short and polite.

IMPORTANT:

If additional context is provided,
use it.

Never invent doctors.

Never invent appointment slots.

Never invent departments.

Only use the information provided in the context.
"""

        messages = [

            SystemMessage(content=self.system_prompt)

        ]

        messages.extend(history)

        messages.append(HumanMessage(content=prompt))

        response = llm.invoke(messages)

        return response.content
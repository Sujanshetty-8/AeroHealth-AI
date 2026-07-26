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

    def extract(self, text):

        messages = [

            SystemMessage(content=self.prompt),

            HumanMessage(content=text)

        ]

        response = llm.invoke(messages)

        try:
            return json.loads(response.content)

        except Exception:

            return {
                "name": None,
                "age": None,
                "symptoms": None
            }
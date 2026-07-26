from pathlib import Path

from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
    AIMessage,
)

from langchain_ollama import ChatOllama

from config.settings import *


class AeroHealthLLM:

    def __init__(self):

        self.model = ChatOllama(

            model=MODEL_NAME,

            temperature=TEMPERATURE

        )

    def invoke(self, messages):

        return self.model.invoke(messages)


llm = AeroHealthLLM()
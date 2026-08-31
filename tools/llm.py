from config.settings import LLM_PROVIDER, MODEL_NAME, TEMPERATURE

class AeroHealthLLM:
    def __init__(self):
        if LLM_PROVIDER == "gemini":
            from langchain_google_genai import ChatGoogleGenerativeAI
            # It will automatically pick up GOOGLE_API_KEY from env
            self.model = ChatGoogleGenerativeAI(
                model=MODEL_NAME,
                temperature=TEMPERATURE
            )
        elif LLM_PROVIDER == "groq":
            from langchain_groq import ChatGroq
            # It will automatically pick up GROQ_API_KEY from env
            self.model = ChatGroq(
                model_name=MODEL_NAME,
                temperature=TEMPERATURE
            )
        elif LLM_PROVIDER == "openai":
            from langchain_openai import ChatOpenAI
            # It will automatically pick up OPENAI_API_KEY from env
            self.model = ChatOpenAI(
                model=MODEL_NAME,
                temperature=TEMPERATURE
            )
        else:
            # Default to local ollama
            from langchain_ollama import ChatOllama
            self.model = ChatOllama(
                model=MODEL_NAME,
                temperature=TEMPERATURE
            )

    def invoke(self, messages):
        response = self.model.invoke(messages)
        # Handle cases where LangChain/Gemini returns a list of blocks instead of a string
        if hasattr(response, 'content') and isinstance(response.content, list):
            text_parts = []
            for part in response.content:
                if isinstance(part, dict) and 'text' in part:
                    text_parts.append(part['text'])
                elif isinstance(part, str):
                    text_parts.append(part)
            response.content = "".join(text_parts)
        return response

llm = AeroHealthLLM()
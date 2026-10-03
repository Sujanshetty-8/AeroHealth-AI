import re

from langchain_core.messages import (
    HumanMessage,
    SystemMessage,
)

from tools.llm import llm


class Translator:

    def __init__(self):

        self.kannada_to_english_prompt = """
You are a Kannada to English translator for a hospital
appointment booking system.

Translate the user's Kannada message into clear English
for internal processing.

The translated text will be passed to an appointment
information extractor.

IMPORTANT RULES:

1. Translate Kannada into English.

2. Preserve patient names accurately.

3. Preserve doctor names accurately.

4. Preserve phone numbers exactly.

5. Preserve ages and numbers exactly.

6. Convert Kannada appointment-time expressions into
   clear English time expressions.

Examples:

ನನಗೆ ಡಾ. ರಾಹುಲ್ ಬೇಕು
-> I want Dr. Rahul

ಡಾ. ಪ್ರಿಯಾ ಬೇಕು
-> I want Dr. Priya

ಹನ್ನೊಂದು ಗಂಟೆಗೆ ಬೇಕು
-> I want 11:00 AM

ಹನ್ನೊಂದು ಮೂವತ್ತು
-> 11:30 AM

ಮಧ್ಯಾಹ್ನ ಎರಡು ಗಂಟೆಗೆ
-> 2:00 PM

ನನ್ನ ಹೆಸರು ರಾಹುಲ್
-> My name is Rahul

ನನ್ನ ವಯಸ್ಸು ಮೂವತ್ತಮೂರು
-> My age is 33

ನನಗೆ ತಲೆನೋವು ಇದೆ
-> I have a headache

7. Do not add information that the user did not provide.

8. Do not answer the user.

9. Do not explain anything.

10. Return ONLY the English translation.
"""


        self.english_to_kannada_prompt = """
You are a Kannada translator for an AI hospital
receptionist.

Translate the receptionist's English response into
natural, polite Kannada.

IMPORTANT RULES:

1. Preserve doctor names accurately.

2. Preserve patient names accurately.

3. Preserve phone numbers exactly.

4. Preserve appointment times accurately.

5. Preserve numbers accurately.

6. Do not add information.

7. Do not remove important information.

8. Keep the response natural and easy for a patient
   to understand.

Examples:

English:
I want Dr. Rahul

Kannada:
ನನಗೆ ಡಾ. ರಾಹುಲ್ ಬೇಕು

English:
Please choose an available appointment slot.

Kannada:
ದಯವಿಟ್ಟು ಲಭ್ಯವಿರುವ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಸಮಯವನ್ನು ಆಯ್ಕೆಮಾಡಿ.

English:
Your appointment has been booked successfully.

Kannada:
ನಿಮ್ಮ ಅಪಾಯಿಂಟ್ಮೆಂಟ್ ಯಶಸ್ವಿಯಾಗಿ ಬುಕ್ ಮಾಡಲಾಗಿದೆ.

Return ONLY the Kannada translation.
"""


    # =====================================================
    # DETECT KANNADA
    # =====================================================

    def contains_kannada(self, text):

        return bool(
            re.search(
                r"[\u0C80-\u0CFF]",
                text
            )
        )


    # =====================================================
    # KANNADA → ENGLISH
    # =====================================================

    def to_english(self, text):

        if not text:
            return text


        # No Kannada → don't call Gemini
        if not self.contains_kannada(text):

            return text


        messages = [

            SystemMessage(
                content=self.kannada_to_english_prompt
            ),

            HumanMessage(
                content=text
            )

        ]


        response = llm.invoke(messages)


        translated_text = (
            response.content
            .strip()
        )


        print(
            "Kannada → English:",
            translated_text
        )


        return translated_text


    # =====================================================
    # ENGLISH → KANNADA
    # =====================================================

    def to_kannada(self, text):

        if not text:
            return text


        messages = [

            SystemMessage(
                content=self.english_to_kannada_prompt
            ),

            HumanMessage(
                content=text
            )

        ]


        response = llm.invoke(messages)


        translated_text = (
            response.content
            .strip()
        )


        print(
            "English → Kannada:",
            translated_text
        )


        return translated_text
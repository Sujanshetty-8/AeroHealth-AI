import re

# Keywords related to hospital/reception work
HOSPITAL_KEYWORDS = [
    "appointment",
    "book",
    "doctor",
    "hospital",
    "clinic",
    "patient",
    "fever",
    "cold",
    "cough",
    "headache",
    "pain",
    "chest",
    "heart",
    "stomach",
    "vomit",
    "nausea",
    "medicine",
    "symptom",
    "consult",
    "department",
    "cardiology",
    "neurology",
    "orthopedic",
    "dermatology",
    "age",
    "name"
]

# Obvious non-hospital topics
BLOCKED_KEYWORDS = [
    "python",
    "java",
    "c++",
    "javascript",
    "program",
    "code",
    "algorithm",
    "leetcode",
    "html",
    "css",
    "sql",
    "resume",
    "movie",
    "joke",
    "song",
    "football",
    "cricket",
    "bitcoin",
    "politics",
    "translate",
    "essay"
]


def is_hospital_query(message: str) -> bool:

    msg = message.lower()

    # Explicitly block obvious unrelated topics
    for word in BLOCKED_KEYWORDS:
        if re.search(rf"\b{re.escape(word)}\b", msg):
            return False

    # Allow hospital-related topics
    for word in HOSPITAL_KEYWORDS:
        if re.search(rf"\b{re.escape(word)}\b", msg):
            return True

    # Short replies during an active conversation
    if len(msg.split()) <= 4:
        return True

    return False
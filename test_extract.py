from agents.extractor import Extractor

extractor = Extractor()

tests = [

    "My name is Sujan",

    "I am 22 years old",

    "I have chest pain",

    "I want Dr. Priya",

    "11 AM works for me",

    "I want Dr. Rahul at 3 PM"

]

for text in tests:

    print("\nUSER:", text)

    print("EXTRACTED:", extractor.extract(text))
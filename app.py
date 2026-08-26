from graph.conversation_manager import ConversationManager
from services.slot_generator import SlotGenerator


# --------------------------------
# Generate today's appointment slots
# --------------------------------

slot_generator = SlotGenerator()
slot_generator.generate_today_slots()


# --------------------------------
# Start conversation
# --------------------------------

manager = ConversationManager()
print("="*50)
print("AeroHealth AI")
print("="*50)

while True:

    user = input("\nYou : ")

    if user.lower() == "exit":
        break

    reply = manager.process(user)

    print("\nReceptionist :", reply)
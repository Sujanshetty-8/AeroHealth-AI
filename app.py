from graph.conversation_manager import ConversationManager
from tools.guard import is_hospital_query

manager = ConversationManager()

print("="*50)
print("AeroHealth AI")
print("="*50)

while True:

    user=input("\nYou : ")

    if user=="exit":

        break

    if not is_hospital_query(user):

        print(

            "\nReceptionist :",

            "I'm sorry, I can only assist with hospital-related services."

        )

        continue

    reply=manager.process(user)

    print("\nReceptionist :",reply)
from services.slot_generator import SlotGenerator

generator = SlotGenerator()

print("Generating today's slots...")

generator.generate_today_slots()

print("Done.")
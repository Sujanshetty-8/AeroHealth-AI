from graph.state import ConversationState


def get_next_stage(state: ConversationState):

    patient = state["patient"]

    if patient["symptoms"] is None:
        return "ASK_SYMPTOMS"

    if patient["name"] is None:
        return "ASK_NAME"

    if patient["age"] is None:
        return "ASK_AGE"

    if patient["department"] is None:
        return "TRIAGE"

    if patient["doctor"] is None:
        return "SCHEDULER"

    if patient["slot"] is None:
        return "ASK_SLOT"

    if patient["phone"] is None:
        return "ASK_PHONE"

    if state["booking_complete"]:
        return "BOOKING_COMPLETE"

    return "ASK_PHONE"


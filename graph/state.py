from typing import TypedDict, List, Optional


class Patient(TypedDict):
    name: Optional[str]
    age: Optional[int]
    phone: Optional[str]
    symptoms: Optional[str]
    department: Optional[str]
    doctor: Optional[str]
    slot: Optional[str]


class ConversationState(TypedDict):
    conversation: List[str]

    stage: str

    intent: Optional[str]

    patient: Patient

    booking_complete: bool
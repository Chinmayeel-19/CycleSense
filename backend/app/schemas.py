from datetime import date, datetime
from pydantic import BaseModel, Field
from typing import Optional
class RegisterRequest(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    email: str
    password: str = Field(..., min_length=8, max_length=72)
    age: Optional[int] = Field(default=None, ge=1, le=120)
    preferred_language: str = "English"


class LoginRequest(BaseModel):
    email: str
    password: str

class UserProfileCreate(BaseModel):
    name: str = Field(..., min_length=1, max_length=100)
    age: Optional[int] = Field(default=None, ge=1, le=120)
    preferred_language: str = "English"


class UserProfileResponse(BaseModel):
    id: int
    name: str
    age: Optional[int] = None
    preferred_language: str

    class Config:
        from_attributes = True


from datetime import date, datetime


class MenstrualRecordCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    period_start_date: date
    period_end_date: Optional[date] = None
    notes: Optional[str] = None


class MenstrualRecordResponse(BaseModel):
    id: int
    user_id: int
    period_start_date: date
    period_end_date: Optional[date] = None
    cycle_length: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class DailyHealthLogCreate(BaseModel):
    user_id: int = Field(..., gt=0)
    log_date: date
    symptoms: Optional[str] = None
    pain_level: Optional[int] = Field(default=None, ge=0, le=10)
    mood: Optional[str] = None
    sleep_hours: Optional[float] = Field(default=None, ge=0, le=24)
    water_intake_liters: Optional[float] = Field(default=None, ge=0, le=20)
    physical_activity_minutes: Optional[int] = Field(default=None, ge=0)
    notes: Optional[str] = None


class DailyHealthLogResponse(BaseModel):
    id: int
    user_id: int
    log_date: date
    symptoms: Optional[str] = None
    pain_level: Optional[int] = None
    mood: Optional[str] = None
    sleep_hours: Optional[float] = None
    water_intake_liters: Optional[float] = None
    physical_activity_minutes: Optional[int] = None
    notes: Optional[str] = None

    class Config:
        from_attributes = True

class PeriodReflectionCreate(BaseModel):
    energy: Optional[str] = None
    cramps: Optional[str] = None
    flow: Optional[str] = None
    mood: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    notes: Optional[str] = None


class PeriodReflectionResponse(BaseModel):
    id: int
    user_id: int
    energy: Optional[str] = None
    cramps: Optional[str] = None
    flow: Optional[str] = None
    mood: Optional[str] = None
    symptoms: list[str] = Field(default_factory=list)
    notes: Optional[str] = None
    recorded_at: Optional[datetime] = None

    class Config:
        from_attributes = True
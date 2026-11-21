
from sqlalchemy import Column, Integer, String, Date, DateTime, Float, ForeignKey, Text
from sqlalchemy.orm import relationship
from datetime import datetime

from app.database import Base


class UserProfile(Base):
    __tablename__ = "user_profiles"

    id = Column(Integer, primary_key=True, index=True)
    email = Column(String(255), nullable=True)
    password_hash = Column(String(255), nullable=True) 
    name = Column(String(100), nullable=False)
    age = Column(Integer, nullable=True)
    preferred_language = Column(String(20), default="English")
    created_at = Column(DateTime, default=datetime.utcnow)

    menstrual_records = relationship(
        "MenstrualRecord",
        back_populates="user",
        cascade="all, delete-orphan"
    )

    daily_logs = relationship(
        "DailyHealthLog",
        back_populates="user",
        cascade="all, delete-orphan"
    )
    period_reflections = relationship(
        "PeriodReflection",
        back_populates="user",
        cascade="all, delete-orphan"
    )


class MenstrualRecord(Base):
    __tablename__ = "menstrual_records"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    period_start_date = Column(Date, nullable=False)
    period_end_date = Column(Date, nullable=True)
    cycle_length = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("UserProfile", back_populates="menstrual_records")


class DailyHealthLog(Base):
    __tablename__ = "daily_health_logs"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)
    log_date = Column(Date, nullable=False)
    symptoms = Column(Text, nullable=True)
    pain_level = Column(Integer, nullable=True)
    mood = Column(String(50), nullable=True)
    sleep_hours = Column(Float, nullable=True)
    water_intake_liters = Column(Float, nullable=True)
    physical_activity_minutes = Column(Integer, nullable=True)
    notes = Column(Text, nullable=True)

    user = relationship("UserProfile", back_populates="daily_logs")
class PeriodReflection(Base):
    __tablename__ = "period_reflections"

    id = Column(Integer, primary_key=True, index=True)
    user_id = Column(Integer, ForeignKey("user_profiles.id"), nullable=False)

    energy = Column(String(30), nullable=True)
    cramps = Column(String(30), nullable=True)
    flow = Column(String(30), nullable=True)
    mood = Column(String(30), nullable=True)
    symptoms = Column(Text, nullable=True)
    notes = Column(Text, nullable=True)

    recorded_at = Column(DateTime, default=datetime.utcnow)

    user = relationship("UserProfile", back_populates="period_reflections")

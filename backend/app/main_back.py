
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session

from database import Base, engine, SessionLocal
from models import UserProfile, MenstrualRecord, DailyHealthLog
from schemas import (
    UserProfileCreate,
    UserProfileResponse,
    MenstrualRecordCreate,
    MenstrualRecordResponse,
    DailyHealthLogCreate,
    DailyHealthLogResponse
)

Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Women's Health AI",
    description="AI-Based Longitudinal Women's Health Monitoring System",
    version="1.0.0"
)


def get_db():
    db = SessionLocal()
    try:
        yield db
    finally:
        db.close()


@app.get("/")
def home():
    return {"message": "Women's Health AI Backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "configured"}


@app.post("/users/", response_model=UserProfileResponse, status_code=201)
def create_user(
    user: UserProfileCreate,
    db: Session = Depends(get_db)
):
    new_user = UserProfile(
        name=user.name,
        age=user.age,
        preferred_language=user.preferred_language
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return new_user


@app.get("/users/", response_model=list[UserProfileResponse])
def get_users(db: Session = Depends(get_db)):
    return db.query(UserProfile).order_by(UserProfile.id).all()


@app.get("/users/{user_id}", response_model=UserProfileResponse)
def get_user(user_id: int, db: Session = Depends(get_db)):
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return user

@app.post(
    "/menstrual-records/",
    response_model=MenstrualRecordResponse,
    status_code=201
)
def create_menstrual_record(
    record: MenstrualRecordCreate,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(
        UserProfile.id == record.user_id
    ).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    if (
        record.period_end_date is not None
        and record.period_end_date < record.period_start_date
    ):
        raise HTTPException(
            status_code=422,
            detail="Period end date cannot be before start date"
        )

    previous_record = (
        db.query(MenstrualRecord)
        .filter(MenstrualRecord.user_id == record.user_id)
        .filter(
            MenstrualRecord.period_start_date < record.period_start_date
        )
        .order_by(MenstrualRecord.period_start_date.desc())
        .first()
    )

    cycle_length = None
    if previous_record is not None:
        cycle_length = (
            record.period_start_date - previous_record.period_start_date
        ).days

    new_record = MenstrualRecord(
        user_id=record.user_id,
        period_start_date=record.period_start_date,
        period_end_date=record.period_end_date,
        cycle_length=cycle_length,
        notes=record.notes
    )

    db.add(new_record)
    db.commit()
    db.refresh(new_record)

    return new_record


@app.get(
    "/users/{user_id}/menstrual-records/",
    response_model=list[MenstrualRecordResponse]
)
def get_menstrual_records(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if user is None:
        raise HTTPException(status_code=404, detail="User not found")

    return (
        db.query(MenstrualRecord)
        .filter(MenstrualRecord.user_id == user_id)
        .order_by(MenstrualRecord.period_start_date.desc())
        .all()
    )
@app.post(
    "/daily-logs/",
    response_model=DailyHealthLogResponse,
    status_code=201
)
def create_daily_log(
    log: DailyHealthLogCreate,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(
        UserProfile.id == log.user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    new_log = DailyHealthLog(
        user_id=log.user_id,
        log_date=log.log_date,
        symptoms=log.symptoms,
        pain_level=log.pain_level,
        mood=log.mood,
        sleep_hours=log.sleep_hours,
        water_intake_liters=log.water_intake_liters,
        physical_activity_minutes=log.physical_activity_minutes,
        notes=log.notes
    )

    db.add(new_log)
    db.commit()
    db.refresh(new_log)

    return new_log


@app.get(
    "/users/{user_id}/daily-logs/",
    response_model=list[DailyHealthLogResponse]
)
def get_daily_logs(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    return (
        db.query(DailyHealthLog)
        .filter(DailyHealthLog.user_id == user_id)
        .order_by(DailyHealthLog.log_date.desc())
        .all()
    )

@app.get("/users/{user_id}/health-summary/")
def get_health_summary(
    user_id: int,
    db: Session = Depends(get_db)
):
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    menstrual_records = (
        db.query(MenstrualRecord)
        .filter(MenstrualRecord.user_id == user_id)
        .order_by(MenstrualRecord.period_start_date.desc())
        .all()
    )

    daily_logs = (
        db.query(DailyHealthLog)
        .filter(DailyHealthLog.user_id == user_id)
        .order_by(DailyHealthLog.log_date.desc())
        .all()
    )

    return {
        "user": {
            "id": user.id,
            "name": user.name,
            "age": user.age,
            "preferred_language": user.preferred_language
        },
        "total_menstrual_records": len(menstrual_records),
        "total_daily_logs": len(daily_logs),
        "menstrual_records": [
            {
                "period_start_date": str(record.period_start_date),
                "period_end_date": (
                    str(record.period_end_date)
                    if record.period_end_date else None
                ),
                "cycle_length": record.cycle_length,
                "notes": record.notes
            }
            for record in menstrual_records
        ],
        "daily_logs": [
            {
                "log_date": str(log.log_date),
                "symptoms": log.symptoms,
                "pain_level": log.pain_level,
                "mood": log.mood,
                "sleep_hours": log.sleep_hours,
                "water_intake_liters": log.water_intake_liters,
                "physical_activity_minutes": (
                    log.physical_activity_minutes
                ),
                "notes": log.notes
            }
            for log in daily_logs
        ]
    }


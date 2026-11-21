import json
from fastapi import FastAPI, Depends, HTTPException
from sqlalchemy.orm import Session
from app.database import get_db
from fastapi.middleware.cors import CORSMiddleware
from fastapi.security import HTTPBearer, HTTPAuthorizationCredentials
from sqlalchemy import or_

from app.schemas import (
    RegisterRequest,
    LoginRequest,
    UserProfileCreate,
    UserProfileResponse,
    MenstrualRecordCreate,
    MenstrualRecordResponse,
    PeriodReflectionCreate,
    PeriodReflectionResponse,
    DailyHealthLogCreate,
    DailyHealthLogResponse
)

from app.auth_utils import (
    hash_password,
    verify_password,
    create_access_token,
    decode_access_token
)

from app.database import Base, engine, SessionLocal
from app.models import (
    UserProfile,
    MenstrualRecord,
    DailyHealthLog,
    PeriodReflection
)
from app.cycle_analysis import analyze_menstrual_cycle
Base.metadata.create_all(bind=engine)

app = FastAPI(
    title="Women's Health AI",
    description="AI-Based Longitudinal Women's Health Monitoring System",
    version="1.0.0"
)
security = HTTPBearer()

def get_current_user(
    credentials: HTTPAuthorizationCredentials = Depends(security),
    db: Session = Depends(get_db)
):
    user_id = decode_access_token(credentials.credentials)

    if user_id is None:
        raise HTTPException(
            status_code=401,
            detail="Invalid or expired token"
        )

    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if user is None:
        raise HTTPException(
            status_code=401,
            detail="User not found"
        )

    return user
@app.post("/auth/register")
def register_user(data: RegisterRequest, db: Session = Depends(get_db)):

    existing_user = db.query(UserProfile).filter(
        UserProfile.email == data.email.lower()
    ).first()

    if existing_user:
        raise HTTPException(
            status_code=400,
            detail="Email is already registered"
        )

    if "@" not in data.email:
        raise HTTPException(
            status_code=400,
            detail="Invalid email address"
        )

    new_user = UserProfile(
        name=data.name,
        email=data.email.lower(),
        password_hash=hash_password(data.password),
        age=data.age,
        preferred_language=data.preferred_language
    )

    db.add(new_user)
    db.commit()
    db.refresh(new_user)

    return {
        "message": "Registration successful",
        "user_id": new_user.id,
        "name": new_user.name,
        "email": new_user.email
    }


@app.post("/auth/login")
def login_user(data: LoginRequest, db: Session = Depends(get_db)):

    user = db.query(UserProfile).filter(
        UserProfile.email == data.email.lower()
    ).first()

    if not user or not user.password_hash:
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    if not verify_password(data.password, user.password_hash):
        raise HTTPException(
            status_code=401,
            detail="Invalid email or password"
        )

    token = create_access_token(user.id)

    return {
        "message": "Login successful",
        "access_token": token,
        "token_type": "bearer",
        "user": {
            "id": user.id,
            "name": user.name,
            "email": user.email
        }
    }
app.add_middleware(
    CORSMiddleware,
    allow_origins=[
        "http://localhost:5173",
        "http://127.0.0.1:5173",
        "http://localhost:5174",
        "http://127.0.0.1:5174"
    ],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)


@app.get("/")
def home():
    return {"message": "Women's Health AI Backend is running!"}


@app.get("/health")
def health_check():
    return {"status": "healthy", "database": "configured"}

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
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if record.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot add records for another user"
        )
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
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's menstrual records"
    )
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
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if log.user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot add logs for another user"
        )
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
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's daily logs"
        )
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
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's health summary"
        )
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

@app.get("/users/{user_id}/cycle-analysis/")
def get_cycle_analysis(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's cycle analysis"
        )

    # Check whether the user exists
    user = db.query(UserProfile).filter(
        UserProfile.id == user_id
    ).first()

    if not user:
        raise HTTPException(
            status_code=404,
            detail="User not found"
        )

    # Get the user's menstrual records
    records = db.query(MenstrualRecord).filter(
        MenstrualRecord.user_id == user_id
    ).order_by(
        MenstrualRecord.period_start_date.asc()
    ).all()

    # Extract period start dates
    period_dates = [
        record.period_start_date.isoformat()
        for record in records
    ]

    # Perform cycle analysis
    result = analyze_menstrual_cycle(period_dates)

    return {
        "user_id": user_id,
        "user_name": user.name,
        "cycle_analysis": result
    }
# PERIOD REFLECTION ENDPOINTS

@app.post(
    "/users/{user_id}/period-reflection/",
    response_model=PeriodReflectionResponse,
    status_code=201
)
def save_period_reflection(
    user_id: int,
    data: PeriodReflectionCreate,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot save another user's reflection"
        )

    reflection = PeriodReflection(
        user_id=user_id,
        energy=data.energy,
        cramps=data.cramps,
        flow=data.flow,
        mood=data.mood,
        symptoms=json.dumps(data.symptoms),
        notes=data.notes
    )

    db.add(reflection)
    db.commit()
    db.refresh(reflection)

    return {
        "id": reflection.id,
        "user_id": reflection.user_id,
        "energy": reflection.energy,
        "cramps": reflection.cramps,
        "flow": reflection.flow,
        "mood": reflection.mood,
        "symptoms": data.symptoms,
        "notes": reflection.notes,
        "recorded_at": reflection.recorded_at
    }


@app.get(
    "/users/{user_id}/period-reflection/",
    response_model=PeriodReflectionResponse
)
def get_period_reflection(
    user_id: int,
    db: Session = Depends(get_db),
    current_user: UserProfile = Depends(get_current_user)
):
    if user_id != current_user.id:
        raise HTTPException(
            status_code=403,
            detail="You cannot access another user's reflection"
        )

    reflection = (
        db.query(PeriodReflection)
        .filter(PeriodReflection.user_id == user_id)
        .order_by(PeriodReflection.recorded_at.desc())
        .first()
    )

    if reflection is None:
        raise HTTPException(
            status_code=404,
            detail="No period reflection found"
        )

    return {
        "id": reflection.id,
        "user_id": reflection.user_id,
        "energy": reflection.energy,
        "cramps": reflection.cramps,
        "flow": reflection.flow,
        "mood": reflection.mood,
        "symptoms": json.loads(reflection.symptoms or "[]"),
        "notes": reflection.notes,
        "recorded_at": reflection.recorded_at
    }


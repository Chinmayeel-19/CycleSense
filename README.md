# 🌸 CycleSense

### AI-Based Longitudinal Women's Health Monitoring and Risk-Assessment System

<p align="center">
  <strong>Track • Understand • Monitor</strong>
</p>

CycleSense is an ongoing full-stack women's health monitoring application designed to help users record menstrual cycles, maintain daily health journals, and understand their health patterns over time.

**Project Status: 🚧 Work in Progress**

This project is actively being developed as my final-year B.E. Artificial Intelligence and Machine Learning major project.

---

## 🎯 Project Objective

The goal of CycleSense is to provide a centralized platform for menstrual health tracking and longitudinal health monitoring, with future plans to integrate AI-based health insights.

## ✨ Features

### Implemented

- User registration and login.
- JWT-based authentication.
- Menstrual cycle tracking and record management.
- Daily health and symptom journaling.
- Cycle history and cycle-length analysis.
- Health data storage using SQLite and SQLAlchemy.
- REST API integration between frontend and backend.

### Under Development / Planned

- Advanced AI-based health insights.
- Longitudinal health pattern analysis.
- Risk-assessment features.
- Personalized health recommendations.
- Enhanced AI-powered health assistant.

---

## 🛠️ Technology Stack

| Component | Technologies |
|---|---|
| Frontend | React.js, HTML, CSS, JavaScript |
| Backend | Python, FastAPI |
| Database | SQLite |
| ORM | SQLAlchemy |
| Authentication | JWT, bcrypt |
| API | REST APIs |
| Development Tools | VS Code, Git, GitHub |

---

## 📁 Project Structure

```text
CycleSense/
├── backend/
│   ├── app/
│   │   ├── auth_utils.py
│   │   ├── cycle_analysis.py
│   │   ├── database.py
│   │   ├── main.py
│   │   ├── models.py
│   │   └── schemas.py
│   └── requirements.txt
│
├── frontend/
│   ├── public/
│   ├── src/
│   │   ├── App.jsx
│   │   ├── App.css
│   │   ├── Auth.jsx
│   │   ├── DailyJournal.jsx
│   │   └── DailyJournal.css
│   ├── package.json
│   └── vite.config.js
│
└── .gitignore
```
---

## 🚀 How to Run the Project Locally

### Prerequisites

- Python 3.10 or later
- Node.js and npm
- Git

### 1. Clone the Repository

```bash
git clone https://github.com/Chinmayeel-19/CycleSense.git
cd CycleSense
```

### 2. Start the Backend

Open a terminal:

```bash
cd backend
```

Install the required Python packages:

```bash
pip install -r requirements.txt
```

Start the FastAPI server:

```bash
python -m uvicorn app.main:app --reload
```

Backend API: http://127.0.0.1:8000

API Documentation: http://127.0.0.1:8000/docs

### 3. Start the Frontend

Open a second terminal from the project root:

```bash
cd frontend
npm install
npm run dev
```

Open the local URL displayed in your terminal, usually:

http://localhost:5173

### 4. Access the Application

1. Open the frontend URL in your browser.
2. Register a new account using a test email and password.
3. Log in using the account you created.
4. Explore the dashboard and available health-tracking features.

---

## 🔐 Authentication and Data Privacy

- User authentication is implemented using JWT.
- Passwords are protected using password hashing.
- User data is stored in a local SQLite database.
- Database files and personal credentials are excluded from this public repository.

Use test information when exploring the application. CycleSense is currently a development prototype and is not intended to replace professional medical advice.

---

## 📸 Application Preview

Screenshots of the login page, dashboard, cycle tracker, and health journal will be added as development progresses.

---

## 🔮 Future Enhancements

- AI-powered longitudinal health analysis.
- Machine learning-based risk assessment.
- Personalized health insights.
- Improved user experience and visualizations.
- Deployment for public demonstration.

---

## 👩‍💻 Developer

**Chinmayee Lokesh**

B.E. Artificial Intelligence and Machine Learning | 2027

- GitHub: https://github.com/Chinmayeel-19
- LinkedIn: https://www.linkedin.com/in/chinmayee-lokesh-b174b3396/

---

⭐ This project is actively under development. Suggestions and feedback are welcome.


**Note:** Both the frontend and backend must be running for the application to work correctly.

*Planned features are not yet implemented and are subject to development and validation.*
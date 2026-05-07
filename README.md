# Aurora ERP

A modern, role-based academic management system designed to be fast, professional, and scalable.

## Project Structure
- `frontend/`: Next.js 15 application (React, Tailwind CSS)
- `backend/`: NestJS backend API (TypeScript, Prisma)

---

## 🚀 Quick Setup & Run Guide

To test the application locally, you must run both the backend API and the frontend application simultaneously.

### 1. Start the Backend API
The backend currently runs on a "mock" mode, bypassing the database, so no PostgreSQL setup is required yet.
```bash
cd backend
npm install
npm run start:dev
```
*The backend will run on `http://localhost:3001`.*

### 2. Start the Frontend
Open a **new terminal window** and run the frontend:
```bash
cd frontend
npm install
npm run dev
```
*The frontend will run on `http://localhost:3000`.*

---

## 🔐 Mock Login Credentials

The application currently uses a mock authentication bypass to allow UI testing without a database. You can log in as any of the three roles using the following credentials:

| Role | Username (Email) | Password |
| :--- | :--- | :--- |
| **Admin** | `admin@aurora.ac.in` | `password123` |
| **Faculty** | `faculty@aurora.ac.in` | `password123` |
| **Student** | `student@aurora.ac.in` | `password123` |

> [!WARNING]  
> If you encounter an **"Invalid credentials"** or **"Cannot connect to the server"** error, it means your **backend API is not running**. Please ensure you have the backend running in a separate terminal.

---

## 🎨 UI/UX Features
- **Enterprise Monochromatic Theme**: Professional Indigo (`#4f46e5`) and white layout.
- **Role-Based Routing**: Secure redirects based on the logged-in user.
- **Hydration Safe**: Fully compatible with browser extensions and password managers.

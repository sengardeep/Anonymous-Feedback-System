# Anonymous Feedback System

A full-stack anonymous feedback app where creators can:

- Sign up and sign in
- Create feedback forms
- Share public form links
- Collect anonymous responses
- View all responses for their own forms

## Tech Stack

### Backend
- Node.js
- Express
- MongoDB + Mongoose
- JWT (authentication)
- bcrypt (password hashing)
- zod (request validation)
- cors
- dotenv

### Frontend
- Vanilla HTML/CSS/JavaScript
- Multi-page UI:
  - `frontend/index.html` (login/signup)
  - `frontend/create.html` (dashboard)
  - `frontend/form.html` (public anonymous feedback page)

## Project Structure

```text
Anonymous Feedback System/
  backend/
    db.js
    index.js
    package.json
    test_api.js
    middleware/
      auth.js
  frontend/
    create.html
    form.html
    index.html
    script.js
    style.css
```

## How It Works

1. User signs up with email/password.
2. User signs in and receives a JWT token.
3. User creates a form title from dashboard.
4. App generates a public URL like `form.html?id=<formId>`.
5. Anyone with that link submits anonymous text feedback.
6. Form owner (authenticated) can fetch all feedback for that form.


## Local Setup

## Prerequisites

- Node.js 18+
- MongoDB (local or cloud)

### 1. Install backend dependencies

```bash
cd backend
npm install
```

### 2. Configure environment

Create `backend/.env`:

```env
MONGODB_URI=mongodb://127.0.0.1:27017/anonymous_feedback
JWT_SECRET=replace_with_a_strong_secret
```

### 3. Start server

```bash
npm run dev
```

Server starts at `http://localhost:3000` and serves frontend pages automatically.

## Running the App

Open:
- `http://localhost:3000/` -> login/signup page
- After login -> dashboard at `create.html`
- Public feedback links -> `form.html?id=<formId>`

Important:
- Prefer opening through backend (`localhost:3000`).
- Opening frontend files directly via `file://` can break auth/navigation due to browser origin restrictions.



## Current Scripts

In `backend/package.json`:

- `npm run dev` -> runs `nodemon index.js`
- `npm test` -> placeholder (not implemented)

## Security and Production Notes

- The backend currently allows `cors({ origin: "*" })`.
- Replace permissive CORS with allowed frontend domain(s) in production.
- Never use the fallback JWT secret in production.
- Add rate limiting and stricter security headers before deployment.

## Future Improvements

- Add form deletion/editing
- Add pagination for feedback
- Add automated tests (Jest/Supertest)
- Add Docker setup
- Improve error shape consistency across all endpoints

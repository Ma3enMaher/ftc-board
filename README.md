# FTC Board - Team Task Management System

A full-featured task management system built with Next.js and Firebase for FTC (First Tech Challenge) teams.

## Tech Stack

- **Frontend**: Next.js (Pages Router)
- **Backend**: Firebase (Authentication + Firestore)
- **Styling**: CSS-in-JS (Inline Styles)
- **Language**: TypeScript

## Features

### Role-Based Access Control
- **Admin**: Full access to manage committees and users
- **Leader**: Create and manage tasks for their committee
- **Member**: View and submit tasks assigned to their committee

### Committee Management
- Create/edit/delete committees
- Assign leaders to committees
- View committee members

### Task Management
- Create tasks with title, description, and deadline
- Tasks are scoped to committees
- View submission status and submissions

### Submissions
- Members can submit text answers
- Optional file URL attachment
- Edit submissions before deadline

## Project Structure

```
ftc-board/
├── components/          # Reusable UI components
│   ├── Button.tsx
│   ├── Card.tsx
│   ├── Input.tsx
│   ├── Layout.tsx
│   ├── Modal.tsx
│   └── ProtectedRoute.tsx
├── contexts/            # React Context providers
│   └── AuthContext.tsx
├── lib/                 # Firebase and Firestore utilities
│   ├── firebase.ts
│   └── firestore.ts
├── pages/               # Next.js Pages (file-based routing)
│   ├── _app.tsx         # App wrapper with AuthProvider
│   ├── index.tsx        # Login/Signup page
│   ├── dashboard.tsx    # Dynamic dashboard
│   ├── admin/           # Admin pages
│   ├── leader/          # Leader pages
│   └── member/          # Member pages
├── styles/              # Global styles
├── types/               # TypeScript type definitions
└── .env.local           # Environment variables
```

## Getting Started

### 1. Create Firebase Project

1. Go to [Firebase Console](https://console.firebase.google.com/)
2. Create a new project
3. Enable **Authentication** (Email/Password provider)
4. Enable **Firestore Database**
5. Create a Web App and copy the config values

### 2. Configure Environment Variables

```bash
cp .env.local.example .env.local
```

Edit `.env.local` with your Firebase credentials:
```env
NEXT_PUBLIC_FIREBASE_API_KEY=your_api_key
NEXT_PUBLIC_FIREBASE_AUTH_DOMAIN=your_project.firebaseapp.com
NEXT_PUBLIC_FIREBASE_PROJECT_ID=your_project_id
NEXT_PUBLIC_FIREBASE_STORAGE_BUCKET=your_project.appspot.com
NEXT_PUBLIC_FIREBASE_MESSAGING_SENDER_ID=your_sender_id
NEXT_PUBLIC_FIREBASE_APP_ID=your_app_id
```

### 3. Set Up Firestore Security Rules

Go to Firebase Console > Firestore Database > Rules and add:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // Users can read their own data
    match /users/{userId} {
      allow read: if request.auth != null;
      allow write: if request.auth.uid == userId ||
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Committees - admin can manage
    match /committees/{committeeId} {
      allow read: if request.auth != null;
      allow write: if request.auth != null &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }

    // Tasks - leaders can manage their committee's tasks
    match /tasks/{taskId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'leader';
      allow update, delete: if request.auth != null &&
                    get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role in ['leader', 'admin'];
    }

    // Submissions - members can submit to their committee
    match /submissions/{submissionId} {
      allow read: if request.auth != null;
      allow create: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
      allow update: if request.auth != null &&
                    request.auth.uid == resource.data.userId;
    }
  }
}
```

### 4. Install and Run

```bash
npm install
npm run dev
```

Visit http://localhost:3000

## Creating Demo Users

Since Firebase Auth doesn't allow programmatic user creation without Admin SDK, create users through the signup page, then manually update their roles in Firestore:

1. Sign up with email/password
2. Go to Firestore Console
3. Find the user document in `users` collection
4. Update `role` field to "admin", "leader", or "member"
5. Set `committeeId` to a committee's ID (optional)

## Firestore Collections

### users
```json
{
  "id": "firebase_uid",
  "name": "John Doe",
  "email": "john@example.com",
  "role": "member",
  "committeeId": "committee_id_or_null",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### committees
```json
{
  "id": "auto_generated",
  "name": "Marketing",
  "description": "Marketing team",
  "leaderId": "user_id",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### tasks
```json
{
  "id": "auto_generated",
  "title": "Design Poster",
  "description": "Create a poster for the competition",
  "committeeId": "committee_id",
  "createdBy": "leader_user_id",
  "deadline": "timestamp",
  "status": "open",
  "createdAt": "timestamp",
  "updatedAt": "timestamp"
}
```

### submissions
```json
{
  "id": "auto_generated",
  "taskId": "task_id",
  "userId": "user_id",
  "userName": "John Doe",
  "answer": "My submission content...",
  "fileUrl": "https://...",
  "submittedAt": "timestamp",
  "updatedAt": "timestamp"
}
```

## Pages

| Route | Access | Description |
|-------|--------|-------------|
| `/` | Public | Login/Signup page |
| `/dashboard` | All authenticated | Dynamic dashboard based on role |
| `/admin` | Admin only | Manage committees and users |
| `/leader` | Leader only | Create and manage tasks |
| `/member` | Member only | View and submit tasks |

## License

MIT

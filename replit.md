# Kazanım Takip Sistemi

## Overview
A Turkish-language educational achievement tracking system for teachers to manage students and monitor their learning progress. Supports multi-institution architecture with complete data isolation.

## Features
- **Multi-Institution Support**: Each institution has separate login and isolated student data
- **Two-Stage Authentication**: Institution login first, then teacher login
- **Teacher Authentication**: Teachers can create accounts with custom passwords on first login
- **Student Management**: Add, delete, search students with duplicate prevention
- **Admin Panel**: Teachers named "Admin" can manage modules and achievements for their institution
- **Module-Based Achievements**: Achievements organized into color-coded modules
- **Achievement Tracking**: Three-status tracking (Yapamıyor/Çalışılıyor/Yapabiliyor)
- **Smart Achievement Display**: Shows 2 achievements from each module (up to 10 total) as current targets
- **Multi-Teacher Support**: Students can be associated with multiple teachers within same institution
- **Automatic Rotation**: When a student masters an achievement, it's automatically replaced with the next unmastered one
- **Visual Distinction**: "My Students" have green theme styling for easy identification

## Tech Stack
- **Frontend**: React with TypeScript, TanStack Query, Wouter routing
- **Backend**: Express.js with TypeScript
- **Database**: PostgreSQL with Drizzle ORM
- **UI**: Shadcn/ui components, Tailwind CSS, Framer Motion
- **Theme**: Dark theme with Turkish language interface

## Project Structure
```
client/
  src/
    pages/
      Home.tsx           - Student list page
      StudentDashboard.tsx - Achievement tracking for individual student
      TeacherLogin.tsx   - Two-stage login (institution → teacher)
      AdminPanel.tsx     - Module/achievement management (Admin only)
      SuperAdminDashboard.tsx - Super admin panel for managing all institutions
    hooks/
      useStudentData.ts  - Main data hook using TanStack Query
    lib/
      api.ts             - API client functions
server/
  index.ts              - Express server entry
  routes.ts             - API routes with institution scoping
  storage.ts            - Database storage interface
  db.ts                 - Database connection
shared/
  schema.ts             - Drizzle schema (institutions, teachers, students, modules, achievements)
```

## Database Schema
- **institutions**: id, name (unique), password, isLoginFrozen
- **teachers**: id, institutionId, name, password, isPasswordSet
- **modules**: id, institutionId, name, color, orderIndex - color-coded achievement groups
- **achievements**: id, moduleId, institutionId, name, orderIndex - individual learning goals
- **students**: id, institutionId, name, completedAchievementIds, monthlyProgress, associatedTeacherIds, createdBy, lastUpdatedBy

## API Endpoints
### Authentication
- `POST /api/auth/institution-login` - Login to institution
- `POST /api/auth/teacher-login` - Login or create teacher (requires institution session)
- `POST /api/auth/set-password` - Set teacher password
- `POST /api/auth/logout` - Logout (clears all session data)
- `GET /api/auth/me` - Get current session info

### Students (all require authentication)
- `GET /api/students` - Get all students for current institution
- `GET /api/students/:id` - Get single student (institution-scoped)
- `POST /api/students` - Create student
- `PATCH /api/students/:id` - Update student
- `DELETE /api/students/:id` - Delete student
- `POST /api/students/:id/associate-teacher` - Associate current teacher with student

### Modules & Achievements
- `GET /api/modules` - Get all modules for current institution
- `GET /api/modules-with-achievements` - Get modules with nested achievements
- `POST /api/modules` - Create module (Admin only)
- `PATCH /api/modules/:id` - Update module (Admin only)
- `DELETE /api/modules/:id` - Delete module and its achievements (Admin only)
- `GET /api/achievements` - Get all achievements for current institution
- `POST /api/achievements` - Create achievement (Admin only)
- `PATCH /api/achievements/:id` - Update achievement (Admin only)
- `DELETE /api/achievements/:id` - Delete achievement (Admin only)

### Super Admin
- `POST /api/super-admin/login` - Super admin login (Ahmet Bayrak)
- `POST /api/super-admin/logout` - Super admin logout
- `GET /api/super-admin/me` - Get super admin session info
- `GET /api/super-admin/institutions` - List all institutions with freeze status
- `POST /api/super-admin/institutions/:id/freeze` - Toggle institution login freeze

## Module Colors
Modules are automatically assigned colors from a predefined palette:
- Green (#22c55e), Blue (#3b82f6), Amber (#f59e0b), Red (#ef4444)
- Violet (#8b5cf6), Pink (#ec4899), Cyan (#06b6d4), Lime (#84cc16)

## Recent Changes
- **Dec 2024**: Added admin module/achievement management system
- Color-coded modules with automatic color assignment
- Smart achievement display showing 2 from each module (up to 10)
- Admin panel accessible only to teachers named "Admin"
- Institution-scoped module and achievement storage
- **ABA Import**: One-click import of ABA therapy achievement modules (7 modules, 130+ achievements)
  - Clears existing modules/achievements and student progress before import
  - Includes: Eşleme, İfade Edici Dil, Taklit, Sözel Taklit, Alıcı Dil, Ortak Dikkat, Yönerge Takip

## User Preferences
- Dark theme UI
- Turkish language interface
- Simple/clean design
- Green visual distinction for "my students"
- Private access only (no public data)

## Mobile App (Capacitor)
The project is configured for Android packaging using Capacitor:
- **Config**: `capacitor.config.ts`
- **Android Project**: `android/` folder
- **App ID**: com.kazanimtakip.app
- **Build Instructions**: See `APK_BUILD_INSTRUCTIONS.md`

To build APK:
1. Run `npm run build` to compile web assets
2. Run `npx cap sync android` to sync with Android project
3. Open in Android Studio with `npx cap open android`
4. Build APK from Android Studio

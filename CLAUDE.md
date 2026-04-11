# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Project Overview

SportsIQ (package: `com.justinbooth.gameiq`) — a React Native fitness coaching app built with Expo. Features AI-powered workout generation, Firebase auth with Apple Sign-In, and RevenueCat subscriptions (TRIAL/BASIC/PREMIUM tiers).

## Commands

```bash
# Development
npx expo start                # Start Expo dev server
npx expo start --ios          # Run on iOS simulator
npx expo start --android      # Run on Android emulator
npx expo start --web          # Run web preview

# Docker (alternative)
docker-compose up app          # Frontend only
docker-compose up              # Frontend + PostgreSQL
docker-compose --profile backend up  # Everything including Spring Boot backend

# Testing
npm test                       # Run all tests (Jest, non-watch)
npm run test:watch             # Jest in watch mode
npx jest path/to/test.ts      # Run a single test file

# Building
npx eas build --platform ios --profile preview
npx eas build --platform ios --profile production
```

## Architecture

### Navigation Structure
`App.tsx` defines the navigation hierarchy using React Navigation:
- **RootStack** (native-stack): `MainTabs`, `EditProfile` (modal), `WorkoutDisplay` (modal)
- **MainTabs** (bottom-tabs): Home, Profile, Workouts, Coaching

### Auth Flow
`AuthScreen` (Apple Sign-In or dev login) -> Firebase `onAuthStateChanged` -> `UserService.checkUserExists` -> `OnboardingFlow` (new users, sport/position/subscription selection) -> `MainTabs`

Dev user fallback: `dev@gameiq.com` / uid `dev-user-123` for local testing without Apple Sign-In.

### Service Layer (`src/services/`)
All API calls use the Fetch API (no Axios). Services talk to a Spring Boot (Kotlin) backend.
- **apiService.ts** — health checks, user stats, conversations, tags
- **userService.ts** — user CRUD, existence checks by Firebase UID
- **workoutApiService.ts** — workout generation, retrieval, search, saving
- **revenueCatService.ts** — RevenueCat subscription management

API base URL comes from `EXPO_PUBLIC_API_URL` env var. Responses follow `{ success, data?, error?, cost? }` shape.

### Subscription Enforcement
`TrialLimitError` is thrown when the backend returns a trial/subscription limit message. Screens catch this and display `TrialLimitModal`. The `UpgradeContext` (wraps the entire app) lets any screen trigger the subscription flow via `useUpgrade().onUpgradePress()`.

### Theme (`src/theme/`)
Dark-mode-first design system with navy/purple/silver/green palette. `appTheme.ts` exports colors, typography, spacing, and shadow tokens. UI components use React Native Paper (Material Design 3).

## Key Configuration

- **TypeScript**: `strict: false`, extends `expo/tsconfig.base`
- **Expo SDK**: ~54.0.0 with Hermes JS engine, new architecture disabled
- **React**: 19.1.0 / React Native: 0.81.5
- **Database**: PostgreSQL 15 on port 5433 (host), managed by backend Flyway migrations
- **Environment**: `.env` for dev, `.env.production` for prod. API URL is the primary toggle.

## Testing

Jest 30 with `jest-expo` preset. Tests live in `src/__tests__/`. Mocks for Expo modules are in `jest/setup.js`.

# CLAUDE.md

## Project
Personal Finance Tracker — React Native Mobile App
React Native + Expo + TypeScript

## Connects To
Spring Boot API: http://localhost:8080 (dev)
Production API: https://your-aws-url.com (prod)

## Architecture
- screens/ — one file per screen
- components/ — reusable UI components
- services/ — API calls (axios)
- hooks/ — custom React hooks
- context/ — global state (auth, user)
- navigation/ — React Navigation config
- utils/ — helpers

## Rules
- TypeScript everywhere — no any types
- JWT stored in AsyncStorage
- All API calls go through services/ layer
- Never call axios directly from screens
- Handle loading and error states on every screen

## API Base URL
Dev: http://localhost:8080
Prod: set in .env file
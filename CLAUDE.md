# Prelegal Project

## Overview

This is a SaaS product to allow users to draft legal agreements based on templates in the templates directory.
The user can carry out AI chat in order to establish what document they want and how to fill in the fields.
The available documents are covered in the catalog.json file in the project root, included here:

@catalog.json

The frontend currently supports the NDA template only. The backend provides auth and document persistence. AI chat endpoints exist as stubs.

## Development process

When instructed to build a feature:
1. Use your Atlassian tools to read the feature instructions from Jira
2. Develop the feature - do not skip any step from the feature-dev 7 step process
3. Thoroughly test the feature with unit tests and integration tests and fix any issues
4. Submit a PR using your github tools

## AI design

When writing code to make calls to LLMs, use your Cerebras skill to use LiteLLM via OpenRouter to the `openrouter/openai/gpt-oss-120b` model with Cerebras as the inference provider. You should use Structured Outputs so that you can interpret the results and populate fields in the legal document.

There is an OPENROUTER_API_KEY in the .env file in the project root.

## Technical design

The entire project should be packaged into a Docker container.  
The backend should be in backend/ and be a uv project, using FastAPI.  
The frontend should be in frontend/  
The database should use SQLLite and be created from scratch each time the Docker container is brought up, allowing for a users table with sign up and sign in.  
Consider statically building the frontend and serving it via FastAPI, if that will work.  
There should be scripts in scripts/ for:  
```bash
# Mac
scripts/start-mac.sh    # Start
scripts/stop-mac.sh     # Stop

# Linux
scripts/start-linux.sh
scripts/stop-linux.sh

# Windows
scripts/start-windows.ps1
scripts/stop-windows.ps1
```
Backend available at http://localhost:8000

## Color Scheme
- Accent Yellow: `#ecad0a`
- Blue Primary: `#209dd7`
- Purple Secondary: `#753991` (submit buttons)
- Dark Navy: `#032147` (headings)
- Gray Text: `#888888`

## Implementation Status

### V1 Foundation (PL-4) - Complete
- FastAPI backend (`backend/app/`) with uv project
- SQLite database (async SQLAlchemy) with User and Document models
- JWT cookie-based auth (bcrypt password hashing)
- Document CRUD with user ownership enforcement
- Multi-stage Dockerfile: static Next.js export served via FastAPI
- docker-compose.yml and start/stop scripts for Mac/Linux/Windows

### AI Chat for NDA (PL-5) - Complete
- AI chat integration via LiteLLM + OpenRouter (Cerebras inference, gpt-oss-120b model)
- Structured outputs for field extraction from natural conversation
- ChatPanel component with 3-column layout (form | chat | preview)
- Live preview updates as AI extracts NDA field values
- AI proactively asks about unfilled fields
- Graceful error handling for network/API failures
- 20 backend tests, 86 frontend tests

### Not Yet Implemented
- Multi-template frontend (only NDA currently)
- Frontend auth UI (signup/signin)
- Frontend-backend integration (document save)

### Current API Endpoints
- `POST /api/auth/signup` - Create new user account
- `POST /api/auth/signin` - Sign in and receive JWT cookie
- `POST /api/auth/signout` - Clear auth cookie
- `GET /api/auth/me` - Get current user info
- `GET /api/documents` - List user's saved documents (auth required)
- `POST /api/documents` - Save new document (auth required)
- `GET /api/documents/{id}` - Get specific document (auth required)
- `PUT /api/documents/{id}` - Update document (auth required)
- `DELETE /api/documents/{id}` - Delete document (auth required)
- `GET /api/chat/greeting` - Get AI greeting for NDA drafting
- `POST /api/chat/message` - Send chat message, returns AI reply + extracted NDA fields
- `GET /api/health` - Health check

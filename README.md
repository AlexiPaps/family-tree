# Family Tree Mini-Builder

A full-stack application for constructing simple family trees with parent-child relationships.

## How to Run Locally

### Prerequisites

- Node.js 18+ installed
- npm or yarn package manager

### Installation

```bash
# Install dependencies
npm install

# Start development server
npm run dev
```

The application will be available at [http://localhost:3000](http://localhost:3000).

### Running Tests

```bash
# Run all tests
npm test

# Run tests in watch mode
npm run test:watch
```

### Build for Production

```bash
npm run build
npm start
```

---

## Architecture Overview

```
┌─────────────────────────────────────────────────────────────────┐
│                         Frontend (React)                        │
│  ┌─────────────┐  ┌─────────────┐  ┌──────────────────────┐     │
│  │ PersonForm  │  │ PersonList  │  │  FamilyTreeModal     │     │
│  │ (create)    │  │ (manage)    │  │  (visualize)         │     │
│  └─────────────┘  └─────────────┘  └──────────────────────┘     │
│                            │                                    │
│              Client-side validation (UX only)                   │
└────────────────────────────┼────────────────────────────────────┘
                             │ HTTP/JSON
┌────────────────────────────┼────────────────────────────────────┐
│                      API Routes (Next.js)                       │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  /api/persons          - GET, POST                       │   │
│  │  /api/persons/[id]     - GET, DELETE                     │   │
│  │  /api/persons/[id]/parents          - POST               │   │
│  │  /api/persons/[id]/parents/[parentId] - DELETE           │   │
│  └──────────────────────────────────────────────────────────┘   │
│                            │                                    │
│              Server-side validation (source of truth)           │
└────────────────────────────┼────────────────────────────────────┘
                             │
┌────────────────────────────┼────────────────────────────────────┐
│                     Persistence Layer                           │
│  ┌──────────────────────────────────────────────────────────┐   │
│  │  JSON File Storage (data/family.json)                    │   │
│  └──────────────────────────────────────────────────────────┘   │
└─────────────────────────────────────────────────────────────────┘
```

### Technology Stack

| Layer | Technology |
|-------|------------|
| Frontend | Next.js 15, React 19, TypeScript |
| Backend | Next.js App Router API Routes |
| Persistence | JSON file storage |
| Styling | CSS Modules |
| Testing | Vitest |

### Key Design Decisions

- **Shared validation logic**: The same validation functions are used on both client and server, ensuring consistency while keeping the server as the source of truth.
- **Immediate state updates**: The frontend updates local state directly from successful API responses, avoiding additional refetch calls.
- **JSON file persistence**: Chosen for simplicity and zero external dependencies. Easily swappable for a database.

---

## Data Model

### Person

```typescript
interface Person {
  id: string;           // Unique identifier (UUID)
  name: string;         // Required, non-empty
  dateOfBirth: string;  // ISO date string (YYYY-MM-DD), required
  placeOfBirth?: string; // Optional
  parentIds: string[];  // Array of 0-2 parent IDs
}
```

### Storage Format

Data is persisted in `data/family.json`:

```json
{
  "persons": [
    {
      "id": "abc123",
      "name": "John Doe",
      "dateOfBirth": "1970-05-15",
      "placeOfBirth": "New York",
      "parentIds": []
    },
    {
      "id": "def456",
      "name": "Jane Doe",
      "dateOfBirth": "1995-08-20",
      "parentIds": ["abc123"]
    }
  ]
}
```

---

## Validation Rules

| Rule | Description |
|------|-------------|
| **Name required** | Name cannot be empty or whitespace only |
| **Date of birth required** | Must be a valid date in YYYY-MM-DD format |
| **No future dates** | Date of birth cannot be in the future |
| **Maximum 2 parents** | A person can have 0, 1, or 2 parents |
| **Age difference** | Parent must be at least 15 years older than child |
| **No self-parenting** | A person cannot be their own parent |
| **No cycles** | A person cannot be their own ancestor (prevents A → B → A loops) |

### Validation Flow

1. **Client-side** (optional, UX enhancement): Validates before submission to provide instant feedback
2. **Server-side** (required, source of truth): All data is re-validated before persistence

---

## API Format

### Base URL

```
http://localhost:3000/api
```

### Response Format

All endpoints return JSON with this structure:

```typescript
// Success
{
  "success": true,
  "data": <response data>
}

// Error
{
  "success": false,
  "error": "Error message",
  "errors": [{ "field": "fieldName", "message": "Validation message" }]
}
```

---

### Endpoints

#### GET /api/persons

Retrieve all persons.

**Response:**

```json
{
  "success": true,
  "data": [
    {
      "id": "abc123",
      "name": "John Doe",
      "dateOfBirth": "1970-05-15",
      "placeOfBirth": "New York",
      "parentIds": []
    }
  ]
}
```

---

#### POST /api/persons

Create a new person.

**Request Body:**

```json
{
  "name": "Jane Doe",
  "dateOfBirth": "1995-08-20",
  "placeOfBirth": "Boston"
}
```

**Success Response (201):**

```json
{
  "success": true,
  "data": {
    "id": "def456",
    "name": "Jane Doe",
    "dateOfBirth": "1995-08-20",
    "placeOfBirth": "Boston",
    "parentIds": []
  }
}
```

**Validation Error (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    { "field": "name", "message": "Name is required" },
    { "field": "dateOfBirth", "message": "Date of birth cannot be in the future" }
  ]
}
```

---

#### GET /api/persons/:id

Retrieve a single person.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "abc123",
    "name": "John Doe",
    "dateOfBirth": "1970-05-15",
    "parentIds": []
  }
}
```

**Not Found (404):**

```json
{
  "success": false,
  "error": "Person not found"
}
```

---

#### DELETE /api/persons/:id

Delete a person and remove them from all parent relationships.

**Response (200):**

```json
{
  "success": true
}
```

---

#### POST /api/persons/:id/parents

Add a parent to a person.

**Request Body:**

```json
{
  "parentId": "abc123"
}
```

**Success Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "def456",
    "name": "Jane Doe",
    "dateOfBirth": "1995-08-20",
    "parentIds": ["abc123"]
  }
}
```

**Validation Error (400):**

```json
{
  "success": false,
  "error": "Validation failed",
  "errors": [
    { "field": "parentId", "message": "Parent must be at least 15 years older than child (current difference: 10 years)" }
  ]
}
```

---

#### DELETE /api/persons/:id/parents/:parentId

Remove a parent relationship.

**Response (200):**

```json
{
  "success": true,
  "data": {
    "id": "def456",
    "name": "Jane Doe",
    "dateOfBirth": "1995-08-20",
    "parentIds": []
  }
}
```

---

## Project Structure

```
family-tree/
├── data/
│   └── family.json          # Persistent storage
├── src/
│   ├── app/
│   │   ├── api/
│   │   │   └── persons/     # API routes
│   │   ├── layout.tsx       # Root layout
│   │   └── page.tsx         # Main page
│   ├── components/
│   │   ├── PersonForm.tsx   # Create person form
│   │   ├── PersonList.tsx   # List with parent management
│   │   ├── FamilyTreeModal.tsx  # Tree visualization
│   │   └── ConfirmModal.tsx # Confirmation dialogs
│   ├── lib/
│   │   ├── storage.ts       # JSON file operations
│   │   ├── validation.ts    # Validation logic
│   │   └── utils.ts         # Helper functions
│   ├── styles/              # CSS Modules
│   └── types/
│       └── index.ts         # TypeScript interfaces
├── package.json
└── vitest.config.ts
```

---

## AI Approach

### Tools Used

- **Cursor** (IDE) with **Claude Opus 4.5** as the AI model

### What I Used AI For

AI assistance was used throughout the entire development process:

- **Scoping**: Defining the project structure and breaking down requirements
- **Solution design**: Discussing architectural approaches and data modeling decisions
- **Code generation**: Writing components, API routes, validation logic, and utilities
- **Code review**: Identifying issues and suggesting improvements
- **Testing**: Generating unit tests for validation logic and API routes
- **Documentation**: Creating this README with architecture diagrams and API documentation

### Why I Chose These Tools

Cursor provides seamless AI integration directly in the development environment, allowing for contextual code generation and refactoring. Claude Opus 4.5 was chosen for its ability to generate consistent, high-quality code while understanding the full context of the codebase.

---

## Future Improvements

Given more time or for a production deployment, the following enhancements would be considered:

### Database & Data Layer

- **Real database** (PostgreSQL or SQLite with a proper driver) with schema migrations
- **Two-table design**: Separate `persons` and `relationships` tables, allowing for relationship metadata (type, date added) and more flexible querying

### API & Backend

- **Pagination** for the persons list endpoint (current implementation won't scale with hundreds of people)
- **Search/filter endpoint** to find people by name or date range
- **Edit person endpoint** (currently only create and delete are supported; no way to update name or date of birth)
- **Authentication** for multi-user support

### Frontend

- **Better tree visualization** using a proper graph library (D3.js, react-flow, or vis.js) instead of the current CSS-based hierarchy
- **Edit functionality** for existing people directly in the UI
- **Search/filter** controls to quickly find people in large lists
- **Undo capability** for destructive actions (delete person, remove parent)

### Testing & Quality

- **End-to-end tests** using Playwright or Cypress to verify full user flows

# Quantity Measurement UI — Angular Frontend (UC-20)

Angular 17 frontend for the UC-18 Quantity Measurement .NET REST API.

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Angular 17 (standalone components) |
| Styling | SCSS + custom design system |
| HTTP | Angular `HttpClient` + functional interceptor |
| Auth | JWT Bearer token via `sessionStorage` |
| Routing | Angular Router with `CanActivate` guard |
| Forms | Template-driven forms (`NgModel`) |
| State | Component-level state + `BehaviorSubject` |

---

## Project Structure

```
src/app/
├── components/
│   ├── login/           # Login page
│   ├── register/        # Registration page
│   ├── navbar/          # Sticky top navbar with logout
│   ├── dashboard/       # Calculator with 5 operation tabs
│   ├── history/         # Measurement history with filters
│   ├── quantity-input/  # Reusable quantity input component
│   └── result-card/     # Reusable result display component
├── guards/
│   └── auth.guard.ts    # Protects /dashboard and /history
├── interceptors/
│   └── auth.interceptor.ts  # Attaches JWT Bearer to every request
├── models/
│   ├── auth.model.ts
│   └── quantity.model.ts
└── services/
    ├── auth.service.ts
    └── quantity.service.ts
```

---

## Setup

### 1. Install
```bash
npm install
```

### 2. Update Backend CORS (Program.cs)
Add Angular dev server origin:
```csharp
policy.WithOrigins("http://localhost:4200")
      .AllowAnyHeader()
      .AllowAnyMethod();
```

### 3. Run
```bash
ng serve
```
Open http://localhost:4200

The proxy (`proxy.conf.json`) forwards `/api/*` → `http://localhost:5500` automatically.

---

## API Endpoints

| Method | Endpoint | Auth |
|---|---|---|
| POST | `/api/v1/auth/register` | No |
| POST | `/api/v1/auth/login` | No |
| POST | `/api/v1/quantities/compare` | JWT |
| POST | `/api/v1/quantities/convert` | JWT |
| POST | `/api/v1/quantities/add` | JWT |
| POST | `/api/v1/quantities/subtract` | JWT |
| POST | `/api/v1/quantities/divide` | JWT |
| GET  | `/api/v1/quantities/history` | JWT |
| GET  | `/api/v1/quantities/history/operation/{type}` | JWT |
| GET  | `/api/v1/quantities/history/measurement/{type}` | JWT |
| GET  | `/api/v1/quantities/count` | JWT |

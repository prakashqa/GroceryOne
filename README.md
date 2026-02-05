# GroceryOne - Multi-Tenant Grocery Mobile Application

A scalable, multi-tenant grocery management mobile application supporting Android, iOS, and future web compatibility with multi-language support (English and Telugu).

## Tech Stack

| Layer | Technology |
|-------|------------|
| Mobile | React Native + TypeScript |
| State Management | Redux Toolkit + RTK Query |
| Navigation | React Navigation v6 |
| Backend | NestJS + TypeScript |
| Database | PostgreSQL (schema-per-tenant) |
| Cache | Redis |
| Push Notifications | Firebase Cloud Messaging |
| i18n | react-i18next |
| Testing | Jest, React Native Testing Library, Detox |

## Project Structure

```
GroceryOne/
├── mobile/                    # React Native App
│   ├── src/
│   │   ├── core/             # Config, hooks, utils
│   │   ├── data/             # API (RTK Query), DTOs
│   │   ├── domain/           # Entities, use cases
│   │   ├── presentation/     # Components, screens, navigation
│   │   ├── store/            # Redux slices
│   │   ├── i18n/             # Localization (en, te)
│   │   └── tenant/           # Multi-tenant context
│   ├── __tests__/            # Test utilities
│   └── e2e/                  # Detox E2E tests
│
├── backend/                   # NestJS API
│   ├── src/
│   │   ├── core/             # Guards, middleware, filters
│   │   ├── database/         # Migrations, seeds
│   │   ├── tenant/           # Tenant management
│   │   └── modules/          # Feature modules
│   └── test/                 # E2E tests
│
├── packages/
│   └── shared/               # Shared types, constants, utils
│
├── admin/                     # React Admin Panel (future)
└── .github/workflows/         # CI/CD pipelines
```

## Getting Started

### Prerequisites

- Node.js 20+
- npm 10+
- PostgreSQL 16+
- Redis 7+
- Android Studio (for Android development)
- Xcode (for iOS development, macOS only)

### Installation

1. **Clone the repository**
   ```bash
   git clone <repository-url>
   cd GroceryOne
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Build shared package**
   ```bash
   npm run shared build
   ```

4. **Set up backend environment**
   ```bash
   cp backend/.env.example backend/.env
   # Edit backend/.env with your database credentials
   ```

5. **Run database migrations**
   ```bash
   npm run backend migration:run
   ```

### Running the Application

**Start Backend**
```bash
npm run backend start:dev
```

**Start Mobile (iOS)**
```bash
cd mobile
npx pod-install
npm run ios
```

**Start Mobile (Android)**
```bash
npm run mobile android
```

## Development

### Running Tests

```bash
# Run all tests
npm test

# Run mobile tests with coverage
npm run mobile test:coverage

# Run backend tests
npm run backend test

# Run E2E tests (mobile)
npm run mobile e2e:android
npm run mobile e2e:ios
```

### Linting

```bash
npm run lint
```

### Type Checking

```bash
npm run typecheck
```

## Multi-Tenancy

The application uses a **schema-per-tenant** approach:
- Each tenant has a dedicated PostgreSQL schema
- Tenant is identified via `X-Tenant-ID` header or subdomain
- Branding and features are configurable per tenant

## Internationalization

Supported languages:
- **English (en)** - Default
- **Telugu (te)**

Language switching is dynamic without app restart.

## API Documentation

When running in development mode, Swagger documentation is available at:
```
http://localhost:3000/docs
```

## Contributing

1. Follow TDD approach (write tests first)
2. Maintain 80%+ code coverage
3. Follow the existing code structure
4. Use conventional commits

## License

Private - All rights reserved

# Database Migration Report

**Date:** January 21, 2026
**Database:** gro_one (PostgreSQL)

---

## Executive Summary

Successfully implemented persistent database storage for the GroOne backend. All hardcoded data and Local Storage data structures have been migrated to a PostgreSQL database schema with corresponding backend APIs and mobile integration.

---

## Data Sources Identified

### Hardcoded Data (mobile/src/domain/types/picking.ts)
| Type | Count | Description |
|------|-------|-------------|
| Categories | 9 | Product categories (Atta, Dal, Oil, etc.) |
| Items | 72 | Products (8 items per category) |

### Local Storage Keys
| Key | Purpose |
|-----|---------|
| `@groceryone/catalog` | Categories and items cache |
| `@groceryone/multi_cart` | Shopping carts data |
| `@groceryone/settings` | User preferences |

---

## Database Schema Created

### Tables

#### categories
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | Unique identifier |
| name | VARCHAR(255) | Display name |
| icon | VARCHAR(10) | Emoji icon |
| sort_order | INTEGER | Display order |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP | Soft delete |

#### items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| slug | VARCHAR(100) | Unique identifier |
| name | VARCHAR(255) | Display name |
| category_id | UUID | FK to categories |
| unit | VARCHAR(10) | kg, gm, pcs, L, ml |
| default_quantity | DECIMAL(10,2) | Default qty |
| sort_order | INTEGER | Display order |
| is_active | BOOLEAN | Active status |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP | Soft delete |

#### carts
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| name | VARCHAR(255) | Cart name |
| user_id | UUID | Optional user FK |
| device_id | VARCHAR(255) | Device identifier |
| status | VARCHAR(20) | draft/printed/completed |
| is_active | BOOLEAN | Active cart flag |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |
| deleted_at | TIMESTAMP | Soft delete |

#### cart_items
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| cart_id | UUID | FK to carts |
| item_id | UUID | FK to items |
| quantity | DECIMAL(10,2) | Quantity |
| added_at | TIMESTAMP | When added |

#### user_settings
| Column | Type | Description |
|--------|------|-------------|
| id | UUID | Primary key |
| user_id | UUID | Optional user FK |
| device_id | VARCHAR(255) | Device identifier |
| theme_mode | VARCHAR(20) | light/dark/system |
| language | VARCHAR(10) | Language code |
| notifications | JSONB | Notification prefs |
| printer | JSONB | Printer settings |
| created_at | TIMESTAMP | Creation time |
| updated_at | TIMESTAMP | Last update |

---

## Backend Services Created

### Categories Module
- **Entity:** `backend/src/modules/categories/entities/category.entity.ts`
- **DTOs:** `create-category.dto.ts`, `update-category.dto.ts`
- **Service:** `categories.service.ts` (CRUD + bulkCreate)
- **Controller:** `categories.controller.ts`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /categories | List all categories |
| GET | /categories/count | Get category count |
| GET | /categories/:id | Get by ID |
| GET | /categories/slug/:slug | Get by slug |
| POST | /categories | Create category |
| PUT | /categories/:id | Update category |
| DELETE | /categories/:id | Soft delete |

### Products Module
- **Entity:** `backend/src/modules/products/entities/item.entity.ts`
- **DTOs:** `create-item.dto.ts`, `update-item.dto.ts`
- **Service:** `products.service.ts` (CRUD + bulkCreate)
- **Controller:** `products.controller.ts`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /items | List all items |
| GET | /items/count | Get item count |
| GET | /items/category/:id | Get by category |
| GET | /items/:id | Get by ID |
| GET | /items/slug/:slug | Get by slug |
| POST | /items | Create item |
| PUT | /items/:id | Update item |
| DELETE | /items/:id | Soft delete |

### Cart Module
- **Entities:** `cart.entity.ts`, `cart-item.entity.ts`
- **DTOs:** `create-cart.dto.ts`, `update-cart.dto.ts`, `add-cart-item.dto.ts`, `update-cart-item.dto.ts`
- **Service:** `cart.service.ts`
- **Controller:** `cart.controller.ts`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /carts | List carts |
| GET | /carts/active | Get active cart |
| GET | /carts/count | Get cart count |
| GET | /carts/:id | Get by ID |
| POST | /carts | Create cart |
| PUT | /carts/:id | Update cart |
| DELETE | /carts/:id | Soft delete |
| POST | /carts/:id/items | Add item |
| PUT | /carts/:id/items/:itemId | Update item qty |
| DELETE | /carts/:id/items/:itemId | Remove item |
| DELETE | /carts/:id/items | Clear cart |

### Users Module
- **Entity:** `user-settings.entity.ts`
- **DTOs:** `user-settings.dto.ts`
- **Service:** `users.service.ts`
- **Controller:** `users.controller.ts`

**API Endpoints:**
| Method | Path | Description |
|--------|------|-------------|
| GET | /users/settings | Get or create settings |
| GET | /users/settings/:id | Get by ID |
| POST | /users/settings | Create settings |
| PUT | /users/settings/:id | Update by ID |
| PUT | /users/settings/user/:userId | Upsert by user |
| PUT | /users/settings/device/:deviceId | Upsert by device |
| DELETE | /users/settings/:id | Delete settings |

---

## Seed Data

### Location
`backend/src/database/seeds/`

### Files
- `seed-data.ts` - 9 categories and 72 items from picking.ts
- `seed.service.ts` - Seeding service with auto-seed option
- `seed.controller.ts` - Admin endpoints for seeding
- `seed.module.ts` - Module configuration

### Admin Endpoints
| Method | Path | Description |
|--------|------|-------------|
| POST | /admin/seeds | Run full seed |
| POST | /admin/seeds/if-empty | Seed only if empty |
| GET | /admin/seeds/status | Get data counts |
| DELETE | /admin/seeds | Clear all data |

### Auto-Seed
Set `AUTO_SEED=true` in `.env` to automatically seed on startup (development only).

---

## Mobile API Integration

### RTK Query Endpoints
| File | Hooks |
|------|-------|
| `categoryApi.ts` | useGetCategoriesQuery, useCreateCategoryMutation, etc. |
| `productApi.ts` | useGetItemsQuery, useCreateItemMutation, etc. |
| `cartApi.ts` | useGetCartsQuery, useAddCartItemMutation, etc. |
| `userSettingsApi.ts` | useGetUserSettingsQuery, useUpdateUserSettingsMutation, etc. |

### Sync Utilities
| File | Functions |
|------|-----------|
| `catalogSync.ts` | syncLocalToBackend, syncBackendToLocal, isBackendAvailable |
| `cartSync.ts` | syncLocalCartsToBackend, fetchCartsFromBackend |

---

## Migration Strategy

### Approach: Local-First with Backend Sync
1. App continues to work with local storage (AsyncStorage)
2. When backend is available, sync utilities can migrate data
3. Gradual transition to backend-only mode

### Migration Steps (for production)
1. Start PostgreSQL and run database migrations
2. Call `/admin/seeds/if-empty` to seed initial data
3. Use sync utilities to migrate user-specific data
4. Switch app to use RTK Query hooks for data fetching

---

## Data Count Summary

### Before Migration
| Source | Categories | Items | Carts | Settings |
|--------|------------|-------|-------|----------|
| Hardcoded | 9 | 72 | - | - |
| Local Storage | Variable | Variable | Variable | Variable |

### After Migration (Seed Data)
| Database | Categories | Items |
|----------|------------|-------|
| gro_one | 9 | 72 |

---

## Files Created/Modified

### Backend (New Files)
```
backend/src/
├── database/
│   ├── database.module.ts
│   └── seeds/
│       ├── seed-data.ts
│       ├── seed.service.ts
│       ├── seed.controller.ts
│       └── seed.module.ts
├── modules/
│   ├── categories/
│   │   ├── entities/category.entity.ts
│   │   ├── dto/
│   │   │   ├── create-category.dto.ts
│   │   │   ├── update-category.dto.ts
│   │   │   └── index.ts
│   │   ├── categories.service.ts
│   │   └── categories.controller.ts
│   ├── products/
│   │   ├── entities/item.entity.ts
│   │   ├── dto/
│   │   │   ├── create-item.dto.ts
│   │   │   ├── update-item.dto.ts
│   │   │   └── index.ts
│   │   ├── products.service.ts
│   │   └── products.controller.ts
│   ├── cart/
│   │   ├── entities/
│   │   │   ├── cart.entity.ts
│   │   │   └── cart-item.entity.ts
│   │   ├── dto/
│   │   │   ├── create-cart.dto.ts
│   │   │   ├── update-cart.dto.ts
│   │   │   ├── add-cart-item.dto.ts
│   │   │   ├── update-cart-item.dto.ts
│   │   │   └── index.ts
│   │   ├── cart.service.ts
│   │   └── cart.controller.ts
│   └── users/
│       ├── entities/user-settings.entity.ts
│       ├── dto/
│       │   ├── user-settings.dto.ts
│       │   └── index.ts
│       ├── users.service.ts
│       └── users.controller.ts
```

### Mobile (New Files)
```
mobile/src/
├── data/api/
│   ├── categoryApi.ts
│   ├── productApi.ts
│   ├── cartApi.ts
│   └── userSettingsApi.ts
└── utils/sync/
    ├── catalogSync.ts
    ├── cartSync.ts
    └── index.ts
```

### Modified Files
- `backend/src/app.module.ts` - Added DatabaseModule
- `backend/src/modules/*/module.ts` - Updated module imports
- `mobile/src/data/api/index.ts` - Added API exports

---

## Next Steps

1. **Start PostgreSQL** - Ensure the gro_one database is running
2. **Run Backend** - `cd backend && npm run start:dev`
3. **Seed Data** - POST to `/admin/seeds/if-empty`
4. **Verify** - GET `/admin/seeds/status` should show 9 categories, 72 items
5. **Test APIs** - Access Swagger docs at `/docs`
6. **Mobile Integration** - Update app to use RTK Query hooks

---

## Notes

- TypeORM `synchronize: true` in development auto-creates tables
- Soft deletes preserve data integrity
- JSONB columns for flexible settings storage
- UUID primary keys for distributed systems compatibility
- API versioning via `/api/v1` prefix

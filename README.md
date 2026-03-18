# 🏠 HomeFix — Full-Stack Home Service Booking Platform

HomeFix connects customers with local service providers (plumber, electrician, painter, mason, cleaner, carpenter), supports secure booking + payment, and includes provider/admin operations with real-time updates.

This README is written for:

- first-time reviewers,
- recruiters/interviewers,
- new contributors,
- and anyone who wants to understand the project quickly.

![Node.js](https://img.shields.io/badge/Node.js-18+-339933?logo=nodedotjs&logoColor=white)
![React](https://img.shields.io/badge/React-19-61DAFB?logo=react&logoColor=white)
![MongoDB](https://img.shields.io/badge/MongoDB-8-47A248?logo=mongodb&logoColor=white)
![Socket.io](https://img.shields.io/badge/Socket.io-4-010101?logo=socketdotio&logoColor=white)
![Razorpay](https://img.shields.io/badge/Razorpay-Payments-0C2451?logo=razorpay&logoColor=white)
![License](https://img.shields.io/badge/License-MIT-blue)

---

## 📌 TL;DR (Quick Evaluation)

- **Type:** Role-based service marketplace (Customer / Provider / Admin)
- **Architecture:** React SPA + Express API + MongoDB + Socket.io
- **Strengths:** Clear role separation, real-time booking workflow, payment integration, operational admin views
- **Production note:** Deploy backend on non-serverless runtime if you need full Socket.io support
- **Best health check:** `GET /api/health`

---

## ✨ Core Features

### Customer

- Search providers by service type and filters
- Book provider with date/time/address/problem details
- Pay online via Razorpay order + verification flow
- Track booking states (`pending`, `accepted`, `rejected`, `completed`, `cancelled`)
- Rate and review completed services
- Manage favorite providers

### Provider

- Manage profile + service details
- Toggle availability (`online/offline`)
- Accept/reject bookings
- View booking and earnings context

### Admin

- View platform dashboard stats
- Browse customers/providers/bookings
- View provider-level stats
- Delete user accounts when needed

### Real-time

- New booking alerts
- Booking status updates
- Availability change broadcasts
- Online users list
- Force logout handling for session control

---

## 🛠️ Tech Stack

| Layer        | Technology                                          |
| ------------ | --------------------------------------------------- |
| Frontend     | React 19, Vite, Tailwind CSS 4, React Router, Axios |
| Backend      | Node.js, Express, Mongoose                          |
| Database     | MongoDB                                             |
| Real-time    | Socket.io + socket.io-client                        |
| Auth         | JWT + cookies/Bearer token + role middleware        |
| Payments     | Razorpay                                            |
| Email        | Nodemailer (SMTP)                                   |
| Media Upload | Cloudinary + Multer                                 |
| UI           | Lucide React, react-hot-toast, Chart.js             |

---

## 🧭 System Architecture

```text
Frontend (React)
	├─ AuthContext (session/user state)
	├─ SocketContext (live events)
	├─ services/api.js (Axios client + API modules)
	└─ Pages/Components (role-based dashboards)

Backend (Express)
	├─ Routes (auth/services/bookings/payments/providers/favorites/admin)
	├─ Middleware (protect/authorize/upload/rate-limit)
	├─ Controllers (business logic)
	├─ Models (Customer/Provider/Booking/Payment/...)
	└─ Socket service (event dispatch + online presence)

MongoDB (Mongoose)
	└─ Persistent user, booking, payment, favorite, notification data
```

---

## 📁 Project Structure

```bash
homefix/
├── backend/
│   ├── config/            # DB + Cloudinary config
│   ├── controllers/       # Business logic per module
│   ├── middleware/        # Auth/RBAC/upload protection
│   ├── models/            # Mongoose schemas
│   ├── routes/            # Express routers
│   ├── services/          # Socket + email services
│   ├── utils/             # Seeder/email helpers/templates
│   └── server.js          # App bootstrap
├── frontend/
│   ├── src/
│   │   ├── components/    # Shared + admin UI components
│   │   ├── context/       # Auth + socket providers
│   │   ├── hooks/         # Custom hooks
│   │   ├── pages/         # Route pages
│   │   ├── services/      # API integration layer
│   │   └── utils/         # Utility helpers
│   └── index.html
└── README.md
```

---

## 🔍 Important Backend Objects

### API Route Modules (mounted in `backend/server.js`)

| Base Path        | File                        | Responsibility                                                   |
| ---------------- | --------------------------- | ---------------------------------------------------------------- |
| `/api/auth`      | `routes/auth.routes.js`     | Register/login/logout, profile, password reset                   |
| `/api/services`  | `routes/service.routes.js`  | Service types, provider browsing/search, provider profile update |
| `/api/bookings`  | `routes/booking.routes.js`  | Booking lifecycle + review + availability slots                  |
| `/api/payments`  | `routes/payment.routes.js`  | Razorpay order creation, verification, payment history           |
| `/api/providers` | `routes/provider.routes.js` | Provider self profile + availability toggle                      |
| `/api/favorites` | `routes/favorite.routes.js` | Customer favorites CRUD/check                                    |
| `/api/admin`     | `routes/admin.route.js`     | Admin dashboard, user management, platform reports               |

### Core Models

| Model          | Purpose                       | Key Fields                                                                        |
| -------------- | ----------------------------- | --------------------------------------------------------------------------------- |
| `Customer`     | End-user account              | `name`, `email`, `phone`, `address`, `isLoggedIn`, `socketId`                     |
| `Provider`     | Service professional profile  | `serviceType`, `experience`, `description`, `rating`, `isAvailable`, `workImages` |
| `Booking`      | Customer-provider job record  | `customerId`, `providerId`, `bookingDate`, `status`, `paymentStatus`, `rating`    |
| `Payment`      | Payment transaction ledger    | `bookingId`, `amount`, `razorpayOrderId`, `razorpayPaymentId`, `status`           |
| `Favorite`     | Saved provider relationship   | `customerId`, `providerId` (compound uniqueness)                                  |
| `Notification` | Internal notification log     | `userId`, `userType`, `type`, `message`, `status`, `emailStatus`                  |
| `Admin`        | Admin account + session state | `email`, `password`, `activeSessionId`, `socketId`                                |

### Key Middleware Concepts

- `protect`: verifies JWT from cookie or Bearer token
- `authorize(...roles)`: role-based endpoint access
- `restoreUser`: optional user hydration for mixed public/private service browsing
- Global rate limiter on `/api`

---

## 🎨 Important Frontend Objects

### App-Level Routing (`frontend/src/App.jsx`)

| Route Type    | Paths                                                                                                  | Guard                                             |
| ------------- | ------------------------------------------------------------------------------------------------------ | ------------------------------------------------- |
| Public        | `/`, `/services`, `/provider/:id`, `/login`, `/register`, `/forgot-password`, `/reset-password/:token` | none                                              |
| Customer-only | `/customer-dashboard`                                                                                  | `ProtectedRoute` with `allowedRoles=["customer"]` |
| Provider-only | `/provider-dashboard`                                                                                  | `ProtectedRoute` with `allowedRoles=["provider"]` |
| Authenticated | `/profile`                                                                                             | `ProtectedRoute`                                  |
| Admin         | `/admin/*` (`dashboard`, `customers`, `providers`)                                                     | `AdminRoute` + `AdminLayout`                      |

### State & Integration Layers

| Object              | File                        | Responsibility                                                      |
| ------------------- | --------------------------- | ------------------------------------------------------------------- |
| `AuthProvider`      | `context/AuthContext.jsx`   | User session state, login/register/logout, token persistence        |
| `SocketProvider`    | `context/SocketContext.jsx` | Connect/disconnect socket, online users, force-logout handling      |
| `api` + module APIs | `services/api.js`           | Axios client + typed module groups (`authAPI`, `bookingsAPI`, etc.) |

---

## 📡 API Endpoint Summary

> Full list is implemented under `backend/routes/*`. Below is the main contract for quick review.

### Auth

- `POST /api/auth/register`
- `POST /api/auth/login`
- `POST /api/auth/logout` (protected)
- `GET /api/auth/me` (protected)
- `PUT /api/auth/profile` (protected)
- `GET /api/auth/verify-token` (protected)
- `POST /api/auth/forgotpassword`
- `PUT /api/auth/resetpassword/:resettoken`

### Services

- `GET /api/services`
- `GET /api/services/search`
- `GET /api/services/:type`
- `GET /api/services/provider/:id` (customer)
- `PUT /api/services/profile` (provider)

### Bookings

- `POST /api/bookings` (customer)
- `GET /api/bookings/customer` (customer)
- `GET /api/bookings/provider` (provider)
- `GET /api/bookings/:id` (protected)
- `PUT /api/bookings/:id/status` (provider)
- `PUT /api/bookings/:id/cancel` (customer)
- `POST /api/bookings/:id/review` (customer)
- `GET /api/bookings/availability/:providerId`

### Payments

- `POST /api/payments/create-order` (customer)
- `POST /api/payments/verify` (customer)
- `GET /api/payments/history` (protected)

### Provider / Favorites / Admin

- `PUT /api/providers/availability` (provider)
- `GET /api/providers/me` (provider)
- `GET /api/favorites` (customer)
- `POST /api/favorites/:providerId` (customer)
- `DELETE /api/favorites/:providerId` (customer)
- `GET /api/favorites/:providerId/check` (protected)
- `GET /api/admin/dashboard` (admin)
- `GET /api/admin/customers` (admin)
- `GET /api/admin/providers` (admin)
- `GET /api/admin/bookings` (admin)
- `GET /api/admin/providers/:id/stats` (admin)
- `DELETE /api/admin/users/:id` (admin)

---

## 🔌 Real-time Socket Events

| Event                           | Direction               | Purpose                     |
| ------------------------------- | ----------------------- | --------------------------- |
| `new-booking`                   | Server → Provider/Admin | Notify new booking request  |
| `booking-accepted`              | Server → Customer       | Provider accepted           |
| `booking-rejected`              | Server → Customer       | Provider rejected           |
| `booking-updated`               | Server → Customer/Admin | Status update broadcast     |
| `booking-cancelled`             | Server → Provider       | Customer cancelled          |
| `payment-confirmed`             | Server → User           | Payment success notice      |
| `provider-availability-changed` | Server → All            | Availability status changed |
| `online-users`                  | Server → All            | List of online user IDs     |
| `force_logout`                  | Server → User           | Session terminated remotely |

---

## 🚀 Local Setup

## 1) Clone + Install

```bash
git clone https://github.com/YOUR_USERNAME/homefix.git
cd homefix

cd backend
npm install

cd ../frontend
npm install
```

## 2) Backend `.env` (required baseline)

Create `backend/.env`:

```env
PORT=5000
NODE_ENV=development

# Database
MONGODB_URI=mongodb://localhost:27017/homefix
# MONGODB_URI_SRV=mongodb+srv://<user>:<pass>@cluster.mongodb.net/homefix
MONGODB_DNS_SERVERS=8.8.8.8,1.1.1.1

# Auth
JWT_SECRET=replace_with_strong_secret
JWT_EXPIRE=7d

# CORS + URLs
# Add both local and production origins as comma-separated values
CLIENT_URL=http://localhost:5173,https://your-app.vercel.app
FRONTEND_URL=http://localhost:5173,https://your-app.vercel.app

# Razorpay
RAZORPAY_KEY_ID=rzp_test_xxxxx
RAZORPAY_KEY_SECRET=xxxxxxxx

# Email (SMTP via Nodemailer)
SMTP_HOST=smtp.gmail.com
SMTP_PORT=587
SMTP_SECURE=false
SMTP_USER=your_email_username
SMTP_PASS=your_email_password_or_app_password
EMAIL_FROM_NAME=HomeFix
EMAIL_FROM_EMAIL=no-reply@homefix.com

# Cloudinary (if uploading profile/work images)
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_cloudinary_key
CLOUDINARY_API_SECRET=your_cloudinary_secret

# Optional seed admin
ADMIN_EMAIL=admin@homefix.com
ADMIN_PASSWORD=strong_admin_password
```

Run backend:

```bash
cd backend
npm run dev
```

## 3) Frontend `.env`

Create `frontend/.env`:

```env
VITE_API_URL=http://localhost:5000/api
VITE_SOCKET_URL=http://localhost:5000
VITE_ENABLE_SOCKET=true
```

Run frontend:

```bash
cd frontend
npm run dev
```

## 4) Optional Seed

```bash
cd backend
npm run seed
```

---

## 📜 Available Scripts

### Backend

- `npm run dev` → starts with nodemon
- `npm start` → starts with node
- `npm run seed` → seeds sample data

### Frontend

- `npm run dev` → starts Vite dev server
- `npm run build` → production build
- `npm run preview` → preview build locally
- `npm run lint` → run ESLint

---

## 🌐 Deployment Guidance

- **Recommended for full real-time support:** deploy backend to Render/Railway/Fly/VM (non-serverless)
- **If backend is serverless (e.g., Vercel):** set `VITE_ENABLE_SOCKET=false` to avoid repeated socket retries
- **Always set backend `CLIENT_URL`** to frontend origin(s), comma-separated if needed
- **Email in production:** set `SMTP_HOST`, `SMTP_PORT`, `SMTP_SECURE`, `SMTP_USER`, `SMTP_PASS`, `EMAIL_FROM_NAME`, and `EMAIL_FROM_EMAIL`
- Verify deployment via: `GET https://<backend-domain>/api/health`

---

## 🧪 How to Review/Rate This Project Quickly

Use this checklist if you are evaluating quality:

1. **Runability:** Does local setup work in <10 minutes?
2. **Architecture clarity:** Are frontend/backend responsibilities separated cleanly?
3. **Role security:** Are customer/provider/admin routes guarded correctly?
4. **Business flow:** Can a booking go from creation → acceptance/rejection → payment → review?
5. **Operational readiness:** Are health checks, rate limits, CORS, and env configuration present?
6. **Real-time behavior:** Are booking + availability events propagated correctly?

---

## 📊 Project Analysis (Current State)

### What is strong

- Good separation of concerns (`routes` → `controllers` → `models`)
- Real-world features (payments, real-time updates, favorites, reviews)
- RBAC structure is implemented consistently in route layers
- API has health endpoint + rate limiting + CORS controls

### Improvement opportunities

- Add automated tests (unit/integration/e2e) for critical flows
- Add API docs/spec (OpenAPI/Swagger) for external consumers
- Add CI pipeline (lint + test + build checks)
- Add explicit error catalog and response schema examples

### Overall assessment

HomeFix is a **strong portfolio-grade full-stack project** with practical production concepts. With testing + CI + formal API documentation, it can move from “very good” to “industry-ready.”

---

## 👥 User Roles

| Role     | Access                                                                 |
| -------- | ---------------------------------------------------------------------- |
| Customer | Search providers, book services, pay, track bookings, review, favorite |
| Provider | Manage availability/profile, handle bookings                           |
| Admin    | Monitor platform, manage users/bookings, view analytics                |

---

## 📄 License

Licensed under the MIT License.

---



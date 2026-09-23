# 🩸 Blood Link — Backend API

> **A secure, scalable backend for connecting blood donors with patients, hospitals, and blood requests through intelligent donor matching, verification, payments, appointments, and donation tracking.**

Blood Link is a full-featured blood donation and emergency coordination platform designed to streamline the process of creating blood requests, verifying requests, finding compatible nearby donors, coordinating donor offers, processing payments, scheduling appointments, and completing donations.

The backend is built with **Node.js, TypeScript, Express.js, Prisma ORM, PostgreSQL, Redis, and modern authentication and notification technologies**.

---

## 📌 Table of Contents

* [Overview](#-overview)
* [Core Features](#-core-features)
* [System Workflow](#-system-workflow)
* [Blood Request Workflow](#-blood-request-workflow)
* [Donor Matching Workflow](#-donor-matching-workflow)
* [Donor Offer Workflow](#-donor-offer-workflow)
* [Payment Workflow](#-payment-workflow)
* [Appointment Workflow](#-appointment-workflow)
* [Donation Workflow](#-donation-workflow)
* [Authentication Flow](#-authentication-flow)
* [User Roles](#-user-roles)
* [Blood Compatibility](#-blood-compatibility)
* [Distance-Based Matching](#-distance-based-matching)
* [Notification System](#-notification-system)
* [Email System](#-email-system)
* [Technology Stack](#-technology-stack)
* [Project Architecture](#-project-architecture)
* [Database Architecture](#-database-architecture)
* [API Architecture](#-api-architecture)
* [Environment Variables](#-environment-variables)
* [Installation](#-installation)
* [Development](#-development)
* [Database Setup](#-database-setup)
* [API Documentation](#-api-documentation)
* [Security](#-security)
* [Error Handling](#-error-handling)
* [Project Goals](#-project-goals)
* [Future Improvements](#-future-improvements)
* [Author](#-author)

---

# 🩸 Overview

**Blood Link** is designed to solve a common problem in emergency blood donation:

> Finding the right donor at the right time and coordinating the complete donation process from request creation to successful donation.

Instead of treating blood donation as a simple donor-search application, Blood Link provides an end-to-end workflow:

```text
User Registration
       ↓
Email Verification
       ↓
Authentication
       ↓
Blood Request Creation
       ↓
Admin Verification
       ↓
Blood Group Compatibility
       ↓
Donor Eligibility Check
       ↓
Distance-Based Matching
       ↓
Donor Offers
       ↓
Requester Payment
       ↓
Donor Notification
       ↓
Appointment Scheduling
       ↓
Blood Donation
       ↓
Donation Completion
```

The backend is responsible for enforcing business rules, maintaining transactional consistency, protecting user data, and coordinating communication between requesters, donors, hospitals, and administrators.

---

# 🚀 Core Features

## 🔐 Authentication & Authorization

* User registration
* Email OTP verification
* Secure password hashing
* Login/logout
* Authentication using HTTP cookies
* Role-based authorization
* User status management
* Password reset using OTP
* Password change notification
* Google authentication support
* Email verification
* Protected API routes

---

## 👥 User Management

Blood Link supports multiple user roles with different responsibilities.

Supported roles include:

* `CALLER`
* `DONOR`
* `PATIENT`
* `HOSPITAL`
* `ADMIN`
* `SUPER_ADMIN`

The role-based architecture allows each type of user to access only the operations relevant to them.

---

# 🩸 Blood Request Management

Users can create blood requests containing information such as:

* Blood group
* Blood component
* Required units
* Urgency
* Required date
* Required time
* Division
* District
* Area
* Address
* Geographic coordinates
* Patient/requester information

Example blood components:

```text
WHOLE_BLOOD
RBC
PLASMA
PLATELETS
CRYOPRECIPITATE
```

Example urgency levels:

```text
NORMAL
URGENT
EMERGENCY
```

Blood requests go through a controlled lifecycle instead of immediately becoming active donor-matching requests.

---

# 🔄 System Workflow

The overall Blood Link workflow can be represented as:

```text
┌─────────────────────┐
│     User Signup     │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Email OTP Verify    │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│     Login/Auth      │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Create Blood Request│
└──────────┬──────────┘
           ↓
┌──────────────────────────┐
│ PENDING_VERIFICATION     │
└──────────┬───────────────┘
           ↓
┌─────────────────────┐
│ Admin Verification │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Request Approved    │
└──────────┬──────────┘
           ↓
┌─────────────────────────────┐
│ Find Compatible Donors      │
│                             │
│ • Blood compatibility       │
│ • Donor availability        │
│ • Donor eligibility         │
│ • Distance                  │
│ • Existing offers           │
└──────────┬──────────────────┘
           ↓
┌─────────────────────┐
│ Donor Offer Created │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Donor Accepts Offer │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Requester Payment   │
└──────────┬──────────┘
           ↓
┌─────────────────────┐
│ Payment Confirmed   │
└──────────┬──────────┘
           ↓
┌──────────────────────┐
│ Appointment Booking  │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Blood Donation       │
└──────────┬───────────┘
           ↓
┌──────────────────────┐
│ Donation Completed   │
└──────────────────────┘
```

---

# 📋 Blood Request Workflow

A blood request follows a controlled verification process.

### 1. Request Creation

An authorized user creates a blood request.

The request contains:

```text
Blood Group
Blood Component
Units Required
Urgency
Required Date
Required Time
Location
Patient/Requester Information
```

The initial status is:

```text
PENDING_VERIFICATION
```

### 2. Admin Verification

An administrator reviews the request.

Possible outcomes include:

```text
APPROVED
REJECTED
```

Only approved requests proceed to donor matching.

### 3. Donor Matching

After approval, the backend starts the donor matching process.

The matching engine evaluates:

* Blood group compatibility
* Donor availability
* Donor eligibility
* Geographic distance
* Existing donor offers
* Donor/user status

---

# 🎯 Donor Matching Workflow

Blood Link uses multiple criteria to identify potential donors.

```text
Approved Request
       ↓
Find Active Donors
       ↓
Check Blood Compatibility
       ↓
Check Donor Availability
       ↓
Check Donation Eligibility
       ↓
Calculate Distance
       ↓
Apply Distance Limit
       ↓
Exclude Existing Offers
       ↓
Create Donor Offers
       ↓
Notify Matching Donors
```

## Matching Criteria

### Blood Compatibility

The backend determines compatible donor blood groups based on the requested blood group and component.

### Donor Availability

Only donors who are currently available for donation are considered.

### Donor Eligibility

The system checks whether the donor is eligible to donate based on the platform's donation rules.

### Geographic Distance

The system calculates the distance between:

```text
Blood Request Location
             ↓
Donor Location
```

using geographic coordinates.

Donors outside the configured matching radius are excluded.

### Duplicate Prevention

Existing donor offers are checked before creating a new offer.

This prevents the same donor from receiving duplicate offers for the same request.

---

# 🤝 Donor Offer Workflow

After matching, Blood Link creates donor offers.

Example lifecycle:

```text
PENDING
   ↓
ACCEPTED
   ↓
PAYMENT_PENDING
   ↓
PAYMENT_COMPLETED
   ↓
APPOINTMENT_SCHEDULED
   ↓
DONATION_COMPLETED
```

Depending on the request lifecycle, an offer may also be:

```text
REJECTED
EXPIRED
CANCELLED
```

The donor receives notification when a suitable request becomes available.

---

# 💳 Payment Workflow

Payment is an important part of the Blood Link coordination process.

The platform integrates payment processing so that required service/transport/platform charges can be handled before the final donation coordination stage.

The payment workflow is approximately:

```text
Donor Offer Accepted
        ↓
Payment Required
        ↓
Requester Creates Payment
        ↓
Payment Gateway
        ↓
Payment Verification
        ↓
Payment Successful
        ↓
Update Payment Status
        ↓
Notify Donor
        ↓
Appointment Can Be Scheduled
```

The project uses **bKash** as the intended payment provider.

Payment-related operations are designed to ensure that payment status is verified before subsequent workflow steps are enabled.

---

# 📅 Appointment Workflow

Once the required payment is completed, the donor can proceed to schedule an appointment.

```text
Payment Completed
       ↓
Appointment Availability
       ↓
Donor Selects Date
       ↓
Appointment Created
       ↓
Appointment Confirmed
       ↓
Donation
```

Appointment creation validates:

* Blood request
* Donor
* Appointment date
* Request state
* Payment state
* Existing appointment constraints

The appointment date must represent a valid future appointment according to the application's business rules.

---

# 🩸 Donation Workflow

The donation process connects the appointment and blood request.

A simplified lifecycle is:

```text
Appointment Scheduled
       ↓
Donor Arrives
       ↓
Donation Process
       ↓
Donation Recorded
       ↓
Units Fulfilled Updated
       ↓
Donation Completed
       ↓
Request Status Updated
```

The `Donation` entity tracks information such as:

* Donation number
* Blood request
* Donor
* Hospital
* Donation status
* Donation information
* Related appointment/request information

This creates a traceable relationship between:

```text
Request
   ↕
Donor
   ↕
Appointment
   ↕
Donation
```

---

# 🔐 Authentication Flow

Blood Link uses OTP-based email verification for account registration and password recovery.

## Registration

```text
User submits registration
          ↓
Generate OTP
          ↓
Store OTP in Redis
          ↓
Send OTP through email
          ↓
User submits OTP
          ↓
Verify OTP
          ↓
Create/activate account
```

Redis is used for short-lived OTP storage.

Example key structure:

```text
User-Registration-OTP:{email}
```

Registration-related temporary data can also be stored in Redis with an expiration period.

---

## Forgot Password

```text
Forgot Password
      ↓
Generate OTP
      ↓
Store OTP in Redis
      ↓
Send Email
      ↓
Verify OTP
      ↓
Reset Password
      ↓
Password Changed
```

---

# 👤 User Roles

## CALLER

Can create/manage blood requests on behalf of patients where permitted by the business rules.

## DONOR

Can:

* Maintain donor profile
* Manage availability
* Receive donor offers
* Accept/reject offers
* Schedule appointments
* Complete donations
* View relevant donation information

## PATIENT

Can create and manage their own blood-related requests where permitted.

## HOSPITAL

Can participate in blood request and donation workflows and maintain hospital-related information.

## ADMIN

Responsible for:

* Blood request verification
* User management
* Request management
* Monitoring system operations
* Managing administrative workflows

## SUPER_ADMIN

Provides higher-level administrative capabilities and system-level management.

---

# 🧬 Blood Compatibility

Blood Link contains a compatibility layer that determines which donor blood groups can be considered for a particular blood request.

Example ABO groups:

```text
A
B
AB
O
```

The matching service determines compatible groups according to the blood component and platform rules before donors are selected.

This keeps compatibility logic centralized instead of duplicating it across controllers.

---

# 📍 Distance-Based Matching

Blood Link uses geographic coordinates to calculate the distance between a blood request and a donor.

The system works with:

```text
Latitude
Longitude
```

A distance calculation utility is used to determine the approximate distance between two locations.

Conceptually:

```text
Request Coordinates
        ↓
Distance Calculation
        ↓
Distance <= Matching Radius?
        ↓
      YES
        ↓
Eligible Donor
```

This helps prioritize geographically relevant donors and prevents unsuitable distant donors from being included in the matching process.

---

# 🔔 Notification System

Blood Link supports multiple notification channels.

## Push Notifications

Web push notifications can be sent to matching donors when a new blood request becomes available.

Example:

```text
New Blood Request

Blood Group: A+
Urgency: EMERGENCY
Location: Dhaka
```

## Email Notifications

Important workflow events can trigger emails, including:

* Registration verification
* Welcome email
* Password reset
* Password changed
* New blood request
* Donor offer
* Payment confirmation
* Appointment-related communication
* Donation-related communication

---

# ✉️ Email Template System

Transactional emails are separated into reusable templates.

Example structure:

```text
src/
└── app/
    └── templates/
        ├── auth/
        │   ├── welcome.ejs
        │   ├── email-verification.ejs
        │   ├── forgot-password.ejs
        │   └── password-changed.ejs
        │
        └── blood-request/
            └── blood-request-donor.ejs
```

Using EJS templates keeps email presentation separate from business logic.

---

# 🧰 Technology Stack

## Backend

| Technology | Purpose                  |
| ---------- | ------------------------ |
| Node.js    | JavaScript runtime       |
| TypeScript | Type safety              |
| Express.js | REST API framework       |
| Prisma     | ORM                      |
| PostgreSQL | Primary database         |
| Redis      | OTP/cache/temporary data |
| EJS        | Email templates          |

## Authentication & Security

| Technology                  | Purpose             |
| --------------------------- | ------------------- |
| JWT / Cookie Authentication | User authentication |
| bcrypt                      | Password hashing    |
| Zod                         | Request validation  |
| Role-based authorization    | Access control      |

## Integrations

| Technology       | Purpose                       |
| ---------------- | ----------------------------- |
| bKash            | Payment processing            |
| Web Push         | Real-time donor notifications |
| Email Service    | Transactional communication   |
| Geolocation APIs | Address/coordinate handling   |

---

# 🏗️ Project Architecture

The project follows a modular backend architecture.

A simplified structure:

```text
src/
│
├── app/
│   ├── modules/
│   │   ├── auth/
│   │   ├── user/
│   │   ├── donor/
│   │   ├── patient/
│   │   ├── hospital/
│   │   ├── bloodRequest/
│   │   ├── donorOffer/
│   │   ├── payment/
│   │   ├── appointment/
│   │   ├── donation/
│   │   └── notification/
│   │
│   ├── templates/
│   │   ├── auth/
│   │   └── blood-request/
│   │
│   ├── middlewares/
│   ├── errors/
│   └── utils/
│
├── config/
│
├── routes/
│
├── app.ts
└── server.ts
```

The exact folder structure may evolve as the application grows.

---

# 🗄️ Database Architecture

The project uses **PostgreSQL** with **Prisma ORM**.

Major domain entities include:

```text
User
 │
 ├── DonorProfile
 ├── PatientProfile
 └── HospitalProfile
 │
 ├── BloodRequest
 │
 ├── BloodRequestDonor
 │
 ├── Payment
 │
 ├── Appointment
 │
 ├── Donation
 │
 ├── Notification
 │
 └── AuditLog
```

Additional relationships support:

* Donor offers
* Donation history
* Blood requests
* Reservations
* Appointments
* Payments
* Notifications
* Audit logs

This relational model allows the platform to maintain a complete history of the blood donation lifecycle.

---

# 🔄 Core Domain Relationship

The core relationship can be visualized as:

```text
                    ┌─────────────┐
                    │    User     │
                    └──────┬──────┘
                           │
              ┌────────────┼────────────┐
              ↓            ↓            ↓
          Donor        Patient      Hospital
              │
              ↓
        Donor Profile
              │
              ↓
       Donor Availability
              │
              ↓
      ┌───────────────────┐
      │ Blood Request     │
      └─────────┬─────────┘
                ↓
        Donor Matching
                ↓
         Donor Offer
                ↓
            Payment
                ↓
          Appointment
                ↓
            Donation
```

---

# 🌐 API Architecture

The backend follows a RESTful API architecture.

Typical request flow:

```text
HTTP Request
     ↓
Router
     ↓
Authentication Middleware
     ↓
Authorization Middleware
     ↓
Validation
     ↓
Controller
     ↓
Service
     ↓
Prisma
     ↓
PostgreSQL
     ↓
Response
```

Business logic is primarily handled in service layers rather than directly inside controllers.

This keeps controllers lightweight and makes business logic easier to test and maintain.

---

# 🛡️ Validation

The API uses **Zod** for input validation.

Validation is applied to important operations such as:

* User registration
* Login
* Blood request creation
* Blood request updates
* Donor offers
* Payments
* Appointments
* Donation records

Example:

```ts
const createAppointmentValidation = z.object({
  requestId: z.uuid(),
  appointmentDate: z.coerce.date(),
});
```

Validation helps ensure malformed or invalid requests do not reach the business logic layer.

---

# ⚙️ Environment Variables

Create a `.env` file in the project root.

Example:

```env
NODE_ENV=development

PORT=5000

DATABASE_URL="postgresql://USER:PASSWORD@HOST:PORT/DATABASE"

REDIS_HOST=
REDIS_PORT=
REDIS_USERNAME=
REDIS_PASSWORD=

JWT_ACCESS_SECRET=
JWT_REFRESH_SECRET=

EMAIL_USER=
EMAIL_PASSWORD=
EMAIL_FROM=

BKASH_APP_KEY=
BKASH_APP_SECRET=
BKASH_USERNAME=
BKASH_PASSWORD=
BKASH_BASE_URL=

WEB_PUSH_PUBLIC_KEY=
WEB_PUSH_PRIVATE_KEY=
WEB_PUSH_SUBJECT=
```

> Never commit real credentials, API keys, passwords, tokens, or private keys to GitHub.

---

# 🚀 Installation

## 1. Clone the repository

```bash
git clone <your-repository-url>
```

## 2. Enter the project

```bash
cd <project-directory>
```

## 3. Install dependencies

```bash
npm install
```

## 4. Configure environment variables

Create:

```text
.env
```

and add the required environment variables.

## 5. Generate Prisma Client

```bash
npx prisma generate
```

## 6. Run database migrations

```bash
npx prisma migrate dev
```

## 7. Start development server

```bash
npm run dev
```

The API will be available at:

```text
http://localhost:5000
```

---

# 🗃️ Database Commands

Generate Prisma Client:

```bash
npx prisma generate
```

Create a migration:

```bash
npx prisma migrate dev --name migration_name
```

Deploy migrations:

```bash
npx prisma migrate deploy
```

Open Prisma Studio:

```bash
npx prisma studio
```

---

# 🧪 Development

Recommended development workflow:

```bash
npm run dev
```

Build:

```bash
npm run build
```

Start production build:

```bash
npm start
```

If linting is configured:

```bash
npm run lint
```

---

# 📚 API Documentation

API documentation can be exposed through Swagger/OpenAPI.

A typical development endpoint can be:

```text
http://localhost:5000/api-docs
```

The API can be organized into modules such as:

```text
/api/auth
/api/users
/api/donors
/api/patients
/api/hospitals
/api/blood-requests
/api/donor-offers
/api/payments
/api/appointments
/api/donations
/api/notifications
```

> Update the paths above if your implementation uses different route prefixes.

---

# 🔒 Security

Security is an important part of Blood Link because the platform handles personal, authentication, payment, and health-related workflow data.

Security measures include:

* Password hashing
* Authentication middleware
* Role-based authorization
* Request validation
* HTTP-only authentication cookies where applicable
* OTP expiration
* Redis-based temporary credential storage
* Environment-based secrets
* Protected administrative routes
* Duplicate operation prevention
* Database constraints
* Centralized error handling

Sensitive credentials should never be stored directly in source code.

---

# ⚠️ Error Handling

The backend uses centralized error handling to provide consistent API responses.

Typical errors include:

```text
Validation Error
Authentication Error
Authorization Error
Not Found
Conflict
Database Error
Payment Error
External Service Error
```

A consistent response format makes it easier for frontend applications to consume API errors.

Example:

```json
{
  "success": false,
  "message": "Blood request not found",
  "error": {
    "code": "NOT_FOUND"
  }
}
```

---

# 🔁 Example End-to-End Scenario

Consider a patient who urgently needs blood.

### Step 1 — Create Request

The requester submits:

```text
Blood Group: O+
Component: WHOLE_BLOOD
Units: 2
Urgency: EMERGENCY
Location: Dhaka
Required Date: ...
Required Time: ...
```

### Step 2 — Verification

The request enters:

```text
PENDING_VERIFICATION
```

An administrator reviews and approves it.

### Step 3 — Matching

Blood Link searches eligible donors.

The system checks:

```text
Is donor active?
        ↓
Is donor available?
        ↓
Is blood group compatible?
        ↓
Is donor eligible?
        ↓
Is donor within matching radius?
        ↓
Does donor already have an offer?
```

### Step 4 — Donor Offer

An eligible donor receives an offer.

```text
New Blood Request
        ↓
Donor Accepts
```

### Step 5 — Payment

The requester completes the required payment.

```text
Payment Initiated
       ↓
Payment Verified
       ↓
Payment Successful
```

### Step 6 — Appointment

The donor schedules an appointment.

```text
Appointment Created
```

### Step 7 — Donation

The donor completes the donation.

```text
Donation Recorded
       ↓
Units Fulfilled Updated
       ↓
Request/Donation Completed
```

This provides a traceable end-to-end transaction from request creation to donation completion.

---

# 📊 Business Rules

Some of the important business rules implemented by the backend include:

### Blood Requests

* Only authorized users can create requests.
* New requests require verification.
* Only approved requests enter donor matching.
* Required date/time must satisfy the request's scheduling rules.
* Units required are validated against configured limits.

### Donor Matching

* Only active donors are considered.
* Donor availability is checked.
* Blood compatibility is checked.
* Donation eligibility is checked.
* Distance is considered.
* Existing offers are excluded.

### Payments

* Payment status is tracked independently.
* Successful payment unlocks the appropriate next workflow stage.
* Payment confirmation can trigger donor notification.

### Appointments

* Appointment requests must reference valid blood requests.
* Appointment dates are validated.
* Appointment scheduling follows the payment/request workflow.

### Donations

* Donations are linked to a request and donor.
* Donation records maintain traceability.
* Fulfilled units can be tracked against requested units.

---

# 🧩 Design Principles

The backend is designed around several principles:

### Separation of Concerns

```text
Routes
  ↓
Controllers
  ↓
Services
  ↓
Database
```

Each layer has a specific responsibility.

### Reusable Business Logic

Complex operations such as donor matching, blood compatibility, distance calculation, and notification delivery are isolated into reusable services/utilities.

### Validation First

Invalid input should be rejected before reaching business logic.

### Transactional Consistency

Critical operations involving multiple database records should maintain consistent state.

### Traceability

Requests, donor offers, payments, appointments, and donations are connected so that the complete workflow can be audited.

---

# 🧠 Important Backend Services

Some of the key backend services include:

```text
Authentication Service
        ↓
User Service
        ↓
Blood Request Service
        ↓
Donor Matching Service
        ↓
Donor Offer Service
        ↓
Payment Service
        ↓
Appointment Service
        ↓
Donation Service
        ↓
Notification Service
```

The donor matching service is particularly important because it combines multiple business rules into a single workflow.

---

# 🔮 Future Improvements

Potential future improvements include:

* Advanced donor ranking
* Smarter donor availability prediction
* Hospital inventory management
* Blood bank integration
* Real-time request tracking
* SMS notifications
* Advanced admin dashboard
* Analytics and reporting
* Donation history analytics
* Automated donor reminders
* Appointment reminders
* Payment reconciliation
* Improved audit logging
* Automated expired-request handling
* Queue-based background processing
* Redis-based caching
* Automated testing and integration testing
* Docker containerization
* CI/CD pipeline
* Production monitoring and observability

---

# 🧪 Testing Strategy

The backend can be tested at multiple levels:

```text
Unit Tests
    ↓
Service Tests
    ↓
Integration Tests
    ↓
API Tests
    ↓
End-to-End Tests
```

Important areas for automated testing include:

* Authentication
* OTP verification
* Blood compatibility
* Donor eligibility
* Distance calculation
* Donor matching
* Duplicate donor offers
* Payment verification
* Appointment validation
* Donation completion
* Authorization

---

# 📈 Scalability Considerations

The architecture is designed so that high-load operations can later be moved into background processing.

For example:

```text
Blood Request Approved
        ↓
Queue Job
        ↓
Donor Matching Worker
        ↓
Create Offers
        ↓
Notification Worker
        ↓
Push/Email Notifications
```

Redis can also be extended for:

* Caching
* Rate limiting
* Temporary data
* Background job queues
* Distributed coordination

This allows the system to scale without putting all processing directly inside HTTP request/response cycles.

---

# 🗺️ High-Level Architecture

```text
                         ┌────────────────────┐
                         │      Client        │
                         │ Web / Mobile App   │
                         └─────────┬──────────┘
                                   │
                                   ▼
                         ┌────────────────────┐
                         │    REST API        │
                         │    Express.js      │
                         └─────────┬──────────┘
                                   │
                    ┌──────────────┼──────────────┐
                    │              │              │
                    ▼              ▼              ▼
              Authentication   Validation    Authorization
                    │              │              │
                    └──────────────┼──────────────┘
                                   ▼
                         ┌────────────────────┐
                         │    Controllers    │
                         └─────────┬──────────┘
                                   ▼
                         ┌────────────────────┐
                         │     Services      │
                         └─────────┬──────────┘
                                   │
             ┌─────────────────────┼─────────────────────┐
             │                     │                     │
             ▼                     ▼                     ▼
       ┌───────────┐         ┌───────────┐        ┌────────────┐
       │ PostgreSQL│         │   Redis   │        │ External   │
       │  Prisma   │         │   Cache   │        │ Services   │
       └───────────┘         └───────────┘        └────────────┘
                                                        │
                                      ┌─────────────────┼─────────────────┐
                                      │                 │                 │
                                      ▼                 ▼                 ▼
                                    bKash             Email            Web Push
```

---

# 📌 Project Status

**Status:** Active Development 🚧

Blood Link is being developed as a production-oriented blood donation coordination backend with a focus on:

* Clean architecture
* Secure authentication
* Reliable donor matching
* Payment integration
* Appointment management
* Donation tracking
* Notifications
* Maintainable TypeScript code

---

# 👨‍💻 Author

**Mohammad Moniruzzaman**

Full Stack Web Developer

### Technologies

```text
JavaScript
TypeScript
React
Next.js
Node.js
Express.js
PostgreSQL
Prisma
MongoDB
Redis
REST API
```

### Project Focus

```text
Backend Engineering
API Development
Database Design
Authentication
Payment Integration
Real-Time Notifications
Scalable Web Applications
```

---

# ⭐ Contributing

Contributions, suggestions, and improvements are welcome.

For major changes, please open an issue first to discuss the proposed change.

---

# 📄 License

This project is currently intended for development and portfolio purposes.

Add an appropriate open-source license before accepting external contributions or distributing the project publicly.

---

## 🩸 Blood Link

**Connecting people who need blood with people who can donate.**

```text
REQUEST → VERIFY → MATCH → OFFER → PAY → APPOINT → DONATE
```

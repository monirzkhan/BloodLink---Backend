BloodLink-Backend/
│
├── src/
│   │
│   ├── app.ts
│   ├── server.ts
│   │
│   ├── config/
│   │   ├── env.ts
│   │   ├── database.ts
│   │   ├── redis.ts
│   │   ├── cors.ts
│   │   └── logger.ts
│   │
│   ├── routes/
│   │   └── index.ts
│   │
│   ├── middlewares/
│   │   ├── auth.middleware.ts
│   │   ├── role.middleware.ts
│   │   ├── error.middleware.ts
│   │   ├── validation.middleware.ts
│   │   ├── rateLimit.middleware.ts
│   │   └── upload.middleware.ts
│   │
│   ├── modules/
│   │   │
│   │   ├── auth/
│   │   │   ├── auth.controller.ts
│   │   │   ├── auth.service.ts
│   │   │   ├── auth.repository.ts
│   │   │   ├── auth.route.ts
│   │   │   ├── auth.validation.ts
│   │   │   └── auth.types.ts
│   │   │
│   │   ├── user/
│   │   │   ├── user.controller.ts
│   │   │   ├── user.service.ts
│   │   │   ├── user.repository.ts
│   │   │   ├── user.route.ts
│   │   │   ├── user.validation.ts
│   │   │   └── user.types.ts
│   │   │
│   │   ├── donor/
│   │   │   ├── donor.controller.ts
│   │   │   ├── donor.service.ts
│   │   │   ├── donor.repository.ts
│   │   │   ├── donor.route.ts
│   │   │   ├── donor.validation.ts
│   │   │   └── donor.types.ts
│   │   │
│   │   ├── patient/
│   │   │   ├── patient.controller.ts
│   │   │   ├── patient.service.ts
│   │   │   ├── patient.repository.ts
│   │   │   ├── patient.route.ts
│   │   │   └── patient.validation.ts
│   │   │
│   │   ├── hospital/
│   │   │   ├── hospital.controller.ts
│   │   │   ├── hospital.service.ts
│   │   │   ├── hospital.repository.ts
│   │   │   ├── hospital.route.ts
│   │   │   └── hospital.validation.ts
│   │   │
│   │   ├── bloodRequest/
│   │   │   ├── bloodRequest.controller.ts
│   │   │   ├── bloodRequest.service.ts
│   │   │   ├── bloodRequest.repository.ts
│   │   │   ├── bloodRequest.route.ts
│   │   │   ├── bloodRequest.validation.ts
│   │   │   └── bloodRequest.types.ts
│   │   │
│   │   ├── matching/
│   │   │   ├── matching.controller.ts
│   │   │   ├── matching.service.ts
│   │   │   ├── matching.repository.ts
│   │   │   ├── matching.route.ts
│   │   │   ├── compatibility.ts
│   │   │   └── matching.types.ts
│   │   │
│   │   ├── reservation/
│   │   │   ├── reservation.controller.ts
│   │   │   ├── reservation.service.ts
│   │   │   ├── reservation.repository.ts
│   │   │   └── reservation.route.ts
│   │   │
│   │   ├── appointment/
│   │   │   ├── appointment.controller.ts
│   │   │   ├── appointment.service.ts
│   │   │   ├── appointment.repository.ts
│   │   │   ├── appointment.route.ts
│   │   │   └── appointment.validation.ts
│   │   │
│   │   ├── donation/
│   │   │   ├── donation.controller.ts
│   │   │   ├── donation.service.ts
│   │   │   ├── donation.repository.ts
│   │   │   ├── donation.route.ts
│   │   │   └── donation.validation.ts
│   │   │
│   │   ├── payment/
│   │   │   ├── payment.controller.ts
│   │   │   ├── payment.service.ts
│   │   │   ├── payment.repository.ts
│   │   │   ├── payment.route.ts
│   │   │   ├── payment.validation.ts
│   │   │   └── providers/
│   │   │       ├── payment.interface.ts
│   │   │       └── bkash/
│   │   │           ├── bkash.service.ts
│   │   │           ├── bkash.api.ts
│   │   │           ├── bkash.types.ts
│   │   │           └── bkash.utils.ts
│   │   │
│   │   ├── notification/
│   │   │   ├── notification.controller.ts
│   │   │   ├── notification.service.ts
│   │   │   ├── notification.repository.ts
│   │   │   ├── notification.route.ts
│   │   │   └── providers/
│   │   │       ├── email/
│   │   │       ├── sms/
│   │   │       └── push/
│   │   │
│   │   ├── admin/
│   │   │   ├── admin.controller.ts
│   │   │   ├── admin.service.ts
│   │   │   ├── admin.route.ts
│   │   │   └── admin.validation.ts
│   │   │
│   │   └── audit/
│   │       ├── audit.service.ts
│   │       └── audit.repository.ts
│   │
│   ├── jobs/
│   │   ├── requestExpiry.job.ts
│   │   ├── donorMatching.job.ts
│   │   ├── notification.job.ts
│   │   └── reservationExpiry.job.ts
│   │
│   ├── templates/
│   │   ├── email/
│   │   │   ├── welcome.ejs
│   │   │   ├── email-verification.ejs
│   │   │   ├── forgot-password.ejs
│   │   │   ├── password-changed.ejs
│   │   │   ├── login-success.ejs
│   │   │   ├── donor-match.ejs
│   │   │   ├── blood-request-approved.ejs
│   │   │   ├── payment-success.ejs
│   │   │   └── donation-confirmed.ejs
│   │   │
│   │   └── sms/
│   │       ├── donor-match.txt
│   │       ├── otp.txt
│   │       └── payment-success.txt
│   │
│   ├── utils/
│   │   ├── jwt.ts
│   │   ├── bcrypt.ts
│   │   ├── otp.ts
│   │   ├── pagination.ts
│   │   ├── distance.ts
│   │   ├── response.ts
│   │   └── generateNumber.ts
│   │
│   ├── constants/
│   │   ├── bloodGroups.ts
│   │   ├── roles.ts
│   │   ├── status.ts
│   │   └── messages.ts
│   │
│   └── types/
│       ├── express.d.ts
│       └── common.ts
│
├── prisma/
│   ├── schema.prisma
│   ├── migrations/
│   └── seed.ts
│
├── uploads/
│
├── tests/
│   ├── auth/
│   ├── bloodRequest/
│   ├── matching/
│   ├── payment/
│   └── donation/
│
├── .env
├── .env.example
├── .gitignore
├── package.json
├── tsconfig.json
└── README.md


## Recommended Route Tree

/api/v1

├── /auth
├── /users
├── /donors
├── /patients
├── /hospitals
├── /blood-requests
├── /matching
├── /reservations
├── /appointments
├── /donations
├── /payments
├── /notifications
└── /admin

## Complete Business Flow

                    USER
                     │
                     ▼
                Register/Login
                     │
                     ▼
              Patient / Caller
                     │
                     ▼
            Create Blood Request
                     │
                     ▼
              Validation Layer
                     │
                     ▼
          PENDING_VERIFICATION
                     │
                     ▼
                   ADMIN
                     │
              ┌──────┴──────┐
              │             │
           Reject         Approve
              │             │
              ▼             ▼
          REJECTED       MATCHING
                            │
                            ▼
                    Matching Engine
                            │
                ┌───────────┼───────────┐
                │           │           │
            Blood Group  Availability  Location
                │           │           │
                └───────────┼───────────┘
                            │
                            ▼
                      Match Ranking
                            │
                            ▼
                     Donor Notification
                            │
                   ┌────────┴────────┐
                   │                 │
                Decline            Accept
                   │                 │
                   │                 ▼
                   │             Reservation
                   │                 │
                   │                 ▼
                   │          Calculate Charges
                   │                 │
                   │                 ▼
                   │            Create Payment
                   │                 │
                   │                 ▼
                   │               bKash
                   │                 │
                   │          ┌──────┴──────┐
                   │          │             │
                   │       SUCCESS        FAILED
                   │          │             │
                   │          ▼             ▼
                   │     Appointment     Retry/Cancel
                   │          │
                   │          ▼
                   │       Hospital
                   │          │
                   │          ▼
                   │      Screening
                   │          │
                   │     ┌────┴────┐
                   │     │         │
                   │  Ineligible  Eligible
                   │     │         │
                   │     ▼         ▼
                   │  Cancel    Donation
                   │               │
                   │               ▼
                   │      Hospital Confirmation
                   │               │
                   │               ▼
                   │        Update Fulfillment
                   │               │
                   │               ▼
                   │       Request Completed
                   │
                   └───────────────┘
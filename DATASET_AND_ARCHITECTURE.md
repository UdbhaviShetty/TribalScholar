# Unified Scholar Portal — Dataset & Architecture Reference

## 📊 What Dataset Was Used?

This app uses **two complementary data sources**:

### 1. Real-Time Backend — Supabase (PostgreSQL)
**What it is:** Supabase is an open-source Firebase alternative built on PostgreSQL.
- **URL:** `https://bgifkahbyvebhimeebqa.supabase.co`
- **Type:** Cloud-hosted relational database (PostgreSQL 15)
- **Authentication:** Supabase Auth (email/password with JWT tokens)
- **Multi-user:** ✅ Every user who registers gets their own isolated data (Row Level Security)

### 2. Scholarship Data Sources (Public Domain / Government Data)

| Scheme | Source | Amount |
|---|---|---|
| Post-Matric Scholarship for ST Students | Ministry of Tribal Affairs, scholarships.gov.in | ₹50,000/year |
| National Overseas Scholarship for ST Candidates | Ministry of Tribal Affairs | ₹15,00,000 |
| Top Class Education Scheme for ST | Ministry of Tribal Affairs | ₹2,00,000/year |
| National Fellowship for ST Students | University Grants Commission (UGC) | ₹31,000–35,000/month |
| Chief Minister ST Merit Grant – Karnataka | Dept of Tribal Welfare, Karnataka | ₹45,000 |
| Dr. Ambedkar Scholarship – Maharashtra | Social Justice Dept, Maharashtra | ₹35,000/year |
| National Merit Fellowship | National Science & Tribal Research Foundation | ₹75,000/year |
| Tata Trusts Tribal Education Grant | Tata Trusts (CSR) | ₹60,000/year |
| Girls in STEM Tribal Grant | National Tribal Dev Foundation | ₹30,000/year |
| Eklavya Alumni Scholarship | EMRS Alumni Welfare Trust | ₹20,000 (one-time) |

**Primary reference:** [National Scholarship Portal](https://scholarships.gov.in) — India's official government portal for all central & state scholarships.

---

## 🏗️ Database Schema (PostgreSQL via Supabase)

```
┌─────────────┐    ┌──────────────┐    ┌──────────────────┐
│   profiles  │    │   students   │    │   scholarships   │
│─────────────│    │──────────────│    │──────────────────│
│ id (UUID)   │───▶│ id (UUID FK) │    │ id (UUID PK)     │
│ role        │    │ dob          │    │ title            │
│ full_name   │    │ gender       │    │ provider         │
│ created_at  │    │ state        │    │ category         │
└─────────────┘    │ education... │    │ amount           │
                   │ income       │    │ deadline         │
                   │ is_st        │    │ income_limit     │
                   │ tribe_name   │    │ tribal_req...    │
                   └──────────────┘    └──────────────────┘
                          │                    │
               ┌──────────┴──────────┐         │
               ▼                     ▼         ▼
     ┌──────────────────┐  ┌────────────────────────┐
     │ saved_scholarships│  │     applications       │
     │──────────────────│  │────────────────────────│
     │ student_id (FK)  │  │ student_id (FK)        │
     │ scholarship_id   │  │ scholarship_id (FK)    │
     └──────────────────┘  │ status (enum)          │
                           │ st_certificate_no      │
                           │ bank_details           │
                           └────────────────────────┘
```

---

## 👥 Multi-User Support

- **Every new registration** → Supabase trigger auto-creates a `profiles` + `students` row
- **Row Level Security (RLS)** → Each user sees ONLY their own data
- **Role-based access:** `student` vs `admin` roles enforce different permissions
- **No limit** on number of concurrent users

---

## 🧠 AI Eligibility Engine

The eligibility checking is a **deterministic rules engine** (no external API):

```typescript
// Checks automatically run for each user:
checkEligibility(userProfile, scholarship) → 'Eligible' | 'Potentially Eligible' | 'Not Eligible'
```

Rules checked:
- ST/Tribal community status
- Annual family income vs scheme limit
- Academic percentage/CGPA
- Gender requirements
- Education level (UG/PG/Diploma/PhD)
- State eligibility
- Disability requirements

---

## 📡 Tech Stack Summary

| Layer | Technology |
|---|---|
| Frontend | React Native (Expo) — runs on Web, Android, iOS |
| Backend / Database | Supabase (PostgreSQL 15 + Auth + RLS) |
| Real-time updates | Supabase Realtime (WebSocket) |
| Authentication | Supabase Auth (JWT, email/password) |
| Scholarship data | National Scholarship Portal (public domain) |
| Rules engine | Custom TypeScript deterministic engine |
| Hosting | Expo Web (localhost for dev) |

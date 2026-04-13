# CareQ: Hospital Queue & Bed Management System
## Technical Specification & Project Plan

---

## 1. System Architecture Design
The CareQ system follows a modern Client-Server architecture tailored for high reliability and real-time responsiveness.
- **Frontend (Client):** A dynamic Single Page Application (SPA) built to serve three distinct user roles: Patients, Staff, and Admins.
- **Backend (Server):** A centralized RESTful API that handles business logic, database transactions, and authentication.
- **Real-Time Engine:** A WebSocket server integrated natively with the backend to push instant updates regarding token queues and bed availability directly to connected web clients.
- **AI Integration Pipeline:** A dedicated internal service in the backend that processes incoming patient data through Machine Learning algorithms to calculate priority scores, predict wait times, and optimize resource allocation.

## 2. Database Schema Design (MySQL)
MySQL is selected to ensure structured, ACID-compliant storage—an essential requirement for critical medical records and relationships.

**Table: `patients`**
- `patient_id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `name` (VARCHAR(255), NOT NULL)
- `contact_number` (VARCHAR(20), NOT NULL)
- `reason_for_visit` (TEXT)
- `created_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Table: `queue_tokens`**
- `token_id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `patient_id` (INT, FOREIGN KEY references patients)
- `token_number` (VARCHAR(10), UNIQUE, NOT NULL)
- `status` (ENUM('waiting', 'in_progress', 'completed', 'cancelled'), DEFAULT 'waiting')
- `priority_score` (INT, DEFAULT 0)
- `is_emergency` (BOOLEAN, DEFAULT FALSE)
- `estimated_wait_minutes` (INT)
- `issued_at` (TIMESTAMP, DEFAULT CURRENT_TIMESTAMP)

**Table: `beds`**
- `bed_id` (INT, PRIMARY KEY, AUTO_INCREMENT)
- `ward_name` (VARCHAR(100))
- `status` (ENUM('available', 'occupied', 'cleaning', 'maintenance'), DEFAULT 'available')
- `current_patient_id` (INT, FOREIGN KEY references patients, NULL)
- `last_updated` (TIMESTAMP)

## 3. API Design
RESTful API endpoints facilitating communication between the frontend client and the backend database.

**Patient & Queue Management**
- `POST /api/patient/register`
  - *Description:* Allows a new patient to register for a token.
  - *Request Body:* `{"name": "John Doe", "contactNumber": "123-456-7890", "reasonForVisit": "Consultation"}`
  - *Response (Success):* `{"tokenNumber": "A101", "estimatedWaitingTime": "45 minutes", "message": "..."}`
- `GET /api/queue/status/:tokenNumber`
  - *Description:* Fetches the real-time position and updated wait time for a specific patient.

**Bed & Resource Management**
- `GET /api/beds`
  - *Description:* Returns a list of all beds, filtered by ward and current availability status.
- `PATCH /api/beds/:bed_id`
  - *Description:* Allows staff to update a bed's status (e.g., from 'occupied' to 'cleaning').

**Admin Dashboard Endpoints**
- `GET /api/dashboard/metrics`
  - *Description:* Aggregates key system metrics including total waiting patients, active beds, and system load.

## 4. AI Feature Implementation Strategy

> **Tip:** The AI features rely heavily on quality data. Initially, they will use simpler heuristic algorithms and seamlessly upgrade to complex ML models as the hospital accumulates historical data.

- **Emergency Patient Prioritization:**
  - **Logic:** During registration, patient symptoms and self-reported severity are processed via a classification model. If categorized as an emergency, they are assigned the maximum `priority_score`. 
  - **Action:** The system dynamically adjusts the active queue, bypassing standard tokens, and fires a WebSocket alert to medical staff dashboards for immediate triaging.
- **Waiting Time Prediction:**
  - **Logic:** Uses historical average consultation times, the number of currently active staff, and the current queue length. A regression model continuously recalculates `estimated_wait_minutes` for all queued patients every time a token changes status.
- **Resource Management Optimization:**
  - **Logic:** By analyzing the influx pattern of patients and historical admission rates, the system projects bed occupancy over the next 12-24 hours. It alerts administrators if a ward is projected to hit capacity, suggesting proactive equipment redirection or identifying eligible candidates for discharge.

## 5. User Interface (UI) & User Experience (UX) Design
Accessibility, clarity, and mobile-responsiveness are the core tenets of the CareQ UI design.

- **Patients (Mobile-First):**
  - **Tracker Screen:** Since patients typically wait on their phones, the UI features a highly legible dashboard with a massive, bold token number, a dynamic progress bar, and clear color-coding (e.g., transitioning from orange to green when their turn is next).
- **Hospital Staff (Tablet/Desktop):**
  - **Management Dashboard:** A clean, split-view interface. The left pane shows the live, color-coded patient queue. The right pane shows an interactive "Bed Map." Staff can intuitively drag-and-drop a patient's token onto an available bed to simultaneously admit them and update the database structure.
- **Administrators (Desktop-Optimized):**
  - **Command Center Interface:** Focuses on macro-level oversight. Utilizes real-time gauge charts for average wait times and predictive heatmaps showing current vs. projected hospital utilization capacity.

## 6. Technology Stack Justification & Selection
- **Frontend: React**
  - *Rationale:* Chosen over plain HTML/JS because the staff and patient dashboards require continuous DOM updates based on real-time WebSocket data. React's virtual DOM handles these high-frequency updates extremely efficiently without causing browser lag or messy re-renders.
- **Backend: Node.js**
  - *Rationale:* Selected over Python (Flask) due to its inherently asynchronous, event-driven architecture. Node.js is widely considered superior for handling thousands of concurrent, long-lived WebSocket connections (e.g., via `Socket.io`), which is strictly required for the live queue update mechanics. 
- **Database: MySQL**
  - *Rationale:* Chosen over Firebase. While Firebase offers out-of-the-box real-time syncing, a hospital system fundamentally relies on enormously complex relational data mappings (linking patients to specific doctors, wards, bills, and historical logs). MySQL ensures strict ACID-compliant data integrity and provides the powerful querying needed to train the AI models. The real-time capabilities will be bridged efficiently via Node.js WebSockets instead.

## 7. Deployment and Scalability Plan
- **Infrastructure:** Application environments deployed via Docker containers to guarantee absolute consistency across staging and production.
- **Cloud Scaling:** The Node.js backend nodes will sit behind a cloud Load Balancer. If queue traffic spikes unpredictably, auto-scaling groups automatically spin up additional backend instances to distribute the load seamlessly.
- **Database Enhancements:** Implement strict indexing on high-traffic fields (`token_number` and `status`) in MySQL and utilize Connection Pooling in the Node.js backend to prevent database bottlenecks during peak registration hours.

## 8. Security Considerations
- **Data Privacy & Encryption:** Enforce HTTPS (TLS 1.3) across all endpoints. Sensitive Personally Identifiable Information (PII) is encrypted at rest within the MySQL database. Assures HIPAA/GDPR compliance foundations.
- **Role-Based Access Control (RBAC):** Token-based authentication (JSON Web Tokens) guarantees patients only have read-access to their own specific token. Only authenticated medical staff can execute state-changing actions (claiming beds), and only administrators can access the macroscopic analytics.
- **API Rate Limiting:** The exposed `/register` and `/token` endpoints are protected by IP rate-limiting to prevent malicious denial-of-service (DoS) attempts or spam token generation that could ruin the AI's queue predictions.

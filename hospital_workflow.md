# Final Hospital Workflow Chart

## 1. Patient Entry & Registration

**Step 1: Patient Arrival**
* Patient enters hospital
* Patient specifies which doctor they want to consult

**Step 2: Token Generation**
* Doctor-specific token generated
* Token linked to:
  * Doctor name
  * Date & time
  * Patient ID

---

## 2. OPD Fee Collection (Before Consultation)

**Step 3: Consultation Fee Handling**
* Payment modes: Cash, UPI
* Default: standard doctor consultation fee

**Step 4: Fee Flexibility (Doctor-Authorized)**
System must allow:
* Free consultation (₹0)
* Reduced consultation fee
* Refund (partial / full)

Mandatory documentation:
* Authorizing doctor
* Reason (economically poor / family / staff / doctor discretion)
* Original fee vs final collected fee

*Note: Even free cases must have a token and visit record.*

---

## 3. Nursing Station – Vitals Documentation

**Step 5: Pre-Consultation Vitals**
Nurse documents in EMR:
* Pulse
* Blood Pressure
* SpO₂
* Temperature
* Weight
* Height
* BMI (auto-calculated)
* Time-stamped
* Visible to doctor before consultation

---

## 4. Doctor Consultation & Clinical Documentation

**Step 6: Consultation**
Doctor (or typist with doctor) documents:
* Chief complaints
* History
* Examination findings
* Provisional diagnosis
* All entries stored under patient profile
* Tagged to doctor and token

---

## 5. Investigations Workflow (OPD)

**Step 7: Ordering Investigations**
Doctor orders:
* In-house lab
* Outside lab (not billed internally)

**Step 8: In-House Lab Billing**
* Lab charges are fixed by default
* Doctor may authorize:
  * % discount (10%, 20%, 50%)
  * Full waiver (₹0)

Documentation required:
* Authorizing doctor
* Reason
* Original amount vs final amount

**Step 9: Lab Payment & Token**
* Patient pays lab bill at reception (Cash / UPI)
* Lab token activated only after:
  * Payment OR
  * Authorized discount/free status

**Step 10: Laboratory Processing**
* Patient gives token number at lab
* Lab staff verifies payment/authorization
* Sample collected
* Reports entered directly into EMR
* Results visible to ordering doctor

---

## 6. Prescription & Pharmacy Workflow

**Step 11: Electronic Prescription**
* Doctor generates prescription in EMR
* Prescription:
  * Tagged to patient token
  * Sent directly to pharmacy

**Step 12: Pharmacy Dispensing (Flexible Quantity)**
* Patient may request reduced quantity
* Pharmacy staff can:
  * Modify dispensed quantity
  * Apply discount or full waiver (doctor-approved)

System must store:
* Original prescription
* Actual medicines dispensed
* Quantity difference
* Discount / free reason
* Stock reduced accordingly
* Pharmacy bill generated (or ₹0 for free cases)

---

## 7. Surgical Workflow (OP → IPD)

**Step 13: Surgery Decision**
* Surgeon posts patient for surgery
* No fixed surgery pricing

**Step 14: Surgery Billing (VARIABLE)**
Surgery bill components:
* Surgeon fee (variable)
* Anesthetist fee (variable)
* OT charges
* Consumables / raw materials
* Medicines
* Room tariff (IPD)
* Final surgery amount decided by doctor
* Discounts / free care allowed with documentation

**Step 15: Surgery Consumables Package**
* Suggested consumables & medicines per surgery
* Editable per patient
* Items sent to pharmacy
* Dispensed and billed (or waived)

---

## 8. IPD Workflow

**Step 16: Admission**
* Room type selected
* Room tariff auto-applied per day

**Step 17: IPD Medicines & Orders**
* Nurse enters medicine request
* Doctor approves
* Pharmacy supplies medicines
* No daily payment
* Charges accumulated

**Step 18: Cross-Consultations**
* Primary doctor calls another specialist
* Cross-consult fee added to bill
* Patient informed by nurse
* Payment only at discharge

---

## 9. Final Billing & Discharge

**Step 19: Consolidated Bill Generation**
Final bill includes:
* Consultation fees
* Lab charges
* Pharmacy charges
* Surgery charges
* Room tariff
* Cross-consultation fees
* Discounts / refunds

**Step 20: Payment & Discharge**
* Patient pays final bill (Cash / UPI)
* Discharge summary generated
* All data stored in EMR

---

## 10. Audit, Safety & Governance (GLOBAL)

System must maintain:
* Original vs modified bills
* Discount / free approvals
* Refund trails
* Prescription vs dispensed medicines
* Fixed OP lab pricing with override logs
* Variable IPD billing with authorization

---

## 11. Future-Ready (NOT ACTIVE NOW)
* Insurance module to be added later
* Internal revenue sharing to be added after discussion with the auditor

# 🛡️ Solopreneur Security Playbook

This playbook contains the **10 Golden Rules** for building secure, professional SaaS applications. Apply these to every project to ensure hospital-grade security from Day 1.

---

### 1. 🔑 Secure Password Storage
*   **Never** store plain-text passwords.
*   **Always** use `bcryptjs` with at least 12 salt rounds.
*   **Rule**: Scramble passwords before they ever touch the database.

### 2. 🛡️ Input Validation (The "Zod Guard")
*   **Never** trust user input.
*   **Always** use a validation library like `Zod` for every API endpoint.
*   **Rule**: If the data isn't perfect, don't let it in.

### 3. 🎭 Error Masking
*   **Never** show technical database errors to the user (no "Prisma" or "SQL" errors).
*   **Always** return generic messages like "Something went wrong" in production.
*   **Rule**: Keep the technical details in your server logs, not the browser.

### 4. 🚪 Restricted CORS
*   **Never** use wildcard (`*`) origins in production.
*   **Always** whitelist only your official domain (e.g., your Vercel URL).
*   **Rule**: Only your website is allowed to talk to your API.

### 5. 🚦 Rate Limiting
*   **Never** leave your "Front Door" wide open.
*   **Always** limit login attempts (5 per 15 mins) and API calls (60 per min).
*   **Rule**: Stop bots and hackers from spamming your system.

### 6. 🕵️‍♂️ Security Headers
*   **Always** set `X-Frame-Options: DENY` (Anti-Clickjacking).
*   **Always** set `Strict-Transport-Security` (Force HTTPS).
*   **Always** set `Content-Security-Policy` (Only trust your own code).
*   **Rule**: Tell the browser to be extra cautious with your site.

### 7. 🧹 Clean Environment
*   **Never** commit `.env` files to GitHub.
*   **Always** use `.gitignore` and `.env.example`.
*   **Rule**: Keep your keys and passwords off the internet.

### 8. 🩹 Dependency Auditing
*   **Always** run `npm audit` after installing new tools.
*   **Always** fix "High" and "Critical" vulnerabilities immediately.
*   **Rule**: Don't build your house with "buggy" materials.

### 9. 🔌 Independent Database
*   **Always** use a stable, professional provider (like Supabase).
*   **Always** use connection pooling for high-performance scaling.
*   **Rule**: Your database should be the most stable part of your system.

### 10. 📜 Audit Logging (Future-Proofing)
*   **Always** log important actions (Who changed what?).
*   **Rule**: Maintain a "Paper Trail" for medical or financial compliance.

---
**Standard Implementation Status**: ✅ Active in Malar Hospital Project.

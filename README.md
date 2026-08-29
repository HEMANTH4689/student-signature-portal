# Student Signature Collection Portal

## Excel format
- Column A: SIGNATURE ID
- Column B: STUDENT NAME
- First row is treated as a heading.

## Run locally
1. Install Node.js 20+
2. `npm install`
3. Set an admin password:
   - Windows CMD: `set ADMIN_PASSWORD=YourStrongPassword`
   - PowerShell: `$env:ADMIN_PASSWORD="YourStrongPassword"`
4. `npm start`
5. Open `http://localhost:3000`
6. Admin: `http://localhost:3000/admin.html`

## Online deployment
Deploy to a Node.js hosting provider that supports persistent disk. Set:
- `ADMIN_PASSWORD` as an environment variable
- Start command: `npm start`

Important: This project stores signatures on the server disk. For serious/long-term use, use persistent storage and HTTPS. Do not share the admin password.

Student URL: `/`
Admin URL: `/admin.html`

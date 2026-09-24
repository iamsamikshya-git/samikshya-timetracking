Planning — Time Tracker App

1\. Core user flows



Sign up / Login



New user signs up (email + password via Firebase Auth)

First-time signup → redirected to onboarding page

Onboarding form: name, gender, role (e.g. Developer, Designer)

Details saved to their user profile in Firestore

Redirected to dashboard

On future logins, if profile already exists, skip onboarding and go straight to dashboard



Create a time entry



Logged-in user is on the dashboard

Fills out a form: task/project name, start time, end time, notes

Submits → validated → saved to Firestore, tied to their userId

Duration is calculated automatically (end time − start time) — not manually entered

List updates to show the new entry



View time entries



User sees their own time entries on the dashboard, most recent first

Each entry shows task name, start time, end time, calculated duration, notes



Send a summary email



User clicks "Send Summary Email"

App gathers their current time entries

Calls a serverless function, which calls Resend to send the email

UI shows success or failure feedback

2\. Data model



Firestore collection: users



Field	Type	Notes

uid	string (doc ID)	matches Firebase Auth UID

name	string	required, set during onboarding

gender	string	required, set during onboarding

role	string	e.g. "Developer", "Designer" — required, set during onboarding

email	string	from Firebase Auth

createdAt	timestamp	set on onboarding completion



Firestore collection: timeEntries



Field	Type	Notes

id	string (doc ID)	auto-generated

userId	string	ties entry to the logged-in user

taskName	string	required

startTime	timestamp	required

endTime	timestamp	required

notes	string	optional

createdAt	timestamp	set on save, for sorting



Duration is not stored — it's calculated in the UI as endTime - startTime whenever entries are displayed. Keeps the data model simple and avoids sync issues.



3\. Firebase usage

Authentication — Firebase Auth, email/password. Required since this is multi-user.

Firestore

users collection — one profile doc per user, created once during onboarding

timeEntries collection — entries tied to userId

Onboarding check logic: on login, check if a users/{uid} doc exists.

If not → route to onboarding form

If yes → route straight to dashboard

Security rules: restrict both collections so a user can only read/write their own data:

users/{uid} — only readable/writable by the user with matching uid

timeEntries — only readable/writable where userId == request.auth.uid

4\. Resend email flow

Trigger: manual button click ("Send Summary Email") on the dashboard

What it sends: HTML summary of the logged-in user's time entries (task, start, end, calculated duration, notes)

Where it runs: Vercel serverless function (api/send-summary.js) — API key never exposed client-side

Recipient: the logged-in user's own email (pulled from their Firebase Auth account) — no separate recipient input needed

Domain: Resend's test/sandbox domain during development

5\. Deployment shape

Hosting: Vercel, connected to the GitHub repo

Frontend: React (Vite) build, including login/signup, onboarding, and dashboard pages

Backend logic: one serverless function for email (api/send-summary.js)

Environment variables (Vercel project settings, mirrored in .env.local for dev):

VITE\_FIREBASE\_API\_KEY

VITE\_FIREBASE\_AUTH\_DOMAIN

VITE\_FIREBASE\_PROJECT\_ID

VITE\_FIREBASE\_APP\_ID

RESEND\_API\_KEY (server-side only)

Deploy trigger: push to main (after PR review) auto-deploys via Vercel's GitHub integration

6\. Decisions (confirmed)

&#x20;Multi-user with Firebase Auth (email/password)

&#x20;Onboarding page collects name, gender, role on first signup only; stored in users profile, not re-asked on future logins

&#x20;Duration calculated automatically from start/end time, not stored or manually entered

&#x20;Summary email sent to the logged-in user's own email address


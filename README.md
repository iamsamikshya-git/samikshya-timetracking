# Time Tracker

A small web app for tracking work sessions. Users can create an account, complete a profile, record task start and end times, and email themselves a summary of their entries.

## Tech stack

- **React** and **Vite** for the client application and development server
- **Tailwind CSS** for styling
- **Firebase Authentication** for email and password sign-in
- **Cloud Firestore** for user profiles and time entries
- **Resend** for summary emails, called from a serverless API function
- **Vercel** for hosting the Vite app and running the email API function
- **Vitest** and Testing Library for the test setup

## Features

- Create an account and log in with email and password
- Complete a first-login profile with name, gender, and role
- Log time with a task or project name, start and end times, and optional notes
- See your own entries update live, newest first; duration is calculated from the start and end times
- Email an HTML summary of your entries to your account email address
- Firestore security rules scope user profiles and time entries to their owner

## Local setup

### Prerequisites

- Node.js and npm
- A Firebase project with Email/Password Authentication and Cloud Firestore enabled
- A Resend account and API key for summary email testing
- Vercel CLI if you want to run the `/api/send-summary` function locally

### Install and configure

1. Clone the repository and install dependencies:

   ```sh
   npm install
   ```

2. Create `.env.local` in the project root and add the Firebase web app settings and Resend API key (see [Environment variables](#environment-variables)). Keep `.env.local` out of version control.

3. In Firebase Authentication, enable the **Email/Password** provider. Create a Firestore database and publish the rules in `firestore.rules`:

   ```sh
   firebase deploy --only firestore:rules
   ```

   This command requires the Firebase CLI and an authenticated Firebase project selection (for example, run `firebase login` and `firebase use <project-id>` first).

4. Create the required Firestore composite index described in [Firestore setup](#firestore-setup).

5. Start the Vite client:

   ```sh
   npm run dev
   ```

   The client is available at the local URL printed by Vite. This starts the UI only. To test summary email locally, use `npx vercel dev` from the project root so Vercel also serves `api/send-summary.js`; make sure the same environment variables are available to that process.

## Environment variables

| Variable | Required | Used by | Purpose |
| --- | --- | --- | --- |
| `VITE_FIREBASE_API_KEY` | Yes | Vite client, `src/lib/firebase.js` | Firebase web app configuration |
| `VITE_FIREBASE_AUTH_DOMAIN` | Yes | Vite client, `src/lib/firebase.js` | Firebase Authentication domain |
| `VITE_FIREBASE_PROJECT_ID` | Yes | Vite client, `src/lib/firebase.js` | Firebase project and Firestore instance |
| `VITE_FIREBASE_APP_ID` | Yes | Vite client, `src/lib/firebase.js` | Firebase web app identifier |
| `RESEND_API_KEY` | For email | Vercel function, `api/send-summary.js` | Authenticates server-side requests to Resend; never expose this as a `VITE_` variable |

The Firebase values are part of the browser app configuration and are bundled into the client. Protect user data with Firebase Authentication and Firestore Security Rules. `RESEND_API_KEY` is a server-side secret.

## Firebase setup

1. Create a Firebase project and register a web app. Copy its API key, auth domain, project ID, and app ID into the matching `VITE_` variables.
2. In **Authentication > Sign-in method**, enable **Email/Password**.
3. Create a **Cloud Firestore** database.
4. Deploy `firestore.rules` using the Firebase CLI. The rules allow each signed-in user to access only `users/{uid}` where the document ID matches their Auth UID, and `timeEntries` documents whose `userId` matches their UID. Unmatched paths are denied.
5. Create this composite index for the dashboard query on `timeEntries`:

   | Collection | Field | Order |
   | --- | --- | --- |
   | `timeEntries` | `userId` | Ascending |
   | `timeEntries` | `createdAt` | Descending |

   The dashboard filters entries by `userId` and orders them by `createdAt`. Firestore requires the composite index for this query. You can create it in **Firestore > Indexes > Composite**; if the query reports a missing index, its error includes a link to create the required index.

The app uses two collections:

- **`users`**: one profile document at `users/{uid}`, containing `name`, `gender`, `role`, `email`, and `createdAt`.
- **`timeEntries`**: auto-ID documents containing `userId`, `taskName`, `startTime`, `endTime`, `notes`, and `createdAt`. Duration is calculated when displayed and is not stored.

## Resend setup

Create a Resend API key and set it as `RESEND_API_KEY` in local/Vercel server environment settings. The summary endpoint sends from Resend's `onboarding@resend.dev` sandbox address.

While using the Resend sandbox, email can only be sent to the Resend account owner's own email address. To send to other recipients, verify a sending domain in Resend and update the sender address in `api/send-summary.js` to an address on that verified domain.

## Tests

Run the current tests once:

```sh
npm run test:run
```

Run Vitest in watch mode:

```sh
npm test
```

The current test files contain placeholder `it.todo` cases, so they document intended coverage but do not yet test the implemented behavior.

## Deployment

1. Import the Git repository into Vercel and select the project root.
2. Add all four `VITE_FIREBASE_*` values and `RESEND_API_KEY` in the Vercel project's Environment Variables settings for the environments you use.
3. Use the Vite build command `npm run build` (Vercel detects Vite automatically) and the output directory `dist`. Vercel serves `api/send-summary.js` as a serverless function.
4. Connect the production branch to `main`. With the Vercel Git integration enabled, pushes or merges to `main` automatically deploy to production; other branches can produce preview deployments.

## Known limitations

- The current tests are placeholders and contain no assertions.
- There is no password reset flow.
- Time entries cannot be edited or deleted in the app.

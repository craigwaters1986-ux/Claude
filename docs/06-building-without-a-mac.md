# 6 · Building and installing without a Mac

Everything here runs on **GitHub-hosted Macs** (GitHub Actions). You only need a web browser and your iPhone.

## A. Compile check: automatic, free

Every push that changes `ios/` runs **Actions → iOS build**. It generates the Xcode project, runs the GymCore tests on macOS, and compiles the iPhone app (with its Watch app) and the Watch app for the simulator. You can also run it manually: Actions → iOS build → *Run workflow*.

The GitHub Free plan includes about **$12/month of runner time ≈ 190 macOS minutes** for private repositories. One iOS build uses about 5–8 minutes. (Public repositories get standard runners free.)

## B. Install on your iPhone with TestFlight

Apple only lets you install your own build on an iPhone through a paid developer account. Without a Mac, TestFlight is the route.

### 1. Join the Apple Developer Program (once, ~$99/year)
Install the **Apple Developer** app on your iPhone → Account → *Enroll*. You need two-factor authentication and photo ID. Availability depends on your region, and approval can take a day or two.

### 2. Pick a bundle ID and register it (browser)
Choose a reverse-domain ID that you own the name of, e.g. `com.yourname.forma`.
At **developer.apple.com → Certificates, IDs & Profiles → Identifiers → +**, register two App IDs:

| Identifier | Capabilities to tick |
|---|---|
| `com.yourname.forma` | HealthKit, Sign in with Apple |
| `com.yourname.forma.watchkitapp` | HealthKit |

### 3. Create the app record (browser)
**appstoreconnect.apple.com → Apps → + → New App**: platform iOS, a name (it must be unique on the App Store, e.g. "Forma Gym Tracker"), the bundle ID `com.yourname.forma`, and any SKU (e.g. `forma-001`).

### 4. Create an API key (browser)
**App Store Connect → Users and Access → Integrations → App Store Connect API → Team Keys → +**
- Access: **Admin**. This is needed so the build machine can create signing certificates for you (Apple "cloud signing").
- Copy the **Issuer ID** and the **Key ID**, and **download the .p8 file**. You can only download it once, so keep it safe.

Your **Team ID** is at developer.apple.com → Account → Membership details.

### 5. Add them to GitHub (browser)
Repository → **Settings → Secrets and variables → Actions**

| Kind | Name | Value |
|---|---|---|
| Secret | `ASC_KEY_ID` | Key ID |
| Secret | `ASC_ISSUER_ID` | Issuer ID |
| Secret | `ASC_KEY_P8` | Entire contents of the .p8 file, including the `-----BEGIN PRIVATE KEY-----` and `-----END PRIVATE KEY-----` lines. On a phone, open it in the Files app and copy all the text |
| Secret | `APPLE_TEAM_ID` | Team ID |
| Variable | `BUNDLE_ID` | `com.yourname.forma` |

Secrets are encrypted by GitHub and are never shown in logs.

### 6. Build and upload
**Actions → TestFlight → Run workflow.** About 10–15 minutes later the build is uploaded. Apple then processes it, usually within 5–30 minutes.

### 7. Install
1. App Store Connect → your app → **TestFlight** → *Internal Testing* → create a group and add yourself.
2. Install Apple's **TestFlight** app on your iPhone, accept the invite, and tap **Install**.
3. The Watch app installs through the iPhone: open the **Watch** app on your iPhone → scroll to *Available Apps* → Forma → Install (or turn on automatic app install).

TestFlight builds expire after 90 days. Run the workflow again to get a fresh build.

## If something fails

| Message in the workflow log | Fix |
|---|---|
| `Missing setup: …` | A secret or variable from step 5 is missing or misspelled |
| `No profiles for '…' were found` / signing errors | Check that the App IDs in step 2 match `BUNDLE_ID` exactly, and that the API key has **Admin** access |
| `No suitable application records were found` | Create the app record (step 3) with the same bundle ID |
| `The bundle version must be higher` | Re-run: each run uses the next build number |
| A compile error | Open the failed **iOS build** run; the log lists each `error:` with file and line |

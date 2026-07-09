# DayMates 📱✨

Welcome to **DayMates**, the ultimate hybrid platform combining a physical social gathering discoverer (**DayMates**) and a high-fidelity secondary ticket marketplace (**TicketSwap**).

The entire application is built using **React Native + Expo + React Native Web**, utilizing **Expo Router** and **NativeWind** (Tailwind CSS) to render the exact same native components seamlessly across **Web, iOS, and Android** from a single unified codebase.

The layout is styled in a **Deep Obsidian Purple theme** featuring electric violet, deep plum, and neon orchid accents.

---

## 🚀 Core Features & Modules

1. **Ecosystem Selector (Welcome Hub)**: A beautiful bento-grid entrance connecting the two ecosystems with smooth animations.
2. **DayMates (Local Social Gatherings)**: Explore, search, filter, host, and join physical meetups (sports, gaming, coffee walks, dinners) in real-time.
3. **TicketSwap (Marketplace)**: Trade concert, festival, and sports tickets securely with escrow transaction matching and built-in chat rooms.
4. **Interactive Profile & Virtual Wallet**: Fund account balances, view active security sessions, and inspect secure login logs.
5. **Real-time Secure Escrow Chat**: Direct chat rooms between organizers and mates or ticket buyers and sellers.
6. **Unified Secure Backend**: A TypeORM PostgreSQL backend hosting robust APIs for authentication, gather actions, ticketing trade, and real-time chat.

---

## 🛠️ Unified Single-Codebase Architecture

- **Frontend Framework**: React Native with Expo SDK 50+ & Expo Router
- **Web Compilation Engine**: React Native Web bundled natively by Expo Metro
- **Styling**: NativeWind (Tailwind CSS) for unified styling across all screens
- **Backend Service**: Unified Express API server (`server.ts`)

---

## 💻 Running the Application Locally

# Development

```bash
npm install

npx expo start
```

To boot up the complete full-stack environment with both the backend server and frontend web app concurrently:

```bash
npm run dev
```

---

## 📂 Project Directory Structure

Here is the clean, organized layout of the **DayMates** codebase:

```text
daymates/
    app/              # Expo Router screen navigation files
    components/       # Reusable general UI components
    features/         # Modular feature-specific screens & components
        daymates/     # Gathering cards, host modals, search features
        ticketswap/   # Ticket listings, purchase handshakes, verified badges
        profile/      # Wallet balance card, device trackers, transaction logs
        auth/         # Google SSO Identity Services buttons & login hooks
    services/         # API clients & secure backend request wrappers
    hooks/            # Custom React hooks (useAuth, state managers)
    utils/            # Formatters (currency, dates), constants, helpers
    assets/           # Static images, launcher icons, and graphic assets
    backend/          # Unified Express server, TypeORM entities, and PostgreSQL schema
```

---

## 📱 Mobile (Android & iOS) Local Testing Guide

### 1. Local Testing WITHOUT APK Generation (Expo Go)

Expo Go is the easiest and fastest way to test your React Native code on a physical mobile device with instant live-reloading.

1. Download the free **Expo Go** app from the Google Play Store (Android) or Apple App Store (iOS).
2. Connect your computer and your physical phone to the **same Wi-Fi network**.
3. Run the native Expo development server:
   ```bash
   npx expo start
   ```
4. Scan the generated QR code printed in your terminal:
   - On **Android**: Open the **Expo Go** app and tap "Scan QR Code".
   - On **iOS**: Open your default **Camera app** and scan the QR code to prompt opening inside Expo Go.
5. Any edits made to the codebase will instantly reload on your phone in under a second!

---

### 2. How to Generate an Installable APK (Android Standalone)

To generate a standalone `.apk` installer file for Android using EAS (Expo Application Services):

1. **Install EAS CLI** globally:
   ```bash
   npm install -g eas-cli
   ```
2. **Log in** to your free Expo developer account:
   ```bash
   eas login
   ```
3. **Configure your project**:
   ```bash
   eas build:configure
   ```
4. In your generated `eas.json` file, add a `preview` profile specifying that the build type should be an installable `.apk` (instead of `.aab` Google Play bundle):
   ```json
   {
     "build": {
       "preview": {
         "android": {
           "buildType": "apk"
         }
       }
     }
   }
   ```
5. Run the EAS build command:
   ```bash
   eas build -p android --profile preview
   ```
6. Once the cloud build completes, Expo will output a direct download link. Download and install the `.apk` directly onto any Android phone!

---

### 3. How to Run on Android / iOS Emulators

To test the app locally on your machine inside virtual devices:

- **Android Emulator** (requires Android Studio):
  1. Boot up your virtual device in Android Device Manager.
  2. Run `npx expo start` and press `a` to load the app on Android.
- **iOS Simulator** (requires macOS & Xcode):
  1. Open the Simulator app.
  2. Run `npx expo start` and press `i` to load the app on iOS.

---

## 📦 Production Web Bundle & Deployment

To bundle the React Native Web assets and compile the server for hosting:

```bash
npm run build
```

This command:

1. Calls `npx expo export -p web` to bundle all React Native components into optimized web-compliant static assets inside `dist/`.
2. Bundles the Express TypeScript backend into `dist/server.cjs` using `esbuild`.

To launch the standalone full-stack server:

```bash
npm start
```

## Running locally

- `npm run dev` - if any backend changes
- `npx expo start --dev-client --clear` - if UI changes

## Build the APK

- `eas build --profile preview`
- `eas build --profile production`

Then Install the APK in your mobile

Enjoy building the future of physical social gatherings with **DayMates**! 🌸🤝🎫

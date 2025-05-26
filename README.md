# investment-dashboard

## Installation

1. **Clone the repository:**
   ```sh
   git clone https://github.com/keshan123/investment-dashboard.git
   cd investment-dashboard
   ```
2. **Set Node version (requires nvm):**
   ```sh
   nvm use
   # If you don't have the correct Node version, install it:
   nvm install
   ```
3. **Install the Ionic CLI (if you don't have it):**
   ```sh
   npm install -g @ionic/cli
   ```
4. **Install project dependencies:**
   ```sh
   npm install
   ```
5. **Start the development server:**
   ```sh
   ionic serve
   ```

---

## Features

### Portfolio Tab
- Displays user investments from `portfolio.json`.
- Shows symbol, amount, percentage of portfolio, live-updating prices, total value, initial value, and percentage change since purchase.
- Uses a donut chart to visualize portfolio allocation, with the total value in the center, updating live.
- The "Portfolio" title is now displayed above the chart for better mobile layout.
- Each investment row is styled with asset info, price info, investment info, and a colored bar matching the donut chart.
- List uses `trackBy` and `<div>`s to prevent scroll jumps on price updates.
- Back button on Product Detail uses browser history.
- Cash balance ("Wallet") is displayed in the toolbar, updates live, and turns red if negative.
- Modal appears if the cash balance goes negative, prompting the user to deposit funds or sell shares.

### Market Tab
- Lists available investment products, combining data from `pricing.json` and `instrument-list.json`.
- Live price updates, colored green/red for up/down ticks.
- Search bar allows filtering by name or symbol, implemented with a reactive `BehaviorSubject`.
- Clicking a product navigates to the Product Detail page.
- (Note: List item fade-in animations were removed to ensure best touch support on iOS.)

### Product Detail Page
- Shows product details, live price, and a form to buy or sell shares.
- Displays a line graph of the last 30 price ticks, updating live.
- Buy/sell UI uses a single quantity input and side-by-side Buy (green) and Sell (red) buttons.
- Buying reduces the wallet balance (can go negative); selling increases it.
- If the user owns shares, the Sell button is enabled and shows proceeds.
- After a successful buy or sell, a toast is shown and the user is navigated back to the portfolio.

### Cash Balance and Deposit Feature
- Cash balance is managed in `PortfolioService`, persisted in `localStorage`, and exposed as an observable.
- Full-page Deposit screen allows users to mock adding funds, which updates the wallet balance.
- Routing is set up for `/tabs/deposit`, and navigation buttons are available from both the nav and the negative balance modal.

### Negative Balance Modal
- Custom modal appears as a bottom sheet when the wallet goes negative, with a warning and options to deposit or dismiss.
- Modal is styled to only take up half the screen and allows seeing the background.
- Dismiss and Deposit buttons are horizontally centered.

### General Technical Details
- Uses standalone Angular components and imports.
- Modern, mobile-friendly styling, with careful attention to spacing, padding, and color.
- State management with RxJS and BehaviorSubjects.
- Audio and UI effects are scoped to only run when appropriate.

---

## Platform Notes & Known Issues
- **Was built for DarkMode:**
  - This project was created for darkmode only users as that was the device i had with me, given more time i would have prepared for both. 
- **iOS Touch Events:**
  - Custom Angular animations on dynamic lists (such as fade-in or staggered animations) can interfere with touch/click events on iOS devices, especially when using Ionic components. Animations were removed from the market list to ensure best touch support.
- **ng-reflect attributes:**
  - Attributes like `ng-reflect-name` are only present in development mode for debugging and will not appear in production builds.

---

## Secret Feature: Konami Code
If you enter the classic Konami code (↑ ↑ ↓ ↓ ← → ← → b a) anywhere in the app, Mario-style sound effects will be enabled for price up/down and buy/sell actions, with a special sound for selling and for successful deposits. Look for fun audio surprises when Konami mode is active!

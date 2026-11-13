# TradePro

A full-stack trading dashboard for exploring simulated market data, managing a virtual portfolio, and practicing order workflows. TradePro pairs a React interface with an Express API, SQLite persistence, and WebSocket market updates.

> **Educational project:** Market prices are randomly simulated and are not live financial data. Orders use virtual account balances. This application is not a brokerage and must not be used for investment decisions.

## Features

- Account registration, login, and JWT-protected application routes
- Market dashboard with stock quotes, price history charts, and live simulated price updates
- Portfolio overview with holdings and virtual cash balance
- Watchlist management
- Market and limit buy/sell order workflows with server-side validation
- Order history and transaction history
- Persistent users, holdings, orders, transactions, and price history using SQLite

## Technology

- **Frontend:** React 18, React Router, Recharts, Axios
- **Backend:** Node.js, Express, WebSocket (`ws`)
- **Storage:** SQLite with `better-sqlite3`
- **Authentication:** JSON Web Tokens and bcrypt password hashing
- **Tests:** Node.js built-in test runner for backend integration tests; Jest and React Testing Library for frontend tests

## Project Layout

```text
.
├── backend/
│   ├── server.js
│   ├── server.test.js
│   ├── package.json
│   └── .env.example
├── frontend/
│   ├── public/
│   ├── src/
│   └── package.json
├── .gitignore
├── LICENSE
├── proces.txt
└── README.md
```

The local SQLite database is created as `backend/trading.db` when the backend starts. It is intentionally excluded from Git; each local installation has its own data.

## Requirements

- Node.js 18 or later and npm
- Git (to clone the repository)

## Run Locally

### 1. Clone the repository

```bash
git clone https://github.com/sahiljuyal21/TradePro-Trading-Website.git
cd TradePro-Trading-Website
```

### 2. Install dependencies

Install the backend and frontend dependencies in their respective folders:

```bash
cd backend
npm install
cd ../frontend
npm install
```

### 3. Configure the backend

From the `backend` folder, copy `.env.example` to `.env` and set a private JWT secret. For example, in PowerShell:

```powershell
Copy-Item .env.example .env
```

Edit `backend/.env`:

```env
JWT_SECRET=replace-this-with-a-long-random-secret
DATABASE_PATH=./trading.db
```

Do not commit `.env` or use the example secret in a deployed environment. The backend defaults to port `3001` and supports the `PORT` environment variable.

### 4. Start the backend

In one terminal, from the `backend` folder:

```bash
npm start
```

The API and WebSocket server are available at `http://localhost:3001` and `ws://localhost:3001`.

### 5. Start the frontend

In a second terminal, from the `frontend` folder:

```bash
npm start
```

Open `http://localhost:3000` and create an account from the registration page. The frontend currently targets the backend at `localhost:3001`.

## Tests and Build

Run the backend integration tests from `backend/`:

```bash
npm test
```

Run the frontend tests from `frontend/`:

```bash
npm test -- --watchAll=false --runInBand
```

Create a production frontend build from `frontend/`:

```bash
npm run build
```

## API Overview

The Express API is served under `/api`:

| Endpoint | Access | Purpose |
| --- | --- | --- |
| `POST /api/auth/register` | Public | Create an account |
| `POST /api/auth/login` | Public | Sign in and receive a token |
| `GET /api/auth/me` | Authenticated | Get the current account |
| `GET /api/stocks` | Public | List simulated stocks |
| `GET /api/stocks/:symbol` | Public | Get a simulated stock quote |
| `GET /api/stocks/:symbol/history` | Public | Get stored price history |
| `GET /api/portfolio` | Authenticated | Get portfolio information |
| `GET /api/orders` | Authenticated | List account orders |
| `POST /api/orders` | Authenticated | Submit an order |
| `GET /api/transactions` | Authenticated | List account transactions |
| `GET /api/watchlist` | Authenticated | Get the watchlist |
| `POST /api/watchlist` | Authenticated | Add a stock to the watchlist |
| `DELETE /api/watchlist/:symbol` | Authenticated | Remove a stock from the watchlist |

Authenticated requests use `Authorization: Bearer <token>`.

## Security and Data Notes

- Passwords are hashed before being stored. Keep `JWT_SECRET` private and use a strong unique value outside local development.
- SQLite data is local to the running backend and is not included in the repository. Back up `backend/trading.db` separately if you need to preserve local accounts or activity.
- The sample stock list and prices are for simulation only. No external market-data provider or real trade execution is connected.
- Do not use real credentials or sensitive personal information in a demo deployment.

## License

Distributed under the MIT License. See [LICENSE](LICENSE).

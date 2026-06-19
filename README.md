# Twin Backend — Social Connect API

Node.js + Express backend for the Twin Social Connect feature.

## Setup

### Prerequisites
- Node.js 18+ installed

### Installation
```bash
git clone https://github.com/YOUR_USERNAME/twin-backend.git
cd twin-backend
npm install
```

### Run the server
```bash
npm run dev
```
Server runs on `http://localhost:5000`

## API Endpoints

| Method | Endpoint | Description |
|--------|----------|-------------|
| GET | `/` | Check server is running |
| GET | `/connections?userId=user1` | Get all connected platforms |
| POST | `/connections` | Save a new connection |
| DELETE | `/connections/:platform` | Disconnect a platform |
| GET | `/auth/:platform` | Get OAuth URL for a platform |

## Project Structure

twin-backend/

├── routes/

│   ├── auth.js          → OAuth routes

│   └── connections.js   → Save/read/delete connections

├── data/

│   └── connections.json → Simple JSON database

├── server.js            → Main server entry point

├── .env                 → Secret API keys (not on GitHub)

└── package.json

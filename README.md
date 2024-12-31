# Pre-Pump Backend Service

A backend service for fetching Pre-Pump campaigns and transactions on Solana.

## Prerequisites

- Node.js v16+
- MongoDB
- Helius API key

## Installation

1. Clone the repository:
```bash
git clone https://github.com/DefikitTeam/prepumpfun-cronjob.git
cd prepumpfun-cronjob
```

2. Install dependencies:
```bash
yarn install
```

3. Set up environment variables:

```bash
cp .env.example .env
```

4. Run docker compose

```bash
docker compose up -d
```

5. Run job

```bash
make serve
```

5.1 Run local

```bash
yarn start:campaign
```


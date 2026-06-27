# 📜 Chronicle

<div align="center">

# 📜 Chronicle

### A Cryptographic Evidence Vault for Whistleblowers, Journalists, Activists, Employees, and Individuals.

**Preserve • Verify • Prove**

[![Next.js](https://img.shields.io/badge/Next.js-15-black?logo=next.js)](https://nextjs.org/)
[![TypeScript](https://img.shields.io/badge/TypeScript-5-blue?logo=typescript)](https://www.typescriptlang.org/)
[![Supabase](https://img.shields.io/badge/Supabase-Storage%20%26%20Postgres-3ECF8E?logo=supabase)](https://supabase.com/)
[![Solidity](https://img.shields.io/badge/Solidity-Smart%20Contracts-363636?logo=solidity)](https://soliditylang.org/)
[![Viem](https://img.shields.io/badge/Viem-Latest-6C47FF)](https://viem.sh/)
[![TurboRepo](https://img.shields.io/badge/TurboRepo-Monorepo-EF4444?logo=turborepo)](https://turbo.build/repo)
[![MIT License](https://img.shields.io/badge/License-MIT-green.svg)](LICENSE)

</div>

---

## 🌟 Overview

Chronicle is an open-source evidence preservation platform designed to help individuals securely preserve digital evidence and establish verifiable proof of existence.

Whether you're a journalist safeguarding source material, an employee documenting workplace misconduct, an activist preserving critical information, or simply someone who wants to protect important digital records, Chronicle provides a secure and transparent way to preserve evidence while enabling independent integrity verification.

Built around modern cryptographic principles, Chronicle ensures that evidence remains trustworthy without exposing sensitive file contents on the blockchain.

---

# ✨ Features

* 📂 Secure evidence upload
* 🔐 Cryptographic integrity protection
* ⛓ Immutable blockchain proof of existence
* 📑 Evidence metadata management
* 🔎 Independent verification
* 🏷 Evidence organization with tags and descriptions
* 📊 Evidence timeline and transaction history
* ⚡ Fast and intuitive user experience

---

# 🏗 Architecture

```text
                 Browser
                     │
                     ▼
           Evidence Upload Portal
                     │
                     ▼
              Next.js Application
                     │
      ┌──────────────┼──────────────┐
      ▼              ▼              ▼
 Supabase       PostgreSQL      Blockchain
  Storage         Metadata        Network
      │              │              │
      └──────────────┴──────────────┘
                     │
                     ▼
          Evidence Verification
```

---

# 🔒 Security

Chronicle follows a layered security approach focused on preserving the integrity of digital evidence.

* Files remain securely stored off-chain.
* Sensitive information is never written to the blockchain.
* Cryptographic techniques provide evidence integrity.
* Blockchain is used solely to establish immutable proof of existence.
* Verification can be performed independently without relying on a trusted central authority.

---

# 🛠 Tech Stack

| Category    | Technologies                                |
| ----------- | ------------------------------------------- |
| Frontend    | Next.js 15, React, TypeScript, Tailwind CSS |
| Backend     | Next.js API Routes (Serverless)             |
| Monorepo    | TurboRepo, Yarn Workspaces                  |
| Storage     | Supabase Storage                            |
| Database    | Supabase PostgreSQL                         |
| Blockchain  | Solidity, Hardhat, Viem, Wagmi, RainbowKit  |
| Development | ESLint, Prettier                            |

---

# 📁 Project Structure

```text
Chronicle/
│
├── apps/
│   └── web/                 # Next.js application
│
├── packages/
│   └── shared/              # Shared utilities, types and business logic
│
├── contracts/               # Smart contracts and deployment scripts
│
├── supabase/                # Database configuration and migrations
│
├── turbo.json
├── package.json
└── yarn.lock
```

---

# 🚀 Getting Started

## Clone the repository

```bash
git clone https://github.com/<your-username>/chronicle.git

cd chronicle
```

---

## Install dependencies

```bash
yarn install
```

---

## Configure Environment Variables

Create the following file:

```text
apps/web/.env.local
```

Example:

```env
NEXT_PUBLIC_SUPABASE_URL=

NEXT_PUBLIC_SUPABASE_ANON_KEY=

SUPABASE_SERVICE_ROLE_KEY=

RPC_URL=

BLOCKCHAIN_PRIVATE_KEY=

NEXT_PUBLIC_CHRONICLE_CONTRACT_ADDRESS=
```

---

## Start the development server

```bash
yarn dev
```

Visit:

```text
http://localhost:3000
```

---

# 📦 Smart Contract Deployment

Navigate to the contracts workspace:

```bash
cd contracts
```

Install dependencies:

```bash
yarn install
```

Deploy:

```bash
yarn deploy
```

After deployment, update your environment variables with the deployed contract address.

---

# 🤝 Contributing

Contributions are welcome!

If you'd like to improve Chronicle, feel free to:

* Fork the repository
* Create a feature branch
* Submit a pull request
* Open an issue for bugs or feature requests

Please ensure your code follows the existing style and includes appropriate documentation where necessary.

---

<div align="center">

Built with 🔮 by **lbyarinth**.

**Chronicle — Preserve • Verify • Prove**

</div>

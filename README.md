# Arc Testnet — Hardhat Setup

![Arc Testnet](https://img.shields.io/badge/Network-Arc%20Testnet-blue)
![Chain ID](https://img.shields.io/badge/Chain%20ID-5042002-green)
![Status](https://img.shields.io/badge/Status-Active-brightgreen)

## 📖 About This Project

Arc Testnet pe deployed Hardhat-based smart contract project. ERC20 token aur custom contract ke saath on-chain activity demonstrate karta hai. Yeh project Arc ecosystem ke saath actively interact karta hai.

---

## ⚡ Quick Start

### Step 1 — Install dependencies
```bash
npm install
```

### Step 2 — Create `.env` file

Root folder mein `.env` file banayein:
```
PRIVATE_KEY=your_wallet_private_key_here
```

> ⚠️ **Never share your private key! `.env` file ko `.gitignore` mein rakhein.**

### Step 3 — Get testnet USDC

- Arc Faucet pe jayein: https://faucet.arc.io
- Apna wallet address enter karein
- Free testnet USDC milega (gas ke liye use hoga)

### Step 4 — Compile contract
```bash
npm run compile
```

### Step 5 — Deploy to Arc Testnet
```bash
npm run deploy
```

---

## 📁 Project Structure

```
arc-hardhat/
├── contracts/
│   └── ArcTestContract.sol     ← Smart contract
├── scripts/
│   └── deploy.js               ← Deploy script
├── hardhat.config.js           ← Network config
├── package.json
└── README.md
```

---

## 🌐 Network Details

| Property | Value |
|----------|-------|
| **Chain ID** | 5042002 |
| **Gas Token** | USDC |
| **RPC URL** | https://rpc.testnet.arc.network |
| **Block Explorer** | https://testnet.arcscan.app |

---

## 📜 Deployed Contracts on Arc Testnet

| Contract | Address | Explorer |
|----------|---------|---------|
| ArcTestContract | `0x80FA38299826D22Bc7e907E31281A0D74691F9Bc` | [View](https://testnet.arcscan.app/address/0x80FA38299826D22Bc7e907E31281A0D74691F9Bc) |
| ArcToken (ERC20) | `0xF4Da24868597E921464C97ADAf0674B492cED8a5` | [View](https://testnet.arcscan.app/address/0xF4Da24868597E921464C97ADAf0674B492cED8a5) |

---

## ✅ Progress Tracker

- [x] Smart contract deployed on Arc Testnet
- [x] ERC20 token deployed
- [x] Daily contract interactions active
- [x] Transactions verified on ArcScan
- [x] Faucet integration complete
- [ ] Frontend interface (coming soon)

---

## 💡 Tips for On-Chain Activity

1. Contract ke saath daily interact karein
2. On-chain activity consistent rakhein
3. Multiple transaction types use karein (deploy, transfer, swap)
4. ArcScan pe apni activity verify karein

---

## 🔒 Security

- Private key kabhi share na karein
- `.env` file `.gitignore` mein honi chahiye
- Testnet pe sirf testnet funds use karein

---

## 📄 License

MIT License — Open source project for Arc Testnet development.

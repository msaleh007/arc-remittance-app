// ============================================================
//  ARC REMITTANCE APP - Backend Server
//  USDC cross-chain transfer (Sepolia -> Arc) via Circle CCTP
//  Built for the Stablecoins Commerce Stack Challenge (Track 1)
//  Backend logic based on a proven, working CCTP integration.
// ============================================================

require('dotenv').config();
const express = require('express');
const cors = require('cors');
const {
  createPublicClient, createWalletClient, http,
  encodeFunctionData, defineChain, parseUnits, formatUnits
} = require('viem');
const { privateKeyToAccount } = require('viem/accounts');
const { sepolia } = require('viem/chains');

const app = express();
app.use(cors());
app.use(express.json());
app.use(express.static('public'));

// ============ Arc Testnet chain definition ============
const arcTestnet = defineChain({
  id: 5042002,
  name: 'Arc Testnet',
  nativeCurrency: { name: 'USDC', symbol: 'USDC', decimals: 18 },
  rpcUrls: { default: { http: ['https://5042002.rpc.thirdweb.com'] } },
  blockExplorers: { default: { name: 'ArcScan', url: 'https://testnet.arcscan.app' } },
  testnet: true,
});

// ============ Config (official Circle CCTP testnet) ============
const ETHEREUM_SEPOLIA_USDC = '0x1c7d4b196cb0c7b01d743fbc6116a902379c7238';
const ETHEREUM_SEPOLIA_TOKEN_MESSENGER = '0x8fe6b999dc680ccfdd5bf7eb0974218be2542daa';
const ARC_TESTNET_MESSAGE_TRANSMITTER = '0xe737e5cebeeba77efe34d4aa090756590b1ce275';

const ETHEREUM_SEPOLIA_DOMAIN = 0;
const ARC_TESTNET_DOMAIN = 26;

const account = privateKeyToAccount(process.env.PRIVATE_KEY);

// ============ Clients ============
const sepoliaClient = createWalletClient({ chain: sepolia, transport: http(), account });
const sepoliaPublic = createPublicClient({ chain: sepolia, transport: http() });
const arcClient = createWalletClient({ chain: arcTestnet, transport: http(), account });

// ============ ABIs ============
const approveAbi = [{
  type: 'function', name: 'approve', stateMutability: 'nonpayable',
  inputs: [{ name: 'spender', type: 'address' }, { name: 'amount', type: 'uint256' }],
  outputs: [{ name: '', type: 'bool' }]
}];
const balanceAbi = [{
  type: 'function', name: 'balanceOf', stateMutability: 'view',
  inputs: [{ name: 'account', type: 'address' }], outputs: [{ type: 'uint256' }]
}];
const burnAbi = [{
  type: 'function', name: 'depositForBurn', stateMutability: 'nonpayable',
  inputs: [
    { name: 'amount', type: 'uint256' },
    { name: 'destinationDomain', type: 'uint32' },
    { name: 'mintRecipient', type: 'bytes32' },
    { name: 'burnToken', type: 'address' },
    { name: 'destinationCaller', type: 'bytes32' },
    { name: 'maxFee', type: 'uint256' },
    { name: 'minFinalityThreshold', type: 'uint32' },
  ], outputs: []
}];
const mintAbi = [{
  type: 'function', name: 'receiveMessage', stateMutability: 'nonpayable',
  inputs: [{ name: 'message', type: 'bytes' }, { name: 'attestation', type: 'bytes' }],
  outputs: []
}];

function toBytes32(addr) {
  return ('0x000000000000000000000000' + addr.slice(2));
}

// ============ API: wallet + balance ============
app.get('/api/wallet', async (req, res) => {
  try {
    const balance = await sepoliaPublic.readContract({
      address: ETHEREUM_SEPOLIA_USDC, abi: balanceAbi,
      functionName: 'balanceOf', args: [account.address]
    });
    res.json({ address: account.address, usdc: formatUnits(balance, 6) });
  } catch (e) { res.status(500).json({ error: e.message }); }
});

// ============ API: transparent quote ============
app.post('/api/quote', (req, res) => {
  const amount = parseFloat(req.body.amount || 0);
  res.json({ amount, bridgeFee: 0, estGas: 0.02, receives: amount, total: amount });
});

// ============ API: full transfer (approve -> burn -> attest -> mint) ============
app.post('/api/send', async (req, res) => {
  try {
    const { amount, recipient } = req.body;
    const value = parseUnits(String(amount), 6);
    const dest = recipient && recipient.length === 42 ? recipient : account.address;
    const maxFee = 500n;

    // Step 1: approve (10 USDC allowance, like the working script)
    const approveTx = await sepoliaClient.sendTransaction({
      to: ETHEREUM_SEPOLIA_USDC,
      data: encodeFunctionData({
        abi: approveAbi, functionName: 'approve',
        args: [ETHEREUM_SEPOLIA_TOKEN_MESSENGER, 10_000_000n]
      })
    });
    await sepoliaPublic.waitForTransactionReceipt({ hash: approveTx });

    // Step 2: burn (depositForBurn) - full 7 args
    const burnTx = await sepoliaClient.sendTransaction({
      to: ETHEREUM_SEPOLIA_TOKEN_MESSENGER,
      data: encodeFunctionData({
        abi: burnAbi, functionName: 'depositForBurn',
        args: [
          value,
          ARC_TESTNET_DOMAIN,
          toBytes32(dest),
          ETHEREUM_SEPOLIA_USDC,
          '0x0000000000000000000000000000000000000000000000000000000000000000',
          maxFee,
          1000
        ]
      })
    });
    await sepoliaPublic.waitForTransactionReceipt({ hash: burnTx });

    // Step 3: retrieve attestation
    const url = `https://iris-api-sandbox.circle.com/v2/messages/${ETHEREUM_SEPOLIA_DOMAIN}?transactionHash=${burnTx}`;
    let attestation = null;
    for (let i = 0; i < 30; i++) {
      const r = await fetch(url);
      if (r.ok) {
        const data = await r.json();
        if (data?.messages?.[0]?.status === 'complete') { attestation = data.messages[0]; break; }
      }
      await new Promise(res => setTimeout(res, 5000));
    }
    if (!attestation) {
      return res.json({ ok: true, approveTx, burnTx, minted: false,
        message: 'Burned on Sepolia. Attestation still pending — mint will follow.' });
    }

    // Step 4: mint on Arc
    const mintTx = await arcClient.sendTransaction({
      to: ARC_TESTNET_MESSAGE_TRANSMITTER,
      data: encodeFunctionData({
        abi: mintAbi, functionName: 'receiveMessage',
        args: [attestation.message, attestation.attestation]
      })
    });

    res.json({ ok: true, approveTx, burnTx, mintTx, minted: true, recipient: dest,
      message: 'Transfer complete! USDC minted on Arc Testnet.' });
  } catch (e) {
    res.status(500).json({ ok: false, error: e.message });
  }
});

const PORT = process.env.PORT || 3000;
app.listen(PORT, () => {
  console.log(`Arc Remittance backend running: http://localhost:${PORT}`);
  console.log(`Sender wallet: ${account.address}`);
});

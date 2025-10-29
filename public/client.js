// client.js

// --- 1. KONFIGURASI FRONTEND ---
const CONFIG = {
    // Info Jaringan (BSC Testnet)
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97, 
    chainHex: '0x61', 
    chainName: 'BSC Testnet',

    // ==========================================================
    // PERUBAHAN KRITIS: Ganti localhost dengan domain API Anda
    // WAJIB menggunakan HTTPS agar browser tidak memblokir
    backendUrl: 'https://api.spark-ai.xyz',
    // ==========================================================

    // GANTI DENGAN ALAMAT KONTRAK TESTNET ANDA
    usdc: '0x337610d27c682E347C9cD60BD4b3b107C9d34dDd',
    mytoken: '0xde78E250b6d473d2418308428B4a74d46efBd148', 
    relayer: '0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a', // Tetap
    
    // GANTI DENGAN DOMPET SERVER ANDA (dompet yang akan MENERIMA 1 USDC)
    serverWallet: '0xbdDD85bc42010110B8184d0fDA25659688bf935E'
};

// ABI (Application Binary Interface) minimal untuk token ERC20
const ERC20_ABI = [
    'function balanceOf(address) view returns (uint256)',
    'function decimals() view returns (uint8)',
    'function approve(address,uint256) returns (bool)',
    'function allowance(address,address) view returns (uint256)'
];

// Variabel Global
let provider, signer, userAddress;
let usdcContract, mytokenContract;

// --- 2. Elemen DOM ---
const connectSection = document.getElementById('connectSection');
const appSection = document.getElementById('appSection');
const walletAddressSpan = document.getElementById('walletAddress');
const usdcBalanceSpan = document.getElementById('usdcBalance');
const mytokenBalanceSpan = document.getElementById('mytokenBalance');
const spinButton = document.getElementById('spinButton');
const statusSection = document.getElementById('statusSection');
const stepsSection = document.getElementById('stepsSection');
const slotImgs = [
    document.getElementById('slot1-img'),
    document.getElementById('slot2-img'),
    document.getElementById('slot3-img')
];
// Pastikan nama file gambar ini sesuai dengan yang ada di folder /images/ Anda
const allSymbolImages = [
    'images/Jesse.png',
    'images/Base.png',
    'images/BTC.png',
    'images/ETH.png',
    'images/Other.png'
];


// --- 3. Fungsi Koneksi Wallet (Dengan ENS FIX) ---
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        // --- AWAL PERBAIKAN ENS ---
        // 1. Buat provider MetaMask HANYA untuk mendapatkan signer
        const metaMaskProvider = new ethers.BrowserProvider(window.ethereum);
        await metaMaskProvider.send("eth_requestAccounts", []);
        const metaMaskSigner = await metaMaskProvider.getSigner();
        userAddress = await metaMaskSigner.getAddress();

        // 2. Buat network kustom untuk BSC Testnet (non-ENS)
        const bscTestnet = new ethers.Network('bnbt', 97);
        bscTestnet.ensAddress = null; // KUNCI UTAMA: Menonaktifkan ENS

        // 3. Set 'provider' global kita ke provider kustom (JsonRpcProvider)
        provider = new ethers.JsonRpcProvider(CONFIG.rpc, bscTestnet);
        
        // 4. Set 'signer' global kita ke signer MetaMask, TAPI terhubung ke provider kustom
        signer = metaMaskSigner.connect(provider);
        // --- AKHIR PERBAIKAN ENS ---

        // Coba ganti ke BSC Testnet
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.chainHex }], // '0x61'
            });
        } catch (switchError) {
            if (switchError.code === 4902) {
                await window.ethereum.request({
                    method: 'wallet_addEthereumChain',
                    params: [{
                        chainId: CONFIG.chainHex,
                        chainName: CONFIG.chainName,
                        nativeCurrency: { name: 'tBNB', symbol: 'tBNB', decimals: 18 },
                        rpcUrls: [CONFIG.rpc],
                        blockExplorerUrls: ['https://testnet.bscscan.com']
                    }]
                });
            } else { throw switchError; }
        }

        connectSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        walletAddressSpan.textContent = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);

        // Inisialisasi kontrak
        usdcContract = new ethers.Contract(CONFIG.usdc, ERC20_ABI, signer);
        mytokenContract = new ethers.Contract(CONFIG.mytoken, ERC20_ABI, provider);

        await loadBalances();
    } catch (error) {
        console.error(error);
        showStatus('Error connecting wallet: ' + error.message, 'error');
    }
}

// --- 4. Fungsi Memuat Saldo ---
async function loadBalances() {
    try {
        usdcBalanceSpan.textContent = 'Loading...';
        mytokenBalanceSpan.textContent = 'Loading...';

        const usdcBal = await usdcContract.balanceOf(userAddress);
        const mytokenBal = await mytokenContract.balanceOf(userAddress);
        
        // GANTI DESIMAL JIKA PERLU (USDC biasanya 6)
        usdcBalanceSpan.textContent = ethers.formatUnits(usdcBal, 6) + ' USDC';
        mytokenBalanceSpan.textContent = ethers.formatUnits(mytokenBal, 18) + ' MYTOKEN';

    } catch (error) {
        console.error("Error loading balances:", error);
        usdcBalanceSpan.textContent = 'Error';
        mytokenBalanceSpan.textContent = 'Error';
    }
}

// --- 5. Fungsi Utilitas (Status, Step, Sleep, Animasi) ---
function showStatus(message, type = 'info') {
    statusSection.innerHTML = `<div class="status status-${type}">${message}</div>`;
}
function resetSteps() {
    stepsSection.classList.add('hidden');
    for (let i = 1; i <= 5; i++) {
        const step = document.getElementById(`step${i}`);
        step.classList.remove('active', 'completed');
    }
}
function updateStep(stepNum, state) {
    if (stepNum === 1) { stepsSection.classList.remove('hidden'); }
    const step = document.getElementById(`step${stepNum}`);
    if (state === 'active') {
        step.classList.add('active');
        step.classList.remove('completed');
    } else if (state === 'completed') {
        step.classList.remove('active');
        step.classList.add('completed');
    }
}
function sleep(ms) { return new Promise(resolve => setTimeout(resolve, ms)); }

async function animateSpin(duration = 2000) {
    updateStep(3, 'active');
    slotImgs.forEach(img => img.classList.add('spinning'));
    let intervalId = setInterval(() => {
        for (const img of slotImgs) {
            const randomImg = allSymbolImages[Math.floor(Math.random() * allSymbolImages.length)];
            img.src = randomImg;
        }
    }, 80);
    await sleep(duration);
    clearInterval(intervalId);
    slotImgs.forEach(img => img.classList.remove('spinning'));
    updateStep(3, 'completed');
}

// --- 6. FUNGSI UTAMA: SPIN SLOT ---
async function spinSlot() {
    spinButton.disabled = true;
    resetSteps();
    showStatus('Preparing your spin...', 'info');

    try {
        // --- Step 1: Approve USDC ---
        updateStep(1, 'active');
        showStatus('Checking USDC approval...', 'info');

        const amount = ethers.parseUnits('1', 6); // 1 USDC (6 desimal)
        const allowance = await usdcContract.allowance(userAddress, CONFIG.relayer);

        if (allowance < amount) {
            showStatus('Please approve 1 USDC for the relayer... (Gas required)');
            const approveTx = await usdcContract.approve(CONFIG.relayer, amount);
            await approveTx.wait();
            showStatus('Approval successful!', 'info');
        }
        updateStep(1, 'completed');

        // --- Step 2: Sign payment (0 gas!) ---
        updateStep(2, 'active');
        showStatus('Sign the payment message (0 gas!)', 'info');

        const nonce = ethers.hexlify(ethers.randomBytes(32));
        const validAfter = Math.floor(Date.now() / 1000);
        const validBefore = validAfter + 600; // 10 menit

        const domain = {
            name: 'B402',
            version: '1',
            chainId: CONFIG.chainId,
            verifyingContract: CONFIG.relayer
        };
        const types = {
            TransferWithAuthorization: [
                { name: 'from', type: 'address' },
                { name: 'to', type: 'address' },
                { name: 'value', type: 'uint256' },
                { name: 'validAfter', type: 'uint256' },
                { name: 'validBefore', type: 'uint256' },
                { name: 'nonce', type: 'bytes32' }
            ]
        };
        const value = {
            from: userAddress,
            to: CONFIG.serverWallet, // Bayar ke dompet server
            value: amount.toString(),
            validAfter, validBefore, nonce
        };

        const signature = await signer.signTypedData(domain, types, value);
        updateStep(2, 'completed');

        // --- Step 3: Animasi dan Kirim ke Backend ---
        const animationPromise = animateSpin(2000); // Mulai animasi

        // Kirim tanda tangan ke API backend Anda
        const response = await fetch(`${CONFIG.backendUrl}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorization: value,
                signature,
                userAddress: userAddress 
            })
        });

        const result = await response.json();
        
        await animationPromise; // Pastikan animasi selesai
        updateStep(4, 'active'); // Server paying rewards

        if (!result.success) {
            throw new Error(result.error || 'Backend failed to process spin.');
        }

        // --- Step 4 & 5: Tampilkan Hasil ---
        slotImgs[0].src = `images/${result.result[0]}.png`;
        slotImgs[1].src = `images/${result.result[1]}.png`;
        slotImgs[2].src = `images/${result.result[2]}.png`;

        updateStep(4, 'completed');
        updateStep(5, 'completed');
        
        let winMessage = `You got 1000 MYTOKEN!`;
        if (result.winnings > 0) {
            winMessage = `🎉 YOU WON ${result.winnings} USDC! 🎉<br>+ ${result.tokenReward} MYTOKEN!`;
        } else {
            winMessage = `You won ${result.tokenReward} MYTOKEN. Better luck next time!`;
        }

        showStatus(
            `${winMessage}
             <br><a class="link" href="https://testnet.bscscan.com/tx/${result.payoutTxHash}" target="_blank">View Payout Transaction</a>`,
            'success'
        );

        setTimeout(loadBalances, 3000);

    } catch (error) {
        console.error(error);
        showStatus('❌ Error: ' + error.message, 'error');
        resetSteps();
    } finally {
        spinButton.disabled = false;
    }
}

// public/client.js

// --- KONFIGURASI (Harus sesuai dengan server.js) ---
const CONFIG = {
    // Info Jaringan (BSC Testnet)
    rpc: 'https://data-seed-prebsc-1-s1.binance.org:8545',
    chainId: 97, // BSC Testnet chainId
    chainHex: '0x61', // Hex untuk 97
    chainName: 'BSC Testnet',

    // Alamat Kontrak (GANTI DENGAN ALAMAT TESTNET ANDA)
    // Dapatkan alamat USDC palsu dari faucet BSC Testnet
    usdc: '0x...Alamat_Kontrak_USDC_Testnet_Anda',
    // Token yang Anda berikan sebagai hadiah (buat token BEP20 Anda sendiri)
    mytoken: '0x...Alamat_Kontrak_MYTOKEN_Testnet_Anda', 
    
    // Alamat B402 Relayer (Ini tetap sama)
    relayer: '0xE1C2830d5DDd6B49E9c46EbE03a98Cb44CD8eA5a',
    
    // Alamat dompet server Anda (dompet yang akan MENERIMA 1 USDC)
    serverWallet: '0x...Alamat_SERVER_WALLET_Anda_Penerima_USDC',
    
    // URL Backend Anda
    backendUrl: 'http://localhost:3000'
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

// --- Elemen DOM ---
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
// Daftar gambar simbol untuk animasi
const allSymbolImages = [
    'images/Jesse.png',
    'images/Base.png',
    'images.BTC.png',
    'images/ETH.png',
    'images/Other.png'
];


// --- 1. Fungsi Koneksi Wallet ---
async function connectWallet() {
    try {
        if (!window.ethereum) {
            alert('Please install MetaMask!');
            return;
        }

        provider = new ethers.BrowserProvider(window.ethereum);
        await provider.send("eth_requestAccounts", []);
        signer = await provider.getSigner();
        userAddress = await signer.getAddress();

        // Coba ganti ke BSC Testnet
        try {
            await window.ethereum.request({
                method: 'wallet_switchEthereumChain',
                params: [{ chainId: CONFIG.chainHex }], // '0x61' untuk BSC Testnet
            });
        } catch (switchError) {
            // Jika chain belum ditambahkan
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
            } else {
                throw switchError;
            }
        }

        connectSection.classList.add('hidden');
        appSection.classList.remove('hidden');
        walletAddressSpan.textContent = userAddress.slice(0, 6) + '...' + userAddress.slice(-4);

        // Inisialisasi kontrak
        usdcContract = new ethers.Contract(CONFIG.usdc, ERC20_ABI, signer);
        mytokenContract = new ethers.Contract(CONFIG.mytoken, ERC20_ABI, provider); // provider saja untuk membaca

        await loadBalances();
    } catch (error) {
        showStatus('Error connecting wallet: ' + error.message, 'error');
    }
}

// --- 2. Fungsi Memuat Saldo ---
async function loadBalances() {
    try {
        usdcBalanceSpan.textContent = 'Loading...';
        mytokenBalanceSpan.textContent = 'Loading...';

        const usdcBal = await usdcContract.balanceOf(userAddress);
        const mytokenBal = await mytokenContract.balanceOf(userAddress);
        
        // Asumsi USDC punya 6 desimal, dan MYTOKEN 18 (Sesuaikan jika perlu)
        usdcBalanceSpan.textContent = ethers.formatUnits(usdcBal, 6) + ' USDC';
        mytokenBalanceSpan.textContent = ethers.formatUnits(mytokenBal, 18) + ' MYTOKEN';

    } catch (error) {
        console.error("Error loading balances:", error);
        usdcBalanceSpan.textContent = 'Error';
        mytokenBalanceSpan.textContent = 'Error';
    }
}

// --- 3. Fungsi Utilitas (Status, Step, Sleep, Animasi) ---
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
    if (stepNum === 1) { // Tampilkan steps saat langkah 1 dimulai
        stepsSection.classList.remove('hidden');
    }
    const step = document.getElementById(`step${stepNum}`);
    if (state === 'active') {
        step.classList.add('active');
        step.classList.remove('completed');
    } else if (state === 'completed') {
        step.classList.remove('active');
        step.classList.add('completed');
    }
}

function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// Fungsi Animasi Spin (dari kode kita sebelumnya)
async function animateSpin(duration = 2000) {
    updateStep(3, 'active');
    
    slotImgs.forEach(img => img.classList.add('spinning'));

    const startTime = Date.now();
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

// --- 4. FUNGSI UTAMA: SPIN SLOT ---
async function spinSlot() {
    spinButton.disabled = true;
    resetSteps();
    showStatus('Preparing your spin...', 'info');

    try {
        // --- Step 1: Approve USDC ---
        updateStep(1, 'active');
        showStatus('Checking USDC approval...', 'info');

        const amount = ethers.parseUnits('1', 6); // 1 USDC (asumsi 6 desimal)
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
        const validBefore = validAfter + 600; // Tanda tangan valid selama 10 menit

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
            to: CONFIG.serverWallet, // Kirim 1 USDC ke dompet server
            value: amount.toString(),
            validAfter,
            validBefore,
            nonce
        };

        const signature = await signer.signTypedData(domain, types, value);
        updateStep(2, 'completed');

        // --- Step 3: Animasi dan Kirim ke Backend ---
        // Kita jalankan animasi SECARA BERSAMAAN dengan request backend
        const animationPromise = animateSpin(2000); // Mulai animasi

        // Kirim tanda tangan ke server untuk dieksekusi
        const response = await fetch(`${CONFIG.backendUrl}/spin`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                authorization: value,
                signature,
                userAddress: userAddress // Kirim alamat pengguna untuk hadiah
            })
        });

        const result = await response.json();
        
        // Pastikan animasi selesai
        await animationPromise; 
        updateStep(4, 'active'); // Server paying rewards

        if (!result.success) {
            throw new Error(result.error || 'Backend failed to process spin.');
        }

        // --- Step 4 & 5: Tampilkan Hasil ---
        // Tampilkan gambar hasil akhir
        slotImgs[0].src = `images/${result.result[0]}.png`;
        slotImgs[1].src = `images/${result.result[1]}.png`;
        slotImgs[2].src = `images/${result.result[2]}.png`;

        updateStep(4, 'completed');
        updateStep(5, 'completed');
        
        // Tampilkan pesan kemenangan
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

        // Muat ulang saldo setelah beberapa detik
        setTimeout(loadBalances, 3000);

    } catch (error) {
        console.error(error);
        showStatus('❌ Error: ' + error.message, 'error');
        resetSteps();
    } finally {
        spinButton.disabled = false;
    }
}

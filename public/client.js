// public/client.js
const spinButton = document.getElementById('spinButton');
const status = document.getElementById('status');
const paymentInfoBox = document.getElementById('payment-info');
const paymentDetails = document.getElementById('payment-details');

// Ambil elemen gambar
const slotImgs = [
    document.getElementById('slot1-img'),
    document.getElementById('slot2-img'),
    document.getElementById('slot3-img')
];

// Daftar semua gambar yang mungkin untuk animasi
const allSymbolImages = [
    'images/Jesse.png',
    'images/Base.png',
    'images/BTC.png',
    'images/ETH.png',
    'images/Other.png'
];

const API_URL = 'http://localhost:3000'; // Your backend URL

spinButton.addEventListener('click', handleSpin);

// Fungsi helper untuk delay (menunggu)
function sleep(ms) {
    return new Promise(resolve => setTimeout(resolve, ms));
}

// FUNGSI ANIMASI SPIN
async function animateSpin(duration = 2000) { // Durasi 2 detik
    status.textContent = 'Spinning...';
    
    // Tambahkan kelas 'spinning' (untuk efek blur)
    slotImgs.forEach(img => img.classList.add('spinning'));

    const startTime = Date.now();
    let intervalId = setInterval(() => {
        // Ganti gambar di setiap slot secara acak
        for (const img of slotImgs) {
            const randomImg = allSymbolImages[Math.floor(Math.random() * allSymbolImages.length)];
            img.src = randomImg;
        }
    }, 80); // Ganti gambar setiap 80 milidetik

    // Tunggu selama durasi yang ditentukan
    await sleep(duration);

    // Hentikan interval
    clearInterval(intervalId);
    
    // Hapus kelas 'spinning'
    slotImgs.forEach(img => img.classList.remove('spinning'));
}


async function handleSpin() {
    status.textContent = 'Contacting server...';
    paymentInfoBox.classList.add('hidden');
    spinButton.disabled = true;

    try {
        const response = await fetch(`${API_URL}/spin`);

        if (response.status === 402) {
            // --- KASUS 1: PEMBAYARAN DIPERLUKAN ---
            const data = await response.json();
            status.textContent = '⚠️ Payment required. Check details below.';
            paymentDetails.textContent = JSON.stringify(data, null, 2);
            paymentInfoBox.classList.remove('hidden');
            spinButton.disabled = false; // Aktifkan tombol lagi

        } else if (response.ok) {
            // --- KASUS 2: PEMBAYARAN SUDAH DIVERIFIKASI ---
            
            // 1. Jalankan Animasi DULU!
            await animateSpin(2000); // Tunggu 2 detik
            
            // 2. Dapatkan hasil dari server
            const gameResult = await response.json();
            
            // 3. Tampilkan hasil AKHIR di slot
            slotImgs[0].src = `images/${gameResult.result[0]}.png`;
            slotImgs[1].src = `images/${gameResult.result[1]}.png`;
            slotImgs[2].src = `images/${gameResult.result[2]}.png`;

            // 4. Tampilkan status kemenangan
            if (gameResult.winnings > 0) {
                status.textContent = `🎉 Congratulations! You won ${gameResult.winnings} USD!`;
            } else {
                status.textContent = 'Not lucky this time. Try again!';
            }
            spinButton.disabled = false;

        } else {
            // Error server lainnya
            status.textContent = `Error: ${response.status} - ${response.statusText}`;
            spinButton.disabled = false;
        }

    } catch (error) {
        status.textContent = 'Failed to connect to server. Is it running?';
        console.error(error);
        spinButton.disabled = false;
    }
}

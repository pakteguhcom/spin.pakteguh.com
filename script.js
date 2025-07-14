document.addEventListener('DOMContentLoaded', () => {
    // === DOM Elements ===
    const canvas = document.getElementById('wheelCanvas');
    const ctx = canvas.getContext('2d');
    const entriesTextarea = document.getElementById('entries');
    const updateBtn = document.getElementById('updateBtn');
    const shuffleBtn = document.getElementById('shuffleBtn');
    const sortBtn = document.getElementById('sortBtn');
    const winnerDisplay = document.getElementById('winner-display');
    
    // Modal elements
    const modal = document.getElementById('winnerModal');
    const modalWinnerName = document.getElementById('modalWinnerName');
    const removeWinnerCheckbox = document.getElementById('removeWinnerCheckbox');
    const okButton = document.getElementById('okButton');
    const closeButton = document.querySelector('.close-button');

    // Audio elements
    const suspenseMusic = document.getElementById('suspense-music');
    const winSound = document.getElementById('win-sound');

    // === State ===
    let entries = [];
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];
    let currentAngle = 0;
    let spinAngle = 0;
    let spinVelocity = 0;
    let isSpinning = false;
    let lastWinner = null;

    // === Functions ===

    /**
     * Menggambar roda pada canvas berdasarkan entri yang ada.
     */
    const drawWheel = () => {
        // 1. Dapatkan entri dari textarea
        entries = entriesTextarea.value.split('\n').filter(entry => entry.trim() !== '');
        if (entries.length === 0) {
            clearCanvas();
            return;
        }

        const arcSize = (2 * Math.PI) / entries.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 10;

        // 2. Bersihkan dan atur canvas
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle);

        // 3. Gambar setiap segmen
        entries.forEach((entry, i) => {
            const angle = i * arcSize;
            ctx.fillStyle = colors[i % colors.length];

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + arcSize, false);
            ctx.lineTo(0, 0);
            ctx.fill();

            // Gambar teks
            ctx.save();
            ctx.fillStyle = 'white';
            ctx.font = 'bold 16px Poppins';
            ctx.textAlign = 'center';
            ctx.textBaseline = 'middle';
            ctx.rotate(angle + arcSize / 2);
            ctx.fillText(entry, radius * 0.6, 0);
            ctx.restore();
        });

        ctx.restore();

        // 4. Gambar lingkaran tengah
        ctx.fillStyle = 'white';
        ctx.beginPath();
        ctx.arc(centerX, centerY, 50, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = '#333';
        ctx.font = 'bold 18px Poppins';
        ctx.textAlign = 'center';
        ctx.textBaseline = 'middle';
        ctx.fillText('SPIN', centerX, centerY);
    };

    const clearCanvas = () => {
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.fillStyle = '#ccc';
        ctx.beginPath();
        ctx.arc(centerX, centerY, canvas.width / 2 - 10, 0, 2 * Math.PI);
        ctx.fill();
        ctx.fillStyle = 'white';
        ctx.font = 'bold 18px Poppins';
        ctx.textAlign = 'center';
        ctx.fillText('Tambahkan Nama', centerX, centerY);
    }

    /**
     * Memulai animasi putaran roda.
     */
    const spin = () => {
        if (isSpinning || entries.length < 2) return;
        isSpinning = true;
        winnerDisplay.textContent = '...';

        // Atur parameter putaran
        spinAngle = Math.random() * 10 + 10; // Putaran awal
        spinVelocity = 0.1 + Math.random() * 0.05; // Kecepatan

        // Mulai musik menegangkan
        suspenseMusic.currentTime = 0;
        suspenseMusic.play().catch(e => console.error("Audio play failed:", e));

        animateSpin();
    };

    /**
     * Loop animasi menggunakan requestAnimationFrame.
     */
    const animateSpin = () => {
        currentAngle += spinVelocity;
        spinVelocity *= 0.995; // Efek perlambatan (easing)

        if (spinVelocity < 0.001) {
            spinVelocity = 0;
            isSpinning = false;
            getWinner();
        }

        drawWheel();
        if (isSpinning) {
            requestAnimationFrame(animateSpin);
        }
    };

    /**
     * Menentukan dan menampilkan pemenang setelah roda berhenti.
     */
    const getWinner = () => {
        // Hentikan musik menegangkan
        suspenseMusic.pause();
        
        const totalSegments = entries.length;
        const arcSize = (2 * Math.PI) / totalSegments;
        
        // Koreksi sudut agar 0 berada di posisi penunjuk (kanan)
        const finalAngle = currentAngle % (2 * Math.PI);
        const correctedAngle = (2 * Math.PI) - finalAngle;
        
        const winnerIndex = Math.floor(correctedAngle / arcSize);
        lastWinner = entries[winnerIndex];

        winnerDisplay.textContent = lastWinner;
        showWinnerModal(lastWinner);
    };

    const showWinnerModal = (winner) => {
        modalWinnerName.textContent = winner;
        modal.style.display = 'block';
        removeWinnerCheckbox.checked = false; // Reset checkbox
        winSound.currentTime = 0;
        winSound.play().catch(e => console.error("Audio play failed:", e));
    };
    
    const hideWinnerModal = () => {
        if (removeWinnerCheckbox.checked && lastWinner) {
            let currentEntries = entriesTextarea.value.split('\n');
            currentEntries = currentEntries.filter(entry => entry.trim() !== lastWinner.trim());
            entriesTextarea.value = currentEntries.join('\n');
            drawWheel();
        }
        modal.style.display = 'none';
        lastWinner = null;
    };

    /**
     * Mengacak urutan nama di textarea.
     */
    const shuffleEntries = () => {
        let currentEntries = entriesTextarea.value.split('\n');
        for (let i = currentEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentEntries[i], currentEntries[j]] = [currentEntries[j], currentEntries[i]];
        }
        entriesTextarea.value = currentEntries.join('\n');
        drawWheel();
    };

    /**
     * Mengurutkan nama di textarea.
     */
    const sortEntries = () => {
        let currentEntries = entriesTextarea.value.split('\n').filter(e => e.trim() !== '');
        currentEntries.sort((a, b) => a.localeCompare(b));
        entriesTextarea.value = currentEntries.join('\n');
        drawWheel();
    };

    // === Event Listeners ===
    canvas.addEventListener('click', spin);
    updateBtn.addEventListener('click', drawWheel);
    shuffleBtn.addEventListener('click', shuffleEntries);
    sortBtn.addEventListener('click', sortEntries);
    
    // Modal listeners
    closeButton.addEventListener('click', hideWinnerModal);
    okButton.addEventListener('click', hideWinnerModal);
    window.addEventListener('click', (event) => {
        if (event.target == modal) {
            hideWinnerModal();
        }
    });

    // === Initial Call ===
    drawWheel();
});

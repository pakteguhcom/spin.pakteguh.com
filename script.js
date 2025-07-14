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

    // === Audio Synthesis with Tone.js ===
    // Membuat synthesizer untuk suara. Ini menggantikan tag <audio>
    const suspenseSynth = new Tone.Synth().toDestination();
    const winSynth = new Tone.PolySynth(Tone.Synth).toDestination();
    let suspenseLoop;

    // === State ===
    let entries = [];
    const colors = ['#3498db', '#e74c3c', '#2ecc71', '#f1c40f', '#9b59b6', '#1abc9c', '#e67e22'];
    let currentAngle = 0;
    let spinVelocity = 0;
    let isSpinning = false;
    let lastWinner = null;

    // === Functions ===

    /**
     * Menggambar roda pada canvas berdasarkan entri yang ada.
     */
    const drawWheel = () => {
        entries = entriesTextarea.value.split('\n').filter(entry => entry.trim() !== '');
        if (entries.length === 0) {
            clearCanvas();
            return;
        }

        const arcSize = (2 * Math.PI) / entries.length;
        const centerX = canvas.width / 2;
        const centerY = canvas.height / 2;
        const radius = canvas.width / 2 - 10;

        ctx.clearRect(0, 0, canvas.width, canvas.height);
        ctx.save();
        ctx.translate(centerX, centerY);
        ctx.rotate(currentAngle);

        entries.forEach((entry, i) => {
            const angle = i * arcSize;
            ctx.fillStyle = colors[i % colors.length];

            ctx.beginPath();
            ctx.moveTo(0, 0);
            ctx.arc(0, 0, radius, angle, angle + arcSize, false);
            ctx.lineTo(0, 0);
            ctx.fill();

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
    const spin = async () => {
        if (isSpinning || entries.length < 2) return;
        
        // Memulai konteks audio saat pengguna berinteraksi (penting untuk browser)
        await Tone.start();
        
        isSpinning = true;
        winnerDisplay.textContent = '...';

        // Atur parameter putaran
        spinVelocity = 0.1 + Math.random() * 0.05;

        // Mulai musik menegangkan menggunakan Tone.js
        if (suspenseLoop) suspenseLoop.dispose(); // Bersihkan loop sebelumnya
        suspenseLoop = new Tone.Loop(time => {
            suspenseSynth.triggerAttackRelease("C2", "8n", time);
        }, "8n").start(0);
        Tone.Transport.start();

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
        if (suspenseLoop) {
            Tone.Transport.stop();
            suspenseLoop.dispose();
        }
        
        const totalSegments = entries.length;
        const arcSize = (2 * Math.PI) / totalSegments;
        const finalAngle = currentAngle % (2 * Math.PI);
        const correctedAngle = (2 * Math.PI) - finalAngle;
        const winnerIndex = Math.floor(correctedAngle / arcSize);
        lastWinner = entries[winnerIndex];

        // Mainkan suara kemenangan
        const now = Tone.now();
        winSynth.triggerAttackRelease(["C4", "E4", "G4"], "8n", now);
        winSynth.triggerAttackRelease(["C5"], "8n", now + 0.2);

        winnerDisplay.textContent = lastWinner;
        showWinnerModal(lastWinner);
    };

    const showWinnerModal = (winner) => {
        modalWinnerName.textContent = winner;
        modal.style.display = 'block';
        removeWinnerCheckbox.checked = false;
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

    const shuffleEntries = () => {
        let currentEntries = entriesTextarea.value.split('\n');
        for (let i = currentEntries.length - 1; i > 0; i--) {
            const j = Math.floor(Math.random() * (i + 1));
            [currentEntries[i], currentEntries[j]] = [currentEntries[j], currentEntries[i]];
        }
        entriesTextarea.value = currentEntries.join('\n');
        drawWheel();
    };

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

function calculatePredictions() {
    // Reset hasil
    document.getElementById('predictionResults').innerHTML = '<p>🔄 Memproses data...</p>';
    document.getElementById('digitAnalysis').innerHTML = '';
    
    try {
        // Ambil input
        const day1 = document.getElementById('day1').value.trim();
        const day2 = document.getElementById('day2').value.trim();
        const day3 = document.getElementById('day3').value.trim();
        const day4 = document.getElementById('day4').value.trim();
        const day5 = document.getElementById('day5').value.trim();
        
        // Validasi input wajib
        if (!day1 || !day2) {
            throw new Error("Harap isi data untuk Hari 1 dan Hari 2");
        }
        if (!/^\d{4}$/.test(day1) || !/^\d{4}$/.test(day2)) {
            throw new Error("Format harus 4 digit angka (contoh: 1234)");
        }
        
        // Kumpulkan data historis yang valid
        const history = [day1, day2];
        if (day3 && /^\d{4}$/.test(day3)) history.push(day3);
        if (day4 && /^\d{4}$/.test(day4)) history.push(day4);
        if (day5 && /^\d{4}$/.test(day5)) history.push(day5);
        
        // Ambil digit dari hari 1 (yang tidak boleh digunakan)
        const forbiddenDigits = [...new Set(day1.split('').map(Number))];
        
        // Hitung statistik digit
        const digitStats = calculateDigitStatistics(history);
        
        // Ambil digit yang belum keluar di hari 1 dan 2
        const digitsDay1 = day1.split('').map(Number);
        const digitsDay2 = day2.split('').map(Number);
        const allDigitsDay1And2 = [...new Set([...digitsDay1, ...digitsDay2])];
        const missingDigitsDay1And2 = [];
        
        for (let i = 0; i <= 9; i++) {
            if (!allDigitsDay1And2.includes(i)) {
                missingDigitsDay1And2.push(i);
            }
        }
        
        // Ambil filter
        const requiredDigits = parseDigitInput('requiredDigits');
        const excludedDigits = parseDigitInput('excludedDigits');
        
        // Validasi filter
        const allFilters = [...requiredDigits, ...excludedDigits];
        for (const digit of allFilters) {
            if (digit < 0 || digit > 9) {
                throw new Error("Digit filter harus antara 0-9");
            }
        }
        
        // Tampilkan analisis digit
        displayDigitAnalysis(digitStats, forbiddenDigits, missingDigitsDay1And2, requiredDigits, excludedDigits);
        
        // Generate prediksi dengan mempertimbangkan filter dan digit yang belum muncul
        const predictions = generatePredictions(
            digitStats,
            forbiddenDigits,
            missingDigitsDay1And2,
            requiredDigits,
            excludedDigits,
            history
        );
        
        // Tampilkan hasil
        displayPredictions(predictions, forbiddenDigits, missingDigitsDay1And2, requiredDigits, excludedDigits);
        
    } catch (error) {
        document.getElementById('predictionResults').innerHTML = 
            `<p class="highlight">⚠️ Error: ${error.message}</p>`;
        console.error(error);
    }
}

function calculateDigitStatistics(history) {
    const stats = Array(10).fill(0);
    
    for (const number of history) {
        for (const digitStr of number) {
            const digit = parseInt(digitStr);
            stats[digit]++;
        }
    }
    
    return stats;
}

function parseDigitInput(inputId) {
    const input = document.getElementById(inputId).value.trim();
    if (!input) return [];
    
    return [...new Set(
        input.split(/\s+/)
            .map(Number)
            .filter(d => !isNaN(d) && d >= 0 && d <= 9)
    )];
}

function displayDigitAnalysis(stats, forbiddenDigits, missingDigitsDay1And2, requiredDigits, excludedDigits) {
    let analysisHTML = `
        <h3 style="margin-top: 0;">Statistik Kemunculan Digit</h3>
        <table>
            <thead>
                <tr>
                    <th>Digit</th>
                    <th>Frekuensi</th>
                    <th>Keterangan</th>
                </tr>
            </thead>
            <tbody>
    `;
    
    // Urutkan berdasarkan frekuensi
    const sortedStats = stats.map((count, digit) => ({digit, count}))
                           .sort((a, b) => b.count - a.count);
    
    for (const {digit, count} of sortedStats) {
        let description = '';
        let badgeClass = '';
        
        if (count === 0) {
            description = 'Belum pernah muncul';
            badgeClass = 'badge-success';
        } else if (forbiddenDigits.includes(digit)) {
            description = 'Tidak digunakan (keluar di Hari 1)';
            badgeClass = 'badge-danger';
        } else if (missingDigitsDay1And2.includes(digit)) {
            description = 'Belum keluar di Hari 1-2';
            badgeClass = 'badge-success';
        } else if (count <= 1) {
            description = 'Jarang muncul';
            badgeClass = 'badge-primary';
        } else {
            description = 'Sering muncul';
            badgeClass = 'badge-warning';
        }
        
        // Tambahkan indicator untuk required dan excluded digits
        if (requiredDigits.includes(digit)) {
            description += ' (WAJIB ADA)';
            badgeClass = 'badge-success';
        }
        if (excludedDigits.includes(digit)) {
            description += ' (TIDAK BOLEH ADA)';
            badgeClass = 'badge-danger';
        }
        
        analysisHTML += `
            <tr>
                <td>${digit}</td>
                <td>${count}x</td>
                <td><span class="badge ${badgeClass}">${description}</span></td>
            </tr>
        `;
    }
    
    analysisHTML += `</tbody></table>`;
    
    // Tambahkan ringkasan
    analysisHTML += `
        <div style="margin-top: 25px; background: #f0f7ff; padding: 15px; border-radius: 8px; border-left: 4px solid #3498db;">
            <p style="margin: 5px 0;"><strong>🔴 Digit yang dihindari:</strong> <span style="color: #e74c3c;">${forbiddenDigits.join(', ')}</span> (keluar di Hari 1)</p>
            <p style="margin: 5px 0;"><strong>🟢 Digit potensial:</strong> <span style="color: #2ecc71;">${missingDigitsDay1And2.join(', ')}</span> (belum keluar di Hari 1-2)</p>
            ${requiredDigits.length > 0 ? `<p style="margin: 5px 0;"><strong>✅ Digit wajib ada:</strong> <span style="color: #2ecc71; font-weight: bold;">${requiredDigits.join(', ')}</span></p>` : ''}
            ${excludedDigits.length > 0 ? `<p style="margin: 5px 0;"><strong>❌ Digit tidak boleh ada:</strong> <span style="color: #e74c3c; font-weight: bold;">${excludedDigits.join(', ')}</span></p>` : ''}
        </div>
    `;
    
    document.getElementById('digitAnalysis').innerHTML = analysisHTML;
}

function generatePredictions(stats, forbiddenDigits, missingDigitsDay1And2, requiredDigits, excludedDigits, history) {
    const predictions = new Set();
    const maxAttempts = 5000;
    let attempts = 0;
    
    // 1. Hitung digit yang jarang muncul berdasarkan data historis
    const rareDigits = [];
    for (let i = 0; i < stats.length; i++) {
        if (stats[i] <= Math.floor(history.length / 2)) { // Muncul kurang dari setengah hari
            rareDigits.push(i);
        }
    }
    
    // 2. Filter digit yang diizinkan
    let allowedDigits = Array.from({length: 10}, (_, i) => i)
        .filter(d => !forbiddenDigits.includes(d));
    
    // 3. Handle excluded digits:
    // - Jika excluded digits termasuk digit yang jarang muncul, kita abaikan
    const effectiveExcludedDigits = excludedDigits.filter(d => !rareDigits.includes(d));
    allowedDigits = allowedDigits.filter(d => !effectiveExcludedDigits.includes(d));
    
    // 4. Pastikan requiredDigits termasuk
    for (const req of requiredDigits) {
        if (!allowedDigits.includes(req)) {
            allowedDigits.push(req);
        }
    }
    
    // 5. Prioritas digit:
    const priorityDigits = [...requiredDigits];
    const secondaryPriorityDigits = missingDigitsDay1And2.filter(d => 
        !priorityDigits.includes(d) && allowedDigits.includes(d)
    );
    const tertiaryDigits = rareDigits.filter(d => 
        !priorityDigits.includes(d) && 
        !secondaryPriorityDigits.includes(d) &&
        allowedDigits.includes(d)
    );
    const otherDigits = allowedDigits.filter(d => 
        !priorityDigits.includes(d) && 
        !secondaryPriorityDigits.includes(d) &&
        !tertiaryDigits.includes(d)
    );
    
    while (predictions.size < 10 && attempts < maxAttempts) {
        attempts++;
        
        let selectedDigits = [...priorityDigits];
        
        // Tambahkan digit prioritas sekunder
        const neededAfterPriority = 4 - selectedDigits.length;
        if (neededAfterPriority > 0 && secondaryPriorityDigits.length > 0) {
            const shuffledSecondary = [...secondaryPriorityDigits].sort(() => Math.random() - 0.5);
            selectedDigits.push(...shuffledSecondary.slice(0, neededAfterPriority));
        }
        
        // Tambahkan digit jarang
        const neededAfterSecondary = 4 - selectedDigits.length;
        if (neededAfterSecondary > 0 && tertiaryDigits.length > 0) {
            const shuffledTertiary = [...tertiaryDigits].sort(() => Math.random() - 0.5);
            selectedDigits.push(...shuffledTertiary.slice(0, neededAfterSecondary));
        }
        
        // Tambahkan digit lain jika masih kurang
        const remainingDigits = 4 - selectedDigits.length;
        if (remainingDigits > 0 && otherDigits.length > 0) {
            const shuffledOther = [...otherDigits].sort(() => Math.random() - 0.5);
            selectedDigits.push(...shuffledOther.slice(0, remainingDigits));
        }
        
        // Validasi akhir
        if (selectedDigits.length !== 4) continue;
        if (!requiredDigits.every(d => selectedDigits.includes(d))) continue;
        if (excludedDigits.some(d => selectedDigits.includes(d))) continue;
        
        // Pastikan minimal ada 1 digit yang belum muncul di 2 hari terakhir
        if (priorityDigits.length < 4) {
            const hasMissingDigit = selectedDigits.some(d => missingDigitsDay1And2.includes(d));
            if (!hasMissingDigit) continue;
        }
        
        // Acak urutan digit dan simpan prediksi
        const prediction = selectedDigits.sort(() => Math.random() - 0.5).slice(0, 4).join('');
        predictions.add(prediction);
    }
    
    return Array.from(predictions);
}

function displayPredictions(predictions, forbiddenDigits, missingDigitsDay1And2, requiredDigits, excludedDigits) {
    if (predictions.length === 0) {
        document.getElementById('predictionResults').innerHTML = `
            <div class="highlight" style="padding: 15px; border-radius: 8px;">
                <p>Tidak ditemukan angka prediksi yang memenuhi kriteria.</p>
                <p>Kemungkinan penyebab:</p>
                <ul>
                    <li>Filter terlalu ketat (terlalu banyak angka wajib/dilarang)</li>
                    <li>Konflik antara angka wajib ada dan tidak boleh ada</li>
                    <li>Data historis tidak cukup</li>
                    <li>Angka yang diizinkan terlalu sedikit</li>
                </ul>
                <p>Coba relaksasikan filter atau tambahkan lebih banyak data historis.</p>
            </div>
        `;
        return;
    }
    
    let resultsHTML = `
        <h3>🔮 ${predictions.length} Angka Prediksi Terbaik</h3>
        <p style="margin-bottom: 20px;">Angka berikut tidak mengandung digit dari Hari 1: <span style="color: #e74c3c; font-weight: bold;">${forbiddenDigits.join(', ')}</span></p>
        ${requiredDigits.length > 0 ? `<p style="margin-bottom: 10px;">Mengandung digit wajib: <span style="color: #2ecc71; font-weight: bold;">${requiredDigits.join(', ')}</span></p>` : ''}
        ${excludedDigits.length > 0 ? `<p style="margin-bottom: 10px;">Tidak mengandung digit terlarang: <span style="color: #e74c3c; font-weight: bold;">${excludedDigits.join(', ')}</span></p>` : ''}
        <div class="prediction-container">
    `;
    
    for (const num of predictions) {
        // Highlight digit yang wajib ada dan yang belum muncul
        const formattedNum = num.split('').map(d => {
            const digit = parseInt(d);
            if (requiredDigits.includes(digit)) {
                return `<span style="color: #2ecc71; font-weight: bold; text-decoration: underline;">${d}</span>`;
            } else if (missingDigitsDay1And2.includes(digit)) {
                return `<span style="color: #2ecc71; font-weight: bold;">${d}</span>`;
            }
            return d;
        }).join('');
        
        resultsHTML += `
            <div class="prediction-result">
                ${formattedNum}
            </div>
        `;
    }
    
    resultsHTML += `</div>`;
    
    resultsHTML += `
        <div style="margin-top: 20px; background: #f0f7ff; padding: 15px; border-radius: 8px;">
            <p style="margin: 5px 0;"><span style="color: #2ecc71; font-weight: bold; text-decoration: underline;">Digit bergaris bawah hijau</span>: 
            Digit yang wajib ada (sesuai filter)</p>
            <p style="margin: 5px 0;"><span style="color: #2ecc71; font-weight: bold;">Digit hijau</span>: 
            Digit yang belum muncul dalam 2 hari terakhir</p>
            <p style="margin: 5px 0;"><span style="font-weight: bold;">Tip:</span> Pilih beberapa angka prediksi yang memiliki kombinasi berbeda untuk peluang lebih baik</p>
        </div>
    `;
    
    document.getElementById('predictionResults').innerHTML = resultsHTML;
}
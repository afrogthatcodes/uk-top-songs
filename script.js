const ADMIN_PASSWORD = "Pengi Pootle"; // Change this password if needed
let isAdminLoggedIn = sessionStorage.getItem('ukts_admin_auth') === 'true';

const chartCategories = [
    { id: 'top-songs', title: 'Top Songs', subtitle: 'Singles Chart', maxRank: 75 },
    { id: 'top-albums', title: 'Top Albums', subtitle: 'Albums Chart', maxRank: 25 },
    { id: 'top-artists', title: 'Top Artists', subtitle: 'Artists Chart', maxRank: 25 },
    { id: 'greatest-hits', title: 'Greatest Hits', subtitle: 'Compilation Chart', maxRank: 25 },
    { id: 'top-afrobeats', title: 'Top Afrobeats Songs', subtitle: 'Genre Chart', maxRank: 25 },
    { id: 'top-dance', title: 'Top Dance/Electronic Songs', subtitle: 'Genre Chart', maxRank: 25 },
    { id: 'top-folk-country', title: 'Top Folk/Country Songs', subtitle: 'Genre Chart', maxRank: 25 },
    { id: 'top-indie-rock', title: 'Top Indie/Rock Songs', subtitle: 'Genre Chart', maxRank: 25 },
    { id: 'top-rap', title: 'Top Rap Songs', subtitle: 'Genre Chart', maxRank: 25 },
    { id: 'top-rnb', title: 'Top R&B Songs', subtitle: 'Genre Chart', maxRank: 25 }
];

const defaultData = {
    genres: ['Afrobeats', 'Dance/Electronic', 'Folk/Country', 'Indie/Rock', 'Pop', 'Rap', 'Rnb/Funk'],
    songs: [
        { id: '1', code: 'UKTS-1', title: 'Rein Me In', artist: 'Sam Fender & Olivia Dean', genres: ['Indie/Rock'], album: 'Single', cover: '' },
        { id: '2', code: 'UKTS-2', title: 'Man I Need', artist: 'Olivia Dean', genres: ['Rnb/Funk'], album: 'Single', cover: '' },
        { id: '3', code: 'UKTS-3', title: 'Great Expectation', artist: 'SIENNA SPIRO', genres: ['Pop'], album: 'Single', cover: '' },
        { id: '4', code: 'UKTS-4', title: "Choosin' Texas", artist: 'Ella Langley', genres: ['Folk/Country'], album: 'Single', cover: '' },
        { id: '5', code: 'UKTS-5', title: 'stupid song', artist: 'Olivia Rodrigo', genres: ['Pop'], album: 'Single', cover: '' }
    ],
    artistCodes: {
        'Sam Fender': 'UKTA-1',
        'Olivia Dean': 'UKTA-2',
        'SIENNA SPIRO': 'UKTA-3',
        'Ella Langley': 'UKTA-4',
        'Olivia Rodrigo': 'UKTA-5'
    },
    chartHistory: {
        'top-songs': {
            '18/09/2026': [
                { songId: '1', rank: 1, salesIncrease: false },
                { songId: '2', rank: 2, salesIncrease: true },
                { songId: '3', rank: 3, salesIncrease: false },
                { songId: '4', rank: 4, salesIncrease: false },
                { songId: '5', rank: 5, salesIncrease: true }
            ]
        }
    },
    news: [
        { id: '1', title: 'Charts update: New milestones reached this week', category: 'Latest News', date: 'Sept 18, 2026', content: 'Check out the latest movements across the official UK charts.' }
    ]
};

let globalDB = null;
let currentBuilderEntries = [];

// --- Code Generators ---
function getNextSongCode(db) {
    let maxNum = 0;
    (db.songs || []).forEach(s => {
        if (s.code && s.code.startsWith('UKTS-')) {
            const num = parseInt(s.code.replace('UKTS-', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });
    return `UKTS-${maxNum + 1}`;
}

function getOrAssignArtistCode(artistName, db) {
    if (!db.artistCodes) db.artistCodes = {};
    if (db.artistCodes[artistName]) return db.artistCodes[artistName];

    let maxNum = 0;
    Object.values(db.artistCodes).forEach(code => {
        if (code && code.startsWith('UKTA-')) {
            const num = parseInt(code.replace('UKTA-', ''), 10);
            if (!isNaN(num) && num > maxNum) maxNum = num;
        }
    });

    const newCode = `UKTA-${maxNum + 1}`;
    db.artistCodes[artistName] = newCode;
    return newCode;
}

async function fetchDBAsync() {
    try {
        const response = await fetch('db.json?t=' + Date.now());
        if (response.ok) {
            const remoteDB = await response.json();
            if (remoteDB && remoteDB.songs && remoteDB.songs.length > 0) {
                globalDB = remoteDB;
                localStorage.setItem('uk_top_songs_db_v5', JSON.stringify(globalDB));
                return globalDB;
            }
        }
    } catch (err) {
        console.warn('Could not fetch remote db.json, attempting fallback to local storage.');
    }

    const localData = localStorage.getItem('uk_top_songs_db_v5');
    if (localData) {
        try {
            globalDB = JSON.parse(localData);
            return globalDB;
        } catch (e) {}
    }

    globalDB = defaultData;
    return globalDB;
}

function getDB() {
    if (globalDB) return globalDB;
    const localData = localStorage.getItem('uk_top_songs_db_v5');
    if (!localData) return defaultData;
    try {
        return JSON.parse(localData);
    } catch (e) {
        return defaultData;
    }
}

function saveDB(data) {
    globalDB = data;
    localStorage.setItem('uk_top_songs_db_v5', JSON.stringify(data));
    
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(data, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", "db.json");
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
    showToast('Database saved & db.json downloaded for GitHub!');
}

const fallbackCoverSVG = "data:image/svg+xml;utf8,<svg xmlns='http://www.w3.org/2000/svg' width='100' height='100'><rect width='100' height='100' fill='%23addedc'/></svg>";

function renderSongCover(song, customClass = "w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0") {
    const rawCover = song && (song.cover || song.coverUrl);
    const imgSrc = (rawCover && typeof rawCover === 'string' && rawCover.trim() !== '' && !rawCover.startsWith('data:image/svg')) ? rawCover.trim() : fallbackCoverSVG;
    return `<img src='${imgSrc}' class='${customClass}' onerror="this.src='https://placehold.co/100x100/222/fff?text=Song'">`;
}

function getSongGenres(song) {
    if (song.genres && Array.isArray(song.genres)) return song.genres;
    if (song.genre) return [song.genre];
    return ['Pop'];
}

function renderGenreBadges(song) {
    const genres = getSongGenres(song);
    return genres.map(g => `<span class="bg-neutral-800 px-2.5 py-1 rounded-full text-xs inline-block mr-1 mb-1">${g}</span>`).join('');
}

function parseArtistNames(artistString) {
    if (!artistString) return [];
    const cleaned = artistString.replace(/;/g, ',').replace(/\bfeat\.?/gi, ',');
    return cleaned.split(',').map(a => a.trim()).filter(Boolean);
}

const normalizeStr = (str) => (str || '').toString().toLowerCase().replace(/[^a-z0-9]/g, '');

function artistsMatch(artistStr1, artistStr2) {
    if (!artistStr1 || !artistStr2) return false;
    const a1 = artistStr1.trim().toLowerCase();
    const a2 = artistStr2.trim().toLowerCase();
    if (a1 === a2) return true;

    const tokens1 = a1.split(/[,;&]|\band\b|\bfeat\.?/gi).map(s => s.trim()).filter(Boolean);
    const tokens2 = a2.split(/[,;&]|\band\b|\bfeat\.?/gi).map(s => s.trim()).filter(Boolean);

    return tokens1.some(t1 => tokens2.includes(t1)) || tokens2.some(t2 => tokens1.includes(t2));
}

function songHasArtist(artistString, targetArtist) {
    if (!artistString) return false;
    const artists = parseArtistNames(artistString).map(a => a.toLowerCase());
    const target = targetArtist.trim().toLowerCase();
    return artists.includes(target);
}

// --- Artist Peak Sorting Helper ---
function getArtistTracksSortedByPeak(artistName, db) {
    const artistSongs = (db.songs || []).filter(s => songHasArtist(s.artist, artistName));
    const trackMap = {};

    artistSongs.forEach(song => {
        let peak = 999;
        let weeks = 0;

        if (db.chartHistory) {
            Object.values(db.chartHistory).forEach(categoryDates => {
                Object.values(categoryDates).forEach(entries => {
                    const entry = entries.find(e => e.songId === song.id);
                    if (entry) {
                        weeks++;
                        if (entry.rank < peak) {
                            peak = entry.rank;
                        }
                    }
                });
            });
        }

        trackMap[song.id] = {
            ...song,
            peak: peak === 999 ? '-' : peak,
            weeks: weeks
        };
    });

    return Object.values(trackMap).sort((a, b) => {
        const peakA = typeof a.peak === 'number' ? a.peak : 999;
        const peakB = typeof b.peak === 'number' ? b.peak : 999;
        return peakA - peakB;
    });
}

// --- Missing Helpers to Prevent Page Crashes ---
function getChartDropouts(chartHistoryData, currentChartDate) {
    return [];
}

function safeLen(arr) {
    return (arr && Array.isArray(arr)) ? arr.length : 0;
}

function formatArtists(artistString) {
    if (!artistString) return '';
    const makeLink = (name) => `<a href="artist.html?name=${encodeURIComponent(name)}" class="hover:text-white transition-colors">${name}</a>`;
    const cleanedString = artistString.replace(/;/g, ',');

    if (cleanedString.toLowerCase().includes('feat.')) {
        const parts = cleanedString.split(/feat\./i).map(a => a.trim()).filter(Boolean);
        const primaryPart = parts[0];
        const primaryArtists = primaryPart.split(',').map(a => a.trim()).filter(Boolean);
        const featuredArtists = parts.slice(1).join(' ').split(',').map(a => a.trim()).filter(Boolean);
        
        let formattedPrimary = primaryArtists.length === 1 ? makeLink(primaryArtists[0]) : `${primaryArtists.slice(0, -1).map(a => makeLink(a)).join(', ')} & ${makeLink(primaryArtists[primaryArtists.length - 1])}`;
        if (featuredArtists.length === 0) return formattedPrimary;
        if (featuredArtists.length === 1) return `${formattedPrimary} feat. ${makeLink(featuredArtists[0])}`;
        return `${formattedPrimary} feat. ${featuredArtists.slice(0, -1).map(a => makeLink(a)).join(', ')} & ${makeLink(featuredArtists[featuredArtists.length - 1])}`;
    } 
    
    let artists = cleanedString.split(',').map(a => a.trim()).filter(Boolean);
    if (artists.length === 1) return makeLink(artists[0]);
    if (artists.length === 2) return `${makeLink(artists[0])} & ${makeLink(artists[1])}`;
    const lastArtist = artists.pop();
    return `${artists.map(a => makeLink(a)).join(', ')} & ${makeLink(lastArtist)}`;
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#addedc] text-black px-6 py-3 rounded-xl font-bold shadow-2xl z-50 text-sm';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

// --- Admin Authentication Helpers ---
function promptAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        document.getElementById('admin-pass-input').value = '';
        document.getElementById('admin-login-error').classList.add('hidden');
        modal.classList.remove('hidden');
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.add('hidden');
}

function handleAdminLogin(e) {
    e.preventDefault();
    const pass = document.getElementById('admin-pass-input').value;
    if (pass === ADMIN_PASSWORD) {
        isAdminLoggedIn = true;
        sessionStorage.setItem('ukts_admin_auth', 'true');
        closeAdminLoginModal();
        showToast('Welcome, Admin!');
        if (typeof initAdminPage === 'function') initAdminPage();
    } else {
        const err = document.getElementById('admin-login-error');
        if (err) err.classList.remove('hidden');
    }
}

function adminLogout() {
    isAdminLoggedIn = false;
    sessionStorage.removeItem('ukts_admin_auth');
    showToast('Logged out of Admin');
    window.location.href = 'index.html';
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});

// --- ADMIN UPLOAD & CROWNNOTE-STYLE CHART BUILDER TAB UI ---
function renderAdminUploadTab() {
    const chartOptions = chartCategories.map(c => `<option value="${c.id}">${c.title} (${c.maxRank} max)</option>`).join('');
    const today = new Date();
    const defaultDateStr = `${String(today.getDate()).padStart(2, '0')}/${String(today.getMonth() + 1).padStart(2, '0')}/${today.getFullYear()}`;

    return `
        <div class="space-y-8 max-w-4xl">
            <!-- Mode Switcher Tabs -->
            <div class="flex gap-2 border-b border-neutral-800 pb-4">
                <button onclick="switchAdminToolMode('csv')" id="tool-mode-csv-btn" class="bg-[#addedc] text-black px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all">CSV Importer</button>
                <button onclick="switchAdminToolMode('builder')" id="tool-mode-builder-btn" class="bg-neutral-800 text-neutral-400 px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all hover:text-white">Crownnote-Style Chart Builder</button>
            </div>

            <!-- CSV Importer Section -->
            <div id="tool-csv-section" class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-4">
                <h3 class="text-xl font-bold uppercase">CSV Importer</h3>
                <p class="text-xs text-neutral-400">
                    <strong>Catalog Mode:</strong> <code class="text-[#addedc]">Title, Artist, Genres, Cover URL, Album</code>.<br>
                    <strong>Chart Mode:</strong> <code class="text-[#addedc]">Rank, Song, Artist, Sales Increase (true/false)</code> or Full 7-column format.
                </p>

                <div>
                    <label class="block text-xs uppercase text-neutral-400 mb-1">Upload Mode</label>
                    <select id="csv-upload-type" onchange="toggleUploadModeFields()" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none">
                        <option value="catalog">Master Songs Catalog Import (Songs Only)</option>
                        <option value="chart">Chart Rankings Import (Assign to Chart & Date)</option>
                    </select>
                </div>

                <div id="chart-options-container" class="space-y-3 hidden">
                    <div class="grid grid-cols-1 sm:grid-cols-2 gap-3">
                        <div>
                            <label class="block text-xs uppercase text-neutral-400 mb-1">Select Chart</label>
                            <select id="csv-chart-category" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none">
                                ${chartOptions}
                            </select>
                        </div>
                        <div>
                            <label class="block text-xs uppercase text-neutral-400 mb-1">Chart Date (DD/MM/YYYY)</label>
                            <input type="text" id="csv-chart-date" value="${defaultDateStr}" placeholder="DD/MM/YYYY" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none font-mono">
                        </div>
                    </div>
                </div>

                <div>
                    <label class="block text-xs uppercase text-neutral-400 mb-1">CSV File</label>
                    <input type="file" id="csv-file-input" accept=".csv" class="w-full bg-black border border-neutral-700 px-4 py-3 rounded-xl text-xs text-white">
                </div>

                <button onclick="handleCSVUpload(event)" class="bg-[#addedc] text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase">Import CSV</button>
            </div>

            <!-- Crownnote-Style Chart Builder Section -->
            <div id="tool-builder-section" class="bg-neutral-900 border border-neutral-800 rounded-2xl p-6 space-y-6 hidden">
                <div class="flex flex-col sm:flex-row justify-between items-start sm:items-center gap-4">
                    <div>
                        <h3 class="text-xl font-bold uppercase">Crownnote-Style Chart Builder</h3>
                        <p class="text-xs text-neutral-400">Add songs dynamically, reorder positions, and build your weekly chart flexibly.</p>
                    </div>
                    <button onclick="saveInteractiveChart()" class="bg-[#addedc] text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase">Save Chart</button>
                </div>

                <div class="grid grid-cols-1 sm:grid-cols-2 gap-4 bg-black/40 p-4 rounded-xl border border-neutral-800">
                    <div>
                        <label class="block text-xs uppercase text-neutral-400 mb-1">Select Chart Category</label>
                        <select id="builder-chart-category" onchange="loadBuilderRows()" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none">
                            ${chartOptions}
                        </select>
                    </div>
                    <div>
                        <label class="block text-xs uppercase text-neutral-400 mb-1">Chart Date (DD/MM/YYYY)</label>
                        <input type="text" id="builder-chart-date" value="${defaultDateStr}" onchange="loadBuilderRows()" placeholder="DD/MM/YYYY" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none font-mono">
                    </div>
                </div>

                <!-- Song Picker / Add Bar -->
                <div class="bg-black/60 p-4 rounded-xl border border-neutral-800 flex flex-col sm:flex-row gap-3 items-center">
                    <select id="builder-song-picker" class="flex-1 w-full bg-neutral-900 border border-neutral-700 px-4 py-2.5 rounded-xl text-xs text-white focus:outline-none">
                        <option value="">-- Select Song from Catalog to Add --</option>
                    </select>
                    <button onclick="addSongToBuilder()" class="w-full sm:w-auto bg-[#addedc] text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase shrink-0">Add to Chart</button>
                </div>

                <!-- Dynamic Chart List -->
                <div id="builder-rows-container" class="space-y-3 max-h-[500px] overflow-y-auto pr-2">
                    <!-- Dynamically populated chart rows -->
                </div>

                <button onclick="saveInteractiveChart()" class="bg-[#addedc] text-black px-6 py-2.5 rounded-xl text-xs font-bold uppercase">Save Chart</button>
            </div>
        </div>
    `;
}

function switchAdminToolMode(mode) {
    const csvBtn = document.getElementById('tool-mode-csv-btn');
    const builderBtn = document.getElementById('tool-mode-builder-btn');
    const csvSection = document.getElementById('tool-csv-section');
    const builderSection = document.getElementById('tool-builder-section');

    if (mode === 'csv') {
        csvBtn.className = 'bg-[#addedc] text-black px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all';
        builderBtn.className = 'bg-neutral-800 text-neutral-400 px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all hover:text-white';
        csvSection.classList.remove('hidden');
        builderSection.classList.add('hidden');
    } else {
        builderBtn.className = 'bg-[#addedc] text-black px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all';
        csvBtn.className = 'bg-neutral-800 text-neutral-400 px-5 py-2 rounded-xl text-xs font-bold uppercase transition-all hover:text-white';
        builderSection.classList.remove('hidden');
        csvSection.classList.add('hidden');
        loadBuilderRows();
    }
}

function loadBuilderRows() {
    const container = document.getElementById('builder-rows-container');
    const picker = document.getElementById('builder-song-picker');
    if (!container || !picker) return;

    const db = getDB();
    const category = document.getElementById('builder-chart-category')?.value || 'top-songs';
    const dateInput = document.getElementById('builder-chart-date')?.value.trim();

    const sortedSongs = [...(db.songs || [])].sort((a, b) => a.title.localeCompare(b.title));
    picker.innerHTML = `<option value="">-- Select Song from Catalog to Add --</option>` + sortedSongs.map(s => `<option value="${s.id}">${s.title} - ${s.artist} (${s.code})</option>`).join('');

    const existingEntries = (db.chartHistory && db.chartHistory[category] && db.chartHistory[category][dateInput]) || [];
    currentBuilderEntries = JSON.parse(JSON.stringify(existingEntries));

    renderBuilderList();
}

function renderBuilderList() {
    const container = document.getElementById('builder-rows-container');
    if (!container) return;
    const db = getDB();

    if (currentBuilderEntries.length === 0) {
        container.innerHTML = `<div class="p-8 text-center text-neutral-500 bg-black/40 rounded-xl border border-neutral-800">No songs added to this chart yet. Use the picker above to add songs.</div>`;
        return;
    }

    let html = '';
    currentBuilderEntries.forEach((entry, idx) => {
        const song = db.songs.find(s => s.id === entry.songId);
        const title = song ? song.title : 'Unknown Song';
        const artist = song ? song.artist : 'Unknown Artist';
        const cover = song ? renderSongCover(song, "w-8 h-8 rounded-lg object-cover bg-neutral-800 shrink-0") : '';
        const rank = idx + 1;
        entry.rank = rank;

        html += `
            <div class="flex items-center gap-3 bg-black/60 border border-neutral-800 p-3 rounded-xl">
                <div class="w-12 text-center font-black text-sm text-[#addedc]">#${rank}</div>
                <div class="shrink-0">${cover}</div>
                <div class="flex-1 min-w-0">
                    <p class="font-bold text-xs truncate text-white">${title}</p>
                    <p class="text-[10px] text-neutral-400 truncate">${artist}</p>
                </div>
                <div class="flex items-center space-x-2 shrink-0 px-2">
                    <input type="checkbox" onchange="toggleBuilderSales(${idx}, this.checked)" class="accent-[#addedc] w-4 h-4 rounded cursor-pointer" ${entry.salesIncrease ? 'checked' : ''}>
                    <span class="text-[10px] text-neutral-400 uppercase">Sales Inc.</span>
                </div>
                <div class="flex items-center gap-1 shrink-0">
                    <button onclick="moveBuilderItem(${idx}, -1)" class="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center text-xs" title="Move Up"><i class="fa-solid fa-arrow-up"></i></button>
                    <button onclick="moveBuilderItem(${idx}, 1)" class="w-7 h-7 bg-neutral-800 hover:bg-neutral-700 text-white rounded-lg flex items-center justify-center text-xs" title="Move Down"><i class="fa-solid fa-arrow-down"></i></button>
                    <button onclick="removeBuilderItem(${idx})" class="w-7 h-7 bg-red-950 hover:bg-red-900 text-red-400 rounded-lg flex items-center justify-center text-xs" title="Remove"><i class="fa-solid fa-trash"></i></button>
                </div>
            </div>
        `;
    });

    container.innerHTML = html;
}

function addSongToBuilder() {
    const picker = document.getElementById('builder-song-picker');
    if (!picker || !picker.value) {
        showToast('Please select a song to add.');
        return;
    }

    const songId = picker.value;
    if (currentBuilderEntries.some(e => e.songId === songId)) {
        showToast('This song is already in the chart!');
        return;
    }

    currentBuilderEntries.push({
        songId,
        rank: currentBuilderEntries.length + 1,
        salesIncrease: false
    });

    picker.value = '';
    renderBuilderList();
    showToast('Song added to chart!');
}

function moveBuilderItem(index, direction) {
    const newIndex = index + direction;
    if (newIndex < 0 || newIndex >= currentBuilderEntries.length) return;
    const item = currentBuilderEntries.splice(index, 1)[0];
    currentBuilderEntries.splice(newIndex, 0, item);
    renderBuilderList();
}

function removeBuilderItem(index) {
    currentBuilderEntries.splice(index, 1);
    renderBuilderList();
    showToast('Song removed from chart.');
}

function toggleBuilderSales(index, isChecked) {
    if (currentBuilderEntries[index]) {
        currentBuilderEntries[index].salesIncrease = isChecked;
    }
}

function saveInteractiveChart() {
    const db = getDB();
    const category = document.getElementById('builder-chart-category')?.value || 'top-songs';
    const dateInput = document.getElementById('builder-chart-date')?.value.trim();

    if (!dateInput) {
        showToast('Please specify a chart date.');
        return;
    }

    if (!db.chartHistory) db.chartHistory = {};
    if (!db.chartHistory[category]) db.chartHistory[category] = {};

    currentBuilderEntries.forEach((entry, idx) => {
        entry.rank = idx + 1;
    });

    db.chartHistory[category][dateInput] = JSON.parse(JSON.stringify(currentBuilderEntries));
    saveDB(db);
    showToast(`Successfully saved ${currentBuilderEntries.length} entries for ${category} (${dateInput})!`);
}

function toggleUploadModeFields() {
    const mode = document.getElementById('csv-upload-type')?.value;
    const container = document.getElementById('chart-options-container');
    if (container) {
        if (mode === 'chart') {
            container.classList.remove('hidden');
        } else {
            container.classList.add('hidden');
        }
    }
}

function handleCSVUpload(e) {
    const fileInput = document.getElementById('csv-file-input');
    const uploadType = document.getElementById('csv-upload-type')?.value || 'catalog';
    const chartCategory = document.getElementById('csv-chart-category')?.value;
    const chartDate = document.getElementById('csv-chart-date')?.value.trim();

    if (!fileInput || !fileInput.files[0]) {
        showToast('Please select a CSV file first.');
        return;
    }

    if (uploadType === 'chart' && !chartDate) {
        showToast('Please specify a chart date (DD/MM/YYYY).');
        return;
    }

    const file = fileInput.files[0];
    const reader = new FileReader();

    reader.onload = function(event) {
        const text = event.target.result;
        const lines = text.split(/\r\n|\n/);
        const db = getDB();

        if (uploadType === 'chart') {
            if (!db.chartHistory) db.chartHistory = {};
            if (!db.chartHistory[chartCategory]) db.chartHistory[chartCategory] = {};
        }

        const chartEntries = [];
        let importedCount = 0;
        let matchedCount = 0;

        for (let i = 0; i < lines.length; i++) {
            const line = lines[i].trim();
            if (!line) continue;

            const lowerLine = line.toLowerCase();
            if (i === 0 && (lowerLine.includes('title') || lowerLine.includes('song') || lowerLine.includes('rank'))) continue;

            const cols = line.split(',').map(c => c.trim().replace(/^"|"$/g, ''));
            if (cols.length < 2) continue;

            let title = '';
            let artist = '';
            let genresRaw = 'Pop';
            let cover = '';
            let album = '';
            let salesIncreaseVal = false;

            if (uploadType === 'chart') {
                if (!isNaN(cols[0])) {
                    title = cols[1] || '';
                    artist = cols[2] || '';
                    
                    if (cols.length === 4) {
                        const rawSales = (cols[3] || '').trim().toLowerCase();
                        salesIncreaseVal = ['true', 'yes', '1', 'up', 'y', 't'].includes(rawSales);
                    } else {
                        genresRaw = cols[3] || 'Pop';
                        cover = cols[4] || '';
                        album = cols[5] || '';
                        const rawSales = (cols[6] || '').trim().toLowerCase();
                        salesIncreaseVal = ['true', 'yes', '1', 'up', 'y', 't'].includes(rawSales);
                    }
                } else {
                    title = cols[0] || '';
                    artist = cols[1] || '';
                    genresRaw = cols[2] || 'Pop';
                    cover = cols[3] || '';
                    album = cols[4] || '';
                    const rawSales = (cols[5] || '').trim().toLowerCase();
                    salesIncreaseVal = ['true', 'yes', '1', 'up', 'y', 't'].includes(rawSales);
                }
            } else {
                title = cols[0] || '';
                artist = cols[1] || '';
                genresRaw = cols[2] || 'Pop';
                cover = cols[3] || '';
                album = cols[4] || '';
            }

            if (!title || !artist) continue;

            const genres = genresRaw.split(';').map(g => g.trim()).filter(Boolean);
            if (genres.length === 0) genres.push('Pop');

            const artistNames = parseArtistNames(artist);
            artistNames.forEach(aName => getOrAssignArtistCode(aName, db));

            const normTitle = normalizeStr(title);

            let existingSong = db.songs.find(s => {
                if (normalizeStr(s.title) !== normTitle) return false;
                return artistsMatch(s.artist, artist);
            });

            if (!existingSong) {
                existingSong = {
                    id: (Date.now() + i).toString(),
                    code: getNextSongCode(db),
                    title,
                    artist,
                    album,
                    genres,
                    cover: cover || ''
                };
                db.songs.push(existingSong);
                importedCount++;
            } else {
                matchedCount++;
                if (cover && !existingSong.cover) existingSong.cover = cover;
                if (album && !existingSong.album) existingSong.album = album;
            }

            if (uploadType === 'chart') {
                chartEntries.push({
                    songId: existingSong.id,
                    rank: chartEntries.length + 1,
                    salesIncrease: salesIncreaseVal
                });
            }
        }

        if (uploadType === 'chart') {
            db.chartHistory[chartCategory][chartDate] = chartEntries;
            showToast(`Chart updated! Matched ${matchedCount}, added ${importedCount} new.`);
        } else {
            showToast(`Catalog updated! Added ${importedCount} new songs.`);
        }

        saveDB(db);
        if (typeof switchAdminTab === 'function') switchAdminTab('songs');
    };

    reader.readAsText(file);
}

function openSongModal(songId = null) {
    const db = getDB();
    const song = songId ? db.songs.find(s => s.id === songId) : null;
    const currentGenres = song ? getSongGenres(song) : ['Pop'];
    const autoCode = song ? song.code : getNextSongCode(db);
    
    const cleanCoverInput = song && song.cover && !song.cover.startsWith('data:image/svg') ? song.cover : '';

    const genreCheckboxes = db.genres.map(g => {
        const isChecked = currentGenres.includes(g) ? 'checked' : '';
        return `
            <label class="flex items-center space-x-2 text-xs bg-black p-2 rounded-xl border border-neutral-800 cursor-pointer hover:border-neutral-700">
                <input type="checkbox" name="song-genre" value="${g}" ${isChecked} class="accent-[#addedc] rounded">
                <span>${g}</span>
            </label>
        `;
    }).join('');

    const modalHTML = `
        <div id="song-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div class="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
                <div class="flex justify-between items-center"><h3 class="text-xl font-bold uppercase">${song ? 'Edit Song' : 'Add Song'}</h3><button onclick="closeSongModal()"><i class="fa-solid fa-xmark text-xl"></i></button></div>
                <form onsubmit="handleSongSubmit(event, '${songId || ''}')" class="space-y-3">
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Song Code</label><input type="text" id="song-code-input" value="${autoCode}" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white font-mono" readonly></div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Title</label><input type="text" id="song-title-input" value="${song ? song.title : ''}" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Artist(s)</label><input type="text" id="song-artist-input" value="${song ? song.artist : ''}" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Album</label><input type="text" id="song-album-input" value="${song ? (song.album || '') : ''}" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div>
                        <label class="block text-xs uppercase text-neutral-400 mb-2">Select Genres</label>
                        <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                            ${genreCheckboxes}
                        </div>
                    </div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Cover Image URL</label><input type="text" id="song-cover-input" value="${cleanCoverInput}" placeholder="https://example.com/cover.jpg" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div class="flex justify-end gap-2 pt-3"><button type="button" onclick="closeSongModal()" class="bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold">Cancel</button><button type="submit" class="bg-[#addedc] text-black px-5 py-2 rounded-xl text-xs font-bold">Save Song</button></div>
                </form>
            </div>
        </div>
    `;
    let container = document.getElementById('admin-modal-container');
    if (!container) {
        container = document.createElement('div');
        container.id = 'admin-modal-container';
        document.body.appendChild(container);
    }
    container.innerHTML = modalHTML;
}

function closeSongModal() { 
    const container = document.getElementById('admin-modal-container');
    if (container) container.innerHTML = ''; 
}

function handleSongSubmit(e, songId) {
    e.preventDefault();
    const db = getDB();
    const code = document.getElementById('song-code-input').value.trim();
    const title = document.getElementById('song-title-input').value.trim();
    const artist = document.getElementById('song-artist-input').value.trim();
    const album = document.getElementById('song-album-input').value.trim();
    const cover = document.getElementById('song-cover-input').value.trim();

    const checkedBoxes = document.querySelectorAll('input[name="song-genre"]:checked');
    const genres = Array.from(checkedBoxes).map(cb => cb.value);
    if (genres.length === 0) genres.push('Pop');

    const artistNames = parseArtistNames(artist);
    artistNames.forEach(aName => getOrAssignArtistCode(aName, db));

    if (songId) {
        const song = db.songs.find(s => s.id === songId);
        if (song) {
            song.code = code;
            song.title = title;
            song.artist = artist;
            song.album = album;
            song.genres = genres;
            song.cover = cover;
        }
    } else {
        const newSong = {
            id: Date.now().toString(),
            code: code || getNextSongCode(db),
            title,
            artist,
            album,
            genres,
            cover: cover || ''
        };
        db.songs.push(newSong);
    }

    saveDB(db);
    showToast('Song saved successfully!');
    closeSongModal();
    if (typeof switchAdminTab === 'function') switchAdminTab('songs');
}

function deleteSong(songId) {
    if (!confirm('Are you sure you want to delete this song?')) return;
    const db = getDB();
    db.songs = db.songs.filter(s => s.id !== songId);
    saveDB(db);
    showToast('Song deleted.');
    if (typeof switchAdminTab === 'function') switchAdminTab('songs');
}

window.addEventListener('DOMContentLoaded', async () => {
    await fetchDBAsync();
    if (typeof checkAuthAndInit === 'function') {
        checkAuthAndInit();
    }
});

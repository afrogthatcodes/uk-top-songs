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
let positionChartInstance = null;

const fallbackCoverSVG = "https://placehold.co/100x100/1a1a1a/888888?text=UKTS";

function renderSongCover(song, customClass = "w-10 h-10 rounded-lg object-cover bg-neutral-800 shrink-0") {
    const rawCover = song && (song.cover || song.coverUrl);
    const hasValidCover = rawCover && typeof rawCover === 'string' && rawCover.trim() !== '' && !rawCover.startsWith('data:image/svg');
    const imgSrc = hasValidCover ? rawCover.trim() : fallbackCoverSVG;
    
    return `<img src="${imgSrc}" class="${customClass}" onerror="this.onerror=null; this.src='${fallbackCoverSVG}';">`;
}

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

function getSongGenres(song) {
    if (song.genres && Array.isArray(song.genres)) return song.genres;
    if (song.genre) return [song.genre];
    return ['Pop'];
}

function renderGenreBadges(song) {
    const genres = getSongGenres(song);
    return genres.map(g => `<span class="bg-neutral-800 px-2.5 py-1 rounded-full text-xs inline-block mr-1 mb-1 text-neutral-300">${g}</span>`).join('');
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

function getChartDropouts(chartId, currentDateStr) {
    const db = getDB();
    const historyObj = db.chartHistory[chartId] || {};
    const dates = Object.keys(historyObj).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    const currentIndex = dates.indexOf(currentDateStr);

    if (currentIndex <= 0) return { dropouts: [] };

    const prevDate = dates[currentIndex - 1];
    const prevEntries = historyObj[prevDate] || [];
    const currentEntries = historyObj[currentDateStr] || [];
    const currentSongIds = new Set(currentEntries.map(e => e.songId));

    const dropouts = prevEntries.filter(e => !currentSongIds.has(e.songId));
    return { dropouts };
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

function openHistoryModal(categoryId, categoryTitle, songId, songTitle) {
    const modal = document.getElementById('history-modal');
    const titleEl = document.getElementById('history-modal-title');
    const canvas = document.getElementById('positionHistoryChart');

    if (!modal || !canvas) return;

    titleEl.textContent = `${songTitle} — ${categoryTitle} History`;
    modal.classList.remove('hidden');

    const db = getDB();
    const historyObj = db.chartHistory[categoryId] || {};
    const dates = Object.keys(historyObj).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));

    let firstIndex = -1;
    let lastIndex = -1;

    dates.forEach((d, idx) => {
        const entry = (historyObj[d] || []).find(e => e.songId === songId);
        if (entry) {
            if (firstIndex === -1) firstIndex = idx;
            lastIndex = idx;
        }
    });

    if (firstIndex === -1) return;

    const relevantDates = dates.slice(firstIndex, lastIndex + 1);

    const labels = [];
    const dataPoints = [];
    const mappedDates = []; 

    relevantDates.forEach(d => {
        const entry = (historyObj[d] || []).find(e => e.songId === songId);
        labels.push(d);
        mappedDates.push(d);
        
        if (entry) {
            dataPoints.push(entry.rank);
        } else {
            dataPoints.push(null);
        }
    });

    if (positionChartInstance) {
        positionChartInstance.destroy();
    }

    const ctx = canvas.getContext('2d');
    positionChartInstance = new Chart(ctx, {
        type: 'line',
        data: {
            labels: labels,
            datasets: [{
                label: 'Chart Position',
                data: dataPoints,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.3,
                pointRadius: 6,
                pointHoverRadius: 8,
                pointBackgroundColor: '#38bdf8',
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (event, elements) => {
                if (elements.length > 0) {
                    const clickedIndex = elements[0].index;
                    const targetDate = mappedDates[clickedIndex];
                    if (targetDate) {
                        window.location.href = `charts.html?chart=${categoryId}&date=${encodeURIComponent(targetDate)}`;
                    }
                }
            },
            scales: {
                y: {
                    reverse: true,
                    min: 1,
                    max: 75,
                    ticks: { color: '#a3a3a3', stepSize: 10 },
                    grid: { color: '#262626' }
                },
                x: {
                    ticks: { color: '#a3a3a3' },
                    grid: { color: '#262626' }
                }
            },
            plugins: {
                legend: { display: false },
                tooltip: {
                    callbacks: {
                        label: function(context) {
                            if (context.raw === null) return ' Out of Chart';
                            return ` Rank: ${context.raw} (Click to view chart)`;
                        }
                    }
                }
            }
        }
    });
}

function closeHistoryModal() {
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden');
}

// --- Admin Authentication Modal Helpers ---
function promptAdminLogin() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) {
        const passInput = document.getElementById('admin-pass-input');
        if (passInput) passInput.value = '';
        const err = document.getElementById('admin-login-error');
        if (err) err.classList.add('hidden');
        modal.classList.remove('hidden');
    }
}

function closeAdminLoginModal() {
    const modal = document.getElementById('admin-login-modal');
    if (modal) modal.classList.add('hidden');
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});

window.addEventListener('DOMContentLoaded', async () => {
    await fetchDBAsync();
});

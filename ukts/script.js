const ADMIN_PASSWORD = "admin";
let isAdminLoggedIn = false;

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
        { id: '1', code: 'REIN-01', title: 'Rein Me In', artist: 'Sam Fender & Olivia Dean', genres: ['Indie/Rock'], cover: 'https://images.unsplash.com/photo-1514525253161-7a46d19cd819?w=100&auto=format&fit=crop&q=80' },
        { id: '2', code: 'MAN-02', title: 'Man I Need', artist: 'Olivia Dean', genres: ['Rnb/Funk'], cover: 'https://images.unsplash.com/photo-1511671782779-c97d3d27a1d4?w=100&auto=format&fit=crop&q=80' },
        { id: '3', code: 'GREAT-03', title: 'Great Expectation', artist: 'SIENNA SPIRO', genres: ['Pop'], cover: 'https://images.unsplash.com/photo-1470225620780-dba8ba36b745?w=100&auto=format&fit=crop&q=80' },
        { id: '4', code: 'CHOOS-04', title: "Choosin' Texas", artist: 'Ella Langley', genres: ['Folk/Country'], cover: 'https://images.unsplash.com/photo-1511379938547-c1f69419868d?w=100&auto=format&fit=crop&q=80' },
        { id: '5', code: 'STUP-05', title: 'stupid song', artist: 'Olivia Rodrigo', genres: ['Pop'], cover: 'https://images.unsplash.com/photo-1508700115892-45ecd05ae2ad?w=100&auto=format&fit=crop&q=80' }
    ],
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

function getSongGenres(song) {
    if (song.genres && Array.isArray(song.genres)) return song.genres;
    if (song.genre) return [song.genre];
    return ['Pop'];
}

function renderGenreBadges(song) {
    const genres = getSongGenres(song);
    return genres.map(g => `<span class="bg-neutral-800 px-2.5 py-1 rounded-full text-xs inline-block mr-1 mb-1">${g}</span>`).join('');
}

function songHasArtist(artistString, targetArtist) {
    if (!artistString) return false;
    const cleaned = artistString.replace(/;/g, ',').replace(/\bfeat\.?/gi, ',');
    const artists = cleaned.split(/,|\&/).map(a => a.trim().toLowerCase());
    const target = targetArtist.trim().toLowerCase();
    return artists.includes(target);
}

function formatArtists(artistString) {
    if (!artistString) return '';
    const makeLink = (name) => `<a href="artist.html?name=${encodeURIComponent(name)}" class="hover:text-white transition-colors">${name}</a>`;
    const cleanedString = artistString.replace(/;/g, ',');

    if (cleanedString.toLowerCase().includes('feat.')) {
        const parts = cleanedString.split(/feat\./i).map(a => a.trim()).filter(Boolean);
        const primaryPart = parts[0];
        const primaryArtists = primaryPart.split(',').map(a => a.trim()).filter(Boolean);
        const featuredArtists = parts.slice(1).join(' ').split(/&|,/).map(a => a.trim()).filter(Boolean);
        
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

function getDB() {
    const data = localStorage.getItem('uk_top_songs_db_v4');
    if (!data) {
        localStorage.setItem('uk_top_songs_db_v4', JSON.stringify(defaultData));
        return defaultData;
    }
    const parsed = JSON.parse(data);
    if (!parsed.genres) parsed.genres = defaultData.genres;
    return parsed;
}

function saveDB(data) {
    localStorage.setItem('uk_top_songs_db_v4', JSON.stringify(data));
}

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#addedc] text-black px-6 py-3 rounded-xl font-bold shadow-2xl z-50 text-sm';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openHistoryModal(chartId, songId, songTitle) {
    const db = getDB();
    const modal = document.getElementById('history-modal');
    const titleEl = document.getElementById('history-modal-title');
    if (!modal || !titleEl) return;
    
    titleEl.textContent = `${songTitle} - Position History`;
    modal.classList.remove('hidden');

    const historyObj = db.chartHistory[chartId] || {};
    const dates = Object.keys(historyObj).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    
    const chartLabels = [];
    const chartRanks = [];

    dates.forEach(dateStr => {
        const entries = historyObj[dateStr] || [];
        const match = entries.find(e => e.songId === songId);
        if (match) {
            chartLabels.push(dateStr);
            chartRanks.push(match.rank);
        }
    });

    const canvas = document.getElementById('positionHistoryChart');
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    
    if (window.myPositionChart) window.myPositionChart.destroy();

    window.myPositionChart = new Chart(ctx, {
        type: 'line',
        data: {
            labels: chartLabels,
            datasets: [{
                label: 'Chart Position',
                data: chartRanks,
                borderColor: '#38bdf8',
                backgroundColor: 'rgba(56, 189, 248, 0.1)',
                borderWidth: 3,
                fill: true,
                tension: 0.2
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            scales: {
                y: { reverse: true, min: 1, max: 75, ticks: { color: '#a3a3a3' }, grid: { color: '#262626' } },
                x: { ticks: { color: '#a3a3a3' }, grid: { display: false } }
            },
            plugins: { legend: { display: false } }
        }
    });
}

function closeHistoryModal() { 
    const modal = document.getElementById('history-modal');
    if (modal) modal.classList.add('hidden'); 
}

function checkAdminAuth() {
    return isAdminLoggedIn;
}

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
        closeAdminLoginModal();
        showToast('Welcome, Admin!');
        if (typeof initAdminPage === 'function') initAdminPage();
    } else {
        document.getElementById('admin-login-error').classList.remove('hidden');
    }
}

window.addEventListener('keydown', (e) => {
    if (e.ctrlKey && e.shiftKey && e.key.toLowerCase() === 'a') {
        e.preventDefault();
        window.location.href = 'admin.html';
    }
});
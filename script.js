const ADMIN_PASSWORD = "Pengi Pootle"; // Change this password if needed
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
        { id: '1', code: 'REIN-01', title: 'Rein Me In', artist: 'Sam Fender & Olivia Dean', genres: ['Indie/Rock'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '2', code: 'MAN-02', title: 'Man I Need', artist: 'Olivia Dean', genres: ['Rnb/Funk'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '3', code: 'GREAT-03', title: 'Great Expectation', artist: 'SIENNA SPIRO', genres: ['Pop'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '4', code: 'CHOOS-04', title: "Choosin' Texas", artist: 'Ella Langley', genres: ['Folk/Country'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '5', code: 'STUP-05', title: 'stupid song', artist: 'Olivia Rodrigo', genres: ['Pop'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' }
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
    
    const allDates = Object.keys(historyObj).sort((a,b) => 
        new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-'))
    );
    
    const chartLabels = [];
    const chartRanks = [];

    allDates.forEach(dateStr => {
        const entries = historyObj[dateStr] || [];
        const match = entries.find(e => e.songId === songId);
        
        chartLabels.push(dateStr);
        chartRanks.push(match ? match.rank : null);
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
                fill: false,
                tension: 0.2,
                spanGaps: false
            }]
        },
        options: {
            responsive: true,
            maintainAspectRatio: false,
            onClick: (evt, activeElements) => {
                if (activeElements && activeElements.length > 0) {
                    const index = activeElements[0].index;
                    const selectedDate = chartLabels[index];
                    if (selectedDate && chartRanks[index] !== null) {
                        closeHistoryModal();
                        window.location.href = `charts.html?chart=${chartId}&date=${encodeURIComponent(selectedDate)}`;
                    }
                }
            },
            scales: {
                y: {
                    reverse: true,
                    min: 1,
                    max: 75,
                    ticks: {
                        stepSize: 5,
                        callback: function(value) {
                            if (value === 1 || value % 5 === 0) return value;
                            return '';
                        },
                        color: '#a3a3a3'
                    },
                    grid: { color: '#262626' }
                },
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

function getChartDropouts(chartId, currentDateStr) {
    const db = getDB();
    const historyObj = db.chartHistory[chartId] || {};
    const dates = Object.keys(historyObj).sort((a,b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    
    const currentIndex = dates.indexOf(currentDateStr);
    if (currentIndex <= 0) return { prevDate: null, dropouts: [] };

    const prevDate = dates[currentIndex - 1];
    const prevEntries = historyObj[prevDate] || [];
    const currentSongIds = new Set((historyObj[currentDateStr] || []).map(e => e.songId));

    const dropouts = prevEntries.filter(entry => !currentSongIds.has(entry.songId));
    return { prevDate, dropouts };
}

function renderAdminNewsTab(dbInstance) {
    return `
        <div class="space-y-6">
            <div class="flex justify-between items-center">
                <h3 class="text-xl font-bold uppercase">News Articles</h3>
                <button onclick="openNewsModal()" class="bg-[#addedc] text-black px-5 py-2.5 rounded-xl text-xs font-bold uppercase flex items-center gap-2"><i class="fa-solid fa-plus"></i> Add Article</button>
            </div>
            <div class="bg-neutral-900 border border-neutral-800 rounded-2xl overflow-hidden">
                <table class="w-full text-left border-collapse">
                    <tr class="border-b border-neutral-800 text-neutral-400 text-xs uppercase font-bold bg-neutral-900/50">
                        <th class="p-4">Date</th>
                        <th class="p-4">Title & Content</th>
                        <th class="p-4 text-right">Actions</th>
                    </tr>
                    ${dbInstance.news.map(item => `
                        <tr class="border-b border-neutral-800/50 text-sm">
                            <td class="p-4 font-mono text-neutral-400 text-xs">${item.date}</td>
                            <td class="p-4 font-bold">${item.title} <span class="block text-xs font-normal text-neutral-400 truncate max-w-md">${item.content}</span></td>
                            <td class="p-4 text-right">
                                <button onclick="deleteNews('${item.id}')" class="bg-red-950 hover:bg-red-900 text-red-400 px-3 py-1.5 rounded-lg text-xs font-bold"><i class="fa-solid fa-trash"></i></button>
                            </td>
                        </tr>
                    `).join('')}
                </table>
            </div>
        </div>
    `;
}

function openNewsModal() {
    const modalHTML = `
        <div id="news-modal" class="fixed inset-0 bg-black/80 flex items-center justify-center z-50 p-4">
            <div class="bg-neutral-900 border border-neutral-800 rounded-3xl max-w-lg w-full p-6 space-y-4">
                <div class="flex justify-between items-center"><h3 class="text-xl font-bold uppercase">Add News Article</h3><button onclick="closeNewsModal()"><i class="fa-solid fa-xmark text-xl"></i></button></div>
                <form onsubmit="handleNewsSubmit(event)" class="space-y-3">
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Article Title</label><input type="text" id="news-title-input" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Category</label><input type="text" id="news-cat-input" value="Latest News" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Content</label><textarea id="news-content-input" rows="4" required class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></textarea></div>
                    <div class="flex justify-end gap-2 pt-3"><button type="button" onclick="closeNewsModal()" class="bg-neutral-800 px-4 py-2 rounded-xl text-xs font-bold">Cancel</button><button type="submit" class="bg-[#addedc] text-black px-5 py-2 rounded-xl text-xs font-bold">Publish Article</button></div>
                </form>
            </div>
        </div>
    `;
    document.getElementById('admin-modal-container').innerHTML = modalHTML;
}

function closeNewsModal() { document.getElementById('admin-modal-container').innerHTML = ''; }

function handleNewsSubmit(e) {
    e.preventDefault();
    const currentDb = getDB();
    const title = document.getElementById('news-title-input').value.trim();
    const category = document.getElementById('news-cat-input').value.trim();
    const content = document.getElementById('news-content-input').value.trim();
    
    const options = { month: 'short', day: 'numeric', year: 'numeric' };
    const date = new Date().toLocaleDateString('en-US', options);

    const newArticle = { id: Date.now().toString(), title, category, date, content };
    
    if (!currentDb.news) currentDb.news = [];
    currentDb.news.unshift(newArticle);

    saveDB(currentDb);
    showToast('News article published!');
    closeNewsModal();
    if (typeof switchAdminTab === 'function') switchAdminTab('news');
}

function deleteNews(id) {
    if (!confirm('Are you sure you want to delete this article?')) return;
    const currentDb = getDB();
    currentDb.news = currentDb.news.filter(n => n.id !== id);
    saveDB(currentDb);
    showToast('Article deleted.');
    if (typeof switchAdminTab === 'function') switchAdminTab('news');
}

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
        { id: '1', code: 'UKTS-1', title: 'Rein Me In', artist: 'Sam Fender & Olivia Dean', genres: ['Indie/Rock'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '2', code: 'UKTS-2', title: 'Man I Need', artist: 'Olivia Dean', genres: ['Rnb/Funk'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '3', code: 'UKTS-3', title: 'Great Expectation', artist: 'SIENNA SPIRO', genres: ['Pop'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '4', code: 'UKTS-4', title: "Choosin' Texas", artist: 'Ella Langley', genres: ['Folk/Country'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' },
        { id: '5', code: 'UKTS-5', title: 'stupid song', artist: 'Olivia Rodrigo', genres: ['Pop'], cover: 'data:image/svg+xml;utf8,<svg xmlns="http://www.w3.org/2000/svg" width="100" height="100"><rect width="100" height="100" fill="%23addedc"/></svg>' }
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
    const localData = localStorage.getItem('uk_top_songs_db_v4');
    let localParsed = localData ? JSON.parse(localData) : null;

    try {
        const response = await fetch('db.json?t=' + Date.now());
        if (response.ok) {
            const remoteDB = await response.json();
            if (remoteDB && remoteDB.songs && remoteDB.songs.length > 0) {
                globalDB = remoteDB;
                localStorage.setItem('uk_top_songs_db_v4', JSON.stringify(globalDB));
                return globalDB;
            }
        }
    } catch (err) {
        console.warn('Could not fetch remote db.json, using local storage.');
    }

    if (localParsed && localParsed.songs && localParsed.songs.length > 0) {
        globalDB = localParsed;
    } else {
        globalDB = defaultData;
        localStorage.setItem('uk_top_songs_db_v4', JSON.stringify(defaultData));
    }
    return globalDB;
}

function getDB() {
    if (globalDB) return globalDB;
    const localData = localStorage.getItem('uk_top_songs_db_v4');
    if (!localData) return defaultData;
    try {
        return JSON.parse(localData);
    } catch (e) {
        return defaultData;
    }
}

function saveDB(data) {
    globalDB = data;
    localStorage.setItem('uk_top_songs_db_v4', JSON.stringify(data));
    
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

function showToast(msg) {
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-6 right-6 bg-[#addedc] text-black px-6 py-3 rounded-xl font-bold shadow-2xl z-50 text-sm';
    toast.textContent = msg;
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 3000);
}

function openSongModal(songId = null) {
    const db = getDB();
    const song = songId ? db.songs.find(s => s.id === songId) : null;
    const currentGenres = song ? getSongGenres(song) : ['Pop'];
    const autoCode = song ? song.code : getNextSongCode(db);
    
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
                    <div>
                        <label class="block text-xs uppercase text-neutral-400 mb-2">Select Genres</label>
                        <div class="grid grid-cols-2 gap-2 max-h-32 overflow-y-auto p-1">
                            ${genreCheckboxes}
                        </div>
                    </div>
                    <div><label class="block text-xs uppercase text-neutral-400 mb-1">Cover Image URL / SVG</label><input type="text" id="song-cover-input" value="${song ? (song.cover || '') : ''}" class="w-full bg-black border border-neutral-700 px-4 py-2.5 rounded-xl text-sm text-white"></div>
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
    const cover = document.getElementById('song-cover-input').value.trim();

    const checkedBoxes = document.querySelectorAll('input[name="song-genre"]:checked');
    const genres = Array.from(checkedBoxes).map(cb => cb.value);
    if (genres.length === 0) genres.push('Pop');

    // Automatically ensure artists get assigned UKTA- codes
    const artistNames = artist.replace(/;/g, ',').replace(/\bfeat\.?/gi, ',').split(/,|\&/).map(a => a.trim()).filter(Boolean);
    artistNames.forEach(aName => getOrAssignArtistCode(aName, db));

    if (songId) {
        const song = db.songs.find(s => s.id === songId);
        if (song) {
            song.code = code;
            song.title = title;
            song.artist = artist;
            song.genres = genres;
            song.cover = cover;
        }
    } else {
        const newSong = {
            id: Date.now().toString(),
            code: code || getNextSongCode(db),
            title,
            artist,
            genres,
            cover: cover || fallbackCoverSVG
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

// Automatically load database on startup
window.addEventListener('DOMContentLoaded', async () => {
    await fetchDBAsync();
    if (typeof checkAuthAndInit === 'function') {
        checkAuthAndInit();
    }
});

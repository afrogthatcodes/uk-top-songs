// --- CHART HIGHLIGHTS PANEL ---
function renderChartHighlightsPanel(chartId, currentDateStr, db) {
    const container = document.getElementById('chart-highlights-container');
    if (!container) return;

    const historyObj = db.chartHistory[chartId] || {};
    const dates = Object.keys(historyObj).sort((a, b) => new Date(a.split('/').reverse().join('-')) - new Date(b.split('/').reverse().join('-')));
    const currentIndex = dates.indexOf(currentDateStr);
    const currentEntries = historyObj[currentDateStr] || [];

    if (currentIndex === -1 || currentEntries.length === 0) {
        container.innerHTML = `<p class="text-xs text-neutral-500 font-semibold uppercase">No highlight data available.</p>`;
        return;
    }

    const prevDate = dates[currentIndex - 1];
    const prevEntries = prevDate ? (historyObj[prevDate] || []) : [];
    const prevRankMap = {};
    prevEntries.forEach(e => { prevRankMap[e.songId] = e.rank; });

    const previousSongIds = new Set();
    if (currentIndex > 0) {
        dates.slice(0, currentIndex).forEach(d => {
            (historyObj[d] || []).forEach(e => previousSongIds.add(e.songId));
        });
    }

    let debuts = [];
    let climbers = [];
    let salesBoosts = [];

    currentEntries.forEach(entry => {
        const song = db.songs.find(s => s.id === entry.songId);
        if (!song) return;

        const isDebut = !previousSongIds.has(entry.songId);
        const prevRank = prevRankMap[entry.songId];
        const climbAmount = prevRank ? prevRank - entry.rank : 0;

        const itemData = {
            songId: entry.songId,
            title: song.title,
            artist: song.artist,
            cover: song.cover || fallbackCoverSVG,
            rank: entry.rank,
            isDebut: isDebut,
            climbAmount: climbAmount,
            salesIncrease: entry.salesIncrease
        };

        if (isDebut) debuts.push(itemData);
        else if (climbAmount > 0) climbers.push(itemData);

        if (entry.salesIncrease) salesBoosts.push(itemData);
    });

    debuts.sort((a, b) => a.rank - b.rank);
    climbers.sort((a, b) => b.climbAmount - a.climbAmount);
    salesBoosts.sort((a, b) => a.rank - b.rank);

    let selectedHighlights = [];
    let usedSongIds = new Set();

    // 1. Highest Debut
    let highestDebut = debuts.length > 0 ? debuts[0] : null;
    if (highestDebut) {
        selectedHighlights.push({ ...highestDebut, label: 'HIGHEST DEBUT' });
        usedSongIds.add(highestDebut.songId);
    }

    // 2. Highest Climber
    let highestClimber = climbers.find(c => !usedSongIds.has(c.songId));
    if (highestClimber) {
        selectedHighlights.push({ ...highestClimber, label: `UP ${highestClimber.climbAmount}` });
        usedSongIds.add(highestClimber.songId);
    }

    // 3. Biggest Sales Increase (Bullet)
    let topSales = salesBoosts.find(s => !usedSongIds.has(s.songId));
    if (topSales) {
        selectedHighlights.push({ ...topSales, label: 'BULLET' });
        usedSongIds.add(topSales.songId);
    }

    // 4 & 5. Remaining slots taking Debuts first, then Climbers/Re-entries
    let pool = [
        ...debuts.filter(d => !usedSongIds.has(d.songId)).map(d => ({ ...d, label: 'DEBUT' })),
        ...climbers.filter(c => !usedSongIds.has(c.songId)).map(c => ({ ...c, label: `UP ${c.climbAmount}` }))
    ];

    while (selectedHighlights.length < 5 && pool.length > 0) {
        let nextItem = pool.shift();
        if (!usedSongIds.has(nextItem.songId)) {
            selectedHighlights.push(nextItem);
            usedSongIds.add(nextItem.songId);
        }
    }

    if (selectedHighlights.length === 0) {
        container.innerHTML = `<p class="text-xs text-neutral-500 font-semibold uppercase">No highlights found.</p>`;
        return;
    }

    container.innerHTML = selectedHighlights.map(item => `
        <div class="flex items-center gap-4">
            <img src="${item.cover}" class="w-16 h-16 rounded-xl object-cover shrink-0 bg-neutral-800" onerror="this.onerror=null; this.src='${fallbackCoverSVG}';">
            <div class="min-w-0">
                <span class="text-[10px] font-black uppercase tracking-widest text-neutral-400 block mb-0.5">${item.label}</span>
                <h4 class="font-bold text-sm text-white truncate leading-tight">${item.title}</h4>
                <p class="text-xs font-bold text-red-500 truncate mt-0.5">${formatArtists(item.artist)}</p>
            </div>
        </div>
    `).join('');
}

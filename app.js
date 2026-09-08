// ChantFlow Application Logic

// Used only if config.json cannot be fetched (e.g. the page was opened over file://).
const FALLBACK_TRACKS = [
    { id: 'om', name: '🕉 Om Chant', file: 'audio/om.mp3', duration: 0 },
    { id: 'music1', name: '🎵 Music 1', file: 'audio/music1.mp3', duration: 0 },
    { id: 'censor', name: '✨ Censor', file: 'audio/censor.mp3', duration: 0 }
];

const STORAGE_KEY = 'chantflow_session';
const LEGACY_STORAGE_KEY = 'chantflow_playlist';

class ChantFlow {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.tracks = [];

        // Session definition
        this.playlist = [];        // the sequence, repeated sessionCycles times
        this.startItem = null;     // plays once before the first cycle
        this.endItem = null;       // plays once after the last cycle
        this.sessionCycles = 1;
        this.loopForever = false;

        // Playback position
        this.phase = null;         // 'start' | 'sequence' | 'end' | null
        this.currentIndex = 0;     // position within playlist
        this.currentRepetition = 0;// repetitions done of the current item
        this.currentCycle = 0;     // completed cycles of the whole sequence
        this.isPlaying = false;

        this.autoPlayNext = true;

        this.init();
    }

    async init() {
        this.setupEventListeners();
        this.loadSessionFromStorage();
        this.setupInstallPrompt();
        await this.loadTracks();
        this.applySessionToInputs();
        this.updateUI();
    }

    // --- Track catalogue -------------------------------------------------

    async loadTracks() {
        this.tracks = await this.fetchTrackList();
        this.populateTrackSelectors();
        this.loadDurations();
    }

    // config.json is generated from the contents of audio/ by
    // tools/generate-config.js (or tools/generate-config.ps1).
    async fetchTrackList() {
        try {
            const response = await fetch('config.json', { cache: 'no-cache' });
            if (!response.ok) throw new Error(`HTTP ${response.status}`);

            const config = await response.json();
            if (!Array.isArray(config.tracks) || config.tracks.length === 0) {
                throw new Error('config.json has no tracks');
            }
            return config.tracks.map(t => ({ ...t, duration: 0 }));
        } catch (e) {
            console.warn('Could not load config.json, using fallback track list:', e.message);
            return FALLBACK_TRACKS.map(t => ({ ...t }));
        }
    }

    populateTrackSelectors() {
        const selects = [
            { el: document.getElementById('trackSelect'), placeholder: '-- Choose a track --' },
            { el: document.getElementById('startTrackSelect'), placeholder: '-- None --' },
            { el: document.getElementById('endTrackSelect'), placeholder: '-- None --' }
        ];

        selects.forEach(({ el, placeholder }) => {
            el.innerHTML = '';
            el.appendChild(new Option(placeholder, ''));
            this.tracks.forEach(track => el.appendChild(new Option(track.name, track.id)));
        });
    }

    // Durations arrive asynchronously; the UI is refreshed as each one lands.
    loadDurations() {
        this.tracks.forEach(track => {
            const probe = new Audio();
            probe.preload = 'metadata';
            probe.addEventListener('loadedmetadata', () => {
                track.duration = Math.ceil(probe.duration) || 0;
                this.updateStats();
                this.updateSequenceList();
            });
            probe.addEventListener('error', () => {
                console.warn(`Could not read duration for ${track.file}`);
            });
            probe.src = track.file;
        });
    }

    trackDuration(id) {
        const track = this.tracks.find(t => t.id === id);
        return track ? track.duration : 0;
    }

    // --- Event wiring ----------------------------------------------------

    setupEventListeners() {
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        document.getElementById('addTrackBtn').addEventListener('click', () => this.addTrack());
        document.getElementById('trackSelect').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTrack();
        });

        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // Quick-count buttons; each group names the input it fills.
        document.querySelectorAll('.quick-buttons').forEach(group => {
            group.addEventListener('click', (e) => {
                const btn = e.target.closest('.btn');
                if (!btn) return;
                const input = document.getElementById(group.dataset.target);
                input.value = btn.dataset.count;
                input.dispatchEvent(new Event('change'));
            });
        });

        // Start / end slots
        ['start', 'end'].forEach(edge => {
            document.getElementById(`${edge}TrackSelect`).addEventListener('change', () => this.updateEdgeItem(edge));
            document.getElementById(`${edge}Repetitions`).addEventListener('change', () => this.updateEdgeItem(edge));
        });

        // Whole-sequence repeat count
        document.getElementById('sessionCycles').addEventListener('change', (e) => {
            this.sessionCycles = this.clampCount(e.target.value);
            e.target.value = this.sessionCycles;
            this.saveSessionToStorage();
            this.updateStats();
        });
        document.getElementById('loopForever').addEventListener('change', (e) => {
            this.loopForever = e.target.checked;
            document.getElementById('sessionCycles').disabled = this.loopForever;
            this.saveSessionToStorage();
            this.updateStats();
        });

        // Audio events
        this.audioPlayer.addEventListener('ended', () => this.onTrackEnd());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgressBar());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateTimeDisplay());
        this.audioPlayer.addEventListener('error', () => this.onPlaybackError());

        document.getElementById('autoPlayNext').addEventListener('change', (e) => {
            this.autoPlayNext = e.target.checked;
        });
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            this.audioPlayer.volume = e.target.value / 100;
            document.getElementById('volumeDisplay').textContent = e.target.value + '%';
        });

        // Sequence item removal (delegated)
        document.getElementById('sequenceContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                this.removeTrackFromPlaylist(parseInt(e.target.dataset.index));
            }
        });

        document.getElementById('installBtn').addEventListener('click', () => this.installApp());
    }

    setupInstallPrompt() {
        let deferredPrompt = null;
        const installBtn = document.getElementById('installBtn');

        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            installBtn.style.display = 'block';
        });

        installBtn.addEventListener('click', async () => {
            if (!deferredPrompt) return;
            deferredPrompt.prompt();
            const { outcome } = await deferredPrompt.userChoice;
            console.log(`User response: ${outcome}`);
            deferredPrompt = null;
            installBtn.style.display = 'none';
        });
    }

    // --- Session editing -------------------------------------------------

    clampCount(value, max = 1008) {
        const n = parseInt(value);
        if (isNaN(n) || n < 1) return 1;
        return Math.min(n, max);
    }

    makeItem(trackId, repetitions) {
        const track = this.tracks.find(t => t.id === trackId);
        if (!track) return null;
        return {
            id: track.id,
            name: track.name,
            file: track.file,
            repetitions: this.clampCount(repetitions)
        };
    }

    addTrack() {
        const trackId = document.getElementById('trackSelect').value;
        const repetitions = document.getElementById('repetitionCount').value;

        if (!trackId) {
            alert('Please select a track');
            return;
        }

        this.playlist.push(this.makeItem(trackId, repetitions));
        this.saveSessionToStorage();
        this.updateUI();

        document.getElementById('trackSelect').value = '';
        document.getElementById('repetitionCount').value = '1';
    }

    // Reads the start/end pickers back into startItem / endItem.
    updateEdgeItem(edge) {
        const trackId = document.getElementById(`${edge}TrackSelect`).value;
        const repsInput = document.getElementById(`${edge}Repetitions`);

        repsInput.value = this.clampCount(repsInput.value, 108);
        repsInput.disabled = !trackId;

        const item = trackId ? this.makeItem(trackId, repsInput.value) : null;
        if (edge === 'start') this.startItem = item;
        else this.endItem = item;

        this.saveSessionToStorage();
        this.updateStats();
    }

    removeTrackFromPlaylist(index) {
        this.playlist.splice(index, 1);
        this.saveSessionToStorage();

        if (this.isPlaying) this.stop();

        this.updateUI();
    }

    clearAll() {
        if (this.playlist.length === 0 && !this.startItem && !this.endItem) return;
        if (!confirm('Clear all items from your session?')) return;

        this.playlist = [];
        this.startItem = null;
        this.endItem = null;
        this.stop();
        this.saveSessionToStorage();
        this.applySessionToInputs();
        this.updateUI();
    }

    // --- Playback --------------------------------------------------------

    play() {
        if (!this.startItem && !this.endItem && this.playlist.length === 0) {
            alert('Please add tracks to your session first!');
            return;
        }

        if (this.isPlaying) {
            this.audioPlayer.play();
        } else {
            this.isPlaying = true;
            this.startSession();
        }

        this.updatePlayerButtons();
    }

    startSession() {
        this.currentIndex = 0;
        this.currentRepetition = 0;
        this.currentCycle = 0;

        if (this.startItem) {
            this.phase = 'start';
        } else if (!this.enterSequencePhase()) {
            this.stop();
            return;
        }

        this.playCurrent();
    }

    currentItem() {
        if (this.phase === 'start') return this.startItem;
        if (this.phase === 'end') return this.endItem;
        if (this.phase === 'sequence') return this.playlist[this.currentIndex];
        return null;
    }

    playCurrent() {
        const item = this.currentItem();
        if (!item) {
            this.onSessionComplete();
            return;
        }

        // Repeating the same file: rewind instead of re-assigning src, which
        // would re-fetch the audio and leave an audible gap between repetitions.
        const resolved = new URL(item.file, document.baseURI).href;
        if (this.audioPlayer.src === resolved && this.audioPlayer.readyState > 0) {
            this.audioPlayer.currentTime = 0;
        } else {
            this.audioPlayer.src = item.file;
        }

        const started = this.audioPlayer.play();
        if (started) started.catch(err => console.warn('Playback blocked:', err));

        this.updatePlayerButtons();
        this.updateSessionInfo();
    }

    onTrackEnd() {
        if (!this.isPlaying) return;

        if (!this.autoPlayNext) {
            this.stop();
            return;
        }

        if (this.advancePosition()) this.playCurrent();
        else this.onSessionComplete();
    }

    // Moves to the next thing to play. Returns false when the session is over.
    advancePosition() {
        if (this.phase === 'start') {
            this.currentRepetition++;
            if (this.currentRepetition < this.startItem.repetitions) return true;
            return this.enterSequencePhase();
        }

        if (this.phase === 'sequence') {
            this.currentRepetition++;
            if (this.currentRepetition < this.playlist[this.currentIndex].repetitions) return true;

            this.currentRepetition = 0;
            this.currentIndex++;
            if (this.currentIndex < this.playlist.length) return true;

            // One full pass through the sequence is done.
            this.currentIndex = 0;
            this.currentCycle++;
            if (this.loopForever || this.currentCycle < this.sessionCycles) return true;

            return this.enterEndPhase();
        }

        if (this.phase === 'end') {
            this.currentRepetition++;
            return this.currentRepetition < this.endItem.repetitions;
        }

        return false;
    }

    enterSequencePhase() {
        this.phase = 'sequence';
        this.currentIndex = 0;
        this.currentRepetition = 0;
        this.currentCycle = 0;

        if (this.playlist.length > 0) return true;
        return this.enterEndPhase();
    }

    enterEndPhase() {
        this.currentRepetition = 0;
        if (this.endItem) {
            this.phase = 'end';
            return true;
        }
        this.phase = null;
        return false;
    }

    onSessionComplete() {
        this.stop();
        document.getElementById('currentTrack').textContent = '🙏 Session complete';
    }

    // A file that fails to load would otherwise fire `ended` immediately and
    // spin through every repetition at once.
    onPlaybackError() {
        if (!this.isPlaying) return;
        const item = this.currentItem();
        this.stop();
        document.getElementById('currentTrack').textContent =
            `⚠️ Could not play ${item ? item.file : 'audio'}`;
    }

    pause() {
        this.audioPlayer.pause();
        this.updatePlayerButtons();
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.isPlaying = false;
        this.phase = null;
        this.currentIndex = 0;
        this.currentRepetition = 0;
        this.currentCycle = 0;
        this.updatePlayerButtons();
        document.getElementById('currentTrack').textContent = 'No track selected';
        document.getElementById('sessionInfo').textContent = '';
        document.getElementById('cycleInfo').textContent = '';
    }

    // --- Display ---------------------------------------------------------

    updateProgressBar() {
        if (this.audioPlayer.duration) {
            const percent = (this.audioPlayer.currentTime / this.audioPlayer.duration) * 100;
            document.getElementById('progressBar').style.width = percent + '%';
            this.updateTimeDisplay();
        }
    }

    updateTimeDisplay() {
        const current = this.formatTime(this.audioPlayer.currentTime);
        const duration = this.formatTime(this.audioPlayer.duration);
        document.getElementById('timeDisplay').textContent = `${current} / ${duration}`;
    }

    formatTime(seconds) {
        if (!seconds || isNaN(seconds)) return '00:00';
        const mins = Math.floor(seconds / 60);
        const secs = Math.floor(seconds % 60);
        return `${String(mins).padStart(2, '0')}:${String(secs).padStart(2, '0')}`;
    }

    updateSessionInfo() {
        const item = this.currentItem();
        if (!item) return;

        const rep = this.currentRepetition + 1;
        document.getElementById('currentTrack').textContent = item.name;

        if (this.phase === 'start' || this.phase === 'end') {
            const label = this.phase === 'start' ? 'Start' : 'End';
            document.getElementById('sessionInfo').textContent =
                `${label} • Repetition ${rep}/${item.repetitions}`;
            document.getElementById('cycleInfo').textContent = '';
            return;
        }

        document.getElementById('sessionInfo').textContent =
            `Repetition ${rep}/${item.repetitions} | Item ${this.currentIndex + 1}/${this.playlist.length}`;
        document.getElementById('cycleInfo').textContent = this.loopForever
            ? `Cycle ${this.currentCycle + 1} of ∞`
            : `Cycle ${this.currentCycle + 1}/${this.sessionCycles}`;
    }

    updatePlayerButtons() {
        const playBtn = document.getElementById('playBtn');
        const pauseBtn = document.getElementById('pauseBtn');

        if (this.isPlaying && !this.audioPlayer.paused) {
            playBtn.style.display = 'none';
            pauseBtn.style.display = 'block';
        } else {
            playBtn.style.display = 'block';
            pauseBtn.style.display = 'none';
        }
    }

    updateUI() {
        this.updateSequenceList();
        this.updateStats();
    }

    updateSequenceList() {
        const container = document.getElementById('sequenceContainer');

        if (this.playlist.length === 0) {
            container.innerHTML = '<p class="empty-message">No items added yet. Start building your session!</p>';
            return;
        }

        container.innerHTML = this.playlist.map((item, index) => {
            const total = this.trackDuration(item.id) * item.repetitions;
            return `
            <div class="sequence-item">
                <div class="item-content">
                    <span class="item-number">${index + 1}</span>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>🔁 ${item.repetitions}x • ⏱️ ${this.formatDuration(total)}</p>
                    </div>
                </div>
                <button class="remove-btn" data-index="${index}">✕</button>
            </div>`;
        }).join('');
    }

    itemSeconds(item) {
        return item ? this.trackDuration(item.id) * item.repetitions : 0;
    }

    updateStats() {
        const sequenceSeconds = this.playlist.reduce((sum, item) => sum + this.itemSeconds(item), 0);
        const edgeSeconds = this.itemSeconds(this.startItem) + this.itemSeconds(this.endItem);

        document.getElementById('totalItems').textContent = this.playlist.length;
        document.getElementById('totalCycles').textContent = this.loopForever ? '∞' : this.sessionCycles;

        if (this.loopForever) {
            document.getElementById('totalDuration').textContent = '∞';
        } else {
            const total = edgeSeconds + sequenceSeconds * this.sessionCycles;
            document.getElementById('totalDuration').textContent = this.formatTotal(total);
        }
    }

    // Cycle counts push totals into the hundreds of hours, so minutes alone
    // stop being readable past an hour.
    formatTotal(seconds) {
        const minutes = Math.ceil(seconds / 60);
        if (minutes < 60) return `${minutes} min`;

        const hours = Math.floor(minutes / 60);
        const remainder = minutes % 60;
        if (hours < 24) return remainder ? `${hours}h ${remainder}m` : `${hours}h`;

        const days = Math.floor(hours / 24);
        return `${days}d ${hours % 24}h`;
    }

    formatDuration(seconds) {
        if (seconds < 60) return Math.ceil(seconds) + 's';
        const mins = Math.floor(seconds / 60);
        const secs = Math.ceil(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    // --- Persistence -----------------------------------------------------

    // Pushes the loaded session back onto the form controls.
    applySessionToInputs() {
        document.getElementById('sessionCycles').value = this.sessionCycles;
        document.getElementById('sessionCycles').disabled = this.loopForever;
        document.getElementById('loopForever').checked = this.loopForever;

        [['start', this.startItem], ['end', this.endItem]].forEach(([edge, item]) => {
            const select = document.getElementById(`${edge}TrackSelect`);
            const reps = document.getElementById(`${edge}Repetitions`);
            select.value = item ? item.id : '';
            reps.value = item ? item.repetitions : 1;
            reps.disabled = !select.value;

            // The stored track may no longer exist in config.json.
            if (item && select.value !== item.id) {
                if (edge === 'start') this.startItem = null;
                else this.endItem = null;
                reps.disabled = true;
            }
        });
    }

    saveSessionToStorage() {
        const session = {
            playlist: this.playlist,
            startItem: this.startItem,
            endItem: this.endItem,
            sessionCycles: this.sessionCycles,
            loopForever: this.loopForever
        };
        localStorage.setItem(STORAGE_KEY, JSON.stringify(session));
    }

    loadSessionFromStorage() {
        const saved = localStorage.getItem(STORAGE_KEY);
        if (saved) {
            try {
                const session = JSON.parse(saved);
                this.playlist = session.playlist || [];
                this.startItem = session.startItem || null;
                this.endItem = session.endItem || null;
                this.sessionCycles = this.clampCount(session.sessionCycles);
                this.loopForever = !!session.loopForever;
                return;
            } catch (e) {
                console.error('Error loading session:', e);
            }
        }

        // Migrate a playlist saved by the pre-cycles version of the app.
        const legacy = localStorage.getItem(LEGACY_STORAGE_KEY);
        if (legacy) {
            try {
                this.playlist = JSON.parse(legacy) || [];
                this.saveSessionToStorage();
            } catch (e) {
                console.error('Error loading legacy playlist:', e);
                this.playlist = [];
            }
        }
    }

    installApp() {
        // Install prompt is handled by the beforeinstallprompt listener above.
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChantFlow();
});

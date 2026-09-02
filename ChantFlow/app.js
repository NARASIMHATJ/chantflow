// ChantFlow Application Logic
class ChantFlow {
    constructor() {
        this.audioPlayer = document.getElementById('audioPlayer');
        this.playlist = [];
        this.currentIndex = 0;
        this.currentRepetition = 0;
        this.isPlaying = false;
        this.tracks = [];
        
        this.autoPlayNext = true;
        this.loopSession = false;
        
        this.init();
    }

    init() {
        this.loadTracks();
        this.setupEventListeners();
        this.loadPlaylistFromStorage();
        this.setupInstallPrompt();
        this.updateUI();
    }

    loadTracks() {
        // Audio files available in the audio directory
        this.tracks = [
            { id: 'om', name: '🕉 Om Chant', file: 'audio/om.mp3', duration: 0 },
            { id: 'music1', name: '🎵 Music 1', file: 'audio/music1.mp3', duration: 0 },
            { id: 'censor', name: '✨ Censor', file: 'audio/censor.mp3', duration: 0 },
            { id: 'Raghavendra17db1cycleuntitled', name: 'Raghavendra17db1cycleuntitled', file: 'audio/Raghavendra17db1cycleuntitled.mp3', duration: 0 },
			{ id: 'Pause1.5', name: 'Pause1.5', file: 'audio/Pause1.5.mp3', duration: 0 },
			{ id: 'bell1', name: 'bell1.mp3', file: 'audio/bell1.mp3', duration: 0 },
			{ id: 'Pause1', name: 'Pause1.mp3', file: 'audio/Pause1.mp3', duration: 0 },
			{ id: 'Pause2', name: 'Pause2.mp3', file: 'audio/Pause2.mp3', duration: 0 },
			{ id: 'Pause3', name: 'Pause3.mp3', file: 'audio/Pause3.mp3', duration: 0 },
			{ id: 'Pause4', name: 'Pause4.mp3', file: 'audio/Pause4.mp3', duration: 0 },
			{ id: 'Pause6', name: 'Pause6.mp3', file: 'audio/Pause6.mp3', duration: 0 },
			{ id: 'Pause8', name: 'Pause8.mp3', file: 'audio/Pause8.mp3', duration: 0 },
			{ id: 'Pause10', name: 'Pause10.mp3', file: 'audio/Pause10.mp3', duration: 0 },
			{ id: 'Pausepoint5', name: 'Pausepoint5.mp3', file: 'audio/Pausepoint5.mp3', duration: 0 }
        ];

        // Populate track selector
        const trackSelect = document.getElementById('trackSelect');
        this.tracks.forEach(track => {
            const option = document.createElement('option');
            option.value = track.id;
            option.textContent = track.name;
            trackSelect.appendChild(option);
        });

        // Load durations (will be set after audio loads)
        this.tracks.forEach(track => {
            const audio = new Audio(track.file);
            audio.addEventListener('loadedmetadata', () => {
                const foundTrack = this.tracks.find(t => t.id === track.id);
                if (foundTrack) foundTrack.duration = Math.ceil(audio.duration);
            });
        });
    }

    setupEventListeners() {
        // Player controls
        document.getElementById('playBtn').addEventListener('click', () => this.play());
        document.getElementById('pauseBtn').addEventListener('click', () => this.pause());
        document.getElementById('stopBtn').addEventListener('click', () => this.stop());

        // Track addition
        document.getElementById('addTrackBtn').addEventListener('click', () => this.addTrack());
        document.getElementById('trackSelect').addEventListener('keypress', (e) => {
            if (e.key === 'Enter') this.addTrack();
        });

        // Clear all
        document.getElementById('clearAllBtn').addEventListener('click', () => this.clearAll());

        // Quick repetition buttons
        document.querySelectorAll('.quick-buttons .btn').forEach(btn => {
            btn.addEventListener('click', (e) => {
                document.getElementById('repetitionCount').value = e.target.dataset.count;
            });
        });

        // Audio events
        this.audioPlayer.addEventListener('ended', () => this.onTrackEnd());
        this.audioPlayer.addEventListener('timeupdate', () => this.updateProgressBar());
        this.audioPlayer.addEventListener('loadedmetadata', () => this.updateTimeDisplay());

        // Settings
        document.getElementById('autoPlayNext').addEventListener('change', (e) => {
            this.autoPlayNext = e.target.checked;
        });
        document.getElementById('loopSession').addEventListener('change', (e) => {
            this.loopSession = e.target.checked;
        });
        document.getElementById('volumeControl').addEventListener('input', (e) => {
            const volume = e.target.value / 100;
            this.audioPlayer.volume = volume;
            document.getElementById('volumeDisplay').textContent = e.target.value + '%';
        });

        // Sequence item removal (delegated)
        document.getElementById('sequenceContainer').addEventListener('click', (e) => {
            if (e.target.classList.contains('remove-btn')) {
                const index = parseInt(e.target.dataset.index);
                this.removeTrackFromPlaylist(index);
            }
        });

        // Install app
        document.getElementById('installBtn').addEventListener('click', () => this.installApp());
    }

    setupInstallPrompt() {
        let deferredPrompt;
        window.addEventListener('beforeinstallprompt', (e) => {
            e.preventDefault();
            deferredPrompt = e;
            document.getElementById('installBtn').style.display = 'block';
        });

        if (deferredPrompt) {
            document.getElementById('installBtn').addEventListener('click', async () => {
                deferredPrompt.prompt();
                const { outcome } = await deferredPrompt.userChoice;
                console.log(`User response: ${outcome}`);
                deferredPrompt = null;
                document.getElementById('installBtn').style.display = 'none';
            });
        }
    }

    addTrack() {
        const trackId = document.getElementById('trackSelect').value;
        const repetitions = parseInt(document.getElementById('repetitionCount').value) || 1;

        if (!trackId) {
            alert('Please select a track');
            return;
        }

        const track = this.tracks.find(t => t.id === trackId);
        this.playlist.push({
            id: track.id,
            name: track.name,
            file: track.file,
            duration: track.duration,
            repetitions: repetitions
        });

        this.savePlaylistToStorage();
        this.updateUI();
        
        // Reset selection
        document.getElementById('trackSelect').value = '';
        document.getElementById('repetitionCount').value = '1';
    }

    removeTrackFromPlaylist(index) {
        this.playlist.splice(index, 1);
        this.savePlaylistToStorage();
        
        if (this.isPlaying && index === this.currentIndex) {
            this.stop();
        }
        
        this.updateUI();
    }

    clearAll() {
        if (this.playlist.length === 0) return;
        if (confirm('Clear all items from your session?')) {
            this.playlist = [];
            this.currentIndex = 0;
            this.currentRepetition = 0;
            this.stop();
            this.savePlaylistToStorage();
            this.updateUI();
        }
    }

    play() {
        if (this.playlist.length === 0) {
            alert('Please add tracks to your session first!');
            return;
        }

        if (!this.isPlaying) {
            this.isPlaying = true;
            this.playNext();
        } else {
            this.audioPlayer.play();
        }

        this.updatePlayerButtons();
    }

    playNext() {
        if (this.currentIndex >= this.playlist.length) {
            if (this.loopSession) {
                this.currentIndex = 0;
                this.currentRepetition = 0;
            } else {
                this.stop();
                return;
            }
        }

        const item = this.playlist[this.currentIndex];
        this.audioPlayer.src = item.file;
        this.audioPlayer.play();
        
        this.updateSessionInfo();
    }

    onTrackEnd() {
        this.currentRepetition++;

        const item = this.playlist[this.currentIndex];
        if (this.currentRepetition >= item.repetitions) {
            this.currentRepetition = 0;
            this.currentIndex++;
            
            if (this.currentIndex >= this.playlist.length) {
                if (this.loopSession) {
                    this.currentIndex = 0;
                    if (this.autoPlayNext) this.playNext();
                } else {
                    this.stop();
                }
                return;
            }
        }

        if (this.autoPlayNext) {
            this.playNext();
        } else {
            this.stop();
        }
    }

    pause() {
        this.audioPlayer.pause();
        this.updatePlayerButtons();
    }

    stop() {
        this.audioPlayer.pause();
        this.audioPlayer.currentTime = 0;
        this.isPlaying = false;
        this.currentIndex = 0;
        this.currentRepetition = 0;
        this.updatePlayerButtons();
        document.getElementById('currentTrack').textContent = 'No track selected';
        document.getElementById('sessionInfo').textContent = '';
    }

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
        if (this.currentIndex < this.playlist.length) {
            const item = this.playlist[this.currentIndex];
            const rep = this.currentRepetition + 1;
            document.getElementById('currentTrack').textContent = `${item.name}`;
            document.getElementById('sessionInfo').textContent = 
                `Repetition ${rep}/${item.repetitions} | Item ${this.currentIndex + 1}/${this.playlist.length}`;
        }
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

        container.innerHTML = this.playlist.map((item, index) => `
            <div class="sequence-item">
                <div class="item-content">
                    <span class="item-number">${index + 1}</span>
                    <div class="item-details">
                        <h4>${item.name}</h4>
                        <p>🔁 ${item.repetitions}x • ⏱️ ${this.formatDuration(item.duration * item.repetitions)}</p>
                    </div>
                </div>
                <button class="remove-btn" data-index="${index}">✕</button>
            </div>
        `).join('');
    }

    updateStats() {
        const totalItems = this.playlist.length;
        const totalSeconds = this.playlist.reduce((sum, item) => sum + (item.duration * item.repetitions), 0);
        const totalMinutes = Math.ceil(totalSeconds / 60);

        document.getElementById('totalItems').textContent = totalItems;
        document.getElementById('totalDuration').textContent = `${totalMinutes} min`;
    }

    formatDuration(seconds) {
        if (seconds < 60) return Math.ceil(seconds) + 's';
        const mins = Math.floor(seconds / 60);
        const secs = Math.ceil(seconds % 60);
        return `${mins}m ${secs}s`;
    }

    savePlaylistToStorage() {
        localStorage.setItem('chantflow_playlist', JSON.stringify(this.playlist));
    }

    loadPlaylistFromStorage() {
        const saved = localStorage.getItem('chantflow_playlist');
        if (saved) {
            try {
                this.playlist = JSON.parse(saved);
            } catch (e) {
                console.error('Error loading playlist:', e);
                this.playlist = [];
            }
        }
    }

    installApp() {
        // Install prompt is handled by beforeinstallprompt event
    }
}

// Initialize app when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
    window.app = new ChantFlow();
});

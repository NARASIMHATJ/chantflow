#!/usr/bin/env node
// Regenerates config.json from whatever audio files are present in audio/.
//
// Add or remove files in audio/ and run:  node tools/generate-config.js
// (The .github/workflows/update-config.yml action runs this automatically on push.)
//
// Manual edits you make to a track's "name" or "category" in config.json are
// preserved: entries are matched by "id", which is derived from the filename.

const fs = require('fs');
const path = require('path');

const ROOT = path.join(__dirname, '..');
const AUDIO_DIR = path.join(ROOT, 'audio');
const CONFIG_PATH = path.join(ROOT, 'config.json');

const AUDIO_EXTENSIONS = ['.mp3', '.ogg', '.wav', '.m4a', '.aac', '.opus', '.flac'];

// Filename patterns -> the category and display prefix a new track gets.
const CATEGORY_RULES = [
    { match: /^pause/i,            category: 'pauses',  icon: '⏸' },
    { match: /^bell/i,             category: 'bells',   icon: '🔔' },
    { match: /^om$/i,              category: 'chants',  icon: '🕉' },
    { match: /^(music|bgm)/i,      category: 'music',   icon: '🎵' },
    { match: /.*/,                 category: 'chants',  icon: '🎶' }
];

// Pad digit runs so "Pause2" sorts before "Pause10". Compared ordinally so that the
// Node and PowerShell generators always agree on ordering.
function sortKey(name) {
    return name.toLowerCase().replace(/\d+/g, d => d.padStart(10, '0'));
}

function idFromFilename(filename) {
    return path.basename(filename, path.extname(filename));
}

// "Pausepoint5" -> "Pausepoint5"; "sloka_1" -> "Sloka 1"; "om" -> "Om"
function nameFromId(id) {
    const words = id.replace(/[_-]+/g, ' ').trim();
    return words.charAt(0).toUpperCase() + words.slice(1);
}

function classify(id) {
    return CATEGORY_RULES.find(rule => rule.match.test(id));
}

function readExistingConfig() {
    if (!fs.existsSync(CONFIG_PATH)) return null;
    try {
        return JSON.parse(fs.readFileSync(CONFIG_PATH, 'utf8'));
    } catch (e) {
        console.warn(`config.json is not valid JSON (${e.message}) - rebuilding from scratch.`);
        return null;
    }
}

function main() {
    if (!fs.existsSync(AUDIO_DIR)) {
        console.error(`No audio directory at ${AUDIO_DIR}`);
        process.exit(1);
    }

    const existing = readExistingConfig() || {};
    const previousTracks = new Map((existing.tracks || []).map(t => [t.id, t]));

    const files = fs.readdirSync(AUDIO_DIR)
        .filter(f => AUDIO_EXTENSIONS.includes(path.extname(f).toLowerCase()))
        .sort((a, b) => {
            const ka = sortKey(a), kb = sortKey(b);
            return ka < kb ? -1 : ka > kb ? 1 : 0;
        });

    const tracks = files.map(file => {
        const id = idFromFilename(file);
        const previous = previousTracks.get(id);
        const rule = classify(id);

        return {
            id,
            // Keep a hand-edited display name / category if one is already there.
            name: previous?.name || `${rule.icon} ${nameFromId(id)}`,
            file: `audio/${file}`,
            duration: 0,
            category: previous?.category || rule.category
        };
    });

    const config = {
        app: existing.app || {
            name: 'ChantFlow',
            version: '1.0.0',
            description: 'Devotional Chant Player - Create and play customized chanting sessions',
            author: 'Your Name',
            supportEmail: 'support@example.com'
        },
        tracks,
        defaultRepetitions: existing.defaultRepetitions || [
            { label: '11x', value: 11 },
            { label: '21x', value: 21 },
            { label: '54x', value: 54 },
            { label: '108x', value: 108 }
        ],
        settings: existing.settings || {
            autoPlayNext: true,
            loopSession: false,
            defaultVolume: 70,
            cacheAudio: true,
            enableNotifications: false
        }
    };

    const serialized = JSON.stringify(config, null, 2) + '\n';
    const unchanged = fs.existsSync(CONFIG_PATH) &&
        fs.readFileSync(CONFIG_PATH, 'utf8') === serialized;

    if (unchanged) {
        console.log(`config.json already up to date (${tracks.length} tracks).`);
        return;
    }

    fs.writeFileSync(CONFIG_PATH, serialized);

    const added = tracks.filter(t => !previousTracks.has(t.id)).map(t => t.id);
    const removed = [...previousTracks.keys()].filter(id => !tracks.some(t => t.id === id));

    console.log(`Wrote config.json with ${tracks.length} tracks.`);
    if (added.length) console.log(`  added:   ${added.join(', ')}`);
    if (removed.length) console.log(`  removed: ${removed.join(', ')}`);
}

main();

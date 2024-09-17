// Script/script.js
const noteContainer = document.getElementById('note-container');
const songInput = document.getElementById('song-input');
const songSelect = document.getElementById('song-select');
const startButton = document.getElementById('start-button');
const changeKeybindsButton = document.getElementById('change-keybinds-button');
const saveKeybindsButton = document.getElementById('save-keybinds-button');
const settingsButton = document.getElementById('settings-button');
const saveSettingsButton = document.getElementById('save-settings-button');
const stopButton = document.getElementById('stop-button');
const keyIndicators = document.querySelectorAll('.key');
const keybindsForm = document.getElementById('keybinds-form');
const settingsForm = document.getElementById('settings-form');
const noteColorInputs = document.querySelectorAll('.note-color-input');
const hitLine = document.getElementById('hit-line');
let audioContext, audioBuffer, sourceNode, animationFrameId, analyser, dataArray, bufferLength;
let keys = [65, 83, 68, 70]; // Default keys: A, S, D, F
let noteColors = ['#ff0000', '#00ff00', '#0000ff', '#ffff00']; // Default colors: red, green, blue, yellow

startButton.addEventListener('click', () => {
    if (songInput.files.length > 0) {
        const file = songInput.files[0];
        const reader = new FileReader();
        reader.onload = (e) => {
            const arrayBuffer = e.target.result;
            loadSong(arrayBuffer);
        };
        reader.readAsArrayBuffer(file);
    } else if (songSelect.value) {
        fetch(songSelect.value)
            .then(response => response.arrayBuffer())
            .then(arrayBuffer => loadSong(arrayBuffer))
            .catch(error => console.error('Error loading song:', error));
    } else {
        alert('Please select a song first!');
    }
    toggleControls(false);
});

stopButton.addEventListener('click', () => {
    if (sourceNode) {
        sourceNode.stop();
        cancelAnimationFrame(animationFrameId);
        toggleControls(true);
    }
});

changeKeybindsButton.addEventListener('click', () => {
    keybindsForm.style.display = 'block';
});

saveKeybindsButton.addEventListener('click', () => {
    const key1 = document.getElementById('key1').value.toUpperCase().charCodeAt(0);
    const key2 = document.getElementById('key2').value.toUpperCase().charCodeAt(0);
    const key3 = document.getElementById('key3').value.toUpperCase().charCodeAt(0);
    const key4 = document.getElementById('key4').value.toUpperCase().charCodeAt(0);
    keys = [key1, key2, key3, key4];
    updateKeyIndicators();
    keybindsForm.style.display = 'none';
});

settingsButton.addEventListener('click', () => {
    settingsForm.style.display = 'block';
});

saveSettingsButton.addEventListener('click', () => {
    noteColors = Array.from(noteColorInputs).map(input => input.value);
    settingsForm.style.display = 'none';
});

function updateKeyIndicators() {
    keyIndicators.forEach((indicator, index) => {
        indicator.dataset.key = keys[index];
        indicator.textContent = String.fromCharCode(keys[index]);
        indicator.style.backgroundColor = noteColors[index];
    });
}

function loadSong(arrayBuffer) {
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    audioContext.decodeAudioData(arrayBuffer, (buffer) => {
        audioBuffer = buffer;
        setupAudioNodes();
        playSong();
    });
}

function setupAudioNodes() {
    sourceNode = audioContext.createBufferSource();
    sourceNode.buffer = audioBuffer;
    analyser = audioContext.createAnalyser();
    analyser.fftSize = 256;
    bufferLength = analyser.frequencyBinCount;
    dataArray = new Uint8Array(bufferLength);
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
}

function playSong() {
    sourceNode.start(0);
    generateNotes();
    stopButton.style.display = 'block';
}

function generateNotes() {
    let currentTime = 0;
    const interval = 500; // Interval in milliseconds for note generation

    function createNote() {
        const note = document.createElement('div');
        note.classList.add('note');
        const keyIndex = Math.floor(Math.random() * keys.length);
        note.dataset.key = keys[keyIndex];
        note.style.top = `${-50}px`;
        note.style.left = `${(keyIndex * 100)}px`; // Adjusted to match the key indicators
        note.style.backgroundColor = noteColors[keyIndex];
        noteContainer.appendChild(note);
    }

    function scheduleNotes() {
        if (currentTime < audioBuffer.duration * 1000) {
            createNote();
            currentTime += interval;
            setTimeout(scheduleNotes, interval);
        }
    }

    scheduleNotes();
    animateNotes();
}

function animateNotes() {
    const notes = document.querySelectorAll('.note');
    notes.forEach(note => {
        const top = parseFloat(note.style.top);
        note.style.top = `${top + 2}px`;
        if (top > 300) {
            note.remove();
            document.body.classList.add('screen-shake');
            setTimeout(() => {
                document.body.classList.remove('screen-shake');
            }, 300);
        } else if (top > 250 && top < 300) {
            hitLine.classList.add('flash');
            setTimeout(() => {
                hitLine.classList.remove('flash');
            }, 100);
        }
    });
    animationFrameId = requestAnimationFrame(animateNotes);
}

document.addEventListener('keydown', (e) => {
    const key = e.keyCode;
    const keyIndicator = document.querySelector(`.key[data-key="${key}"]`);
    if (keyIndicator) {
        keyIndicator.classList.add('active');
        checkHit(key);
    }
});

document.addEventListener('keyup', (e) => {
    const key = e.keyCode;
    const keyIndicator = document.querySelector(`.key[data-key="${key}"]`);
    if (keyIndicator) {
        keyIndicator.classList.remove('active');
    }
});

function checkHit(key) {
    const notes = document.querySelectorAll(`.note[data-key="${key}"]`);
    notes.forEach(note => {
        const top = parseFloat(note.style.top);
        if (top > 250 && top < 300) {
            note.classList.add('hit');
            setTimeout(() => note.remove(), 300);
            // Add scoring logic here
        }
    });
}

function toggleControls(show) {
    const display = show ? 'block' : 'none';
    startButton.style.display = display;
    changeKeybindsButton.style.display = display;
    settingsButton.style.display = display;
    songInput.style.display = display;
    songSelect.style.display = display;
    stopButton.style.display = show ? 'none' : 'block';
}

// Initialize the key indicators with the default colors
updateKeyIndicators();

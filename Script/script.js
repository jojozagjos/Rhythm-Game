let audioContext, audioBuffer, sourceNode, analyser, dataArray, animationId;
let notes = [];
let keybinds = ['D', 'F', 'J', 'K'];
let score = 0;
let combo = 0;
let isPaused = false;
let startTime;

document.getElementById('start-button').addEventListener('click', startGame);
document.getElementById('stop-button').addEventListener('click', stopGame);
document.getElementById('pause-button').addEventListener('click', pauseGame);
document.getElementById('settings-button').addEventListener('click', toggleSettings);
document.getElementById('file-input').addEventListener('change', loadFile);
document.getElementById('save-keybinds-button').addEventListener('click', saveKeybinds);
document.addEventListener('keydown', handleKeyPress);
document.addEventListener('keyup', handleKeyRelease);

function startGame() {
    if (!audioBuffer) {
        alert('Please load a song first!');
        return;
    }
    document.getElementById('start-button').style.display = 'none';
    document.getElementById('stop-button').style.display = 'inline';
    document.getElementById('pause-button').style.display = 'inline';
    document.getElementById('settings').style.display = 'none';
    document.getElementById('file-input').style.display = 'none';
    displayKeybinds();
    // Initialize audio context and start playing
    audioContext = new (window.AudioContext || window.webkitAudioContext)();
    sourceNode = audioContext.createBufferSource();
    analyser = audioContext.createAnalyser();
    sourceNode.connect(analyser);
    analyser.connect(audioContext.destination);
    sourceNode.buffer = audioBuffer;
    startTime = audioContext.currentTime;
    sourceNode.start(0);
    // Start animation loop
    animationId = requestAnimationFrame(updateGame);
    generateNotes();
}

function stopGame() {
    document.getElementById('start-button').style.display = 'inline';
    document.getElementById('stop-button').style.display = 'none';
    document.getElementById('pause-button').style.display = 'none';
    document.getElementById('file-input').style.display = 'inline';
    cancelAnimationFrame(animationId);
    sourceNode.stop();
    clearNotes(); // Clear notes when the game stops
}

function pauseGame() {
    if (audioContext.state === 'running') {
        audioContext.suspend();
        isPaused = true;
    } else {
        audioContext.resume();
        isPaused = false;
        animationId = requestAnimationFrame(updateGame);
    }
}

function toggleSettings() {
    const settings = document.getElementById('settings');
    settings.style.display = settings.style.display === 'none' ? 'block' : 'none';
}

function loadFile(event) {
    const file = event.target.files[0];
    const reader = new FileReader();
    reader.onload = function(e) {
        audioContext = new (window.AudioContext || window.webkitAudioContext)();
        audioContext.decodeAudioData(e.target.result, function(buffer) {
            audioBuffer = buffer;
        });
    };
    reader.readAsArrayBuffer(file);
}

function saveKeybinds() {
    keybinds = [
        document.getElementById('key1').value.toUpperCase(),
        document.getElementById('key2').value.toUpperCase(),
        document.getElementById('key3').value.toUpperCase(),
        document.getElementById('key4').value.toUpperCase()
    ];
    displayKeybinds();
    generateNotes(); // Regenerate notes with new keybinds
}

function handleKeyPress(event) {
    const key = event.key.toUpperCase();
    if (keybinds.includes(key)) {
        document.querySelector(`.key[data-key="${event.keyCode}"]`).classList.add('active');
        // Handle note hit or miss
        const note = notes.find(n => n.key === key && !n.hit);
        if (note) {
            note.hit = true;
            score += 100;
            combo++;
            updateScoreAndCombo();
            showFeedback('Perfect');
        } else {
            combo = 0;
            showFeedback('Miss');
            screenShake();
        }
    }
}

function handleKeyRelease(event) {
    const key = event.key.toUpperCase();
    if (keybinds.includes(key)) {
        document.querySelector(`.key[data-key="${event.keyCode}"]`).classList.remove('active');
    }
}

function showFeedback(message) {
    const feedback = document.getElementById('feedback');
    feedback.textContent = message;
    setTimeout(() => feedback.textContent = '', 1000);
}

function displayKeybinds() {
    const keyIndicators = document.querySelectorAll('.key');
    keyIndicators.forEach((keyIndicator, index) => {
        keyIndicator.textContent = keybinds[index];
        keyIndicator.dataset.key = keybinds[index].charCodeAt(0);
    });
}

function generateNotes() {
    clearNotes(); // Clear existing notes
    const songDuration = audioBuffer.duration;
    const bpm = 120; // Assume a default BPM, you can adjust this or calculate it dynamically
    const beatInterval = 60 / bpm; // Interval between beats in seconds
    for (let time = 0; time < songDuration; time += beatInterval) {
        const key = keybinds[Math.floor(Math.random() * keybinds.length)];
        notes.push({ time, key, hit: false });
    }
    notes.forEach(note => {
        const noteElement = document.createElement('div');
        noteElement.classList.add('note');
        noteElement.dataset.key = note.key;
        noteElement.style.backgroundColor = getColorForKey(note.key); // Set color based on key
        noteElement.style.top = '0px'; // Start from the top
        noteElement.style.left = getLeftPositionForKey(note.key); // Align with corresponding key
        document.getElementById('notes-container').appendChild(noteElement);
    });
}

function getColorForKey(key) {
    switch (key) {
        case 'D': return '#ff0000'; // Red
        case 'F': return '#00ff00'; // Green
        case 'J': return '#0000ff'; // Blue
        case 'K': return '#ffff00'; // Yellow
        default: return '#ffffff'; // White
    }
}

function getLeftPositionForKey(key) {
    switch (key) {
        case 'D': return '25%'; // Adjust these values to align with your key positions
        case 'F': return '40%';
        case 'J': return '60%';
        case 'K': return '75%';
        default: return '50%';
    }
}

function updateGame() {
    if (isPaused) return;
    // Update game logic and render notes
    const currentTime = audioContext.currentTime - startTime;
    notes.forEach(note => {
        const noteElement = document.querySelector(`.note[data-key="${note.key}"]`);
        if (noteElement) {
            const notePosition = (note.time - currentTime) * 300; // Increase speed by adjusting this value
            noteElement.style.top = `${notePosition}px`;
            if (notePosition > 500 && !note.hit) { // Adjusted to match the new height
                note.hit = true;
                combo = 0;
                showFeedback('Miss');
                screenShake();
            }
        }
    });
    animationId = requestAnimationFrame(updateGame);
}

function clearNotes() {
    const notesContainer = document.getElementById('notes-container');
    while (notesContainer.firstChild) {
        notesContainer.removeChild(notesContainer.firstChild);
    }
}

function updateScoreAndCombo() {
    document.getElementById('score-display').textContent = `Score: ${score}`;
    document.getElementById('combo-display').textContent = `Combo: ${combo}`;
}

function screenShake() {
    const gameContainer = document.getElementById('game-container');
    gameContainer.classList.add('shake');
    setTimeout(() => gameContainer.classList.remove('shake'), 500);
}

// DOM Elements
const screens = {
    start: document.getElementById('start-screen'),
    gameplay: document.getElementById('gameplay-screen'),
    gameOver: document.getElementById('game-over-screen'),
    victory: document.getElementById('victory-screen')
};

const hud = {
    lives: document.getElementById('lives'),
    score: document.getElementById('score'),
    phase: document.getElementById('phase'),
    phaseName: document.getElementById('phase-name'),
    timerContainer: document.getElementById('timer-container'),
    timer: document.getElementById('timer')
};

const areas = {
    question: document.getElementById('question-area'),
    options: document.getElementById('options-area'),
    memory: document.getElementById('memory-area')
};

const feedbackOverlay = document.getElementById('feedback-overlay');
const feedbackIcon = document.getElementById('feedback-icon');

// Game State
let state = {
    lives: 3,
    score: 0,
    currentPhaseIndex: 0,
    roundsInPhase: 0,
    requiredRounds: 3, // Quantas rodadas certas para passar de fase
    isPlaying: false,
    timerInterval: null
};

// Data Structures
const phasesConfig = [
    { name: "Letras", type: "letters" },
    { name: "Números", type: "numbers" },
    { name: "Cores", type: "colors" },
    { name: "Memória", type: "memory" },
    { name: "Animais", type: "animals" },
    { name: "Desafio Final", type: "mixed" }
];

// Audio System (Web Audio API)
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') {
        audioCtx.resume();
    }
    const o = audioCtx.createOscillator();
    const g = audioCtx.createGain();
    o.connect(g);
    g.connect(audioCtx.destination);

    if (type === 'correct') {
        o.type = 'sine';
        o.frequency.setValueAtTime(523.25, audioCtx.currentTime); // C5
        o.frequency.exponentialRampToValueAtTime(1046.50, audioCtx.currentTime + 0.1); // C6
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        o.start();
        o.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'wrong') {
        o.type = 'sawtooth';
        o.frequency.setValueAtTime(200, audioCtx.currentTime);
        o.frequency.exponentialRampToValueAtTime(50, audioCtx.currentTime + 0.3);
        g.gain.setValueAtTime(0.3, audioCtx.currentTime);
        g.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        o.start();
        o.stop(audioCtx.currentTime + 0.3);
    } else if (type === 'win') {
        o.type = 'square';
        o.frequency.setValueAtTime(440, audioCtx.currentTime); 
        o.frequency.setValueAtTime(554.37, audioCtx.currentTime + 0.1);
        o.frequency.setValueAtTime(659.25, audioCtx.currentTime + 0.2);
        g.gain.setValueAtTime(0.2, audioCtx.currentTime);
        g.gain.linearRampToValueAtTime(0.01, audioCtx.currentTime + 0.5);
        o.start();
        o.stop(audioCtx.currentTime + 0.5);
    }
}

// Helpers
function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

function showScreen(screenId) {
    Object.values(screens).forEach(sc => sc.classList.remove('active'));
    screens[screenId].classList.add('active');
}

function updateHUD() {
    hud.lives.innerHTML = '❤️ '.repeat(state.lives) + '🖤 '.repeat(3 - state.lives);
    hud.score.textContent = state.score;
    hud.phase.textContent = state.currentPhaseIndex + 1;
    hud.phaseName.textContent = phasesConfig[state.currentPhaseIndex].name;
}

function showFeedback(isCorrect) {
    feedbackIcon.textContent = isCorrect ? '🌟' : '❌';
    feedbackOverlay.classList.remove('hidden');
    setTimeout(() => {
        feedbackOverlay.classList.add('hidden');
    }, 1000);
}

// Game Flow
function startGame() {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    state = {
        lives: 3,
        score: 0,
        currentPhaseIndex: 0,
        roundsInPhase: 0,
        requiredRounds: 3,
        isPlaying: true,
        timerInterval: null
    };
    showScreen('gameplay');
    updateHUD();
    loadPhase();
}

function loadPhase() {
    if (!state.isPlaying) return;
    clearInterval(state.timerInterval);
    hud.timerContainer.classList.add('hidden');

    areas.question.innerHTML = '';
    areas.options.innerHTML = '';
    areas.memory.innerHTML = '';
    areas.memory.classList.add('hidden');
    areas.question.classList.remove('hidden');
    areas.options.classList.remove('hidden');

    const config = phasesConfig[state.currentPhaseIndex];
    
    // Difficulty logic:
    // P1, P2 (Initial): 2 options
    // P3, P4 (Medium): 3 options
    // P5, P6 (Adv): 4 options + timer
    let numOptions = 2;
    if (state.currentPhaseIndex >= 2) numOptions = 3;
    if (state.currentPhaseIndex >= 4) numOptions = 4;

    let typeToLoad = config.type;
    
    if (typeToLoad === 'mixed') {
        const mixTypes = ['letters', 'numbers', 'colors', 'animals'];
        typeToLoad = mixTypes[Math.floor(Math.random() * mixTypes.length)];
        startTimer(15);
    }

    if (config.type === 'memory') {
        loadMemoryGame(numOptions * 2); // 4 or 6 cards
    } else {
        const questionData = generateQuestion(typeToLoad, numOptions);
        renderQuestion(questionData);
    }
}

function handleAnswer(isCorrect, element) {
    if (!state.isPlaying || element.disabled) return;
    
    // Disable all options momentarily
    document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = true);

    if (isCorrect) {
        playSound('correct');
        element.classList.add('correct');
        state.score += 10 * (state.currentPhaseIndex + 1);
        showFeedback(true);
        setTimeout(() => nextRound(), 1000);
    } else {
        playSound('wrong');
        element.classList.add('wrong');
        state.lives--;
        showFeedback(false);
        updateHUD();
        if (state.lives <= 0) {
            setTimeout(() => gameOver(), 1000);
        } else {
            setTimeout(() => {
                element.classList.remove('wrong');
                document.querySelectorAll('.option-btn').forEach(btn => btn.disabled = false);
            }, 800);
        }
    }
    updateHUD();
}

function nextRound() {
    state.roundsInPhase++;
    if (state.roundsInPhase >= state.requiredRounds) {
        state.currentPhaseIndex++;
        state.roundsInPhase = 0;
        playSound('win');
        if (state.currentPhaseIndex >= phasesConfig.length) {
            victory();
            return;
        }
    }
    updateHUD();
    loadPhase();
}

function gameOver() {
    state.isPlaying = false;
    clearInterval(state.timerInterval);
    document.getElementById('final-score-lose').textContent = state.score;
    showScreen('gameOver');
}

function victory() {
    state.isPlaying = false;
    document.getElementById('final-score-win').textContent = state.score;
    showScreen('victory');
}

function startTimer(seconds) {
    hud.timerContainer.classList.remove('hidden');
    let timeLeft = seconds;
    hud.timer.textContent = timeLeft;
    state.timerInterval = setInterval(() => {
        timeLeft--;
        hud.timer.textContent = timeLeft;
        if (timeLeft <= 0) {
            clearInterval(state.timerInterval);
            playSound('wrong');
            state.lives--;
            updateHUD();
            if (state.lives <= 0) gameOver();
            else loadPhase(); // restart round
        }
    }, 1000);
}

// generators
function generateQuestion(type, numOptions) {
    let questionText = '';
    let options = [];
    let correct = '';

    if (type === 'letters') {
        const words = [
            {w: 'GATO', m: 0}, {w: 'CASA', m: 0}, {w: 'BOLA', m: 0},
            {w: 'PATO', m: 0}, {w: 'MALA', m: 0}, {w: 'DADO', m: 0}
        ];
        const selected = words[Math.floor(Math.random() * words.length)];
        const alphabet = 'ABCDEFGHIJKLMNOPQRSTUVWXYZ'.split('');
        correct = selected.w[selected.m];
        
        questionText = selected.w.split('').map((char, i) => i === selected.m ? '_' : char).join('');
        options.push(correct);
        while (options.length < numOptions) {
            let randLetter = alphabet[Math.floor(Math.random() * alphabet.length)];
            if (!options.includes(randLetter)) options.push(randLetter);
        }

    } else if (type === 'numbers') {
        const items = ['🍎', '🚗', '🎈', '⭐', '🐶'];
        const item = items[Math.floor(Math.random() * items.length)];
        const count = Math.floor(Math.random() * 5) + 1; // 1 a 5
        questionText = Array(count).fill(item).join(' ');
        correct = count.toString();
        options.push(correct);
        while (options.length < numOptions) {
            let randNum = (Math.floor(Math.random() * 8) + 1).toString();
            if (!options.includes(randNum)) options.push(randNum);
        }

    } else if (type === 'colors') {
        const colors = [
            {nome: 'Azul', emoji: '🔵'}, {nome: 'Vermelho', emoji: '🔴'},
            {nome: 'Verde', emoji: '🟩'}, {nome: 'Amarelo', emoji: '⭐'},
            {nome: 'Laranja', emoji: '🟠'}, {nome: 'Preto', emoji: '⚫'}
        ];
        const selected = colors[Math.floor(Math.random() * colors.length)];
        questionText = selected.emoji;
        correct = selected.nome;
        options.push(correct);
        while (options.length < numOptions) {
            let randColor = colors[Math.floor(Math.random() * colors.length)].nome;
            if (!options.includes(randColor)) options.push(randColor);
        }

    } else if (type === 'animals') {
        const animals = [
            {nome: 'Cachorro', emoji: '🐶'}, {nome: 'Gato', emoji: '🐱'},
            {nome: 'Leão', emoji: '🦁'}, {nome: 'Porco', emoji: '🐷'},
            {nome: 'Sapo', emoji: '🐸'}, {nome: 'Macaco', emoji: '🐵'}
        ];
        const selected = animals[Math.floor(Math.random() * animals.length)];
        questionText = selected.emoji;
        correct = selected.nome;
        options.push(correct);
        while (options.length < numOptions) {
            let randAnimal = animals[Math.floor(Math.random() * animals.length)].nome;
            if (!options.includes(randAnimal)) options.push(randAnimal);
        }
    }

    return { type, questionText, correct, options: shuffle(options) };
}

function renderQuestion(data) {
    if (data.type === 'letters') {
         areas.question.innerHTML = data.questionText.split('').map(char => {
             return `<div class="letter-box ${char === '_' ? 'filled' : ''}">${char === '_' ? '?' : char}</div>`;
         }).join('');
    } else {
         areas.question.innerHTML = `<div class="item-emoji">${data.questionText}</div>`;
    }

    data.options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'option-btn';
        btn.textContent = opt;
        btn.onclick = () => handleAnswer(opt === data.correct, btn);
        areas.options.appendChild(btn);
    });
}

// Memory Game Logic
function loadMemoryGame(totalCards) {
    areas.question.classList.add('hidden');
    areas.options.classList.add('hidden');
    areas.memory.classList.remove('hidden');
    
    // adjust grid layout based on cards
    areas.memory.style.gridTemplateColumns = totalCards > 4 ? 'repeat(3, 1fr)' : 'repeat(2, 1fr)';

    const emojis = ['🌟', '🍎', '🐶', '🚗', '🎈', '🍉'];
    const selectedEmojis = emojis.slice(0, totalCards / 2);
    let cards = [...selectedEmojis, ...selectedEmojis];
    cards = shuffle(cards);

    let flippedCards = [];
    let matchedPairs = 0;

    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.innerHTML = `<span>${emoji}</span>`;
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        
        card.onclick = () => {
            if (!state.isPlaying || flippedCards.length >= 2 || card.classList.contains('flipped') || card.classList.contains('matched')) return;
            
            playSound('correct'); // tiny flip sound
            card.classList.add('flipped');
            flippedCards.push(card);

            if (flippedCards.length === 2) {
                const [c1, c2] = flippedCards;
                if (c1.dataset.emoji === c2.dataset.emoji) {
                    setTimeout(() => {
                        playSound('correct');
                        c1.classList.add('matched');
                        c2.classList.add('matched');
                        matchedPairs++;
                        flippedCards = [];
                        if (matchedPairs === totalCards / 2) {
                            state.score += 50;
                            showFeedback(true);
                            setTimeout(() => nextRound(), 1000);
                        }
                    }, 500);
                } else {
                    setTimeout(() => {
                        playSound('wrong');
                        c1.classList.remove('flipped');
                        c2.classList.remove('flipped');
                        flippedCards = [];
                        
                        // Penalty in memory game
                        state.lives--;
                        updateHUD();
                        if (state.lives <= 0) gameOver();
                    }, 1000);
                }
            }
        };
        areas.memory.appendChild(card);
    });
}

// Events
document.getElementById('btn-start').addEventListener('click', startGame);
document.getElementById('btn-restart-lose').addEventListener('click', startGame);
document.getElementById('btn-restart-win').addEventListener('click', startGame);

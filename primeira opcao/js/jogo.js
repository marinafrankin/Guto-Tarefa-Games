// script.js - Lógica do Jogo "Aventura do Reino Mágico"

/* ==========================================
   CONFIGURAÇÃO ESTADUAL DO JOGO (STATE)
========================================== */
const state = {
    score: 0,
    lives: 3,
    phase: 1, // Fases de 1 a 5
    round: 0, // Rodadas dentro da fase
    maxRoundsPerPhase: 3, // Quantas vezes precisa acertar para passar de fase
    timer: null,
    timeLeft: 10,
    isMemoryActive: false,
    memoryCards: [],
    flippedCards: []
};

/* ==========================================
   BANCOS DE DADOS
========================================== */
const dictionary = [
    { emoji: '🍎', word: 'MAÇÃ', letter: 'M' },
    { emoji: '🍌', word: 'BANANA', letter: 'B' },
    { emoji: '🐶', word: 'CACHORRO', letter: 'C' },
    { emoji: '🐱', word: 'GATO', letter: 'G' },
    { emoji: '🦁', word: 'LEÃO', letter: 'L' },
    { emoji: '🍉', word: 'MELANCIA', letter: 'M' }
];

const colorsData = [
    { hex: '#ff4757', name: 'VERMELHO' },
    { hex: '#2ed573', name: 'VERDE' },
    { hex: '#1e90ff', name: 'AZUL' },
    { hex: '#ffa502', name: 'LARANJA' },
    { hex: '#eccc68', name: 'AMARELO' },
    { hex: '#9b59b6', name: 'ROXO' }
];

const memoryPairs = ['🍎', '🍌', '🐶', '🐱', '⭐', '🎈']; // Para a Fase 4

/* ==========================================
   ELETIVOS DOM
========================================== */
const screens = document.querySelectorAll('.screen');
const btnStart = document.getElementById('btn-start');
const currentPhaseEl = document.getElementById('current-phase');
const scoreEl = document.getElementById('score');
const livesContainer = document.getElementById('lives');
const questionText = document.getElementById('question-text');
const questionVisual = document.getElementById('question-visual');
const optionsContainer = document.getElementById('options-container');
const timerContainer = document.getElementById('timer-container');
const timerBar = document.getElementById('timer-bar');

const btnRestartGo = document.getElementById('btn-restart-go');
const btnRestartVic = document.getElementById('btn-restart-vic');
const finalScoreGo = document.getElementById('final-score-go');
const finalScoreVic = document.getElementById('final-score-vic');

/* ==========================================
   SISTEMA DE SOM (SÍNTESE NATIVA)
========================================== */
// Usamos Web Audio API para não precisar focar em arquivos mp3 externos
const AudioContext = window.AudioContext || window.webkitAudioContext;
const audioCtx = new AudioContext();

function playSound(type) {
    if (audioCtx.state === 'suspended') audioCtx.resume();
    const osc = audioCtx.createOscillator();
    const gainNode = audioCtx.createGain();
    
    osc.connect(gainNode);
    gainNode.connect(audioCtx.destination);
    
    if (type === 'correct') {
        osc.type = 'sine';
        osc.frequency.setValueAtTime(440, audioCtx.currentTime); // Nota A4
        osc.frequency.exponentialRampToValueAtTime(880, audioCtx.currentTime + 0.1);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.2);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.2);
    } else if (type === 'wrong') {
        osc.type = 'sawtooth';
        osc.frequency.setValueAtTime(150, audioCtx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(100, audioCtx.currentTime + 0.3);
        gainNode.gain.setValueAtTime(0.5, audioCtx.currentTime);
        gainNode.gain.exponentialRampToValueAtTime(0.01, audioCtx.currentTime + 0.3);
        osc.start();
        osc.stop(audioCtx.currentTime + 0.3);
    }
}

/* ==========================================
   UTILITÁRIOS
========================================== */
function showScreen(screenId) {
    screens.forEach(s => s.classList.remove('active'));
    document.getElementById(screenId).classList.add('active');
}

function updateHUD() {
    scoreEl.innerText = state.score;
    currentPhaseEl.innerText = state.phase;
    
    // Atualizar corações de vida
    const hearts = livesContainer.querySelectorAll('.heart');
    hearts.forEach((heart, index) => {
        if (index < state.lives) {
            heart.classList.remove('lost');
        } else {
            heart.classList.add('lost');
        }
    });
}

function randomInt(min, max) {
    return Math.floor(Math.random() * (max - min + 1) + min);
}

function shuffle(array) {
    return array.sort(() => Math.random() - 0.5);
}

/* ==========================================
   LÓGICA DO JOGO E GERAÇÃO DE PERGUNTAS
========================================== */
function startGame() {
    state.score = 0;
    state.lives = 3;
    state.phase = 1;
    state.round = 0;
    state.isMemoryActive = false;
    updateHUD();
    showScreen('screen-game');
    loadPhase();
}

function loadPhase() {
    resetTimer();
    updateHUD();
    optionsContainer.innerHTML = '';
    questionVisual.innerHTML = '';
    questionVisual.className = 'visual-area';
    state.isMemoryActive = false;
    
    // Nível de Dificuldade de opções
    let numOptions = 2; // Fácil
    if (state.round === 1) numOptions = 3; // Médio
    if (state.round >= 2 || state.phase === 5) numOptions = 4; // Difícil

    if (state.phase === 1) {
        generateLetterPhase(numOptions);
    } else if (state.phase === 2) {
        generateNumberPhase(numOptions);
    } else if (state.phase === 3) {
        generateColorPhase(numOptions);
    } else if (state.phase === 4) {
        // Jogo da memória é a única fase com layout flex diferenciado
        generateMemoryPhase();
    } else if (state.phase === 5) {
        // Desafio Final mistura os 3 primeiros + Tempo
        startTimer(7); // 7 segundos para responder
        const randomType = randomInt(1, 3);
        if (randomType === 1) generateLetterPhase(numOptions);
        if (randomType === 2) generateNumberPhase(numOptions);
        if (randomType === 3) generateColorPhase(numOptions);
    }
}

/* GERAÇÃO: FASE 1 - LETRAS */
function generateLetterPhase(numOptions) {
    const item = dictionary[randomInt(0, dictionary.length - 1)];
    questionText.innerText = `Com qual letra começa a palavra ${item.word}?`;
    questionVisual.innerHTML = `<span class="emoji-big">${item.emoji}</span>`;
    
    let options = [item.letter];
    const alphabet = "ABCDEFGHIJKLMNOPQRSTUVWXYZ".split("");
    
    while(options.length < numOptions) {
        let randLetter = alphabet[randomInt(0, 25)];
        if (!options.includes(randLetter)) options.push(randLetter);
    }
    
    createOptions(shuffle(options), item.letter);
}

/* GERAÇÃO: FASE 2 - NÚMEROS */
function generateNumberPhase(numOptions) {
    const count = randomInt(1, 9);
    questionText.innerText = "Quantas estrelas existem?";
    
    let starsHtml = "";
    for(let i=0; i < count; i++) { starsHtml += "⭐"; }
    questionVisual.innerHTML = `<span style="font-size: 3rem; letter-spacing: 5px;">${starsHtml}</span>`;

    let options = [count];
    while(options.length < numOptions) {
        let randNum = randomInt(1, 10);
        if (!options.includes(randNum)) options.push(randNum);
    }
    
    createOptions(shuffle(options), count);
}

/* GERAÇÃO: FASE 3 - CORES */
function generateColorPhase(numOptions) {
    const item = colorsData[randomInt(0, colorsData.length - 1)];
    questionText.innerText = "Qual é esta cor?";
    questionVisual.innerHTML = `<div class="color-box" style="background-color: ${item.hex}"></div>`;

    let options = [item.name];
    while(options.length < numOptions) {
        let randColor = colorsData[randomInt(0, colorsData.length - 1)].name;
        if (!options.includes(randColor)) options.push(randColor);
    }
    
    createOptions(shuffle(options), item.name);
}

/* CONFIGURA BOTÕES E VALIDAÇÃO DAS FASES 1, 2, 3 E 5 */
function createOptions(options, correctValue) {
    optionsContainer.className = 'options-grid';
    optionsContainer.innerHTML = '';
    
    options.forEach(opt => {
        const btn = document.createElement('button');
        btn.className = 'btn-option';
        btn.innerText = opt;
        btn.onclick = () => checkAnswer(opt, correctValue, btn);
        optionsContainer.appendChild(btn);
    });
}

function checkAnswer(selected, correct, btnElement) {
    resetTimer(); // Para o tempo se houver
    
    // Desabilitar botões
    const buttons = optionsContainer.querySelectorAll('.btn-option');
    buttons.forEach(b => b.disabled = true);

    if (selected == correct) {
        playSound('correct');
        btnElement.classList.add('correct');
        state.score += 10;
        updateHUD();
        
        setTimeout(() => {
            progressGame();
        }, 1000);
    } else {
        playSound('wrong');
        btnElement.classList.add('wrong');
        loseLife();
        
        // Pinta a correta de verde para a criança aprender
        buttons.forEach(b => {
            if (b.innerText == correct) b.classList.add('correct');
        });
        
        setTimeout(() => {
            if (state.lives > 0) loadPhase();
        }, 1500);
    }
}

/* ==========================================
   FASE 4 - JOGO DA MEMÓRIA
========================================== */
function generateMemoryPhase() {
    state.isMemoryActive = true;
    questionText.innerText = "Encontre os pares iguais!";
    optionsContainer.innerHTML = ''; // Limpa botões, não usaremos aqui
    
    // Escolhe os N primeiros pares baseado na dificuldade (níveis)
    let amountOfPairs = 3; 
    let selectedEmojiPairs = memoryPairs.slice(0, amountOfPairs);
    let cards = [...selectedEmojiPairs, ...selectedEmojiPairs]; // duplica para formar os pares
    cards = shuffle(cards);
    
    questionVisual.innerHTML = '';
    const grid = document.createElement('div');
    grid.className = 'memory-grid';
    
    state.memoryCards = [];
    state.flippedCards = [];
    let matchesFound = 0;
    
    cards.forEach((emoji, index) => {
        const card = document.createElement('div');
        card.className = 'memory-card';
        card.dataset.emoji = emoji;
        card.dataset.index = index;
        card.innerHTML = `<span class="emoji">${emoji}</span>`;
        
        card.onclick = () => {
            if (card.classList.contains('flipped') || card.classList.contains('matched') || state.flippedCards.length >= 2) return;
            
            card.classList.add('flipped');
            state.flippedCards.push(card);
            
            if (state.flippedCards.length === 2) {
                // Checar par
                const [card1, card2] = state.flippedCards;
                if (card1.dataset.emoji === card2.dataset.emoji) {
                    // Acertou o par
                    playSound('correct');
                    card1.classList.add('matched');
                    card2.classList.add('matched');
                    state.score += 5;
                    updateHUD();
                    state.flippedCards = [];
                    matchesFound++;
                    
                    if (matchesFound === amountOfPairs) {
                        setTimeout(() => progressGame(), 1000);
                    }
                } else {
                    // Errou o par
                    playSound('wrong');
                    setTimeout(() => {
                        card1.classList.remove('flipped');
                        card2.classList.remove('flipped');
                        state.flippedCards = [];
                    }, 1000);
                }
            }
        };
        grid.appendChild(card);
    });
    
    questionVisual.appendChild(grid);
}

/* ==========================================
   PROGRESSÃO E VIDA
========================================== */
function progressGame() {
    state.round++;
    
    // Lógica para avançar de Fase
    if ((state.phase !== 4 && state.round >= state.maxRoundsPerPhase) || state.phase === 4) {
        state.phase++;
        state.round = 0;
    }
    
    if (state.phase > 5) {
        winGame();
    } else {
        loadPhase();
    }
}

function loseLife() {
    state.lives--;
    updateHUD();
    if (state.lives <= 0) {
        gameOver();
    }
}

function gameOver() {
    resetTimer();
    finalScoreGo.innerText = state.score;
    showScreen('screen-gameover');
}

function winGame() {
    resetTimer();
    finalScoreVic.innerText = state.score;
    showScreen('screen-victory');
}

/* ==========================================
   TEMPORIZADOR (FASE 5)
========================================== */
function startTimer(seconds) {
    state.timeLeft = seconds;
    timerContainer.classList.remove('hidden');
    timerBar.className = '';
    timerBar.style.width = '100%';
    
    state.timer = setInterval(() => {
        state.timeLeft -= 0.1;
        let percentage = (state.timeLeft / seconds) * 100;
        
        if (percentage < 30) timerBar.className = 'danger';
        else if (percentage < 60) timerBar.className = 'warning';
        
        timerBar.style.width = percentage + '%';
        
        if (state.timeLeft <= 0) {
            clearInterval(state.timer);
            playSound('wrong');
            loseLife();
            
            if(state.lives > 0) {
                // Se errou por tempo e tem vidas, revela a correta ou avança
                setTimeout(() => loadPhase(), 1000);
            }
        }
    }, 100); // Roda a cada 100ms para a barra ficar suave
}

function resetTimer() {
    clearInterval(state.timer);
    timerContainer.classList.add('hidden');
    timerBar.style.width = '100%';
}

/* ==========================================
   EVENTOS
========================================== */
btnStart.addEventListener('click', startGame);
btnRestartGo.addEventListener('click', startGame);
btnRestartVic.addEventListener('click', startGame);

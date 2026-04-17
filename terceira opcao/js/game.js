/* =========================================
   ESTADO DO JOGO / VARIÁVEIS GLOBAIS
   ========================================= */
const animals = [
    { id: 'porco', som: 'Oinc Oinc', respostaSom: 'Isso! O porco faz Oinc Oinc!', comida: 'maçã', respostaComida: 'Muito bem! O porco adora maçã!' },
    { id: 'pato', som: 'Quaque Quaque', respostaSom: 'Isso! O pato faz Quaque Quaque!', comida: 'pão', respostaComida: 'Muito bem! O pato adora pão!' },
    { id: 'vaca', som: 'Muuu Muuu', respostaSom: 'Isso! A vaca faz Muuu Muuu!', comida: 'feno', respostaComida: 'Muito bem! A vaca adora feno!' }
];

let level1Queue = [...animals];
let level2Queue = [...animals];
let currentTargetLvl1 = null;
let currentTargetLvl2 = null;

/* DOM Elements */
const screens = {
    start: document.getElementById('screen-start'),
    lvl1: document.getElementById('screen-level-1'),
    lvl2: document.getElementById('screen-level-2'),
    end: document.getElementById('screen-end')
};

const btnPlay = document.getElementById('btn-play');
const btnReplay = document.getElementById('btn-replay');
const feedbackLvl1 = document.getElementById('feedback-level-1');
const feedbackLvl2 = document.getElementById('feedback-level-2');

/* =========================================
   FUNÇÕES AUXILIARES - VOZ E EFEITOS
   ========================================= */
function speak(text, callback = null) {
    if ('speechSynthesis' in window) {
        window.speechSynthesis.cancel(); // Para falas anteriores
        const msg = new SpeechSynthesisUtterance(text);
        msg.lang = 'pt-BR';
        msg.rate = 1.0; // Velocidade infantil ideal
        msg.pitch = 1.2; // Tom um pouco mais agudo, fofo
        if (callback) {
            msg.onend = callback;
        }
        window.speechSynthesis.speak(msg);
    } else {
        console.warn("Navegador não suporta Speech Synthesis");
        if(callback) callback();
    }
}

function createConfetti() {
    const container = document.getElementById('confetti-container');
    container.innerHTML = '';
    const colors = ['#FF5A5A', '#FFD23F', '#7FD82A', '#6DE3FF', '#FF8AF3'];
    
    for (let i = 0; i < 50; i++) {
        const conf = document.createElement('div');
        conf.classList.add('confetti-piece');
        conf.style.left = Math.random() * 100 + 'vw';
        conf.style.backgroundColor = colors[Math.floor(Math.random() * colors.length)];
        conf.style.animationDuration = (Math.random() * 2 + 1) + 's';
        conf.style.animationDelay = (Math.random() * 0.5) + 's';
        container.appendChild(conf);
    }

    setTimeout(() => {
        container.innerHTML = '';
    }, 4000);
}

/* =========================================
   NAVEGAÇÃO DE TELAS
   ========================================= */
function switchScreen(activeScreen) {
    Object.values(screens).forEach(s => {
        s.classList.remove('active');
        s.classList.add('hidden');
    });
    activeScreen.classList.remove('hidden');
    activeScreen.classList.add('active');
}

btnPlay.addEventListener('click', () => {
    // Inicia a música/voz interativa
    startLevel1();
});

btnReplay.addEventListener('click', () => {
    level1Queue = [...animals];
    level2Queue = [...animals];
    
    // Reseta display do nível 2
    document.querySelectorAll('.food-item').forEach(el => {
        el.style.display = 'flex';
        el.style.transform = 'none';
        el.style.opacity = '1';
    });
    
    startLevel1();
});

/* =========================================
   NÍVEL 1: QUE SOM É ESSE?
   ========================================= */
function startLevel1() {
    switchScreen(screens.lvl1);
    document.querySelectorAll('#screen-level-1 .animal-card').forEach(card => {
        card.classList.remove('correct-highlight');
    });
    feedbackLvl1.textContent = "";
    nextTaskLvl1();
}

function nextTaskLvl1() {
    if (level1Queue.length === 0) {
        setTimeout(startLevel2, 1000);
        return;
    }
    
    currentTargetLvl1 = level1Queue.shift();
    
    setTimeout(() => {
        speak(`Que som o ${currentTargetLvl1.id} faz?`);
    }, 500);
}

// Configura Clicks do Level 1
document.querySelectorAll('#screen-level-1 .animal-card').forEach(card => {
    card.addEventListener('click', () => {
        if (!currentTargetLvl1) return;

        const choosenAnimalId = card.getAttribute('data-animal');
        
        if (choosenAnimalId === currentTargetLvl1.id) {
            // ACERTOU
            card.classList.add('correct-highlight');
            createConfetti();
            
            // Toca som onomatopeico seguido do feedback
            speak(`${currentTargetLvl1.som}... ${currentTargetLvl1.respostaSom}`, () => {
                card.classList.remove('correct-highlight');
                nextTaskLvl1();
            });
            
            currentTargetLvl1 = null; // Trava até terminar
        } else {
            // ERROU
            const wrongAnimal = animals.find(a => a.id === choosenAnimalId);
            speak(`Hum... esse é o ${choosenAnimalId}. Que som o ${currentTargetLvl1.id} faz?`);
            
            card.style.transform = "scale(0.9) rotate(-5deg)";
            setTimeout(() => card.style.transform = "none", 300);
        }
    });
});

/* =========================================
   NÍVEL 2: O QUE ELES COMEM?
   ========================================= */
function startLevel2() {
    switchScreen(screens.lvl2);
    feedbackLvl2.textContent = "";
    nextTaskLvl2();
}

function nextTaskLvl2() {
    if (level2Queue.length === 0) {
        setTimeout(startLevelEnd, 1000);
        return;
    }
    currentTargetLvl2 = level2Queue.shift();
    setTimeout(() => {
        speak(`O que o ${currentTargetLvl2.id === 'vaca' ? 'A vaca' : 'O ' + currentTargetLvl2.id} come?`);
    }, 500);
}

/* Mecânicas de Drag and Drop Padrão (Mouse) e Mobile (Touch) */
const draggables = document.querySelectorAll('.food-item');
const dropzones = document.querySelectorAll('.receiver');

let draggedElem = null;
let startX = 0, startY = 0;

draggables.forEach(elem => {
    // ---- EVENTOS MOUSE (Desktop) ----
    elem.addEventListener('dragstart', (e) => {
        if(!currentTargetLvl2) e.preventDefault(); // Tranca se não tiver animal alvo
        draggedElem = elem;
        e.dataTransfer.setData('text/plain', elem.getAttribute('data-food'));
        setTimeout(() => elem.classList.add('dragging'), 0);
    });

    elem.addEventListener('dragend', () => {
        elem.classList.remove('dragging');
        draggedElem = null;
        dropzones.forEach(z => z.classList.remove('drag-over'));
    });

    // ---- EVENTOS TOUCH (Mobile) ----
    elem.addEventListener('touchstart', (e) => {
        if(!currentTargetLvl2) return;
        draggedElem = elem;
        elem.classList.add('dragging');
        const touch = e.touches[0];
        startX = touch.clientX - elem.getBoundingClientRect().left;
        startY = touch.clientY - elem.getBoundingClientRect().top;
    }, {passive: false});

    elem.addEventListener('touchmove', (e) => {
        if(!draggedElem) return;
        e.preventDefault(); // previne scroll
        const touch = e.touches[0];
        draggedElem.style.position = 'absolute';
        draggedElem.style.zIndex = 1000;
        draggedElem.style.left = (touch.clientX - startX) + 'px';
        draggedElem.style.top = (touch.clientY - startY) + 'px';

        // Verifica colisões com dropzones
        dropzones.forEach(z => {
            const rect = z.getBoundingClientRect();
            if (touch.clientX > rect.left && touch.clientX < rect.right &&
                touch.clientY > rect.top && touch.clientY < rect.bottom) {
                z.classList.add('drag-over');
            } else {
                z.classList.remove('drag-over');
            }
        });
    }, {passive: false});

    elem.addEventListener('touchend', (e) => {
        if(!draggedElem) return;
        elem.classList.remove('dragging');
        
        const touch = e.changedTouches[0];
        let droppedOnValidZone = false;

        dropzones.forEach(z => {
            z.classList.remove('drag-over');
            const rect = z.getBoundingClientRect();
            if (touch.clientX > rect.left && touch.clientX < rect.right &&
                touch.clientY > rect.top && touch.clientY < rect.bottom) {
                
                droppedOnValidZone = true;
                handleDropLogic(elem.getAttribute('data-food'), z.getAttribute('data-accept'), elem);
            }
        });

        // Se soltou fora de uma zone ou não foi aceito, reseta posição
        if (!droppedOnValidZone && draggedElem.style.position === 'absolute') {
            resetDragPosition(draggedElem);
        }
        draggedElem = null;
    });
});

dropzones.forEach(zone => {
    zone.addEventListener('dragover', (e) => {
        e.preventDefault();
        zone.classList.add('drag-over');
    });

    zone.addEventListener('dragleave', () => {
        zone.classList.remove('drag-over');
    });

    zone.addEventListener('drop', (e) => {
        e.preventDefault();
        zone.classList.remove('drag-over');
        if (!draggedElem) return;
        
        const foodType = e.dataTransfer.getData('text/plain');
        const animalType = zone.getAttribute('data-accept');
        
        handleDropLogic(foodType, animalType, draggedElem);
    });
});


function handleDropLogic(foodType, animalType, foodElement) {
    // Verifica se a comida bate com o animal do DOM
    if (foodType === animalType) {
        
        // Verifica se é da tarefa atual
        if(currentTargetLvl2 && animalType === currentTargetLvl2.id) {
            
            // ACERTOU
            foodElement.style.display = 'none'; // Some com a comida
            createConfetti();
            
            speak(`Nhoc, nhoc! ${currentTargetLvl2.respostaComida}`, () => {
                currentTargetLvl2 = null;
                nextTaskLvl2();
            });

        } else {
            // Puxou para animal certo mas não é a vez dele
            speak(`Hum... o ${animalType} come isso, mas agora quero saber do ${currentTargetLvl2.id}.`);
            resetDragPosition(foodElement);
        }
    } else {
        // ERROU
        speak(`Hum... ${animalType === 'vaca' ? 'a vaca gosta' : 'o ' + animalType + ' gosta'} de outra comida. Tente de novo.`);
        resetDragPosition(foodElement);
    }
}

function resetDragPosition(elem) {
    elem.style.position = 'relative';
    elem.style.left = '0';
    elem.style.top = '0';
    elem.style.zIndex = '1';
}

/* =========================================
   TELA FINAL
   ========================================= */
function startLevelEnd() {
    switchScreen(screens.end);
    createConfetti();

    // Uma salva de palmas falada (sintetizada) e celebração
    speak("Parabéns! Você é incrível! Vamos contar juntos os três animais? Um! Dois! Três! Viva!");
}

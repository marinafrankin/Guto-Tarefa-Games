
let currentPhase = 0;

const screens = [
    "screen-start",
    "screen-phase-1",
    "screen-phase-2",
    "screen-phase-3",
    "screen-phase-4",
    "screen-end"
];

// respostas corretas
const answers = {
    1: "O",
    2: "3",
    3: "Triste",
    4: "Right"
};

// ===============================
// INICIAR JOGO
// ===============================
function startGame() {
    currentPhase = 1;
    showScreen("screen-phase-1");
    showHelp("Observe com calma...");
}

// ===============================
// MOSTRAR TELAS
// ===============================
function showScreen(id) {
    document.querySelectorAll(".screen").forEach(screen => {
        screen.classList.remove("active");
    });

    document.getElementById(id).classList.add("active");
}

// ===============================
// SISTEMA DE AJUDA
// ===============================
function showHelp(text) {
    const helpBox = document.getElementById("help-box");
    const helpText = document.getElementById("help-text");

    helpText.innerText = text;
    helpBox.classList.remove("hidden");

    setTimeout(() => {
        helpBox.classList.add("hidden");
    }, 2500);
}

// ===============================
// VERIFICAR RESPOSTA
// ===============================
function checkAnswer(phase, value) {

    const buttons = event.target;

    if (value === answers[phase]) {

        buttons.classList.add("correct-answer");

        showHelp("Muito bem! 🎉");

        setTimeout(() => {
            nextPhase();
        }, 1000);

    } else {

        buttons.classList.add("wrong-answer");

        showHelp("Quase lá... tente novamente 😊");

        setTimeout(() => {
            buttons.classList.remove("wrong-answer");
        }, 500);
    }
}

// ===============================
// PRÓXIMA FASE
// ===============================
function nextPhase() {

    currentPhase++;

    if (currentPhase === 2) {
        showScreen("screen-phase-2");
        showHelp("Conte devagar...");
    }

    else if (currentPhase === 3) {
        showScreen("screen-phase-3");
        showHelp("Observe o rostinho...");
    }

    else if (currentPhase === 4) {
        showScreen("screen-phase-4");
        showHelp("Para onde está o tesouro?");
    }

    else if (currentPhase === 5) {
        showScreen("screen-end");
    }
}

// ===============================
// REINICIAR JOGO
// ===============================
function resetGame() {
    currentPhase = 0;
    showScreen("screen-start");
}

// ===============================
// CARREGAR INICIAL
// ===============================
window.onload = () => {
    showScreen("screen-start");
};
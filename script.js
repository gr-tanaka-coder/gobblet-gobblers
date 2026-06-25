const PLAYERS = {
    blue: {
        name: "\u9752"
    },
    red: {
        name: "\u8d64"
    }
};

const SIZE_LABELS = {
    small: "\u5c0f",
    medium: "\u4e2d",
    large: "\u5927"
};

const SIZE_VALUE = {
    small: 1,
    medium: 2,
    large: 3
};

const WIN_LINES = [
    [0, 1, 2],
    [3, 4, 5],
    [6, 7, 8],
    [0, 3, 6],
    [1, 4, 7],
    [2, 5, 8],
    [0, 4, 8],
    [2, 4, 6]
];

let currentPlayer = "blue";
let gameOver = false;
let selectedPiece = null;

const board = Array.from({ length: 9 }, () => []);
let bluePieces = createReservePieces("blue", 0);
let redPieces = createReservePieces("red", 6);

const boardElement = document.querySelector("#board");
const blueArea = document.querySelector("#bluePieces");
const redArea = document.querySelector("#redPieces");
const cells = document.querySelectorAll(".cell");
const turnDisplay = document.querySelector("#turn");
const resetButton = document.querySelector("#resetButton");
const winnerMessage = document.querySelector("#winnerMessage");

function createReservePieces(player, startId) {
    return ["small", "small", "medium", "medium", "large", "large"].map((size, index) => ({
        player,
        size,
        id: startId + index
    }));
}

function pieceImagePath(piece) {
    return `images/${piece.player}_${piece.size}.png`;
}

function createPieceImage(piece, options = {}) {
    const image = document.createElement("img");
    image.className = `piece-image piece-${piece.size}`;
    image.src = pieceImagePath(piece);
    image.alt = `${PLAYERS[piece.player].name} ${SIZE_LABELS[piece.size]}`;
    image.draggable = false;

    if (options.selected) {
        image.classList.add("selectedPiece");
    }

    return image;
}

function drawBoard() {
    cells.forEach((cell, index) => {
        cell.innerHTML = "";
        cell.disabled = gameOver;

        const stack = board[index];
        if (stack.length === 0) {
            return;
        }

        const topPiece = stack[stack.length - 1];
        const isSelected = selectedPiece?.source === "board" && selectedPiece.index === index;
        cell.appendChild(createPieceImage(topPiece, { selected: isSelected }));
    });
}

function drawPieces() {
    drawReservePieces(blueArea, bluePieces);
    drawReservePieces(redArea, redPieces);
}

function drawReservePieces(area, pieces) {
    area.innerHTML = "";

    pieces.forEach((piece) => {
        const button = document.createElement("button");
        const isSelected = selectedPiece?.source === "reserve" && selectedPiece.id === piece.id;

        button.type = "button";
        button.className = piece.isUsed ? "piece-button piece-slot-empty" : "piece-button";
        button.ariaLabel = `${PLAYERS[piece.player].name}\u306e${SIZE_LABELS[piece.size]}\u306e\u99d2`;
        button.disabled = piece.isUsed || gameOver || currentPlayer !== piece.player;

        if (piece.isUsed) {
            button.ariaHidden = "true";
            button.tabIndex = -1;
        } else {
            button.appendChild(createPieceImage(piece, { selected: isSelected }));
        }

        button.addEventListener("click", () => {
            selectReservePiece(piece);
        });

        area.appendChild(button);
    });
}

function selectReservePiece(piece) {
    if (piece.isUsed || gameOver || currentPlayer !== piece.player) {
        return;
    }

    selectedPiece = {
        source: "reserve",
        player: piece.player,
        id: piece.id,
        size: piece.size
    };

    render();
}

function handleCellClick(index) {
    if (gameOver) {
        return;
    }

    if (selectedPiece === null) {
        selectBoardPiece(index);
        return;
    }

    if (!canPlaceOnCell(index)) {
        return;
    }

    moveSelectedPieceTo(index);
    finishTurn();
}

function selectBoardPiece(index) {
    const stack = board[index];

    if (stack.length === 0) {
        return;
    }

    const topPiece = stack[stack.length - 1];
    if (topPiece.player !== currentPlayer) {
        return;
    }

    selectedPiece = {
        source: "board",
        player: topPiece.player,
        index,
        id: topPiece.id,
        size: topPiece.size
    };

    render();
}

function canPlaceOnCell(index) {
    const stack = board[index];

    if (selectedPiece.source === "board" && selectedPiece.index === index) {
        selectedPiece = null;
        render();
        return false;
    }

    if (stack.length === 0) {
        return true;
    }

    const topPiece = stack[stack.length - 1];
    return SIZE_VALUE[selectedPiece.size] > SIZE_VALUE[topPiece.size];
}

function moveSelectedPieceTo(index) {
    if (selectedPiece.source === "board") {
        board[selectedPiece.index].pop();
    } else {
        removeReservePiece(selectedPiece.player, selectedPiece.id);
    }

    board[index].push({
        player: currentPlayer,
        size: selectedPiece.size,
        id: selectedPiece.id
    });

    selectedPiece = null;
}

function removeReservePiece(player, id) {
    const pieces = player === "blue" ? bluePieces : redPieces;
    const piece = pieces.find((reservePiece) => reservePiece.id === id);

    if (piece) {
        piece.isUsed = true;
    }
}

function finishTurn() {
    const winner = checkWinner();

    if (winner !== null) {
        const message = `${PLAYERS[winner].name}\u306e\u52dd\u3061\uff01`;
        gameOver = true;
        document.body.classList.add("is-disabled");
        boardElement.classList.add("is-won");
        boardElement.dataset.winner = message;
        turnDisplay.textContent = "";
        winnerMessage.textContent = message;
        render();
        return;
    }

    currentPlayer = currentPlayer === "blue" ? "red" : "blue";
    updateTurnDisplay();
    render();
}

function checkWinner() {
    for (const line of WIN_LINES) {
        const [a, b, c] = line;

        if (board[a].length === 0 || board[b].length === 0 || board[c].length === 0) {
            continue;
        }

        const playerA = board[a][board[a].length - 1].player;
        const playerB = board[b][board[b].length - 1].player;
        const playerC = board[c][board[c].length - 1].player;

        if (playerA === playerB && playerB === playerC) {
            return playerA;
        }
    }

    return null;
}

function updateTurnDisplay() {
    document.body.classList.toggle("current-blue", currentPlayer === "blue");
    document.body.classList.toggle("current-red", currentPlayer === "red");
    turnDisplay.textContent = `${PLAYERS[currentPlayer].name}\u306e\u756a\u3067\u3059`;
}

function render() {
    drawBoard();
    drawPieces();
}

function resetGame() {
    currentPlayer = "blue";
    gameOver = false;
    selectedPiece = null;
    bluePieces = createReservePieces("blue", 0);
    redPieces = createReservePieces("red", 6);
    board.forEach((stack) => {
        stack.length = 0;
    });

    document.body.classList.remove("is-disabled");
    document.body.classList.remove("current-red");
    document.body.classList.add("current-blue");
    boardElement.classList.remove("is-won");
    boardElement.removeAttribute("data-winner");
    winnerMessage.textContent = "";
    updateTurnDisplay();
    render();
}

cells.forEach((cell, index) => {
    cell.addEventListener("click", () => {
        handleCellClick(index);
    });
});

resetButton.addEventListener("click", resetGame);

resetGame();

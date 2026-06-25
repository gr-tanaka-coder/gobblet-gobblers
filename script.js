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
let winningLine = [];
let dragState = null;
let suppressNextClick = false;

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
const DRAG_THRESHOLD = 8;
const BOARD_PIECE_SIZE_RATIO = {
    small: 0.145,
    medium: 0.2,
    large: 0.255
};

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
        cell.classList.toggle("winning-cell", winningLine.includes(index));

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
            addDragStartListener(button, (event) => {
                startDragCandidate(event, {
                    source: "reserve",
                    player: piece.player,
                    id: piece.id,
                    size: piece.size
                });
            });
        }

        button.addEventListener("click", () => {
            if (consumeSuppressedClick()) {
                return;
            }

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
    if (consumeSuppressedClick()) {
        return;
    }

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

function startBoardDragCandidate(event, index) {
    const stack = board[index];

    if (stack.length === 0) {
        return;
    }

    const topPiece = stack[stack.length - 1];
    if (topPiece.player !== currentPlayer) {
        return;
    }

    startDragCandidate(event, {
        source: "board",
        player: topPiece.player,
        index,
        id: topPiece.id,
        size: topPiece.size
    });
}

function startDragCandidate(event, piece) {
    const point = getEventPoint(event);

    if (
        point === null ||
        gameOver ||
        piece.player !== currentPlayer ||
        event.button > 0 ||
        event.isPrimary === false
    ) {
        return;
    }

    dragState = {
        piece,
        pointerId: point.pointerId,
        startX: point.x,
        startY: point.y,
        ghost: null,
        isDragging: false
    };

}

function updateDrag(event) {
    const point = getEventPoint(event);

    if (dragState === null || point === null || point.pointerId !== dragState.pointerId) {
        return;
    }

    const distanceX = point.x - dragState.startX;
    const distanceY = point.y - dragState.startY;
    const distance = Math.hypot(distanceX, distanceY);

    if (!dragState.isDragging && distance < DRAG_THRESHOLD) {
        return;
    }

    if (!dragState.isDragging) {
        beginDrag(point);
    }

    moveDragGhost(point.x, point.y);
    event.preventDefault();
}

function beginDrag(point) {
    dragState.isDragging = true;
    suppressNextClick = true;
    selectedPiece = { ...dragState.piece };
    dragState.ghost = createDragGhost(dragState.piece);
    document.body.classList.add("is-dragging");
    document.body.appendChild(dragState.ghost);
    moveDragGhost(point.x, point.y);
}

function createDragGhost(piece) {
    const ghost = createPieceImage(piece);
    const boardSize = boardElement.getBoundingClientRect().width;
    const pieceSize = boardSize * BOARD_PIECE_SIZE_RATIO[piece.size];

    ghost.classList.add("drag-ghost");
    ghost.style.setProperty("--piece-size", `${pieceSize}px`);

    return ghost;
}

function moveDragGhost(x, y) {
    if (dragState?.ghost === null) {
        return;
    }

    dragState.ghost.style.left = `${x}px`;
    dragState.ghost.style.top = `${y}px`;
}

function finishDrag(event) {
    const point = getEventPoint(event);

    if (dragState === null || point === null || point.pointerId !== dragState.pointerId) {
        return;
    }

    const wasDragging = dragState.isDragging;

    if (wasDragging) {
        const cell = findDropCell(point.x, point.y);

        if (cell !== null && canPlaceOnCell(Number(cell.dataset.index))) {
            moveSelectedPieceTo(Number(cell.dataset.index));
            finishTurn();
        } else {
            selectedPiece = null;
            render();
        }
    }

    cleanupDrag();

    if (wasDragging) {
        setTimeout(() => {
            suppressNextClick = false;
        }, 0);
    }
}

function cancelDrag(event) {
    const point = getEventPoint(event);

    if (dragState === null || (point !== null && point.pointerId !== dragState.pointerId)) {
        return;
    }

    selectedPiece = null;
    cleanupDrag();
    render();
}

function cleanupDrag() {
    dragState?.ghost?.remove();
    dragState = null;
    document.body.classList.remove("is-dragging");
}

function findDropCell(x, y) {
    const element = document.elementFromPoint(x, y);
    return element?.closest?.(".cell") ?? null;
}

function consumeSuppressedClick() {
    if (!suppressNextClick) {
        return false;
    }

    suppressNextClick = false;
    return true;
}

function getEventPoint(event) {
    if (event.changedTouches?.length > 0) {
        const touch = Array.from(event.changedTouches).find(
            (item) => dragState === null || item.identifier === dragState.pointerId
        ) ?? event.changedTouches[0];

        return {
            x: touch.clientX,
            y: touch.clientY,
            pointerId: touch.identifier
        };
    }

    if (event.touches?.length > 0) {
        const touch = Array.from(event.touches).find(
            (item) => dragState === null || item.identifier === dragState.pointerId
        ) ?? event.touches[0];

        return {
            x: touch.clientX,
            y: touch.clientY,
            pointerId: touch.identifier
        };
    }

    if (event.clientX === undefined || event.clientY === undefined) {
        return null;
    }

    return {
        x: event.clientX,
        y: event.clientY,
        pointerId: event.pointerId ?? "mouse"
    };
}

function addDragStartListener(element, handler) {
    element.addEventListener("mousedown", handler);
    element.addEventListener("touchstart", handler, { passive: false });
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
    const result = checkWinner();

    if (result !== null) {
        const message = `${PLAYERS[result.player].name}\u306e\u52dd\u3061\uff01`;
        gameOver = true;
        winningLine = result.line;
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
            return {
                player: playerA,
                line
            };
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
    winningLine = [];
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
    addDragStartListener(cell, (event) => {
        startBoardDragCandidate(event, index);
    });

    cell.addEventListener("click", () => {
        handleCellClick(index);
    });
});

window.addEventListener("mousemove", updateDrag, { passive: false });
window.addEventListener("mouseup", finishDrag);
window.addEventListener("touchmove", updateDrag, { passive: false });
window.addEventListener("touchend", finishDrag);
window.addEventListener("touchcancel", cancelDrag);

resetButton.addEventListener("click", resetGame);

resetGame();

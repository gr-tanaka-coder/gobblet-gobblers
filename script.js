let currentPlayer = "○";
let gameOver = false;

const board = [
    [], [], [],
    [], [], [],
    [], [], []
];

let player1Pieces = [
    {size:"小",id:0},
    {size:"小",id:1},
    {size:"中",id:2},
    {size:"中",id:3},
    {size:"大",id:4},
    {size:"大",id:5}
];

let player2Pieces = [
    {size:"小",id:6},
    {size:"小",id:7},
    {size:"中",id:8},
    {size:"中",id:9},
    {size:"大",id:10},
    {size:"大",id:11}
];

const sizeValue = {
    "小": 1,
    "中": 2,
    "大": 3
};

let selectedPiece = null;

const player1Area = document.querySelector("#player1Pieces");
const player2Area = document.querySelector("#player2Pieces");
const cells = document.querySelectorAll(".cell");
const turnDisplay = document.querySelector("#turn");
const resetButton = document.querySelector("#resetButton");


// ---------- 盤面表示 ----------
function drawBoard(){

    cells.forEach((cell,index)=>{

        if(board[index].length === 0){
            cell.textContent = "";
        }
        else{
            cell.innerHTML = "";
            const topPiece = board[index][board[index].length - 1];
            cell.innerHTML = "";
            const pieceDiv = document.createElement("div");
            const eyes = document.createElement("div");
            eyes.classList.add("eyes");

            pieceDiv.appendChild(eyes);

pieceDiv.classList.add("boardPiece");
pieceDiv.classList.add(topPiece.player === "○" ? "player1" : "player2");

const antenna = document.createElement("div");
antenna.classList.add("antenna");

pieceDiv.appendChild(antenna);

if(
    selectedPiece !== null &&
    selectedPiece.source === "board" &&
    selectedPiece.index === index
){
    pieceDiv.classList.add("selectedPiece");
}

if(topPiece.size === "小"){
    pieceDiv.classList.add("small");
}
else if(topPiece.size === "中"){
    pieceDiv.classList.add("medium");
}
else{
    pieceDiv.classList.add("large");
}

pieceDiv.textContent = "";

cell.appendChild(pieceDiv);
        }


    });

}


function drawPieces(){

    player1Area.innerHTML = "";
    player2Area.innerHTML = "";

    // ---------- ○側 ----------
    player1Pieces.forEach(piece=>{

        const div = document.createElement("div");

        div.classList.add("piece");

if(piece.size === "小"){
    div.classList.add("small");
}
else if(piece.size === "中"){
    div.classList.add("medium");
}
else{
    div.classList.add("large");
}

div.textContent = piece.size;

        if(
    selectedPiece !== null &&
    selectedPiece.source === "reserve" &&
    selectedPiece.id === piece.id
){
    div.classList.add("selectedPiece");
}

        div.addEventListener("click",function(){

            if(gameOver){
                return;
            }

            if(currentPlayer !== "○"){
                return;
            }

            selectedPiece = {
    source: "reserve",
    id: piece.id,
    size: piece.size
};

            drawPieces();
            drawBoard();

        });

        player1Area.appendChild(div);

    });


    // ---------- ×側 ----------
    player2Pieces.forEach(piece=>{

        const div = document.createElement("div");

        div.classList.add("piece");

if(piece.size === "小"){
    div.classList.add("small");
}
else if(piece.size === "中"){
    div.classList.add("medium");
}
else{
    div.classList.add("large");
}

div.textContent = piece.size;

        if(
    selectedPiece !== null &&
    selectedPiece.source === "reserve" &&
    selectedPiece.id === piece.id
){
    div.classList.add("selectedPiece");
}

        div.addEventListener("click",function(){

            if(gameOver){
                return;
            }

            if(currentPlayer !== "×"){
                return;
            }

            selectedPiece = {
    source: "reserve",
    id: piece.id,
    size: piece.size
};

            drawPieces();
            drawBoard();

        });

        player2Area.appendChild(div);

    });

}
// ---------- マスをクリックした時 ----------
function handleCellClick(index){

    if(gameOver){
        return;
    }

    // 駒を持っていない → 自分の駒を持ち上げる
    if(selectedPiece === null){

        if(board[index].length === 0){
            return;
        }

        const topPiece = board[index][board[index].length - 1];

        if(topPiece.player !== currentPlayer){
            return;
        }

        selectedPiece = {
            source:"board",
            index:index,
            id:topPiece.id,
            size:topPiece.size
        };

        drawBoard();
        drawPieces();

        return;
    }

    // 置き先の一番上の駒を確認
    if(board[index].length > 0){

        const topPiece = board[index][board[index].length - 1];

        // 同じ大きさ以下には置けない
        if(sizeValue[selectedPiece.size] <= sizeValue[topPiece.size]){
            return;
        }

    }

    // 盤面から持ち上げた駒なら元の場所から取り除く
    if(selectedPiece.source === "board"){

        board[selectedPiece.index].pop();

    }

    // 新しい場所に置く
    board[index].push({
    player: currentPlayer,
    size: selectedPiece.size,
    id: selectedPiece.id
});

    // 駒置き場から出した場合
    if(selectedPiece.source === "reserve"){

        if(currentPlayer === "○"){

            const i = player1Pieces.findIndex(
    piece => piece.id === selectedPiece.id
);
player1Pieces.splice(i,1);

            currentPlayer = "×";

        }
        else{

            const i = player2Pieces.findIndex(
    piece => piece.id === selectedPiece.id
);
player2Pieces.splice(i,1);

            currentPlayer = "○";

        }

    }
    else{

        // 盤面の駒を移動した場合
        if(currentPlayer === "○"){
            currentPlayer = "×";
        }
        else{
            currentPlayer = "○";
        }

    }

 selectedPiece = null;

drawBoard();
drawPieces();

const winner = checkWinner();

if(winner !== null){

    gameOver = true;

    turnDisplay.textContent = "";

const winnerMessage = document.querySelector("#winnerMessage");

winnerMessage.textContent = "🏆 " + winner + " の勝ち！ 🏆";

winnerMessage.style.display = "block";

}
else{

    turnDisplay.textContent = "現在の手番：" + currentPlayer;

}

}

function checkWinner(){

    const lines = [
        [0,1,2],
        [3,4,5],
        [6,7,8],
        [0,3,6],
        [1,4,7],
        [2,5,8],
        [0,4,8],
        [2,4,6]
    ];

    for(const line of lines){

        const [a,b,c] = line;

        if(
            board[a].length > 0 &&
            board[b].length > 0 &&
            board[c].length > 0
        ){

            const playerA = board[a][board[a].length-1].player;
            const playerB = board[b][board[b].length-1].player;
            const playerC = board[c][board[c].length-1].player;

            if(
                playerA === playerB &&
                playerB === playerC
            ){
                return playerA;
            }

        }

    }

    return null;

}

// ---------- 盤面クリックイベント ----------
cells.forEach((cell,index)=>{

    cell.addEventListener("click",function(){

        handleCellClick(index);

    });

});


// ---------- 初期表示 ----------
drawBoard();
drawPieces();

resetButton.addEventListener("click",function(){

    currentPlayer = "○";
    gameOver = false;
    selectedPiece = null;

    board.forEach(cell => cell.length = 0);

    player1Pieces = [
    {size:"小",id:0},
    {size:"小",id:1},
    {size:"中",id:2},
    {size:"中",id:3},
    {size:"大",id:4},
    {size:"大",id:5}
];

player2Pieces = [
    {size:"小",id:6},
    {size:"小",id:7},
    {size:"中",id:8},
    {size:"中",id:9},
    {size:"大",id:10},
    {size:"大",id:11}
];

    turnDisplay.textContent = "現在の手番：○";

    drawBoard();
    drawPieces();

winnerMessage.style.display = "none";

});
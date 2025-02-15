const boardWidth = 8;
const boardHeight = 16;
const minLineLength = 3;
const colors = ["red", "green", "blue", "orange", "purple"];
const levelModifier = 2;
const difficultyModifier = 0.5;
const appStates = {Init: "Init", Playing: "Playing", Paused: "Paused", Over: "Over"};
let appState;
const gameStates = {Player: "Player", RemoveLines: "RemoveLines", NextShape: "NextShape", FreeFall: "FreeFall", CheckLevel: "CheckLevel"};
let game;
const frameTime = 1000 / 60;
const gameBoardElem = document.getElementById("game-board");
const previewElem = document.getElementById("preview");
const levelElem = document.getElementById("level");
const scoreElem = document.getElementById("score");
const messageElem = document.getElementById("message");
const shapes = [[[1], [1]]]; // Example shape
let lastTime = Date.now();
const speed = 1000;

class Position {
    x = 0;
    y = 0;

    constructor(x, y){
        if (x){
            this.x = x;
        }
        if (y)
        {
            this.y = y;
        }
    }
}

class Tile {
    color = 0;
    immobile = false;
    constructor(color, immobile) {
        this.color = color; // int
        this.immobile = immobile; // bool
    }
}

class Game {
    board = null;
    preview = null;
    shape = null;
    shapePosition = null;
    nextShape = null;
    level = 1;
    score = 0;
    difficulty = null;
    state = null;

    constructor(){
    }

    init() {
        this.initLevel();
    }

    initLevel() {
        this.prepareBoard();
        this.prepareNextShape();
        /*if (!this.tryPlaceNextShape())
        {
            throw new Error("Can't place new shape at the start of level");
        }*/
        this.state = gameStates.NextShape;
    }

    prepareBoard() {
        this.board = this.createBoard();
    }

    prepareNextShape() {
        this.nextShape = this.getRandomShape();
        this.preview = createGameBoard(2, 3);
        placeShapeOnBoard(this.preview, this.nextShape, { x: 1, y: 0 })
    }

    tryPlaceNextShape() {
        const nextShapePosition = this.getNewShapePosition(this.nextShape);
        if (this.checkCollision(this.nextShape, nextShapePosition)){
            return false;
        }
        this.shape = this.nextShape;
        this.shapePosition = nextShapePosition;
        this.prepareNextShape();
        this.placeShapeOnBoard();
        return true;
    }

    getNewShapePosition(shape) {
        return getNewShapePosition(this.board, shape);
    }

    checkCollision(shape, position){
        return checkCollision(this.board, shape, position);
    }

    tryMoveShape(dx, dy) {
        this.removeShapeFromBoard();
        const newPosition = new Position(this.shapePosition.x + dx, this.shapePosition.y + dy);
        const collision = this.checkCollision(this.shape, newPosition);
        if (!collision)
        {
            this.shapePosition = newPosition;
        }
        this.placeShapeOnBoard();
        return !collision;
    }

    tryRotateShape(){
        this.removeShapeFromBoard();
        const newShape = rotateShape(this.shape);
        const collision = this.checkCollision(newShape, this.shapePosition);
        //console.log(newShape, this.position, collision);
        if (!collision) {
            this.shape = newShape;
        }
        this.placeShapeOnBoard();
        return !collision;
    }

    placeShapeOnBoard() {
        placeShapeOnBoard(this.board, this.shape, this.shapePosition);
    }

    removeShapeFromBoard() {
        removeShapeFromBoard(this.board, this.shape, this.shapePosition);
    }

    removeLines() {
        return removeLines(this.board);
    }

    freeFall() {
        return freeFall(this.board);
    }

    isLevelCleared() {
        return isLevelCleared(this.board);
    }

    createBoard() {
        return createBoardWithRandomTiles(this.level, this.difficulty);
    }

    getRandomShape() {
        return getRandomShape(this.difficulty);
    }

    levelUp() {
        this.level++;
        this.initLevel();
    }

    setState(newState) {
        console.log("GameState: " + newState);
        this.state = newState;
    }

    addPoints(points) {
        this.score += points;
    }

    static createNewGame(difficulty) {
        const game = new Game();
        game.difficulty = difficulty;
        game.init();
        return game;
    }
}

function getNewShapePosition(board, shape) {
    const position = new Position();
    position.x = Math.floor(board[0].length / 2 - shape[0].length / 2);
    position.y = -1 * (shape.length - 1);
    return position;
}

function createGameBoard(rows, cols) {
    const board = [];
    for (let i = 0; i < rows; i++) {
        board.push(new Array(cols).fill(null));
    }
    return board;
}

function createBoardWithRandomTiles(level, difficulty) {
    const n = level + levelModifier;
    const board = createGameBoard(boardHeight, boardWidth);
    const startY = Math.ceil(boardHeight * (1 - difficultyModifier));
    const positions = [];
    for (let y = startY; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            positions.push({x, y});
        }
    }

    if (positions.length < n) {
        throw new Error("Not enough positions to place all tiles");
    }

    for (let i = 0; i < n; i++) {
        const randomIndex = Math.floor(Math.random() * positions.length);
        const {x, y} = positions.splice(randomIndex, 1)[0];
        board[y][x] = createRandomTile(difficulty, true);
    }

    return board;
}

function createRandomTile(difficulty, immobile) {
    const color = Math.floor(Math.random() * difficulty);
    return new Tile(color, immobile);
}

function removeLines(board) {
    const mask = createGameBoard(board.length, board[0].length);

    // Check horizontal lines
    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col <= board[row].length - minLineLength; col++) {
            const tile = board[row][col];
            if (!tile){
                continue;
            } 
            let count = 1;
            for(let col1 = col + 1; col1 < board[row].length; col1++) {
                if (tile.color !== board[row][col1]?.color) {
                    break;
                }
                count++;
            }
            if (count < minLineLength){
                continue;
            }
            mask[row][col] = true;
            for(let col1 = col; col1 < col + count; col1++) {
                mask[row][col1] = true;
            }
        }
    }

    // Check vertical lines
    for (let col = 0; col < board[0].length; col++) {
        for (let row = 0; row <= board.length - minLineLength; row++) {
            const tile = board[row][col];
            if (!tile){
                continue;
            } 
            let count = 1;
            for(let row1 = row + 1; row1 < board.length; row1++) {
                if (tile.color !== board[row1][col]?.color) {
                    break;
                }
                count++;
            }
            if (count < minLineLength){
                continue;
            }
            for(let row1 = row; row1 < row + count; row1++) {
                mask[row1][col] = true;
            }
        }
    }
    //let totalCount = 0;
    let removedTiles = [];

    for (let row = 0; row < board.length; row++) {
        for (let col = 0; col < board[row].length; col++) {
            if (!mask[row][col]){
                continue;
            }
            const tile = board[row][col];
            board[row][col] = null;
            //totalCount++;
            removedTiles.push(tile);
        }
    }

    return removedTiles;
}

function freeFall(board) {
    let count = 0;
    for (let col = 0; col < board[0].length; col++) {
        for (let row = board.length - 1; row > 1; row--) {
            const tile = board[row - 1][col];
            if (!tile || tile.immobile){
                continue;
            } 
            if (board[row][col]) {
                continue;
            }
            board[row - 1][col] = null;
            board[row][col] = tile;
            count++;
        }
    }
    return count;
}

function isLevelCleared(board) {
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const tile = board[y][x];
            if (!tile) {
                continue;
            }
            if (tile.immobile) {
                return false;
            }
        }
    }
    return true;
}

function renderGameBoard(board, elem) {
    // TODO: Inefficient render routine. Whole board gets wiped and recreated.
    elem.innerHTML = '';
    for (let y = 0; y < board.length; y++) {
        for (let x = 0; x < board[y].length; x++) {
            const tile = board[y][x];
            const tileElem = createTileElement(tile);
            elem.appendChild(tileElem);
        }
    }
}

function getRandomShape(difficulty) {
    const shapeIndex = Math.floor(Math.random() * shapes.length);
    const shape = shapes[shapeIndex];
    const board = createGameBoard(shape.length, shape[0].length);
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            if (shape[i][j]) {
                const color = Math.floor(Math.random() * difficulty);
                board[i][j] = new Tile(color, false);
            }
        }
    }

    return board;
}

function rotateShape(shape) {
    const newShape = [];
    for (let col = 0; col < shape[0].length; col++) {
      newShape[col] = [];
      for (let row = shape.length - 1; row >= 0; row--) {
        newShape[col][shape.length - row - 1] = shape[row][col];
      }
    }
    return newShape;
  }

function placeShapeOnBoard(board, shape, position) {
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            const tile = shape[i][j];
            if (!tile) {
                continue;
            }
            const nx = position.x + j;
            const ny = position.y + i;
            if (nx >= 0 && nx < boardWidth && ny >= 0 && ny < boardHeight) {
                board[ny][nx] = tile;
            }
        }
    }
}

function removeShapeFromBoard(board, shape, position) {
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            const tile = shape[i][j];
            if (!tile) {
                continue;
            }
            const nx = position.x + j;
            const ny = position.y + i;
            if (nx >= 0 && nx < boardWidth && ny >= 0 && ny < boardHeight) {
                board[ny][nx] = null;
            }
        }
    }
}

function checkCollision(board, shape, position) {
    for (let i = 0; i < shape.length; i++) {
        for (let j = 0; j < shape[i].length; j++) {
            const tile = shape[i][j];
            if (!tile) {
                continue;
            }
            const nx = position.x + j;
            const ny = position.y + i;
            if (ny < 0) {
                continue;
            }
            if (nx >= 0 && nx < boardWidth && ny >= 0 && ny < boardHeight) {
                if (board[ny][nx]) {
                    return true; // Collision detected
                }
            } else {
                return true; // Out of bounds collision
            }
        }
    }
    return false; // No collision detected
}

function createTileElement(tile){
    const cellElem = document.createElement('div');
    cellElem.classList.add("cell");
    if (tile) {
        const tileElem = document.createElement('div');
        tileElem.classList.add("tile");
        if (tile.immobile)
        {
            tileElem.classList.add("immobile");
        }
        tileElem.style.backgroundColor = colors[tile.color];
        cellElem.appendChild(tileElem);
    }
    return cellElem;
}

function getPoints(removedTiles) {
    let points = 0;
    if (removedTiles.length == minLineLength) {
        points = 3;
    }
    else
    {
        points = 5 * (removedTiles.length - minLineLength)
    }
    for (let tile of removedTiles) {
        if (!tile.immobile) {
            continue;
        }
        points *= 10;
    }
    return points;
}

function gameLoop() {
    if (appState != appStates.Playing){
        return;
    }
    if (!game){
        //return;
        throw new Error("Game has no obj");
    }
    let tempSpeed = speed;
    if (game.state !== gameStates.Player) {
        tempSpeed = tempSpeed / 8;
    }
    const now = Date.now()
    if (now - lastTime >= tempSpeed) {
        lastTime = now;
        switch (game.state) {
            case gameStates.Player:
                if (!game.tryMoveShape(0, 1))
                {
                    game.setState(gameStates.FreeFall);
                }
                break;
            case gameStates.NextShape:
                if (game.tryPlaceNextShape()) {
                    game.setState(gameStates.Player);
                }
                else {
                    setAppState(states.Over);
                }
                break;
            case gameStates.RemoveLines:
                const removedTiles = game.removeLines();
                console.log(removedTiles);
                if (removedTiles.length > 0) {
                    const points = getPoints(removedTiles);
                    game.addPoints(points);
                    game.setState(gameStates.FreeFall);
                } else {
                    game.setState(gameStates.CheckLevel);
                }
                break;
            case gameStates.CheckLevel:
                if (game.isLevelCleared()){
                    game.addPoints(1000);
                    game.levelUp();
                    //showMessage("Level Up");
                }
                else
                {
                    game.setState(gameStates.NextShape);
                }
                break;
            case gameStates.FreeFall:
                const tilesMoved = game.freeFall();
                if (tilesMoved == 0) {
                    game.setState(gameStates.RemoveLines);
                }
                break;
        }
    }
    renderGame(game);
}

function setAppState(newState) {
    console.log("AppState: " + newState);
    appState = newState;
    switch (newState) {
        case appStates.Init:
            showMessage("Press ENTER");
            break;
        case appStates.Over:
            showMessage("Game Over");
            break;
        case appStates.Paused:
            showMessage("Paused");
            break;
        default:
            hideMessage();
            break;
    }
}

function renderGame(game){
    renderGameBoard(game.board, gameBoardElem);
    // TODO: Can be improved by rendering preview only when next shape/level/score changes
    renderGameBoard(game.preview, previewElem);
    levelElem.innerHTML = game.level;
    scoreElem.innerHTML = game.score;
}

function showMessage(message){
    messageElem.innerHTML = message;
}

function hideMessage() {
    messageElem.innerHTML = "";
}

document.addEventListener('keydown', (e) => {
    //console.log(e.key)
    const canControl = game?.state == gameStates.Player && appState == appStates.Playing;
    switch (e.key) {
      case 'a':
        if (canControl) {
            game.tryMoveShape(-1, 0);
        }
        break;
      case 'd':
        if (canControl) {
            game.tryMoveShape(1, 0);
        }
        break;
      case 's':
        if (canControl) {
            if (game.tryMoveShape(0, 1))
            {
                //game.addPoints(1);
            }
        }
        break;
      case 'w':
        if (canControl) {
            game.tryRotateShape();
        }
        break;
      case 'Enter':
        if (appState == appStates.Over || appState == appStates.Init){
          startNewGame();
        } else if (appState == appStates.Playing) {
          setAppState(appStates.Paused);
        } else if (appState == appStates.Paused) {
          setAppState(appStates.Playing);
        }
    }
  });

function startNewGame() {
    console.log("start");
    game = Game.createNewGame(3);
    setAppState(appStates.Playing);
}

// Initialize game and start game loop
setAppState(appStates.Init);
game = Game.createNewGame(3);
renderGame(game);
setInterval(gameLoop, frameTime / 2); // Run gameLoop every second (1000 milliseconds)


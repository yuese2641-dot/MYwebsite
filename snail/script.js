// ===== 1. 关卡：每个关卡是一个"文字地图"，用一个数组存每一行 =====
// #墙  空格=空地  .目标点  $箱子  @蜗牛
const LEVELS = [
    ["######",
     "#@ $.#",
     "######"],

    ["#######",
     "#     #",
     "# $.  #",
     "#  @  #",
     "#######"],

    ["########",
     "#  .   #",
     "#  $   #",
     "# .$ @ #",
     "########"],

    ["#######",
     "#  .  #",
     "# $$ .#",
     "#  @  #",
     "#######"],

    ["#########",
     "#   #   #",
     "# $   $ #",
     "#   @   #",
     "# . # . #",
     "#   #   #",
     "#########"]
];

// ===== 2. 找到页面元素 =====
const board = document.getElementById("board");
const levelsBar = document.getElementById("levels");
const stepsText = document.getElementById("steps");
const undoBtn = document.getElementById("undoBtn");
const resetBtn = document.getElementById("resetBtn");
const win = document.getElementById("win");
const winText = document.getElementById("winText");
const nextBtn = document.getElementById("nextBtn");

// ===== 3. 游戏数据 =====
let levelIndex = 0;
let walls, targets;    // 不会变的：墙、目标点（用 "行,列" 当作名字存起来）
let boxes, player;     // 会变的：箱子们、蜗牛的位置
let steps, history, won;
let rows, cols;

// 已通关到第几关（存在浏览器里，下次打开接着玩）
let unlocked = Number(localStorage.getItem("snailUnlocked")) || 0;
if (unlocked >= LEVELS.length) { unlocked = LEVELS.length - 1; }

function key(r, c) { return r + "," + c; }

// ===== 4. 载入一个关卡：把文字地图读成数据 =====
function loadLevel(i) {
    levelIndex = i;
    const map = LEVELS[i];
    rows = map.length;
    cols = map[0].length;
    walls = new Set();
    targets = new Set();
    boxes = [];
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const ch = map[r][c];
            if (ch === "#") { walls.add(key(r, c)); }
            if (ch === ".") { targets.add(key(r, c)); }
            if (ch === "$") { boxes.push({ r: r, c: c }); }
            if (ch === "@") { player = { r: r, c: c }; }
        }
    }
    steps = 0;
    history = [];
    won = false;
    win.hidden = true;
    render();
}

function boxAt(r, c) {
    return boxes.find(function (b) { return b.r === r && b.c === c; });
}

// ===== 5. 显示：根据数据，把整个棋盘重新画一遍 =====
function render() {
    // 按屏幕宽度算格子大小，保证手机上也放得下
    const size = Math.min(56, Math.floor((window.innerWidth - 90) / cols));
    document.documentElement.style.setProperty("--size", size + "px");
    board.style.gridTemplateColumns = "repeat(" + cols + ", var(--size))";

    board.innerHTML = "";
    for (let r = 0; r < rows; r++) {
        for (let c = 0; c < cols; c++) {
            const cell = document.createElement("div");
            cell.className = "cell";
            if (walls.has(key(r, c))) {
                cell.classList.add("wall");
            } else {
                cell.classList.add("floor");
                if (targets.has(key(r, c))) { cell.classList.add("target"); }
                if (boxAt(r, c)) {
                    cell.classList.add("box");
                    if (targets.has(key(r, c))) { cell.classList.add("on"); }
                }
                if (player.r === r && player.c === c) {
                    const snail = document.createElement("span");
                    snail.className = "snail";
                    snail.textContent = "🐌";
                    cell.append(snail);
                }
            }
            board.append(cell);
        }
    }

    stepsText.textContent = "步数 " + steps;
    undoBtn.disabled = history.length === 0 || won;

    levelsBar.innerHTML = "";
    LEVELS.forEach(function (_, i) {
        const b = document.createElement("button");
        b.textContent = i + 1;
        b.disabled = i > unlocked;
        if (i === levelIndex) { b.classList.add("active"); }
        b.addEventListener("click", function () { loadLevel(i); });
        levelsBar.append(b);
    });
}

// ===== 6. 移动：游戏的核心规则 =====
function move(dr, dc) {
    if (won) { return; }
    const nr = player.r + dr;
    const nc = player.c + dc;

    if (walls.has(key(nr, nc))) { return; }       // 前面是墙：不动

    const box = boxAt(nr, nc);
    if (box) {
        const br = nr + dr;                         // 箱子后面那一格
        const bc = nc + dc;
        if (walls.has(key(br, bc)) || boxAt(br, bc)) { return; }   // 后面是墙或另一个箱子：推不动
        // 能推：先存档（给"撤销"用），再移动
        history.push(JSON.stringify({ player: player, boxes: boxes, steps: steps }));
        box.r = br;
        box.c = bc;
    } else {
        history.push(JSON.stringify({ player: player, boxes: boxes, steps: steps }));
    }

    player = { r: nr, c: nc };
    steps++;
    checkWin();
    render();
}

// 所有目标点上都有箱子，就赢了
function checkWin() {
    const allDone = boxes.every(function (b) { return targets.has(key(b.r, b.c)); });
    if (!allDone) { return; }
    won = true;
    winText.textContent = "一共用了 " + steps + " 步";
    const isLast = levelIndex === LEVELS.length - 1;
    nextBtn.textContent = isLast ? "从头再来" : "下一关";
    if (!isLast && unlocked < levelIndex + 1) {
        unlocked = levelIndex + 1;
        localStorage.setItem("snailUnlocked", unlocked);
    }
    win.hidden = false;
}

function undo() {
    if (won || history.length === 0) { return; }
    const last = JSON.parse(history.pop());
    player = last.player;
    boxes = last.boxes;
    steps = last.steps;
    render();
}

// ===== 7. 控制：键盘、按钮 =====
document.addEventListener("keydown", function (e) {
    const dirs = {
        ArrowUp: [-1, 0], w: [-1, 0], W: [-1, 0],
        ArrowDown: [1, 0], s: [1, 0], S: [1, 0],
        ArrowLeft: [0, -1], a: [0, -1], A: [0, -1],
        ArrowRight: [0, 1], d: [0, 1], D: [0, 1]
    };
    const d = dirs[e.key];
    if (d) {
        e.preventDefault();   // 防止方向键让页面上下滚动
        move(d[0], d[1]);
    } else if (e.key === "z" || e.key === "Z") {
        undo();
    }
});

document.querySelectorAll(".pad button").forEach(function (b) {
    const d = { up: [-1, 0], down: [1, 0], left: [0, -1], right: [0, 1] }[b.dataset.d];
    b.addEventListener("click", function () { move(d[0], d[1]); });
});

undoBtn.addEventListener("click", undo);
resetBtn.addEventListener("click", function () { loadLevel(levelIndex); });
nextBtn.addEventListener("click", function () {
    loadLevel(levelIndex === LEVELS.length - 1 ? 0 : levelIndex + 1);
});
window.addEventListener("resize", render);

// ===== 8. 打开页面：从已解锁的最高一关开始 =====
loadLevel(unlocked);

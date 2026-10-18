// ===== 1. 找到页面上的元素 =====
const folderList = document.getElementById("folderList");
const folderInput = document.getElementById("folderInput");
const folderBtn = document.getElementById("folderBtn");
const title = document.getElementById("title");
const count = document.getElementById("count");
const todoList = document.getElementById("todoList");
const todoInput = document.getElementById("todoInput");
const todoBtn = document.getElementById("todoBtn");

// ===== 2. 数据：所有文件夹、每个文件夹里的待办，都放在 state 里 =====
// state = { lists: [ { id, name, items: [ { text, done } ] } ], current: 当前文件夹的id }
const KEY = "todoApp";

function newList(name) {
    return { id: Date.now() + Math.random(), name: name, items: [] };
}

function load() {
    try {
        const saved = JSON.parse(localStorage.getItem(KEY));
        if (saved && saved.lists && saved.lists.length) { return saved; }
    } catch (e) {}
    const first = newList("我的待办");
    return { lists: [first], current: first.id };
}

let state = load();

function save() {
    localStorage.setItem(KEY, JSON.stringify(state));
}

function currentList() {
    return state.lists.find(function (l) { return l.id === state.current; }) || state.lists[0];
}

// 造一个元素的小工具：el("span", "类名", "文字")
function el(tag, className, text) {
    const node = document.createElement(tag);
    if (className) { node.className = className; }
    if (text !== undefined) { node.textContent = text; }
    return node;
}

// ===== 3. 显示：根据数据，把页面整个重新画一遍 =====
// 关键：页面永远是"数据"的样子，所以删除后刷新不会再出现
function render() {
    renderFolders();
    renderTodos();
}

function renderFolders() {
    folderList.innerHTML = "";
    state.lists.forEach(function (list) {
        const li = el("li", "folder" + (list.id === state.current ? " active" : ""));
        li.append(
            el("span", "folder-name", list.name),
            el("span", "folder-num", list.items.filter(function (i) { return !i.done; }).length)
        );

        li.addEventListener("click", function () {
            state.current = list.id;
            save();
            render();
        });

        // 至少保留一个文件夹，所以只有多于一个时才能删
        if (state.lists.length > 1) {
            const del = el("button", "del", "×");
            del.setAttribute("aria-label", "删除文件夹");
            del.addEventListener("click", function (e) {
                e.stopPropagation();   // 不要同时触发"切换文件夹"
                if (confirm("删除「" + list.name + "」和里面所有待办？")) {
                    state.lists = state.lists.filter(function (l) { return l !== list; });
                    if (state.current === list.id) { state.current = state.lists[0].id; }
                    save();
                    render();
                }
            });
            li.append(del);
        }
        folderList.append(li);
    });
}

function renderTodos() {
    const list = currentList();
    title.textContent = list.name;
    const left = list.items.filter(function (i) { return !i.done; }).length;
    count.textContent = list.items.length ? "还剩 " + left + " 项" : "还没有待办，在下面添加一条吧";

    todoList.innerHTML = "";
    list.items.forEach(function (item) {
        const li = el("li", "todo" + (item.done ? " done" : ""));

        const box = el("button", "check");
        box.setAttribute("role", "checkbox");
        box.setAttribute("aria-checked", item.done);
        box.setAttribute("aria-label", "完成");
        box.addEventListener("click", function () {
            item.done = !item.done;   // 勾上/取消
            save();
            render();
        });

        const del = el("button", "del", "×");
        del.setAttribute("aria-label", "删除待办");
        del.addEventListener("click", function () {
            list.items = list.items.filter(function (i) { return i !== item; });
            save();   // 数据里删掉，再存起来
            render();
        });

        li.append(box, el("span", "todo-text", item.text), del);
        todoList.append(li);
    });
}

// ===== 4. 添加 =====
function addTodo() {
    const text = todoInput.value.trim();
    if (text === "") { return; }
    currentList().items.push({ text: text, done: false });
    todoInput.value = "";
    save();
    render();
}

function addFolder() {
    const name = folderInput.value.trim();
    if (name === "") { return; }
    const list = newList(name);
    state.lists.push(list);
    state.current = list.id;   // 新建后直接打开它
    folderInput.value = "";
    save();
    render();
    todoInput.focus();
}

todoBtn.addEventListener("click", addTodo);
folderBtn.addEventListener("click", addFolder);

// isComposing：用中文输入法选词时按回车，不算"提交"
todoInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) { addTodo(); }
});
folderInput.addEventListener("keydown", function (e) {
    if (e.key === "Enter" && !e.isComposing) { addFolder(); }
});

// ===== 5. 页面一打开，先画一遍 =====
render();

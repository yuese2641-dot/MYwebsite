const input = document.getElementById("myInput");
const btn = document.getElementById("myBtn");
const list = document.getElementById("myList");

let todos = JSON.parse(localStorage.getItem("todos")) || [];

function showItem(text) {
    const li = document.createElement("li");
    li.textContent = text;
    list.appendChild(li);
    li.addEventListener("click", function () {
        li.remove();
    });
}

for (let i = 0; i < todos.length; i++) {
    showItem(todos[i]);
}

function addItem() {
    const text = input.value.trim();
    if (text === "") { return; }

    showItem(text);
    todos.push(text);
    localStorage.setItem("todos", JSON.stringify(todos));
    input.value = "";
}

btn.addEventListener("click", addItem);

input.addEventListener("keydown", function (e) {
    if (e.key === "Enter") {
        addItem();
    }
});
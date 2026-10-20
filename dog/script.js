const storageKey = 'yuese-chun-care-v2';
const defaults = { food: 72, water: 72, happy: 72, energy: 72, clean: 72, actions: 0 };
let state = { ...defaults };
try {
    const saved = JSON.parse(localStorage.getItem(storageKey));
    if (saved) state = { ...state, ...saved };
} catch {
    // Ignore unavailable or malformed saved game data and start fresh.
}

const message = document.querySelector('#message');
const careLog = document.querySelector('#careLog');
const petPhoto = document.querySelector('#petPhoto');
const photos = [
    '../images/Weixin Image_20261021010627_103_2.jpg',
    '../images/Weixin Image_20261021010628_104_2.jpg',
    '../images/Weixin Image_20261021010628_105_2.jpg',
    '../images/Weixin Image_20261021010526_90_2.jpg',
    '../images/Weixin Image_20261021010527_91_2.jpg'
];
const clamp = value => Math.max(0, Math.min(100, Math.round(value)));

function render() {
    ['food', 'water', 'happy', 'energy', 'clean'].forEach(name => {
        const value = clamp(state[name]);
        state[name] = value;
        document.querySelector(`#${name}Value`).textContent = value;
        document.querySelector(`#${name}Bar`).style.width = `${value}%`;
    });
    careLog.textContent = `今天陪伴小春 ${state.actions} 次`;
    localStorage.setItem(storageKey, JSON.stringify(state));
}

function say(text) {
    message.textContent = text;
    message.classList.remove('pop');
    void message.offsetWidth;
    message.classList.add('pop');
}

function react(photo = false) {
    if (photo) petPhoto.src = photos[Math.floor(Math.random() * photos.length)];
    petPhoto.classList.remove('pet-bounce');
    void petPhoto.offsetWidth;
    petPhoto.classList.add('pet-bounce');
}

const actions = {
    food() {
        state.food += 25;
        state.happy += 5;
        state.clean -= 2;
        say(['小春开心地吃完了饭！', '吃饱啦，小春满足地摇摇尾巴！'][Math.floor(Math.random() * 2)]);
    },
    water() {
        state.water += 28;
        say('咕咚咕咚，小春喝了好多水！');
    },
    play() {
        state.happy += 22;
        state.energy -= 15;
        state.food -= 6;
        state.water -= 7;
        state.clean -= 8;
        say(['小春叼来球球，和你玩得好开心！', '小春跑了一大圈，开心地回到你身边！'][Math.floor(Math.random() * 2)]);
        react(true);
        return;
    },
    walk() {
        state.happy += 18;
        state.energy -= 18;
        state.food -= 5;
        state.water -= 8;
        state.clean -= 7;
        say('一起散步回来啦，小春闻到了好多新味道！');
        react(true);
        return;
    },
    brush() {
        state.clean += 30;
        state.happy += 7;
        say('梳好毛啦，小春变得蓬蓬松松！');
    },
    train() {
        state.happy += 12;
        state.energy -= 10;
        say(['小春学会了一个新动作，真聪明！', '训练完成！小春期待你的表扬。'][Math.floor(Math.random() * 2)]);
        react(true);
        return;
    },
    sleep() {
        state.energy += 32;
        state.happy += 4;
        state.food -= 4;
        state.water -= 4;
        say('小春睡了个舒服的觉，精力恢复啦！');
        react(true);
        return;
    }
};

document.querySelectorAll('[data-action]').forEach(button => button.addEventListener('click', () => {
    const action = actions[button.dataset.action];
    if (!action) return;
    action();
    state.actions += 1;
    render();
}));

render();
// Needs drift only while the little home is open; leaving the page pauses the game.
const driftTimer = window.setInterval(() => {
    state.food -= 1;
    state.water -= 1;
    state.happy -= 1;
    state.clean -= 1;
    render();
    if (Math.random() < 0.18) {
        const moments = ['小春绕着你转了一圈，等你陪它玩。', '小春趴在旁边，安静地陪着你。', '小春歪着头看你，好像在问今天做什么。'];
        say(moments[Math.floor(Math.random() * moments.length)]);
    }
}, 60000);
window.addEventListener('pagehide', () => window.clearInterval(driftTimer), { once: true });

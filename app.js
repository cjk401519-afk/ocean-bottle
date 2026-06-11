const STORAGE_KEY = "oceanBottle.v0.bottles";

const appShell = document.querySelector(".app-shell");
const screens = {
  home: document.getElementById("homeScreen"),
  compose: document.getElementById("composeScreen"),
  tide: document.getElementById("tideScreen"),
};

const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const sendBottle = document.getElementById("sendBottle");
const tideList = document.getElementById("tideList");
const clearBottles = document.getElementById("clearBottles");
const safetyMessage = document.getElementById("safetyMessage");
const errorMessage = document.getElementById("errorMessage");
const floatingBottle = document.getElementById("floatingBottle");
const toast = document.getElementById("toast");

let selectedMood = "疲惫";
let toastTimer = null;

const dangerPatterns = [
  /自杀/,
  /不想活/,
  /死了算了/,
  /结束生命/,
  /伤害自己/,
  /活不下去/,
  /撑不下去/,
  /轻生/,
];

function readBottles() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveBottles(bottles) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(bottles));
    return true;
  } catch (error) {
    return false;
  }
}

function ensureDeleteButtonStyles() {
  if (document.getElementById("deleteBottleStyles")) {
    return;
  }

  const style = document.createElement("style");
  style.id = "deleteBottleStyles";
  style.textContent = `
    .tide-card-head {
      align-items: center;
    }

    .tide-card-tools {
      display: inline-flex;
      align-items: center;
      gap: 0.5rem;
      flex: 0 0 auto;
    }

    .delete-bottle {
      display: inline-grid;
      place-items: center;
      width: 1.8rem;
      height: 1.8rem;
      border: 1px solid rgba(255, 236, 207, 0.16);
      border-radius: 999px;
      color: rgba(255, 231, 211, 0.72);
      background: rgba(255, 255, 255, 0.06);
      cursor: pointer;
      transition: background 160ms ease, color 160ms ease, transform 160ms ease;
    }

    .delete-bottle span {
      display: block;
      font-size: 1.15rem;
      line-height: 1;
      transform: translateY(-0.04rem);
    }

    .delete-bottle:active {
      transform: scale(0.94);
    }

    .delete-bottle:hover {
      color: #ffe6d4;
      background: rgba(255, 178, 130, 0.14);
    }
  `;
  document.head.append(style);
}

function switchView(view) {
  Object.entries(screens).forEach(([name, screen]) => {
    screen.classList.toggle("is-active", name === view);
  });

  appShell.dataset.view = view;

  if (view === "tide") {
    renderTide();
  }

  if (view === "compose") {
    window.setTimeout(() => messageInput.focus({ preventScroll: true }), 280);
  } else {
    messageInput.blur();
  }
}

function formatDate(value) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${month}.${day} ${hour}:${minute}`;
}

function escapeHtml(value) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function renderTide() {
  const bottles = readBottles().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!bottles.length) {
    tideList.innerHTML = `
      <div class="empty-tide">
        这里还没有漂流瓶。等你准备好了，可以先把一句话交给今晚的海。
      </div>
    `;
    return;
  }

  tideList.innerHTML = bottles
    .map((bottle) => {
      const content = escapeHtml(bottle.content);
      const id = escapeHtml(bottle.id);
      const mood = escapeHtml(bottle.mood || "未命名潮汐");
      return `
        <article class="tide-card">
          <div class="tide-card-head">
            <span>${formatDate(bottle.createdAt)}</span>
            <div class="tide-card-tools">
              <span class="tide-mood">${mood}</span>
              <button class="delete-bottle" type="button" data-delete-id="${id}" aria-label="删除这只瓶子" title="删除这只瓶子">
                <span aria-hidden="true">×</span>
              </button>
            </div>
          </div>
          <p class="tide-content">${content}</p>
        </article>
      `;
    })
    .join("");
}

function deleteBottle(id) {
  const bottles = readBottles();
  const nextBottles = bottles.filter((bottle) => bottle.id !== id);

  if (nextBottles.length === bottles.length) {
    showToast("这只瓶子已经不在潮汐里了。");
    renderTide();
    return;
  }

  const confirmed = window.confirm("确定删除这只漂流瓶吗？这个操作不能恢复。");
  if (!confirmed) {
    return;
  }

  const saved = saveBottles(nextBottles);
  if (saved) {
    renderTide();
    showToast("这只瓶子已经交还给海。");
  } else {
    showToast("这台设备暂时无法删除这只瓶子。");
  }
}

function updateTextState() {
  const value = messageInput.value;
  charCount.textContent = `${value.length} / 900`;
  errorMessage.textContent = "";
  errorMessage.classList.remove("is-visible");

  const shouldShowSafety = dangerPatterns.some((pattern) => pattern.test(value));
  safetyMessage.classList.toggle("is-visible", shouldShowSafety);
}

function showToast(message) {
  toast.textContent = message;
  toast.classList.add("is-visible");
  window.clearTimeout(toastTimer);
  toastTimer = window.setTimeout(() => {
    toast.classList.remove("is-visible");
  }, 2600);
}

function playBottleAnimation() {
  floatingBottle.classList.remove("is-sent");
  void floatingBottle.offsetWidth;
  floatingBottle.classList.add("is-sent");
}

function resetCompose() {
  messageInput.value = "";
  updateTextState();
  document.querySelectorAll(".mood-chip").forEach((chip) => {
    const isSelected = chip.dataset.mood === "疲惫";
    chip.classList.toggle("is-selected", isSelected);
    chip.setAttribute("aria-checked", String(isSelected));
  });
  selectedMood = "疲惫";
}

function sendCurrentBottle() {
  const content = messageInput.value.trim();

  if (!content) {
    errorMessage.textContent = "空瓶子会被海浪推回来。先写下一句话吧。";
    errorMessage.classList.add("is-visible");
    messageInput.focus();
    return;
  }

  const bottles = readBottles();
  const bottle = {
    id:
      globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
        ? globalThis.crypto.randomUUID()
        : `${Date.now()}-${Math.random().toString(16).slice(2)}`,
    content,
    mood: selectedMood,
    createdAt: new Date().toISOString(),
    scene: "威海黄昏灯塔海岸",
    status: "kept_by_sea",
  };

  const saved = saveBottles([bottle, ...bottles]);
  if (!saved) {
    errorMessage.textContent = "这台设备暂时没有收好瓶子。可以先复制这段话，稍后再试一次。";
    errorMessage.classList.add("is-visible");
    return;
  }

  playBottleAnimation();
  showToast("海会替你保管一会儿。");
  resetCompose();

  window.setTimeout(() => {
    switchView("tide");
  }, 1300);
}

document.addEventListener("click", (event) => {
  const deleteButton = event.target.closest("[data-delete-id]");
  if (deleteButton) {
    deleteBottle(deleteButton.dataset.deleteId);
    return;
  }

  const actionButton = event.target.closest("[data-action]");
  if (actionButton) {
    switchView(actionButton.dataset.action);
    return;
  }

  const moodChip = event.target.closest(".mood-chip");
  if (moodChip) {
    selectedMood = moodChip.dataset.mood;
    document.querySelectorAll(".mood-chip").forEach((chip) => {
      const isSelected = chip === moodChip;
      chip.classList.toggle("is-selected", isSelected);
      chip.setAttribute("aria-checked", String(isSelected));
    });
  }
});

messageInput.addEventListener("input", updateTextState);
sendBottle.addEventListener("click", sendCurrentBottle);

clearBottles.addEventListener("click", () => {
  const bottles = readBottles();
  if (!bottles.length) {
    showToast("现在还没有需要清空的瓶子。");
    return;
  }

  const confirmed = window.confirm("确定清空这台设备上的所有漂流瓶吗？这个操作不能恢复。");
  if (!confirmed) {
    return;
  }

  const saved = saveBottles([]);
  if (saved) {
    renderTide();
    showToast("这片潮汐已经清空。");
  } else {
    showToast("这台设备暂时无法清空记录。");
  }
});

ensureDeleteButtonStyles();
renderTide();
updateTextState();

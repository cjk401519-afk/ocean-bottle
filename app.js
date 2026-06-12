const STORAGE_KEY = "oceanBottle.v0.bottles";

const appShell = document.querySelector(".app-shell");
const screens = {
  home: document.getElementById("homeScreen"),
  compose: document.getElementById("composeScreen"),
  pick: document.getElementById("pickScreen"),
  tide: document.getElementById("tideScreen"),
};

const messageInput = document.getElementById("messageInput");
const charCount = document.getElementById("charCount");
const sendBottle = document.getElementById("sendBottle");
const tideList = document.getElementById("tideList");
const clearBottles = document.getElementById("clearBottles");
const foundBottle = document.getElementById("foundBottle");
const pickAnother = document.getElementById("pickAnother");
const replyResult = document.getElementById("replyResult");
const safetyMessage = document.getElementById("safetyMessage");
const errorMessage = document.getElementById("errorMessage");
const floatingBottle = document.getElementById("floatingBottle");
const soundToggle = document.getElementById("soundToggle");
const toast = document.getElementById("toast");

let selectedMood = "疲惫";
let toastTimer = null;
let oceanAudio = null;
let oceanSoundStarting = false;
let currentFoundBottleId = null;

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

const presetBottles = [
  {
    id: "harbor-light",
    place: "黄昏港口",
    mood: "疲惫",
    content: "今天没有发生特别糟糕的事，可我还是觉得很累。像在岸边站了很久，风一直吹，却不知道该往哪里走。",
  },
  {
    id: "late-train",
    place: "末班车窗",
    mood: "想念",
    content: "我突然很想念一个已经很久没联系的人。不是想回到过去，只是想知道，那些没说完的话是不是也会被海记得。",
  },
  {
    id: "small-room",
    place: "一盏小灯旁",
    mood: "委屈",
    content: "我好像总是在别人面前说没关系。可其实有些话咽下去以后，会在晚上变得很重。",
  },
  {
    id: "foggy-road",
    place: "雾气很轻的路口",
    mood: "迷茫",
    content: "我不知道现在做的选择对不对。只是希望多年以后回头看，会觉得那时的自己已经很努力了。",
  },
  {
    id: "quiet-roof",
    place: "安静屋顶",
    mood: "平静",
    content: "今晚风很慢。我没有变得特别好，但也没有继续往下沉。这样也算一点点靠岸吧。",
  },
  {
    id: "winter-sea",
    place: "冬天的海边",
    mood: "疲惫",
    content: "我把今天撑过去了。虽然只是普通的一天，但我想有人能替我说一句：已经很好了。",
  },
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

function createOceanNoiseBuffer(context) {
  const seconds = 3;
  const buffer = context.createBuffer(1, context.sampleRate * seconds, context.sampleRate);
  const data = buffer.getChannelData(0);
  let softWave = 0;

  for (let i = 0; i < data.length; i += 1) {
    const white = Math.random() * 2 - 1;
    softWave = softWave * 0.985 + white * 0.16;
    data[i] = Math.max(-1, Math.min(1, softWave * 1.35 + white * 0.08));
  }

  return buffer;
}

function createOceanAudio() {
  const AudioContextClass = window.AudioContext || window.webkitAudioContext;
  if (!AudioContextClass) {
    return null;
  }

  const context = new AudioContextClass();
  const source = context.createBufferSource();
  const lowPass = context.createBiquadFilter();
  const highPass = context.createBiquadFilter();
  const swellGain = context.createGain();
  const foamFilter = context.createBiquadFilter();
  const foamGain = context.createGain();
  const masterGain = context.createGain();
  const swellLfo = context.createOscillator();
  const swellDepth = context.createGain();
  const filterLfo = context.createOscillator();
  const filterDepth = context.createGain();

  source.buffer = createOceanNoiseBuffer(context);
  source.loop = true;

  lowPass.type = "lowpass";
  lowPass.frequency.value = 760;
  lowPass.Q.value = 0.72;

  highPass.type = "highpass";
  highPass.frequency.value = 70;

  swellGain.gain.value = 0.11;

  foamFilter.type = "highpass";
  foamFilter.frequency.value = 1300;
  foamGain.gain.value = 0.018;

  masterGain.gain.value = 0;

  swellLfo.frequency.value = 0.075;
  swellDepth.gain.value = 0.052;

  filterLfo.frequency.value = 0.045;
  filterDepth.gain.value = 220;

  source.connect(lowPass);
  lowPass.connect(highPass);
  highPass.connect(swellGain);
  swellGain.connect(masterGain);

  source.connect(foamFilter);
  foamFilter.connect(foamGain);
  foamGain.connect(masterGain);

  swellLfo.connect(swellDepth);
  swellDepth.connect(swellGain.gain);

  filterLfo.connect(filterDepth);
  filterDepth.connect(lowPass.frequency);

  masterGain.connect(context.destination);

  source.start();
  swellLfo.start();
  filterLfo.start();

  return {
    context,
    source,
    swellLfo,
    filterLfo,
    masterGain,
  };
}

function updateSoundToggle(isPlaying) {
  if (!soundToggle) {
    return;
  }

  soundToggle.classList.toggle("is-playing", isPlaying);
  soundToggle.setAttribute("aria-pressed", String(isPlaying));
  soundToggle.setAttribute("aria-label", isPlaying ? "暂停海浪白噪音" : "播放海浪白噪音");
}

function startOceanSound() {
  if (oceanAudio || oceanSoundStarting) {
    return;
  }

  oceanSoundStarting = true;
  const audio = createOceanAudio();
  if (!audio) {
    oceanSoundStarting = false;
    showToast("这台设备暂时不能播放海浪声。");
    return;
  }

  oceanAudio = audio;
  oceanSoundStarting = false;

  const now = oceanAudio.context.currentTime;
  oceanAudio.masterGain.gain.cancelScheduledValues(now);
  oceanAudio.masterGain.gain.setValueAtTime(0, now);
  oceanAudio.masterGain.gain.linearRampToValueAtTime(0.82, now + 1.2);
  updateSoundToggle(true);
  showToast("海浪声轻轻响起来了。");

  if (oceanAudio.context.state === "suspended") {
    oceanAudio.context.resume().catch(() => {
      stopOceanSound({ silent: true });
      showToast("这台设备暂时不能播放海浪声。");
    });
  }
}

function stopOceanSound(options = {}) {
  if (!oceanAudio) {
    oceanSoundStarting = false;
    return;
  }

  const audio = oceanAudio;
  oceanAudio = null;
  oceanSoundStarting = false;
  const now = audio.context.currentTime;
  audio.masterGain.gain.cancelScheduledValues(now);
  audio.masterGain.gain.setTargetAtTime(0, now, 0.08);

  [audio.source, audio.swellLfo, audio.filterLfo].forEach((node) => {
    try {
      node.stop(now + 0.38);
    } catch (error) {
      // Some browsers may already stop audio nodes during page unload.
    }
  });

  window.setTimeout(() => {
    audio.context.close().catch(() => {});
  }, 520);

  updateSoundToggle(false);
  if (!options.silent) {
    showToast("海浪声停下来了。");
  }
}

function toggleOceanSound() {
  if (oceanAudio || oceanSoundStarting) {
    stopOceanSound();
    return;
  }

  try {
    startOceanSound();
  } catch (error) {
    oceanAudio = null;
    oceanSoundStarting = false;
    updateSoundToggle(false);
    showToast("这台设备暂时不能播放海浪声。");
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

  if (view === "pick") {
    pickBottle();
  }

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

function renderFoundBottle(bottle) {
  if (!foundBottle || !bottle) {
    return;
  }

  foundBottle.classList.remove("is-lit");
  void foundBottle.offsetWidth;

  foundBottle.innerHTML = `
    <div class="found-bottle-top">
      <span>${escapeHtml(bottle.place)}</span>
      <span class="tide-mood">${escapeHtml(bottle.mood)}</span>
    </div>
    <p class="found-bottle-text">${escapeHtml(bottle.content)}</p>
  `;
}

function pickBottle() {
  if (!foundBottle) {
    return;
  }

  const candidates = presetBottles.filter((bottle) => bottle.id !== currentFoundBottleId);
  const bottlePool = candidates.length ? candidates : presetBottles;
  const nextBottle = bottlePool[Math.floor(Math.random() * bottlePool.length)];
  currentFoundBottleId = nextBottle.id;

  if (replyResult) {
    replyResult.textContent = "";
    replyResult.classList.remove("is-visible");
  }
  appShell.classList.remove("is-blessing");
  renderFoundBottle(nextBottle);
}

function sendWarmReply(message) {
  if (!message || !foundBottle) {
    return;
  }

  foundBottle.classList.add("is-lit");
  appShell.classList.remove("is-blessing");
  void appShell.offsetWidth;
  appShell.classList.add("is-blessing");

  if (replyResult) {
    replyResult.textContent = `“${message}” 已经被灯塔的光送向远方。`;
    replyResult.classList.add("is-visible");
  }
  showToast("你的回应被海风带走了。");

  window.setTimeout(() => {
    appShell.classList.remove("is-blessing");
  }, 2200);
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

  const replyButton = event.target.closest("[data-reply]");
  if (replyButton) {
    sendWarmReply(replyButton.dataset.reply);
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
if (soundToggle) {
  soundToggle.addEventListener("click", toggleOceanSound);
}
if (pickAnother) {
  pickAnother.addEventListener("click", pickBottle);
}
window.addEventListener("pagehide", () => stopOceanSound({ silent: true }));

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
updateSoundToggle(false);
renderTide();
updateTextState();

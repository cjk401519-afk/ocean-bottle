const STORAGE_KEY = "oceanBottle.v0.bottles";
const ONBOARDING_KEY = "oceanBottle.v0.onboarded";
const INVITE_URL = "https://cjk401519-afk.github.io/ocean-bottle/";

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
const saveFoundLight = document.getElementById("saveFoundLight");
const replyResult = document.getElementById("replyResult");
const safetyMessage = document.getElementById("safetyMessage");
const errorMessage = document.getElementById("errorMessage");
const floatingBottle = document.getElementById("floatingBottle");
const soundToggle = document.getElementById("soundToggle");
const toast = document.getElementById("toast");
const onboarding = document.getElementById("onboarding");
const onboardingKicker = document.getElementById("onboardingKicker");
const onboardingTitle = document.getElementById("onboardingTitle");
const onboardingText = document.getElementById("onboardingText");
const onboardingDots = document.getElementById("onboardingDots");
const nextOnboarding = document.getElementById("nextOnboarding");
const skipOnboarding = document.getElementById("skipOnboarding");
const openShareSheet = document.getElementById("openShareSheet");
const shareSheet = document.getElementById("shareSheet");
const closeShareSheet = document.getElementById("closeShareSheet");
const copyShareLink = document.getElementById("copyShareLink");
const nativeShare = document.getElementById("nativeShare");
const installAppButton = document.getElementById("installAppButton");
const copyFeedback = document.getElementById("copyFeedback");

const OCEAN_SOUND_SRC = "https://bigsoundbank.com/UPLOAD/mp3/1047.mp3";

let selectedMood = "疲惫";
let toastTimer = null;
let oceanAudio = null;
let oceanSoundStarting = false;
let oceanFadeFrame = null;
let currentFoundBottleId = null;
let currentFoundBottle = null;
let foundBottleOpened = false;
let pickArrivalTimer = null;
let onboardingIndex = 0;
let deferredInstallPrompt = null;

const onboardingSteps = [
  {
    kicker: "一片安静的海",
    title: "先把话交给海",
    text: "这里没有点赞和围观，只有一盏灯、一只瓶子，和慢慢退去的潮水。",
  },
  {
    kicker: "远方也有回声",
    title: "捡到一点温柔",
    text: "现在的来信仍是预设内容。等真实互动准备好之前，我们先把安全和氛围打磨好。",
  },
  {
    kicker: "只在此刻的设备",
    title: "你的潮汐留给你",
    text: "写下的话只保存在这台设备里。准备好了，再把这片海分享给可信任的人。",
  },
];

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
    content: "你不用今天就想明白所有事。海雾散得慢，人也可以慢一点。",
  },
  {
    id: "late-train",
    place: "末班车窗",
    mood: "想念",
    content: "有些想念不会立刻靠岸。它只是经过你，提醒你曾经认真爱过。",
  },
  {
    id: "small-room",
    place: "一盏小灯旁",
    mood: "委屈",
    content: "今晚先别责怪自己。能把这一天走到这里，已经很不容易。",
  },
  {
    id: "foggy-road",
    place: "雾气很轻的路口",
    mood: "迷茫",
    content: "有些难过只是暂时没有岸。等天亮一点，再把脚下的路看清。",
  },
  {
    id: "quiet-roof",
    place: "安静屋顶",
    mood: "平静",
    content: "你可以不立刻变好。先让风从身边经过，明天再向前一点。",
  },
  {
    id: "winter-sea",
    place: "冬天的海边",
    mood: "疲惫",
    content: "如果没人听见你的沉默，也许这盏灯正在替你守一会儿。",
  },
  {
    id: "moon-window",
    place: "有月光的窗边",
    mood: "孤独",
    content: "孤独不是你做错了什么。有些夜晚很长，但它不会一直这样长。",
  },
  {
    id: "rain-platform",
    place: "雨后的站台",
    mood: "迷茫",
    content: "方向感会暂时消失。先确认自己还在呼吸，再决定下一步往哪里走。",
  },
  {
    id: "old-street",
    place: "旧街路灯下",
    mood: "想念",
    content: "想念可以不被回应，也仍然是真的。你认真过，这件事本身就值得温柔对待。",
  },
  {
    id: "warm-cup",
    place: "温热的杯子旁",
    mood: "疲惫",
    content: "今天先把自己放下来。那些没做完的事，明天也许会轻一点。",
  },
  {
    id: "quiet-dock",
    place: "安静码头",
    mood: "委屈",
    content: "有些委屈不是因为你太脆弱，而是你已经忍了很久。",
  },
  {
    id: "blue-stair",
    place: "蓝色楼梯间",
    mood: "迷茫",
    content: "你不需要向所有人证明自己正在变好。慢慢走，也算是在走。",
  },
  {
    id: "night-market",
    place: "快收摊的夜市",
    mood: "平静",
    content: "如果今天没有特别快乐，也没关系。平安经过一天，也是一种抵达。",
  },
  {
    id: "sea-wall",
    place: "退潮后的海堤",
    mood: "释怀",
    content: "放下不一定是忘记。只是你终于愿意把手松一点，让自己好过一点。",
  },
  {
    id: "white-curtain",
    place: "白色窗帘后",
    mood: "孤独",
    content: "你没有被世界落下。只是这一段路，人声离你远了一点。",
  },
  {
    id: "dawn-bus",
    place: "清晨公交车",
    mood: "疲惫",
    content: "累的时候，别急着要求自己发光。能保持一点温度，就已经很好。",
  },
  {
    id: "salt-wind",
    place: "有盐味的风里",
    mood: "想念",
    content: "有些人像潮声，远了也还会回响。你可以想念，也可以继续生活。",
  },
  {
    id: "empty-library",
    place: "快闭馆的图书馆",
    mood: "迷茫",
    content: "答案不一定突然出现。也许它会先变成一页纸、一条路、一次睡醒后的勇气。",
  },
  {
    id: "soft-blanket",
    place: "柔软的被角",
    mood: "委屈",
    content: "你可以承认自己很难过。承认不是失败，是终于没有再假装没事。",
  },
  {
    id: "orange-cloud",
    place: "橘色云下面",
    mood: "平静",
    content: "愿你今晚不用追赶什么。让风替你翻过这一页。",
  },
  {
    id: "glass-door",
    place: "便利店玻璃门前",
    mood: "孤独",
    content: "有人会懂你很慢才说出口的话。在那之前，先把自己听完。",
  },
  {
    id: "low-tide",
    place: "很低的潮线",
    mood: "释怀",
    content: "不是所有失去都要立刻变成意义。先疼一会儿，再慢慢长出新的生活。",
  },
  {
    id: "warm-lighthouse",
    place: "灯塔背光处",
    mood: "疲惫",
    content: "你也许看不见自己的光，但它并没有熄。只是今晚雾很重。",
  },
  {
    id: "paper-ticket",
    place: "折起来的车票里",
    mood: "想念",
    content: "如果一段关系走到这里，也请记得：你曾经给出的真心没有白费。",
  },
  {
    id: "quiet-corner",
    place: "房间的安静角落",
    mood: "委屈",
    content: "你不必把每次难过都解释得有条有理。心也有下雨的时候。",
  },
  {
    id: "silver-wave",
    place: "银色浪边",
    mood: "释怀",
    content: "有些路回头看才知道很远。能走到现在的你，真的已经很勇敢。",
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

function createBottleId() {
  return globalThis.crypto && typeof globalThis.crypto.randomUUID === "function"
    ? globalThis.crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function createOceanAudio() {
  const audio = new Audio(OCEAN_SOUND_SRC);
  audio.loop = true;
  audio.preload = "auto";
  audio.volume = 0;
  return audio;
}

function cancelOceanFade() {
  if (!oceanFadeFrame) {
    return;
  }

  window.cancelAnimationFrame(oceanFadeFrame);
  oceanFadeFrame = null;
}

function fadeOceanVolume(audio, targetVolume, duration, onDone) {
  cancelOceanFade();
  const startVolume = audio.volume;
  const startTime = performance.now();

  function step(now) {
    const progress = Math.min(1, (now - startTime) / duration);
    audio.volume = startVolume + (targetVolume - startVolume) * progress;

    if (progress < 1) {
      oceanFadeFrame = window.requestAnimationFrame(step);
      return;
    }

    oceanFadeFrame = null;
    if (onDone) {
      onDone();
    }
  }

  oceanFadeFrame = window.requestAnimationFrame(step);
}

function updateSoundToggle(isPlaying) {
  if (!soundToggle) {
    return;
  }

  soundToggle.classList.toggle("is-playing", isPlaying);
  soundToggle.setAttribute("aria-pressed", String(isPlaying));
  soundToggle.setAttribute("aria-label", isPlaying ? "暂停海浪白噪音" : "播放海浪白噪音");
}

function renderOnboardingStep() {
  if (!onboarding || !onboardingKicker || !onboardingTitle || !onboardingText || !onboardingDots || !nextOnboarding) {
    return;
  }

  const step = onboardingSteps[onboardingIndex];
  onboardingKicker.textContent = step.kicker;
  onboardingTitle.textContent = step.title;
  onboardingText.textContent = step.text;
  onboardingDots.innerHTML = onboardingSteps
    .map((_, index) => `<span class="${index === onboardingIndex ? "is-active" : ""}"></span>`)
    .join("");
  nextOnboarding.textContent = onboardingIndex === onboardingSteps.length - 1 ? "进入海边" : "下一页";
}

function showOnboarding() {
  let hasSeenOnboarding = false;
  try {
    hasSeenOnboarding = Boolean(localStorage.getItem(ONBOARDING_KEY));
  } catch (error) {
    hasSeenOnboarding = false;
  }

  if (!onboarding || hasSeenOnboarding) {
    return;
  }

  onboardingIndex = 0;
  renderOnboardingStep();
  onboarding.classList.remove("is-hidden");
  window.setTimeout(() => nextOnboarding && nextOnboarding.focus({ preventScroll: true }), 80);
}

function closeOnboarding() {
  if (!onboarding) {
    return;
  }

  try {
    localStorage.setItem(ONBOARDING_KEY, "1");
  } catch (error) {
    // If private browsing blocks storage, closing still matters for this session.
  }
  onboarding.classList.add("is-hidden");
}

function advanceOnboarding() {
  if (onboardingIndex < onboardingSteps.length - 1) {
    onboardingIndex += 1;
    renderOnboardingStep();
    return;
  }

  closeOnboarding();
}

function openSharePanel() {
  if (!shareSheet) {
    return;
  }

  shareSheet.hidden = false;
  window.setTimeout(() => shareSheet.classList.add("is-visible"), 20);
  if (nativeShare) {
    nativeShare.hidden = !navigator.share;
  }
  if (copyShareLink) {
    window.setTimeout(() => copyShareLink.focus({ preventScroll: true }), 80);
  }
}

function closeSharePanel() {
  if (!shareSheet) {
    return;
  }

  shareSheet.classList.remove("is-visible");
  window.setTimeout(() => {
    shareSheet.hidden = true;
  }, 180);
}

function fallbackCopy(text) {
  const helper = document.createElement("textarea");
  helper.value = text;
  helper.setAttribute("readonly", "");
  helper.style.position = "fixed";
  helper.style.left = "-9999px";
  document.body.append(helper);
  helper.select();

  let copied = false;
  try {
    copied = document.execCommand("copy");
  } catch (error) {
    copied = false;
  }

  helper.remove();
  return copied;
}

async function copyText(text, successMessage) {
  try {
    if (navigator.clipboard && window.isSecureContext) {
      await navigator.clipboard.writeText(text);
      showToast(successMessage);
      return;
    }
  } catch (error) {
    // Fall back to the hidden textarea path below.
  }

  if (fallbackCopy(text)) {
    showToast(successMessage);
    return;
  }

  showToast("这台设备暂时不能自动复制。");
}

function buildFeedbackTemplate() {
  return [
    "海洋漂流瓶内测反馈",
    "",
    "1. 我最喜欢的一处：",
    "",
    "2. 我觉得不舒服或不清楚的一处：",
    "",
    "3. 我希望下一版增加：",
    "",
    "4. 我的设备或浏览器：",
  ].join("\n");
}

async function shareInvite() {
  const shareData = {
    title: "海洋漂流瓶",
    text: "我在试一个很安静的海边倾诉小网站，想邀请你也来看看。",
    url: INVITE_URL,
  };

  if (!navigator.share) {
    await copyText(INVITE_URL, "邀请链接已经复制。");
    return;
  }

  try {
    await navigator.share(shareData);
    showToast("这片海已经送出去了。");
  } catch (error) {
    if (error && error.name === "AbortError") {
      return;
    }
    await copyText(INVITE_URL, "邀请链接已经复制。");
  }
}

async function installApp() {
  if (deferredInstallPrompt) {
    deferredInstallPrompt.prompt();
    await deferredInstallPrompt.userChoice;
    deferredInstallPrompt = null;
    showToast("如果添加成功，它会出现在你的桌面。");
    return;
  }

  showToast("在手机浏览器的分享菜单里，可以添加到主屏幕。");
}

function registerServiceWorker() {
  if (!("serviceWorker" in navigator) || location.protocol === "file:") {
    return;
  }

  navigator.serviceWorker.register("./service-worker.js?v=invite-4").catch(() => {
    // The site still works as a normal static page if registration is unavailable.
  });
}

async function startOceanSound() {
  if (oceanAudio || oceanSoundStarting) {
    return;
  }

  document.documentElement.dataset.oceanAudioStatus = "starting";
  document.documentElement.dataset.oceanAudioError = "";
  oceanSoundStarting = true;
  const audio = createOceanAudio();

  oceanAudio = audio;
  try {
    await audio.play();
    if (oceanAudio !== audio) {
      audio.pause();
      return;
    }

    window.__oceanAudioLastError = null;
    document.documentElement.dataset.oceanAudioStatus = "playing";
    document.documentElement.dataset.oceanAudioError = "";
    oceanSoundStarting = false;
    fadeOceanVolume(audio, 0.82, 1200);
    updateSoundToggle(true);
    showToast("海浪声轻轻响起来了。");
  } catch (error) {
    window.__oceanAudioLastError = {
      name: error && error.name ? error.name : "AudioError",
      message: error && error.message ? error.message : "",
    };
    document.documentElement.dataset.oceanAudioStatus = "failed";
    document.documentElement.dataset.oceanAudioError = `${window.__oceanAudioLastError.name}: ${window.__oceanAudioLastError.message}`;

    if (oceanAudio === audio) {
      oceanAudio = null;
    }

    oceanSoundStarting = false;
    updateSoundToggle(false);
    showToast("这台设备暂时不能播放海浪声。");
  }
}

function stopOceanSound(options = {}) {
  if (!oceanAudio) {
    oceanSoundStarting = false;
    document.documentElement.dataset.oceanAudioStatus = "stopped";
    return;
  }

  const audio = oceanAudio;
  oceanAudio = null;
  oceanSoundStarting = false;
  document.documentElement.dataset.oceanAudioStatus = "stopped";

  fadeOceanVolume(audio, 0, 420, () => {
    audio.pause();
    try {
      audio.currentTime = 0;
    } catch (error) {
      // Some mobile browsers block seeking while a media element is unloading.
    }
  });

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
    window.__oceanAudioLastError = {
      name: error && error.name ? error.name : "AudioError",
      message: error && error.message ? error.message : "",
      phase: "toggle",
    };
    document.documentElement.dataset.oceanAudioStatus = "failed";
    document.documentElement.dataset.oceanAudioError = `${window.__oceanAudioLastError.name}: ${window.__oceanAudioLastError.message}`;

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

function setScreenVisibility(screen, isActive) {
  if (!screen) {
    return;
  }

  screen.classList.toggle("is-active", isActive);
  screen.style.opacity = isActive ? "1" : "0";
  screen.style.visibility = isActive ? "visible" : "hidden";
  screen.style.transform = isActive ? "translateY(0)" : "translateY(0.8rem)";
  screen.style.pointerEvents = isActive ? "auto" : "none";
}

function switchView(view) {
  Object.entries(screens).forEach(([name, screen]) => {
    setScreenVisibility(screen, name === view);
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

function hasSavedFoundLight(bottleId) {
  if (!bottleId) {
    return false;
  }

  return readBottles().some((bottle) => bottle.status === "found_light" && bottle.sourceId === bottleId);
}

function updateFoundLightButton() {
  if (!saveFoundLight) {
    return;
  }

  if (!currentFoundBottle || !foundBottleOpened) {
    saveFoundLight.disabled = true;
    saveFoundLight.textContent = "收藏这束光";
    return;
  }

  const isSaved = hasSavedFoundLight(currentFoundBottle.id);
  saveFoundLight.disabled = isSaved;
  saveFoundLight.textContent = isSaved ? "已收藏到潮汐" : "收藏这束光";
}

function resetReplyState() {
  document.querySelectorAll(".reply-chip").forEach((chip) => {
    chip.classList.remove("is-selected");
  });

  if (replyResult) {
    replyResult.textContent = "";
    replyResult.classList.remove("is-visible");
    replyResult.style.opacity = "0";
    replyResult.style.transform = "translateY(0.35rem)";
  }
}

function renderFoundBottle(bottle) {
  if (!foundBottle || !bottle) {
    return;
  }

  foundBottle.classList.remove("is-lit", "is-open", "is-arriving");
  foundBottle.classList.toggle("is-open", foundBottleOpened);
  foundBottle.classList.toggle("is-arriving", !foundBottleOpened);
  void foundBottle.offsetWidth;

  if (!foundBottleOpened) {
    foundBottle.innerHTML = `
      <button class="found-bottle-shell" type="button" data-open-found aria-label="打开这只漂流瓶">
        <span class="found-bottle-wave" aria-hidden="true"></span>
        <span class="found-bottle-visual" aria-hidden="true"></span>
        <span class="found-bottle-status">一只瓶子正慢慢靠近</span>
        <span class="found-bottle-hint">轻点打开</span>
      </button>
    `;
    return;
  }

  foundBottle.innerHTML = `
    <div class="found-bottle-top">
      <span>${escapeHtml(bottle.place)}</span>
      <span class="tide-mood">${escapeHtml(bottle.mood)}</span>
    </div>
    <p class="found-bottle-text">${escapeHtml(bottle.content)}</p>
    <p class="found-bottle-afterword">如果这句话碰到你，可以把一点光送回远方。</p>
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
  currentFoundBottle = nextBottle;
  foundBottleOpened = false;

  window.clearTimeout(pickArrivalTimer);
  screens.pick.dataset.pickState = "arriving";
  pickArrivalTimer = window.setTimeout(() => {
    if (!foundBottleOpened) {
      screens.pick.dataset.pickState = "ready";
    }
  }, 820);

  resetReplyState();
  appShell.classList.remove("is-blessing");
  renderFoundBottle(nextBottle);
  updateFoundLightButton();
}

function openFoundBottle() {
  if (!currentFoundBottle || foundBottleOpened) {
    return;
  }

  foundBottleOpened = true;
  window.clearTimeout(pickArrivalTimer);
  screens.pick.dataset.pickState = "open";
  renderFoundBottle(currentFoundBottle);
  updateFoundLightButton();
  showToast("瓶子里的话被海风展开了。");
}

function sendWarmReply(message) {
  if (!message || !foundBottle) {
    return;
  }

  if (!foundBottleOpened) {
    showToast("先轻轻打开这只瓶子。");
    return;
  }

  foundBottle.classList.add("is-lit");
  appShell.classList.remove("is-blessing");
  void appShell.offsetWidth;
  appShell.classList.add("is-blessing");
  document.querySelectorAll(".reply-chip").forEach((chip) => {
    chip.classList.toggle("is-selected", chip.dataset.reply === message);
  });

  if (replyResult) {
    replyResult.textContent = `“${message}” 这束光已经替你送到远方。`;
    replyResult.classList.add("is-visible");
    replyResult.style.opacity = "1";
    replyResult.style.transform = "translateY(0)";
  }
  showToast("你的回应被海风带走了。");

  window.setTimeout(() => {
    appShell.classList.remove("is-blessing");
  }, 2200);
}

function saveFoundLightToTide() {
  if (!currentFoundBottle || !foundBottleOpened) {
    showToast("先打开这只瓶子，再收藏这束光。");
    return;
  }

  if (hasSavedFoundLight(currentFoundBottle.id)) {
    updateFoundLightButton();
    showToast("这束光已经在情绪潮汐里了。");
    return;
  }

  const bottles = readBottles();
  const savedBottle = {
    id: createBottleId(),
    content: `我在海边捡到一句话：\n${currentFoundBottle.content}`,
    mood: "拾光",
    createdAt: new Date().toISOString(),
    scene: currentFoundBottle.place,
    status: "found_light",
    sourceId: currentFoundBottle.id,
  };

  const saved = saveBottles([savedBottle, ...bottles]);
  if (!saved) {
    showToast("这台设备暂时没有收好这束光。");
    return;
  }

  updateFoundLightButton();
  showToast("这束光已经收进情绪潮汐。");
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
    id: createBottleId(),
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

  const shareButton = event.target.closest("[data-open-share]");
  if (shareButton) {
    openSharePanel();
    return;
  }

  const openFoundButton = event.target.closest("[data-open-found]");
  if (openFoundButton) {
    openFoundBottle();
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
if (nextOnboarding) {
  nextOnboarding.addEventListener("click", advanceOnboarding);
}
if (skipOnboarding) {
  skipOnboarding.addEventListener("click", closeOnboarding);
}
if (openShareSheet) {
  openShareSheet.addEventListener("click", openSharePanel);
}
if (closeShareSheet) {
  closeShareSheet.addEventListener("click", closeSharePanel);
}
if (shareSheet) {
  shareSheet.addEventListener("click", (event) => {
    if (event.target === shareSheet) {
      closeSharePanel();
    }
  });
}
if (copyShareLink) {
  copyShareLink.addEventListener("click", () => copyText(INVITE_URL, "邀请链接已经复制。"));
}
if (nativeShare) {
  nativeShare.addEventListener("click", shareInvite);
}
if (installAppButton) {
  installAppButton.addEventListener("click", installApp);
}
if (copyFeedback) {
  copyFeedback.addEventListener("click", () => copyText(buildFeedbackTemplate(), "反馈文案已经复制。"));
}
if (soundToggle) {
  soundToggle.addEventListener("click", toggleOceanSound);
}
if (pickAnother) {
  pickAnother.addEventListener("click", pickBottle);
}
if (saveFoundLight) {
  saveFoundLight.addEventListener("click", saveFoundLightToTide);
}
window.addEventListener("beforeinstallprompt", (event) => {
  event.preventDefault();
  deferredInstallPrompt = event;
});
window.addEventListener("appinstalled", () => {
  deferredInstallPrompt = null;
  showToast("海洋漂流瓶已经留在桌面上了。");
});
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
switchView("home");
registerServiceWorker();
window.setTimeout(showOnboarding, 460);

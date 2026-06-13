const TIDE_DETAIL_STORAGE_KEY = "oceanBottle.v0.bottles";

const detailScreen = document.getElementById("detailScreen");
const detailDate = document.getElementById("detailDate");
const detailScene = document.getElementById("detailScene");
const detailBottle = document.getElementById("detailBottle");
const tideDetailList = document.getElementById("tideList");
const selfReplyInput = document.getElementById("selfReplyInput");
const selfReplyCount = document.getElementById("selfReplyCount");
const selfReplyError = document.getElementById("selfReplyError");
const saveSelfReply = document.getElementById("saveSelfReply");

let currentDetailBottleId = null;
let tideListObserver = null;

function readTideBottles() {
  try {
    const raw = localStorage.getItem(TIDE_DETAIL_STORAGE_KEY);
    const parsed = raw ? JSON.parse(raw) : [];
    return Array.isArray(parsed) ? parsed : [];
  } catch (error) {
    return [];
  }
}

function saveTideBottles(bottles) {
  try {
    localStorage.setItem(TIDE_DETAIL_STORAGE_KEY, JSON.stringify(bottles));
    return true;
  } catch (error) {
    return false;
  }
}

function tideEscapeHtml(value) {
  return String(value || "")
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function tideFormatDate(value) {
  const date = new Date(value);
  const month = `${date.getMonth() + 1}`.padStart(2, "0");
  const day = `${date.getDate()}`.padStart(2, "0");
  const hour = `${date.getHours()}`.padStart(2, "0");
  const minute = `${date.getMinutes()}`.padStart(2, "0");
  return `${month}.${day} ${hour}:${minute}`;
}

function setTideScreenVisibility(screen, isActive) {
  if (!screen) {
    return;
  }

  screen.classList.toggle("is-active", isActive);
  screen.style.opacity = isActive ? "1" : "0";
  screen.style.visibility = isActive ? "visible" : "hidden";
  screen.style.transform = isActive ? "translateY(0)" : "translateY(0.8rem)";
  screen.style.pointerEvents = isActive ? "auto" : "none";
}

function showTideView(view) {
  document.querySelectorAll(".screen").forEach((screen) => {
    setTideScreenVisibility(screen, screen.id === `${view}Screen`);
  });

  if (window.appShell) {
    window.appShell.dataset.view = view;
  } else {
    document.querySelector(".app-shell").dataset.view = view;
  }

  if (view === "tide") {
    renderEnhancedTide();
  }

  if (view === "compose") {
    window.setTimeout(() => document.getElementById("messageInput").focus({ preventScroll: true }), 240);
  } else if (selfReplyInput) {
    selfReplyInput.blur();
  }
}

function renderEnhancedTide() {
  if (!tideDetailList) {
    return;
  }

  if (tideListObserver) {
    tideListObserver.disconnect();
  }

  const bottles = readTideBottles().sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt));

  if (!bottles.length) {
    tideDetailList.innerHTML = `
      <div class="empty-tide">
        这里还没有漂流瓶。等你准备好了，可以先把一句话交给今晚的海。
      </div>
    `;
  } else {
    tideDetailList.innerHTML = bottles
      .map((bottle) => {
        const id = tideEscapeHtml(bottle.id);
        const mood = tideEscapeHtml(bottle.mood || "未命名潮汐");
        const content = tideEscapeHtml(bottle.content);
        const hasReply = bottle.selfReply && bottle.selfReply.content;

        return `
          <article class="tide-card tide-card-action" data-open-id="${id}" tabindex="0" role="button" aria-label="打开这只漂流瓶回望">
            <div class="tide-card-head">
              <span>${tideFormatDate(bottle.createdAt)}</span>
              <div class="tide-card-tools">
                ${hasReply ? '<span class="tide-reply-mark">已回信</span>' : ""}
                <span class="tide-mood">${mood}</span>
                <button class="open-bottle" type="button" data-open-id="${id}" aria-label="回望这只瓶子">回望</button>
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

  if (tideListObserver) {
    tideListObserver.observe(tideDetailList, { childList: true });
  }
}

function findTideBottle(id) {
  return readTideBottles().find((bottle) => bottle.id === id) || null;
}

function updateSelfReplyState() {
  if (!selfReplyInput || !selfReplyCount || !selfReplyError) {
    return;
  }

  selfReplyCount.textContent = `${selfReplyInput.value.length} / 360`;
  selfReplyError.textContent = "";
  selfReplyError.classList.remove("is-visible");
}

function renderBottleDetail(id) {
  if (!detailBottle) {
    return;
  }

  const bottle = findTideBottle(id);
  if (!bottle) {
    currentDetailBottleId = null;
    showToast("这只瓶子已经不在潮汐里了。");
    showTideView("tide");
    return;
  }

  currentDetailBottleId = id;
  const reply = bottle.selfReply && bottle.selfReply.content ? bottle.selfReply : null;

  detailDate.textContent = tideFormatDate(bottle.createdAt);
  detailScene.textContent = bottle.scene || "威海黄昏灯塔海岸";
  detailBottle.innerHTML = `
    <div class="detail-bottle-meta">
      <span class="tide-mood">${tideEscapeHtml(bottle.mood || "未命名潮汐")}</span>
      <span>${bottle.status === "kept_by_sea" ? "海替你保管着" : "本地潮汐"}</span>
    </div>
    <p class="detail-content">${tideEscapeHtml(bottle.content)}</p>
    ${
      reply
        ? `<div class="saved-self-reply">
            <span>后来写给自己的话</span>
            <p>${tideEscapeHtml(reply.content)}</p>
            <small>${tideFormatDate(reply.createdAt)}</small>
          </div>`
        : `<div class="saved-self-reply is-empty">现在的你还没有给那时的自己回信。</div>`
    }
  `;

  selfReplyInput.value = reply ? reply.content : "";
  updateSelfReplyState();
}

function openBottleDetail(id) {
  currentDetailBottleId = id;
  renderBottleDetail(id);
  showTideView("detail");
}

function saveCurrentSelfReply() {
  if (!currentDetailBottleId || !selfReplyInput || !selfReplyError) {
    return;
  }

  const content = selfReplyInput.value.trim();
  if (!content) {
    selfReplyError.textContent = "先写一句给那时的自己吧。";
    selfReplyError.classList.add("is-visible");
    selfReplyInput.focus();
    return;
  }

  const bottles = readTideBottles();
  const index = bottles.findIndex((bottle) => bottle.id === currentDetailBottleId);
  if (index === -1) {
    showToast("这只瓶子已经不在潮汐里了。");
    showTideView("tide");
    return;
  }

  bottles[index] = {
    ...bottles[index],
    selfReply: {
      content,
      createdAt: new Date().toISOString(),
    },
  };

  if (!saveTideBottles(bottles)) {
    selfReplyError.textContent = "这台设备暂时没有收好这句话。可以稍后再试一次。";
    selfReplyError.classList.add("is-visible");
    return;
  }

  renderBottleDetail(currentDetailBottleId);
  renderEnhancedTide();
  showToast("这句话已经留给那时的自己。");
}

document.addEventListener("click", (event) => {
  const actionButton = event.target.closest("[data-action]");
  if (detailScreen && detailScreen.classList.contains("is-active") && actionButton) {
    event.preventDefault();
    event.stopImmediatePropagation();
    showTideView(actionButton.dataset.action);
    return;
  }
}, true);

document.addEventListener("click", (event) => {
  const openButton = event.target.closest("[data-open-id]");
  if (!openButton) {
    return;
  }

  event.preventDefault();
  openBottleDetail(openButton.dataset.openId);
});

document.addEventListener("keydown", (event) => {
  if (event.key !== "Enter" && event.key !== " ") {
    return;
  }

  const tideCard = event.target.closest(".tide-card-action");
  if (!tideCard || !tideCard.dataset.openId) {
    return;
  }

  event.preventDefault();
  openBottleDetail(tideCard.dataset.openId);
});

if (selfReplyInput) {
  selfReplyInput.addEventListener("input", updateSelfReplyState);
}

if (saveSelfReply) {
  saveSelfReply.addEventListener("click", saveCurrentSelfReply);
}

if (tideDetailList) {
  tideListObserver = new MutationObserver(() => {
    if (document.querySelector(".app-shell").dataset.view !== "tide") {
      return;
    }

    renderEnhancedTide();
  });
  tideListObserver.observe(tideDetailList, { childList: true });
}

renderEnhancedTide();
updateSelfReplyState();

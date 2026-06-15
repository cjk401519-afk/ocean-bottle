(function () {
  if (window.__oceanBottleEchoBridge || typeof window.showLighthouseEcho === "function") {
    return;
  }

  window.__oceanBottleEchoBridge = true;

  const appShell = document.querySelector(".app-shell");
  const sendBottle = document.getElementById("sendBottle");
  const messageInput = document.getElementById("messageInput");
  const errorMessage = document.getElementById("errorMessage");
  const lighthouseEcho = document.getElementById("lighthouseEcho");
  const echoMood = document.getElementById("echoMood");
  const echoText = document.getElementById("echoText");
  const echoContinue = document.getElementById("echoContinue");
  const originalSwitchView = window.switchView;

  if (!appShell || !sendBottle || !messageInput || !lighthouseEcho || !echoMood || !echoText) {
    return;
  }

  const lighthouseEchoes = {
    疲惫: [
      "今晚先不用发光。海已经替你把这份疲惫收好，等你睡醒一点，再慢慢回来。",
      "你已经撑过很多看不见的浪了。灯塔亮着，不是催你靠岸，只是陪你确认方向还在。",
      "把今天放下吧。没做完的事不会因此消失，但你可以先从它们手里回来一会儿。",
    ],
    想念: [
      "有些想念会像潮声一样回来。你不必赶它走，也不必被它带走。",
      "海知道那些没说出口的话。它会替你把温柔留在夜色里，不让它变成责怪。",
      "认真想念过，本身就说明你曾经很真诚。今晚先把这份真诚轻轻放下。",
    ],
    迷茫: [
      "看不清的时候，可以先不急着选方向。灯塔只照亮一点点海面，也足够船慢慢走。",
      "迷茫不是停住了，只是雾比平时重。等风来一点，你会重新看见脚下的路。",
      "答案不用今晚出现。先把呼吸安顿好，明天也许会多一点亮处。",
    ],
    委屈: [
      "你不需要把委屈解释得很完整。海已经听见了，也没有要求你立刻坚强。",
      "有些难过不是你太敏感，而是你真的忍了很久。今晚可以先承认它。",
      "灯塔不会追问原因，它只是亮着。你也可以先被这样安静地照顾一会儿。",
    ],
    平静: [
      "这一刻的平静很珍贵。海会替你把它收好，等以后想起时，还能摸到一点温度。",
      "愿今晚的风慢一点，潮声轻一点。你可以什么都不证明，只是好好经过。",
      "如果此刻已经安静下来，就让这份安静多停一会儿。它也是一种小小的抵达。",
    ],
  };

  let pendingEcho = false;
  let echoVisible = false;
  let pendingMood = "疲惫";
  let echoTimer = null;

  function getSelectedMood() {
    const selected = document.querySelector(".mood-chip.is-selected");
    return selected && selected.dataset.mood ? selected.dataset.mood : "疲惫";
  }

  function pickLighthouseEcho(mood) {
    const lines = lighthouseEchoes[mood] || lighthouseEchoes.疲惫;
    return lines[Math.floor(Math.random() * lines.length)];
  }

  function hideLighthouseEcho() {
    window.clearTimeout(echoTimer);
    echoTimer = null;
    echoVisible = false;
    lighthouseEcho.classList.add("is-hidden");
    appShell.classList.remove("is-echoing", "is-blessing");
  }

  function finishLighthouseEcho() {
    pendingEcho = false;
    hideLighthouseEcho();

    if (typeof originalSwitchView === "function") {
      originalSwitchView("tide");
    }
  }

  function showLighthouseEchoBridge() {
    if (!pendingEcho || echoVisible) {
      return;
    }

    echoVisible = true;
    window.clearTimeout(echoTimer);
    echoMood.textContent = `${pendingMood}的灯塔回声`;
    echoText.textContent = pickLighthouseEcho(pendingMood);
    lighthouseEcho.classList.remove("is-hidden");
    appShell.classList.remove("is-echoing", "is-blessing");
    void appShell.offsetWidth;
    appShell.classList.add("is-echoing", "is-blessing");
    messageInput.blur();
    echoTimer = window.setTimeout(finishLighthouseEcho, 4200);
  }

  if (typeof originalSwitchView === "function") {
    window.switchView = function patchedSwitchView(view) {
      if (view === "tide" && pendingEcho) {
        showLighthouseEchoBridge();
        return;
      }

      return originalSwitchView.apply(this, arguments);
    };
  }

  sendBottle.addEventListener("click", () => {
    if (!messageInput.value.trim()) {
      return;
    }

    if (errorMessage && errorMessage.classList.contains("is-visible")) {
      return;
    }

    pendingMood = getSelectedMood();
    pendingEcho = true;
    window.setTimeout(showLighthouseEchoBridge, 760);
  });

  if (echoContinue) {
    echoContinue.addEventListener("click", finishLighthouseEcho);
  }
})();

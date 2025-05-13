console.log("Mitt script laddades! v6");

// ─────────────────────────────
// Hjälpfunktioner
// ─────────────────────────────
function isMobileDevice() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function waitFrames(n) {
  return new Promise((resolve) => {
    function step(framesLeft) {
      if (framesLeft <= 0) {
        resolve();
      } else {
        requestAnimationFrame(() => step(framesLeft - 1));
      }
    }
    step(n);
  });
}

// ─────────────────────────────
// Transition: index -> case
// ─────────────────────────────
async function indexToCaseTransition(data) {
  const clickedLink = data.trigger;
  if (!clickedLink) {
    return;
  }
  let wrapperEl = clickedLink.querySelector(".cc-img_wrapper");
  if (!wrapperEl) {
    wrapperEl = clickedLink.querySelector("img");
    if (!wrapperEl) {
      return;
    }
  }
  const rect = wrapperEl.getBoundingClientRect();
  const startBorderRadius = getComputedStyle(wrapperEl).borderRadius || "1.5rem";
  const cloneWrapper = wrapperEl.cloneNode(true);
  Object.assign(cloneWrapper.style, {
    position: "fixed",
    top: rect.top + "px",
    left: rect.left + "px",
    width: rect.width + "px",
    height: rect.height + "px",
    borderRadius: startBorderRadius,
    overflow: "hidden",
    zIndex: 9998,
    maxHeight: "none",
  });
  document.body.appendChild(cloneWrapper);
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#ffffff",
    opacity: 0,
    zIndex: 9990,
  });
  document.body.appendChild(overlay);
  let targetTop, targetLeft, targetWidth, targetHeight;
  if (isMobileDevice()) {
    const rem = parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const sideMargin = rem;
    targetWidth = window.innerWidth - 2 * sideMargin;
    targetHeight = targetWidth * (3 / 4);
    targetLeft = sideMargin;
    targetTop = "6rem";
  } else {
    targetHeight = window.innerHeight * 0.7;
    targetWidth = targetHeight * (4 / 3);
    targetLeft = (window.innerWidth - targetWidth) / 2;
    targetTop = window.innerHeight * 0.1;
  }
  const targetBorderRadius = isMobileDevice() ? "0.125rem" : "0.125rem";
  const DURATION = 0.8;
  const EASING = "expo.inOut";
  const tl = gsap.timeline();
  tl.to(overlay, { opacity: 1, duration: 0.3, ease: EASING }, 0);
  tl.to(
    cloneWrapper,
    {
      top: targetTop,
      left: targetLeft,
      width: targetWidth,
      height: targetHeight,
      borderRadius: targetBorderRadius,
      duration: DURATION,
      ease: EASING,
    },
    0
  );
  await Promise.all([tl.then()]);
  overlay.remove();
  cloneWrapper.remove();
}

// ─────────────────────────────
// Transition: case -> index
// ─────────────────────────────
async function caseToIndexTransition(data) {
  // Pixelbump för att trigga addressbar på mobil
  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    window.scrollTo(0, window.scrollY - 1);
  }

  // Spara scrollposition
  const savedCaseScrollY = window.scrollY || document.documentElement.scrollTop;

  // Klona index-container och lägg bakom case
  const indexClone = data.next.container.cloneNode(true);
  Object.assign(indexClone.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    zIndex: 0,
    overflow: "hidden",
    pointerEvents: "none"
  });
  document.body.appendChild(indexClone);

  // Sätt case ovanpå
  Object.assign(data.current.container.style, {
    position: "relative",
    zIndex: 1
  });

  // Vänta två animation frames så att DOM hinner uppdateras
  await new Promise(resolve => requestAnimationFrame(() => requestAnimationFrame(resolve)));

  // Fade ut case
  await gsap.to(data.current.container, { autoAlpha: 0, duration: 0.5 });

  // Ta bort klonen
  indexClone.remove();

  // Återställ stilar
  Object.assign(data.current.container.style, {
    position: "",
    zIndex: ""
  });
  Object.assign(data.next.container.style, {
    position: "",
    zIndex: ""
  });

  // Scrolla till toppen på index
  window.scrollTo(0, 0);
}

// ─────────────────────────────
// Initiera Barba Transitions
// ─────────────────────────────
function initTransitions() {
  barba.init({
    preventRunning: true,
    transitions: [
      {
        name: "index-to-case",
        from: { namespace: ["index"] },
        to: { namespace: ["case"] },
        async leave(data) {
          await indexToCaseTransition(data);
        },
        enter(data) {
          gsap.to(data.next.container, {
            autoAlpha: 1,
            duration: 0.3,
            delay: 0,
          });
          window.scrollTo(0, 0);
        },
      },
      {
        name: "case-to-index",
        from: { namespace: ["case"] },
        to: { namespace: ["index"] },
        async leave(data) {
          await caseToIndexTransition(data);
        },
        enter(data) {
          gsap.to(data.next.container, {
            autoAlpha: 1,
            duration: 0.3,
            delay: 0,
          });
          window.scrollTo(0, 0);
        },
      },
    ],
  });
}

window.addEventListener("DOMContentLoaded", function () {
  initTransitions();
});

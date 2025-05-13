// ─────────────────────────────
// Globala variabler
// ─────────────────────────────
let savedIndexScrollPosition = 0;

// ─────────────────────────────
// Stäng av browserns scrollRestoration
// ─────────────────────────────
window.history.scrollRestoration = "manual";

// ─────────────────────────────
// Barba Hooks för att spara scrollposition
// ─────────────────────────────
barba.hooks.beforeLeave(({ current }) => {
  if (current.container.getAttribute("data-barba-namespace") === "index") {
    savedIndexScrollPosition =
      window.scrollY || document.documentElement.scrollTop;
    console.log("Saved index scroll position:", savedIndexScrollPosition);
  }
});

// ─────────────────────────────
// Hjälpfunktioner
// ─────────────────────────────
// Mobile detection (max-width: 767px)
function isMobileDevice() {
  return window.matchMedia("(max-width: 767px)").matches;
}

function fadeInContainer(container) {
  let isMobile = isMobileDevice();
  let delay = isMobile ? 0.1 : 0.1;
  if (!isMobile) {
    gsap.set(container, { transform: "translateZ(0)" });
  } else {
    gsap.set(container, { clearProps: "transform" });
  }
  gsap.to(container, { autoAlpha: 1, duration: 0.5, delay: delay });
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
// reinitMedia: Video + "Nya" Lottie
// ─────────────────────────────
async function reinitMedia() {
  await waitFrames(2);
  document.querySelectorAll("video[autoplay]").forEach((video) => {
    video.muted = true;
    video.setAttribute("playsinline", "");
    video.currentTime = 0;
    video.play().catch((err) => console.log("Video play error:", err));
  });
  const lottieDivs = document.querySelectorAll(
    '[data-animation-type="lottie"]'
  );
  console.log("Found new-lottie elements:", lottieDivs.length);
  if (
    window.Webflow &&
    window.Webflow.lottie &&
    typeof window.Webflow.lottie.createInstances === "function"
  ) {
    window.Webflow.lottie.createInstances();
    console.log("window.Webflow.lottie.createInstances() called!");
  } else {
    console.warn(
      "Ingen window.Webflow.lottie.createInstances – kan ej initiera nya lottie!"
    );
  }
}

// ─────────────────────────────
// resetWebflow
// ─────────────────────────────
function resetWebflow(data) {
  setTimeout(() => {
    let parser = new DOMParser();
    let dom = parser.parseFromString(data.next.html, "text/html");
    let newHtml = dom.querySelector("html");
    if (newHtml && newHtml.hasAttribute("data-wf-page")) {
      let webflowPageId = newHtml.getAttribute("data-wf-page");
      document
        .querySelector("html")
        .setAttribute("data-wf-page", webflowPageId);
      console.log("Ny data-wf-page:", webflowPageId);
    }
    if (window.Webflow && window.Webflow.ready) {
      window.Webflow.ready();
    }
    if (window.Webflow && window.Webflow.require) {
      let ix2 = window.Webflow.require("ix2");
      if (ix2 && typeof ix2.init === "function") {
        ix2.init();
        console.log("Webflow IX2 reinitialized");
      }
    }
    reinitMedia();
  }, 200);
}

// ─────────────────────────────
// Transition Functions
// ─────────────────────────────

// profile -> index
async function profileToIndexTransition(data) {
  const overlayFadeDuration = 0.3;
  const scrollTop = window.scrollY || document.documentElement.scrollTop;
  const profileHeight = data.current.container.offsetHeight;

  Object.assign(data.current.container.style, {
    position: "fixed",
    top: "0",
    left: "0",
    width: "100%",
    height: `${profileHeight}px`,
    zIndex: 20,
    transform: `translateY(-${scrollTop}px)`,
    willChange: "transform, left",
  });

  const leavingNamespace = data.current.container.getAttribute(
    "data-barba-namespace"
  );
  if (leavingNamespace === "case" && savedIndexScrollPosition) {
    window.scrollTo(0, savedIndexScrollPosition);
  } else {
    window.scrollTo(0, 0);
  }

  const indexClone = data.next.container.cloneNode(true);
  Object.assign(indexClone.style, {
    position: "absolute",
    top: "0",
    left: "0",
    width: "100%",
    height: `${profileHeight}px`,
    zIndex: 10,
    opacity: 1,
    willChange: "transform",
  });

  if (leavingNamespace === "case" && savedIndexScrollPosition) {
    gsap.set(indexClone, { x: "-100%", y: -savedIndexScrollPosition });
  } else {
    gsap.set(indexClone, { x: "-100%", y: 0 });
  }
  document.body.appendChild(indexClone);

  const workOverlay = indexClone.querySelector(".work-overlay");
  if (workOverlay) {
    workOverlay.style.opacity = "1";
    workOverlay.style.zIndex = "15";
  }

  data.next.container.style.visibility = "hidden";
  await new Promise((resolve) => setTimeout(resolve, 0));
  await waitFrames(4);

  gsap.set(indexClone, { x: "-15%" });

  const timelineDefaults = isMobileDevice()
    ? { ease: "expo.inOut", duration: 0.8 }
    : { ease: "expo.inOut", duration: 0.8, force3D: true };

  const tl = gsap.timeline({ defaults: timelineDefaults });
  tl.to(data.current.container, { left: "100%" }, 0);
  tl.to(indexClone, { x: "0%" }, 0);

  if (workOverlay) {
    tl.to(workOverlay, { opacity: 0, duration: overlayFadeDuration }, 0);
  }

  await tl.then();

  window.scrollTo(
    0,
    leavingNamespace === "case" && savedIndexScrollPosition
      ? savedIndexScrollPosition
      : 0
  );

  indexClone.remove();
  data.next.container.style.visibility = "visible";

  console.log("Profile/Case → Index transition complete.");
}

// universal helper for index->profile / case->profile
async function indexToProfileTransitionHelper(data) {
  await new Promise((resolve) => setTimeout(resolve, 0));

  if (window.innerHeight + window.scrollY >= document.body.offsetHeight) {
    window.scrollTo(0, window.scrollY - 1);
  }

  const overlayFadeDuration = 0.3;
  const indexContainer = data.current.container;
  const rect = indexContainer.getBoundingClientRect();

  Object.assign(indexContainer.style, {
    position: "fixed",
    top: `${rect.top}px`,
    left: `${rect.left}px`,
    width: `${rect.width}px`,
    height: `${rect.height}px`,
    zIndex: 10,
    willChange: "left, transform",
  });

  const workOverlay = indexContainer.querySelector(".work-overlay");
  if (workOverlay) {
    workOverlay.style.opacity = "0";
  }

  let cloneContainer;
  if (data.next.container.getAttribute("data-barba-namespace") === "case") {
    const heroElement = data.next.container.querySelector(".hero-section");
    if (heroElement) {
      cloneContainer = document.createElement("div");
      cloneContainer.appendChild(heroElement.cloneNode(true));
      Object.assign(cloneContainer.style, {
        position: "absolute",
        top: "0",
        left: "100%",
        width: "100%",
        height: "100%",
        zIndex: 20,
        willChange: "left, transform",
      });
      document.body.appendChild(cloneContainer);
    } else {
      cloneContainer = data.next.container.cloneNode(true);
      Object.assign(cloneContainer.style, {
        position: "absolute",
        top: "0",
        left: "100%",
        width: "100%",
        height: "100%",
        zIndex: 20,
        willChange: "left, transform",
      });
      document.body.appendChild(cloneContainer);
    }
  } else {
    cloneContainer = data.next.container.cloneNode(true);
    Object.assign(cloneContainer.style, {
      position: "absolute",
      top: "0",
      left: "100%",
      width: "100%",
      height: "100%",
      zIndex: 20,
      willChange: "left, transform",
    });
    document.body.appendChild(cloneContainer);
  }

  data.next.container.style.visibility = "hidden";
  const targetLeft = rect.left - rect.width * 0.25;

  const timelineDefaults2 = isMobileDevice()
    ? { ease: "expo.inOut", duration: 0.8 }
    : { ease: "expo.inOut", duration: 0.8, force3D: true };

  const tl2 = gsap.timeline({ defaults: timelineDefaults2 });
  tl2.to(indexContainer, { left: targetLeft }, 0);
  tl2.to(cloneContainer, { left: "0%" }, 0);

  if (workOverlay) {
    tl2.to(workOverlay, { opacity: 0.7, duration: overlayFadeDuration }, 0);
  }

  await tl2.then();

  cloneContainer.remove();
  data.next.container.style.visibility = "visible";
  window.scrollTo(0, 0);
}

// index->profile
async function indexToProfileTransition(data) {
  let targetNamespace = data.next.container.getAttribute(
    "data-barba-namespace"
  );
  if (targetNamespace === "case") {
    await Promise.all([indexToProfileTransitionHelper(data)]);
  } else {
    await indexToProfileTransitionHelper(data);
  }
  console.log("Index → Profile/Case transition complete.");
}

// case->index
async function caseToIndexTransition(data) {
  await profileToIndexTransition(data);
}

// ─────────────────────────────
// NEW: index->case – Animate the image wrapper clone based on breakpoints.
// Desktop: The clone is animated to be centered with a 10vh top margin, a maximum height of 70vh,
// and its corner radius is tweened from its CSS start value to "0.5rem".
// Mobile: The clone is animated to be full width (with 1rem left/right margins) and positioned with a top margin of "8rem",
// and its corner radius is tweened from its CSS start value to "0.25rem".
async function indexToCaseTransition(data) {
  // 1) Identify the clicked .case-card link
  const clickedLink = data.trigger;
  if (!clickedLink) {
    console.warn("No data.trigger in index->case. Fallback to old transition.");
    return indexToProfileTransition(data);
  }
  // 2) Look for the image wrapper; fallback to <img> if needed
  let wrapperEl = clickedLink.querySelector(".cc-img_wrapper");
  if (!wrapperEl) {
    wrapperEl = clickedLink.querySelector("img");
    if (!wrapperEl) {
      console.warn(
        "No .cc-img_wrapper or <img> found in clicked .case-card. Fallback to old transition."
      );
      return indexToProfileTransition(data);
    }
  }

  // 3) Measure the wrapper's bounding box
  const rect = wrapperEl.getBoundingClientRect();

  // 3a) Get the computed start border radius from CSS (or default to "1.5rem")
  const startBorderRadius =
    getComputedStyle(wrapperEl).borderRadius || "1.5rem";

  // 4) Create a clone of the wrapper and fix its position (override CSS max-height)
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

  // 5) Create a black overlay behind the clone
  const overlay = document.createElement("div");
  Object.assign(overlay.style, {
    position: "fixed",
    top: 0,
    left: 0,
    width: "100vw",
    height: "100vh",
    backgroundColor: "#000000",
    opacity: 0,
    zIndex: 9990,
  });
  document.body.appendChild(overlay);

  // 6) Calculate target dimensions based on breakpoint
  let targetTop, targetLeft, targetWidth, targetHeight;
  if (isMobileDevice()) {
    const rem =
      parseFloat(getComputedStyle(document.documentElement).fontSize) || 16;
    const sideMargin = rem;
    targetWidth = window.innerWidth - 2 * sideMargin;
    targetHeight = targetWidth * (4 / 3);
    targetLeft = sideMargin;
    targetTop = "6rem";
  } else {
    targetHeight = window.innerHeight * 0.7;
    targetWidth = targetHeight * (3 / 4);
    targetLeft = (window.innerWidth - targetWidth) / 2;
    targetTop = window.innerHeight * 0.1;
  }

  // Determine target border radius based on breakpoint:
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
// Initiera Barba Transitions
// ─────────────────────────────
function initTransitions() {
  barba.init({
    preventRunning: true,
    transitions: [
      {
        name: "profile-to-index",
        from: { namespace: ["profile"] },
        to: { namespace: ["index"] },
        async leave(data) {
          await profileToIndexTransition(data);
        },
        enter(data) {
          if (
            data.next.container.getAttribute("data-barba-namespace") === "index"
          ) {
            fadeInContainer(data.next.container);
          } else {
            gsap.to(data.next.container, {
              autoAlpha: 1,
              duration: 0.3,
              delay: 0.1,
            });
          }
        },
        afterEnter(data) {
          resetWebflow(data);
        },
      },
      {
        name: "index-to-profile",
        from: { namespace: ["index", "case"] },
        to: { namespace: ["profile"] },
        async leave(data) {
          await indexToProfileTransition(data);
        },
        enter(data) {
          gsap.to(data.next.container, {
            autoAlpha: 1,
            duration: 0.3,
            delay: 0.3,
          });

          window.scrollTo(0, 0);
        },
        afterEnter(data) {
          resetWebflow(data);
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
          fadeInContainer(data.next.container);
        },
        afterEnter(data) {
          resetWebflow(data);
        },
      },
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
        afterEnter(data) {
          resetWebflow(data);
        },
      },
    ],
  });
}

window.addEventListener("DOMContentLoaded", function () {
  initTransitions();
});

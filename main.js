// ===== PROJECT DATA =====
var projectData = [
  {
    title: 'NEXO', category: 'UI Design',
    desc: 'This is a figma competition project. NEXO consists of a product and an app, the product detects environmental signals to measure if the atmosphere is stressful or joyful, and the app visualizes the data for users.',
    link: 'project1.html', side: 'left', image: 'nexoimg/1.png'
  },
  {
    title: 'Creative David', category: 'Web Design',
    desc: 'Every section of text is clickable! This webzine will use the statue of David as a medium to continuously collect derivative artworks inspired by David.',
    link: 'index_david.html', side: 'right', image: 'images/david.png'
  },
  {
    title: 'Chuhai GO', category: 'UI Design',
    desc: 'A landed project during my internship. Mainly focuses on gathering overseas information for companies or individuals.',
    link: 'project3.html', side: 'left', image: 'go/frontimg.png'
  },
  {
    title: 'Hidden Pulse', category: 'AR Design',
    desc: 'An AR project focusing on storytelling of the history and secret buried underneath the land of Hunter\'s Point in South San Francisco',
    link: 'project4.html', side: 'right', image: 'ar/head.png'
  },
  {
    title: 'Analog Photo Storage', category: 'UI Design',
    desc: 'An app to store photos and emotions for the redesigned disposable camera - a camera that uses AI to help users catch the word and emotion when they are taking photos.',
    link: 'project5.html', side: 'left', image: 'pj1/pj1front.png'
  },
  {
    title: 'Wind Guide', category: 'UI Design',
    desc: 'This is an app for users to experience map guiding in a different way, purposing another method of mapping.',
    link: 'project6.html', side: 'right', image: 'pj4/ft.png'
  }
];

// ===== MAIN PAGE =====
(function () {
  var heroLayer = document.getElementById('heroLayer');
  if (!heroLayer) return;

  var navLinks = document.querySelectorAll('.nav-link');
  var perspectiveContainer = document.getElementById('perspectiveContainer');
  var blocks = document.querySelectorAll('.block');
  var worksIntroLayer = document.getElementById('worksIntroLayer');
  var projectImageExpanded = document.getElementById('projectImageExpanded');
  var projectCardFloat = document.getElementById('projectCardFloat');
  var animationStage = document.getElementById('animationStage');
  var cardTitle = document.getElementById('cardTitle');
  var cardCategory = document.getElementById('cardCategory');
  var cardDesc = document.getElementById('cardDesc');
  var cardLink = document.getElementById('cardLink');
  var expandedImage = document.getElementById('expandedImage');

  var wh = window.innerHeight;
  var ww = window.innerWidth;
  var ticking = false;
  var currentProjectIndex = -1;

  // ===== SCROLL PHASES (vh) =====
  var HERO_FADE_START = 1;
  var HERO_FADE_END = 2;
  var WORKS_START = 2.5;
  var WORKS_END = 4.5;
  var PROJECTS_START = 5;
  var PROJECT_SCROLL = 3;
  var TOTAL_PROJECTS = 6;
  var TOTAL_END = PROJECTS_START + TOTAL_PROJECTS * PROJECT_SCROLL; // 23

  // ===== ONE-POINT PERSPECTIVE FLOOR CONFIG =====
  // Vanishing point = screen center (perspective-origin 50% 50%)
  // Blocks arranged from bottom of screen toward center, receding in depth.
  //
  // Each block's transform: translate(-50%, Y) translateZ(Z) rotateX(TILT)
  //   Y = screen-space offset below center (larger = lower)
  //   Z = depth (more negative = farther from camera)
  //   TILT = floor tilt angle
  //
  // Z values are calibrated so that each block arrives at Z ≈ -150
  // exactly when its project phase starts (with linear zoom).
  var BLOCK_TILT = 50;
  var TOTAL_ZOOM = 1200;

  // Per-block config: y offset (px below center), base z depth, width & height
  // Front block (0) is at bottom, closest & LARGEST
  // Back  block (5) is near center, farthest & SMALLEST
  var BLOCK_CONFIGS = [
    { y: 100, z: -390,  w: 360, h: 234 },   // Project 01 — largest, closest
    { y: 80,  z: -550,  w: 320, h: 208 },   // Project 02
    { y: 60,  z: -710,  w: 280, h: 182 },   // Project 03
    { y: 40,  z: -870,  w: 245, h: 159 },   // Project 04
    { y: 20,  z: -1030, w: 210, h: 136 },   // Project 05
    { y: 0,   z: -1190, w: 180, h: 117 }    // Project 06 — smallest, farthest (unchanged)
  ];

  // Apply per-block sizes & z-index (Project 01 = front/highest, Project 06 = back/lowest)
  for (var b = 0; b < blocks.length; b++) {
    blocks[b].style.width = BLOCK_CONFIGS[b].w + 'px';
    blocks[b].style.height = BLOCK_CONFIGS[b].h + 'px';
    blocks[b].style.zIndex = (TOTAL_PROJECTS - b).toString(); // 6,5,4,3,2,1
  }

  // Scale factor: blocks start at 1/5 size, grow to full with scroll
  var INITIAL_SCALE = 1 / 5;

  function clamp(v, lo, hi) { return Math.min(Math.max(v, lo), hi); }
  function lerp(a, b, t) { return a + (b - a) * t; }
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }

  function updateCardContent(idx) {
    if (idx === currentProjectIndex || idx < 0 || idx >= projectData.length) return;
    currentProjectIndex = idx;
    var d = projectData[idx];
    cardTitle.textContent = d.title;
    cardCategory.textContent = d.category;
    cardDesc.textContent = d.desc;
    cardLink.href = d.link;
    if (expandedImage && d.image) {
      expandedImage.src = d.image;
      expandedImage.alt = d.title + ' Image';
    }
  }

  function onScroll() {
    var scrollY = window.scrollY;
    wh = window.innerHeight;
    ww = window.innerWidth;
    var scrollVH = scrollY / wh;

    // ===== HERO =====
    if (scrollVH <= HERO_FADE_START) {
      heroLayer.style.opacity = '1';
    } else if (scrollVH <= HERO_FADE_END) {
      heroLayer.style.opacity = (1 - (scrollVH - HERO_FADE_START)).toString();
    } else {
      heroLayer.style.opacity = '0';
    }

    // ===== BLOCK ZOOM (continuous, linear) =====
    var zoomProgress = clamp((scrollVH - 0.5) / (TOTAL_END - 0.5), 0, 1);
    var zoomAmount = zoomProgress * TOTAL_ZOOM;

    // Consumed blocks (past projects)
    var consumed = 0;
    if (scrollVH > PROJECTS_START) {
      consumed = Math.min(Math.floor((scrollVH - PROJECTS_START) / PROJECT_SCROLL), TOTAL_PROJECTS);
    }

    // Active project
    var activeProj = -1;
    var wProj = 0;
    if (scrollVH >= PROJECTS_START && scrollVH < TOTAL_END) {
      var ps = scrollVH - PROJECTS_START;
      activeProj = Math.min(Math.floor(ps / PROJECT_SCROLL), TOTAL_PROJECTS - 1);
      wProj = (ps - activeProj * PROJECT_SCROLL) / PROJECT_SCROLL;
    }

    // ===== BLOCK SCALE (1/3 → 1 with scroll) =====
    var blockScale = INITIAL_SCALE + (1 - INITIAL_SCALE) * zoomProgress;

    // ===== UPDATE BLOCKS =====
    for (var i = 0; i < blocks.length; i++) {
      var cfg = BLOCK_CONFIGS[i];
      var z = cfg.z + zoomAmount;

      // Already consumed: hide
      if (i < consumed) {
        blocks[i].style.opacity = '0';
        blocks[i].style.transform = 'translate(-50%, ' + cfg.y + 'px) translateZ(500px) rotateX(0deg) scale(' + blockScale + ')';
        continue;
      }

      // Currently being animated (front block of active project)
      if (i === activeProj && i === consumed) {
        // Stand-up animation:
        // 0.0-0.20: block stands up (rotateX TILT→0), slight scale
        // 0.20-0.35: upright, fading out as expanded image appears
        // 0.35+: hidden
        if (wProj < 0.20) {
          var sp = easeOutCubic(wProj / 0.20);
          var tilt = BLOCK_TILT * (1 - sp);
          var sc = (1 + sp * 0.5) * blockScale;
          var yShift = -sp * 50;
          blocks[i].style.transform = 'translate(-50%, ' + (cfg.y + yShift) + 'px) translateZ(' + z + 'px) rotateX(' + tilt + 'deg) scale(' + sc + ')';
          blocks[i].style.opacity = '1';
        } else if (wProj < 0.35) {
          var fp = (wProj - 0.20) / 0.15;
          blocks[i].style.transform = 'translate(-50%, ' + (cfg.y - 50) + 'px) translateZ(' + z + 'px) rotateX(0deg) scale(' + (1.5 * blockScale) + ')';
          blocks[i].style.opacity = (1 - fp).toString();
        } else {
          blocks[i].style.opacity = '0';
        }
        continue;
      }

      // Normal queue position
      blocks[i].style.transform = 'translate(-50%, ' + cfg.y + 'px) translateZ(' + z + 'px) rotateX(' + BLOCK_TILT + 'deg) scale(' + blockScale + ')';

      // Opacity: dim during hero, full after, fade when near camera
      var baseOpacity = 1;
      if (scrollVH < HERO_FADE_START) {
        baseOpacity = 0.4; // subtle during hero
      } else if (scrollVH < HERO_FADE_END) {
        baseOpacity = lerp(0.4, 1, (scrollVH - HERO_FADE_START) / (HERO_FADE_END - HERO_FADE_START));
      }
      if (z > 100) {
        blocks[i].style.opacity = Math.max(0, baseOpacity * (1 - (z - 100) / 300)).toString();
      } else {
        blocks[i].style.opacity = baseOpacity.toString();
      }
    }

    // Dim perspective during active project image
    if (consumed >= TOTAL_PROJECTS) {
      perspectiveContainer.style.opacity = '0';
    } else if (activeProj >= 0 && wProj > 0.15 && wProj < 0.75) {
      var d1 = clamp((wProj - 0.15) / 0.2, 0, 1);
      var d2 = clamp((wProj - 0.55) / 0.2, 0, 1);
      var dim = d1 - d2;
      perspectiveContainer.style.opacity = (1 - dim * 0.5).toString();
    } else {
      perspectiveContainer.style.opacity = '1';
    }

    // ===== WORKS INTRO =====
    var wp = clamp((scrollVH - WORKS_START) / (WORKS_END - WORKS_START), 0, 1);
    if (wp > 0 && wp < 1) {
      var wo;
      if (wp < 0.35) wo = easeOutCubic(wp / 0.35);
      else if (wp > 0.7) wo = 1 - easeOutCubic((wp - 0.7) / 0.3);
      else wo = 1;
      worksIntroLayer.style.opacity = wo.toString();
      worksIntroLayer.style.transform = 'translateY(' + ((1 - easeOutCubic(wp)) * 50) + 'px)';
    } else {
      worksIntroLayer.style.opacity = '0';
    }

    // ===== PROJECT IMAGE + CARD =====
    if (activeProj >= 0 && activeProj < TOTAL_PROJECTS) {
      updateCardContent(activeProj);
      var data = projectData[activeProj];
      var isLeft = data.side === 'left';

      // Sub-phases:
      // 0.15-0.50: image expands to one side + card slides up
      // 0.50-0.60: PEAK hold
      // 0.60-0.80: exit
      var imgOp = 0, imgSc = 1, imgX = 0, imgY = 0;
      var cOp = 0, cY = 100, cTarget = 33;

      if (wProj >= 0.15 && wProj < 0.50) {
        var p = easeOutCubic((wProj - 0.15) / 0.35);
        imgOp = p;
        imgSc = 0.4 + p * 0.6;
        cOp = p;
        cY = lerp(100, cTarget, p);
      } else if (wProj >= 0.50 && wProj < 0.60) {
        imgOp = 1; imgSc = 1;
        cOp = 1; cY = cTarget;
      } else if (wProj >= 0.60 && wProj < 0.80) {
        var ep = easeInOutCubic((wProj - 0.60) / 0.20);
        imgOp = 1 - ep; imgSc = 1;
        imgX = isLeft ? -ep * 30 : ep * 30;
        imgY = ep * 40;
        cOp = 1 - ep;
        cY = lerp(cTarget, -30, ep);
      }

      projectImageExpanded.style.left = isLeft ? '6%' : 'auto';
      projectImageExpanded.style.right = isLeft ? 'auto' : '6%';
      projectImageExpanded.style.opacity = imgOp.toString();
      projectImageExpanded.style.transform = 'translate(' + imgX + '%, ' + imgY + '%) scale(' + imgSc + ')';

      projectCardFloat.style.left = isLeft ? 'auto' : '14%';
      projectCardFloat.style.right = isLeft ? '14%' : 'auto';
      projectCardFloat.style.opacity = cOp.toString();
      projectCardFloat.style.top = cY + '%';
    } else {
      projectImageExpanded.style.opacity = '0';
      projectCardFloat.style.opacity = '0';
    }

    // ===== ANIMATION STAGE VISIBILITY =====
    if (scrollVH > TOTAL_END + 0.5) {
      animationStage.style.opacity = '0';
      animationStage.style.pointerEvents = 'none';
    } else if (scrollVH > TOTAL_END) {
      animationStage.style.opacity = (1 - (scrollVH - TOTAL_END) / 0.5).toString();
      animationStage.style.pointerEvents = 'none';
    } else {
      animationStage.style.opacity = '1';
      animationStage.style.pointerEvents = '';
    }

    // ===== ACTIVE NAV =====
    var sec = 'home';
    if (scrollVH > TOTAL_END) {
      var ct = document.getElementById('contact');
      var ab = document.getElementById('about');
      if (ct && ct.getBoundingClientRect().top <= wh * 0.5) sec = 'contact';
      else if (ab && ab.getBoundingClientRect().top <= wh * 0.5) sec = 'about';
      else sec = 'projects';
    } else if (scrollVH > WORKS_START) sec = 'projects';

    for (var n = 0; n < navLinks.length; n++) {
      navLinks[n].classList.toggle('active', navLinks[n].dataset.section === sec);
    }

    ticking = false;
  }

  window.addEventListener('scroll', function () {
    if (!ticking) { requestAnimationFrame(onScroll); ticking = true; }
  });

  for (var i = 0; i < navLinks.length; i++) {
    navLinks[i].addEventListener('click', function (e) {
      e.preventDefault();
      var s = this.dataset.section;
      if (s === 'home') window.scrollTo({ top: 0, behavior: 'smooth' });
      else if (s === 'projects') window.scrollTo({ top: PROJECTS_START * wh, behavior: 'smooth' });
      else { var el = document.getElementById(s); if (el) el.scrollIntoView({ behavior: 'smooth' }); }
    });
  }

  window.addEventListener('resize', function () { wh = window.innerHeight; ww = window.innerWidth; });
  onScroll();
})();

// ===== DETAIL PAGE =====
(function () {
  var dn = document.querySelector('.detail-navbar');
  if (!dn) return;
  var lastY = 0;
  window.addEventListener('scroll', function () {
    var y = window.scrollY;
    if (y > lastY && y > 80) dn.classList.add('hidden');
    else dn.classList.remove('hidden');
    lastY = y;
  });
})();

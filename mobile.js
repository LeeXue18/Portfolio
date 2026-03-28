// ===== MOBILE.JS =====
// Mobile-responsive layer for LIYUNXUE Portfolio
// Loads BEFORE main.js and particles.js
// Does NOT modify existing desktop code logic — only adds mobile behaviour

(function () {
  'use strict';

  // --- MOBILE DETECTION ---
  if (window.innerWidth > 768) return;
  document.body.classList.add('is-mobile');

  // --- PREVENT DESKTOP SCRIPTS FROM RUNNING ---
  // Rename element IDs so desktop IIFEs in main.js and particles.js
  // cannot find their root elements and return early.
  var pc = document.getElementById('particleCanvas');
  if (pc) pc.id = 'particleCanvasDesktop';

  var hl = document.getElementById('heroLayer');
  if (hl) hl.id = 'heroLayerDesktop';

  // ===== HAMBURGER MENU =====
  var hamburger = document.getElementById('hamburgerBtn');
  var overlay = document.getElementById('mobileNavOverlay');

  if (hamburger && overlay) {
    hamburger.addEventListener('click', function () {
      var isOpen = hamburger.classList.toggle('active');
      overlay.classList.toggle('open', isOpen);
      document.body.classList.toggle('mobile-nav-open', isOpen);
    });

    var navItems = overlay.querySelectorAll('.mobile-nav-item');
    for (var i = 0; i < navItems.length; i++) {
      navItems[i].addEventListener('click', function (e) {
        e.preventDefault();
        hamburger.classList.remove('active');
        overlay.classList.remove('open');
        document.body.classList.remove('mobile-nav-open');
        var targetId = this.getAttribute('data-target');
        var el = document.getElementById(targetId);
        if (el) {
          setTimeout(function () {
            el.scrollIntoView({ behavior: 'smooth' });
          }, 50);
        }
      });
    }
  }

  // ===== GENERATE PROJECT CARDS =====
  // Deferred with setTimeout(0) because projectData lives in main.js,
  // which is loaded AFTER mobile.js.
  setTimeout(function () {
    var list = document.getElementById('mobileProjectList');
    if (!list || typeof projectData === 'undefined') return;

    var html = '';
    for (var i = 0; i < projectData.length; i++) {
      var p = projectData[i];
      html +=
        '<a href="' + p.link + '" class="mobile-project-card">' +
          '<div class="mobile-card-image">' +
            '<img src="' + p.image + '" alt="' + p.title + '" loading="lazy">' +
          '</div>' +
          '<div class="mobile-card-info">' +
            '<div class="mobile-card-meta">' +
              '<h3 class="mobile-card-title">' + p.title + '</h3>' +
              '<p class="mobile-card-category">' + p.category + '</p>' +
            '</div>' +
            '<span class="mobile-card-explore">' +
              'EXPLORE ' +
              '<svg width="14" height="14" viewBox="0 0 24 24" fill="none">' +
                '<line x1="4" y1="12" x2="20" y2="12" stroke="white" stroke-width="2" stroke-linecap="round"/>' +
                '<polyline points="14,6 20,12 14,18" stroke="white" stroke-width="2" stroke-linecap="round" stroke-linejoin="round" fill="none"/>' +
              '</svg>' +
            '</span>' +
          '</div>' +
        '</a>';
    }
    list.innerHTML = html;
  }, 0);

  // ===== MOBILE PARTICLE SPHERE (non-interactive, auto-rotating) =====
  function createMobileParticles(containerId, particleCount, sphereRadius) {
    var container = document.getElementById(containerId);
    if (!container || typeof THREE === 'undefined') return;
    if (container.clientWidth === 0 || container.clientHeight === 0) return;

    particleCount = particleCount || 1200;
    sphereRadius = sphereRadius || 120;
    var ringCount = Math.floor(particleCount * 0.25);
    var total = particleCount + ringCount;

    var w = container.clientWidth, h = container.clientHeight;
    var scene = new THREE.Scene();
    var camera = new THREE.PerspectiveCamera(60, w / h, 1, 2000);
    camera.position.z = 400;

    var renderer = new THREE.WebGLRenderer({ antialias: false, alpha: true });
    renderer.setSize(w, h);
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 1.5));
    renderer.setClearColor(0x000000, 0);
    container.appendChild(renderer.domElement);

    var geo = new THREE.BufferGeometry();
    var pos = new Float32Array(total * 3);
    var col = new Float32Array(total * 3);

    var BLUE  = new THREE.Color(0x0077C0);
    var LBLUE = new THREE.Color(0x40A8E0);
    var golden = Math.PI * (3 - Math.sqrt(5));

    // Fibonacci sphere
    for (var i = 0; i < particleCount; i++) {
      var y  = 1 - (i / (particleCount - 1)) * 2;
      var r  = Math.sqrt(1 - y * y);
      var th = golden * i;
      var j  = 1 + (Math.random() - 0.5) * 0.08;

      pos[i * 3]     = Math.cos(th) * r * sphereRadius * j;
      pos[i * 3 + 1] = y * sphereRadius * j;
      pos[i * 3 + 2] = Math.sin(th) * r * sphereRadius * j;

      var s = 0.85 + Math.random() * 0.15;
      col[i * 3]     = BLUE.r * s;
      col[i * 3 + 1] = BLUE.g * s;
      col[i * 3 + 2] = BLUE.b * s;
    }

    // Planetary ring
    var ri = sphereRadius * 1.35, ro = sphereRadius * 1.85;
    var tilt = -20 * Math.PI / 180;
    var cT = Math.cos(tilt), sT = Math.sin(tilt);

    for (var k = 0; k < ringCount; k++) {
      var idx = particleCount + k;
      var a   = (k / ringCount) * Math.PI * 2 + Math.random() * 0.1;
      var rr  = ri + Math.random() * (ro - ri);
      var yo  = (Math.random() - 0.5) * 6;
      var rx  = Math.cos(a) * rr;
      var ry  = yo;
      var rz  = Math.sin(a) * rr;

      pos[idx * 3]     = rx;
      pos[idx * 3 + 1] = ry * cT - rz * sT;
      pos[idx * 3 + 2] = ry * sT + rz * cT;

      var rs = 0.7 + Math.random() * 0.3;
      col[idx * 3]     = LBLUE.r * rs;
      col[idx * 3 + 1] = LBLUE.g * rs;
      col[idx * 3 + 2] = LBLUE.b * rs;
    }

    geo.setAttribute('position', new THREE.BufferAttribute(pos, 3));
    geo.setAttribute('color',    new THREE.BufferAttribute(col, 3));

    var mat = new THREE.PointsMaterial({
      size: 1.8,
      vertexColors: true,
      transparent: true,
      opacity: 0.85,
      sizeAttenuation: true,
      blending: THREE.AdditiveBlending,
      depthWrite: false
    });

    var pts = new THREE.Points(geo, mat);
    scene.add(pts);

    function animate() {
      requestAnimationFrame(animate);
      pts.rotation.y += 0.0003;
      renderer.render(scene, camera);
    }
    animate();

    window.addEventListener('resize', function () {
      var nw = container.clientWidth, nh = container.clientHeight;
      if (nw > 0 && nh > 0) {
        camera.aspect = nw / nh;
        camera.updateProjectionMatrix();
        renderer.setSize(nw, nh);
      }
    });
  }

  // Create particle spheres for mobile hero + contact sections
  createMobileParticles('mobileParticles', 1200, 120);
  createMobileParticles('mobileContactParticles', 800, 80);

  // ===== DETAIL PAGE: modify back link to point at portfolio view =====
  var detailBack = document.querySelector('.detail-back');
  if (detailBack) {
    detailBack.setAttribute('href', 'index.html#mobilePortfolio');
  }

  // ===== SCROLL TO HASH on load (for returning from detail pages) =====
  if (window.location.hash) {
    setTimeout(function () {
      var hashEl = document.getElementById(window.location.hash.substring(1));
      if (hashEl) hashEl.scrollIntoView();
    }, 200);
  }

})();

(function () {
  var container = document.getElementById('particleCanvas');
  if (!container) return;

  // --- CONFIG ---
  var SPHERE_COUNT = 3000;
  var RING_COUNT = 800;
  var TOTAL = SPHERE_COUNT + RING_COUNT;
  var SPHERE_RADIUS = 220;
  var RING_INNER = SPHERE_RADIUS * 1.35;
  var RING_OUTER = SPHERE_RADIUS * 1.85;
  var RING_THICKNESS = 8;
  var PARTICLE_SIZE = 2.2;
  var BLUE_COLOR = new THREE.Color(0x0077C0);
  var LIGHT_BLUE = new THREE.Color(0x40A8E0);
  var WHITE_COLOR = new THREE.Color(0xffffff);

  // Hover scatter
  var SCATTER_RADIUS = 100;
  var SCATTER_STRENGTH = 150;
  var HOVER_LERP = 0.2;
  var RETURN_SPEED = 0.015;
  var COLOR_RETURN_SPEED = 0.012;
  var SCATTER_HOLD = 3000;

  // Click explosion (global)
  var EXPLODE_STRENGTH = 350;
  var EXPLODE_SCATTER_DURATION = 4000; // 4s to scatter + turn white
  var EXPLODE_REFORM_DURATION = 3000;  // 3s to reform + turn blue

  var SLOW_ROTATE_SPEED = 0.0003;

  // --- THREE.JS SETUP ---
  var scene = new THREE.Scene();
  var camera = new THREE.PerspectiveCamera(60, container.clientWidth / container.clientHeight, 1, 2000);
  camera.position.z = 600;

  var renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setSize(container.clientWidth, container.clientHeight);
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2));
  renderer.setClearColor(0x000000, 0);
  container.appendChild(renderer.domElement);

  // --- HELPERS ---
  function easeOutCubic(t) { return 1 - Math.pow(1 - t, 3); }
  function easeInOutCubic(t) { return t < 0.5 ? 4*t*t*t : 1 - Math.pow(-2*t+2, 3)/2; }
  function lerp(a, b, t) { return a + (b - a) * t; }

  // --- GENERATE PARTICLES ---
  var geometry = new THREE.BufferGeometry();
  var positions = new Float32Array(TOTAL * 3);
  var colors = new Float32Array(TOTAL * 3);
  var origPositions = new Float32Array(TOTAL * 3);
  var origColors = new Float32Array(TOTAL * 3);

  // Per-particle hover state
  var scattered = new Float32Array(TOTAL);
  var scatterTimers = new Float32Array(TOTAL);

  // Global explosion state
  var explodeActive = false;
  var explodeStartTime = 0;
  var explodeTargets = new Float32Array(TOTAL * 3); // where particles fly to

  // Fibonacci sphere
  var goldenAngle = Math.PI * (3 - Math.sqrt(5));
  for (var i = 0; i < SPHERE_COUNT; i++) {
    var y = 1 - (i / (SPHERE_COUNT - 1)) * 2;
    var radiusAtY = Math.sqrt(1 - y * y);
    var theta = goldenAngle * i;
    var jitter = 1 + (Math.random() - 0.5) * 0.08;

    var px = Math.cos(theta) * radiusAtY * SPHERE_RADIUS * jitter;
    var py = y * SPHERE_RADIUS * jitter;
    var pz = Math.sin(theta) * radiusAtY * SPHERE_RADIUS * jitter;

    positions[i * 3] = px;
    positions[i * 3 + 1] = py;
    positions[i * 3 + 2] = pz;
    origPositions[i * 3] = px;
    origPositions[i * 3 + 1] = py;
    origPositions[i * 3 + 2] = pz;

    var shade = 0.85 + Math.random() * 0.15;
    colors[i * 3] = BLUE_COLOR.r * shade;
    colors[i * 3 + 1] = BLUE_COLOR.g * shade;
    colors[i * 3 + 2] = BLUE_COLOR.b * shade;
    origColors[i * 3] = colors[i * 3];
    origColors[i * 3 + 1] = colors[i * 3 + 1];
    origColors[i * 3 + 2] = colors[i * 3 + 2];
  }

  // Planetary ring
  var RING_TILT = -20 * Math.PI / 180;
  var cosT = Math.cos(RING_TILT);
  var sinT = Math.sin(RING_TILT);
  for (var j = 0; j < RING_COUNT; j++) {
    var idx = SPHERE_COUNT + j;
    var angle = (j / RING_COUNT) * Math.PI * 2 + Math.random() * 0.1;
    var r = RING_INNER + Math.random() * (RING_OUTER - RING_INNER);
    var yOff = (Math.random() - 0.5) * RING_THICKNESS;

    var rx = Math.cos(angle) * r;
    var ry = yOff;
    var rz = Math.sin(angle) * r;

    var fy = ry * cosT - rz * sinT;
    var fz = ry * sinT + rz * cosT;

    positions[idx * 3] = rx;
    positions[idx * 3 + 1] = fy;
    positions[idx * 3 + 2] = fz;
    origPositions[idx * 3] = rx;
    origPositions[idx * 3 + 1] = fy;
    origPositions[idx * 3 + 2] = fz;

    var ringShade = 0.7 + Math.random() * 0.3;
    colors[idx * 3] = LIGHT_BLUE.r * ringShade;
    colors[idx * 3 + 1] = LIGHT_BLUE.g * ringShade;
    colors[idx * 3 + 2] = LIGHT_BLUE.b * ringShade;
    origColors[idx * 3] = colors[idx * 3];
    origColors[idx * 3 + 1] = colors[idx * 3 + 1];
    origColors[idx * 3 + 2] = colors[idx * 3 + 2];
  }

  geometry.setAttribute('position', new THREE.BufferAttribute(positions, 3));
  geometry.setAttribute('color', new THREE.BufferAttribute(colors, 3));

  var material = new THREE.PointsMaterial({
    size: PARTICLE_SIZE,
    vertexColors: true,
    transparent: true,
    opacity: 0.9,
    sizeAttenuation: true,
    blending: THREE.AdditiveBlending,
    depthWrite: false
  });

  var points = new THREE.Points(geometry, material);
  scene.add(points);

  // --- HIT SPHERE for click detection ---
  var hitSphereGeo = new THREE.SphereGeometry(SPHERE_RADIUS * 1.9, 32, 32);
  var hitSphereMat = new THREE.MeshBasicMaterial({ visible: false });
  var hitSphere = new THREE.Mesh(hitSphereGeo, hitSphereMat);
  scene.add(hitSphere);

  // --- MOUSE ---
  var mouse = new THREE.Vector2(9999, 9999);
  var raycaster = new THREE.Raycaster();
  var isMouseOnCanvas = false;

  // Ray in local space (for hover - computed each frame)
  var localRayOrigin = new THREE.Vector3();
  var localRayDir = new THREE.Vector3();
  var hasLocalRay = false;

  // Inverse matrix for transforming ray into particle local space
  var inverseMatrix = new THREE.Matrix4();

  container.addEventListener('mousemove', function (e) {
    var rect = container.getBoundingClientRect();
    mouse.x = ((e.clientX - rect.left) / rect.width) * 2 - 1;
    mouse.y = -((e.clientY - rect.top) / rect.height) * 2 + 1;
    isMouseOnCanvas = true;
  });

  container.addEventListener('mouseleave', function () {
    isMouseOnCanvas = false;
    hasLocalRay = false;
    mouse.set(9999, 9999);
  });

  // --- CLICK: explode ALL particles ---
  container.addEventListener('click', function (e) {
    if (explodeActive) return; // don't restart mid-explosion

    var rect = container.getBoundingClientRect();
    var clickMouse = new THREE.Vector2(
      ((e.clientX - rect.left) / rect.width) * 2 - 1,
      -((e.clientY - rect.top) / rect.height) * 2 + 1
    );
    raycaster.setFromCamera(clickMouse, camera);
    var intersects = raycaster.intersectObject(hitSphere);
    if (intersects.length === 0) return;

    // Explode ALL particles outward from center
    explodeActive = true;
    explodeStartTime = Date.now();

    for (var i = 0; i < TOTAL; i++) {
      var ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
      var ox = origPositions[ix];
      var oy = origPositions[iy];
      var oz = origPositions[iz];
      var len = Math.sqrt(ox * ox + oy * oy + oz * oz) || 1;

      // Outward direction + random spread
      var nx = ox / len + (Math.random() - 0.5) * 0.4;
      var ny = oy / len + (Math.random() - 0.5) * 0.4;
      var nz = oz / len + (Math.random() - 0.5) * 0.4;
      var strength = EXPLODE_STRENGTH * (0.6 + Math.random() * 0.8);

      explodeTargets[ix] = ox + nx * strength;
      explodeTargets[iy] = oy + ny * strength;
      explodeTargets[iz] = oz + nz * strength;

      // Reset scatter state
      scattered[i] = 0;
    }
  });

  // --- Ray-point perpendicular distance ---
  // Returns distance from point P to the ray (origin O, direction D unit vector)
  var _v = new THREE.Vector3();
  var _proj = new THREE.Vector3();
  function rayPointDist(px, py, pz) {
    _v.set(px - localRayOrigin.x, py - localRayOrigin.y, pz - localRayOrigin.z);
    var t = _v.dot(localRayDir);
    if (t < 0) return 9999; // behind camera
    _proj.copy(localRayDir).multiplyScalar(t).add(localRayOrigin);
    return Math.sqrt(
      (px - _proj.x) * (px - _proj.x) +
      (py - _proj.y) * (py - _proj.y) +
      (pz - _proj.z) * (pz - _proj.z)
    );
  }

  // --- ANIMATION ---
  var now = Date.now();

  function animate() {
    requestAnimationFrame(animate);
    now = Date.now();

    // Slow auto-rotation (pause during explosion for clean visual)
    if (!explodeActive) {
      points.rotation.y += SLOW_ROTATE_SPEED;
    }

    // Compute local-space ray for hover
    hasLocalRay = false;
    if (isMouseOnCanvas && !explodeActive) {
      raycaster.setFromCamera(mouse, camera);
      // Transform ray into points' local coordinate system
      inverseMatrix.copy(points.matrixWorld).invert();
      localRayOrigin.copy(raycaster.ray.origin).applyMatrix4(inverseMatrix);
      // Transform direction (direction = transform as vector, not point)
      localRayDir.copy(raycaster.ray.direction);
      var dirEnd = new THREE.Vector3().copy(raycaster.ray.origin).add(raycaster.ray.direction);
      dirEnd.applyMatrix4(inverseMatrix);
      localRayDir.copy(dirEnd).sub(localRayOrigin).normalize();
      hasLocalRay = true;
    }

    var posArr = geometry.attributes.position.array;
    var colArr = geometry.attributes.color.array;
    var changed = false;

    // --- GLOBAL EXPLOSION ---
    if (explodeActive) {
      var elapsed = now - explodeStartTime;
      var totalDuration = EXPLODE_SCATTER_DURATION + EXPLODE_REFORM_DURATION;

      if (elapsed >= totalDuration) {
        // Done: snap everything to original
        explodeActive = false;
        for (var i = 0; i < TOTAL; i++) {
          var ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
          posArr[ix] = origPositions[ix];
          posArr[iy] = origPositions[iy];
          posArr[iz] = origPositions[iz];
          colArr[ix] = origColors[ix];
          colArr[iy] = origColors[iy];
          colArr[iz] = origColors[iz];
        }
        changed = true;
      } else if (elapsed < EXPLODE_SCATTER_DURATION) {
        // Scatter phase: fly outward + gradually turn white
        var t = elapsed / EXPLODE_SCATTER_DURATION; // 0 → 1
        var posT = easeOutCubic(t);   // fast out for position
        var colT = t;                  // linear for color

        for (var i = 0; i < TOTAL; i++) {
          var ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
          posArr[ix] = lerp(origPositions[ix], explodeTargets[ix], posT);
          posArr[iy] = lerp(origPositions[iy], explodeTargets[iy], posT);
          posArr[iz] = lerp(origPositions[iz], explodeTargets[iz], posT);

          colArr[ix] = lerp(origColors[ix], WHITE_COLOR.r, colT);
          colArr[iy] = lerp(origColors[iy], WHITE_COLOR.g, colT);
          colArr[iz] = lerp(origColors[iz], WHITE_COLOR.b, colT);
        }
        changed = true;
      } else {
        // Reform phase: return to original + turn back to blue
        var t2 = (elapsed - EXPLODE_SCATTER_DURATION) / EXPLODE_REFORM_DURATION; // 0 → 1
        var posT2 = easeInOutCubic(t2);
        var colT2 = easeInOutCubic(t2);

        for (var i = 0; i < TOTAL; i++) {
          var ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;
          posArr[ix] = lerp(explodeTargets[ix], origPositions[ix], posT2);
          posArr[iy] = lerp(explodeTargets[iy], origPositions[iy], posT2);
          posArr[iz] = lerp(explodeTargets[iz], origPositions[iz], posT2);

          colArr[ix] = lerp(WHITE_COLOR.r, origColors[ix], colT2);
          colArr[iy] = lerp(WHITE_COLOR.g, origColors[iy], colT2);
          colArr[iz] = lerp(WHITE_COLOR.b, origColors[iz], colT2);
        }
        changed = true;
      }
    } else {
      // --- HOVER SCATTER (only when not exploding) ---
      for (var i = 0; i < TOTAL; i++) {
        var ix = i * 3, iy = i * 3 + 1, iz = i * 3 + 2;

        // Use ray-point distance for accurate proximity
        var dist = 9999;
        if (hasLocalRay) {
          dist = rayPointDist(origPositions[ix], origPositions[iy], origPositions[iz]);
        }

        if (dist < SCATTER_RADIUS) {
          var factor = 1 - dist / SCATTER_RADIUS;
          var pushStrength = factor * factor * SCATTER_STRENGTH;

          // Push direction: from ray closest point outward to particle
          _v.set(
            origPositions[ix] - _proj.x,
            origPositions[iy] - _proj.y,
            origPositions[iz] - _proj.z
          );
          var vLen = _v.length() || 1;

          var tx = origPositions[ix] + (_v.x / vLen) * pushStrength;
          var ty = origPositions[iy] + (_v.y / vLen) * pushStrength;
          var tz = origPositions[iz] + (_v.z / vLen) * pushStrength;

          posArr[ix] += (tx - posArr[ix]) * HOVER_LERP;
          posArr[iy] += (ty - posArr[iy]) * HOVER_LERP;
          posArr[iz] += (tz - posArr[iz]) * HOVER_LERP;

          scattered[i] = Math.min(scattered[i] + 0.15, 1);
          scatterTimers[i] = now;

          colArr[ix] += (WHITE_COLOR.r - colArr[ix]) * 0.15;
          colArr[iy] += (WHITE_COLOR.g - colArr[iy]) * 0.15;
          colArr[iz] += (WHITE_COLOR.b - colArr[iz]) * 0.15;

          changed = true;
        } else if (scattered[i] > 0.001) {
          var elapsed2 = now - scatterTimers[i];
          if (elapsed2 > SCATTER_HOLD) {
            posArr[ix] += (origPositions[ix] - posArr[ix]) * RETURN_SPEED;
            posArr[iy] += (origPositions[iy] - posArr[iy]) * RETURN_SPEED;
            posArr[iz] += (origPositions[iz] - posArr[iz]) * RETURN_SPEED;

            colArr[ix] += (origColors[ix] - colArr[ix]) * COLOR_RETURN_SPEED;
            colArr[iy] += (origColors[iy] - colArr[iy]) * COLOR_RETURN_SPEED;
            colArr[iz] += (origColors[iz] - colArr[iz]) * COLOR_RETURN_SPEED;

            scattered[i] *= (1 - RETURN_SPEED);
            if (scattered[i] < 0.001) scattered[i] = 0;
            changed = true;
          }
        }
      }
    }

    if (changed) {
      geometry.attributes.position.needsUpdate = true;
      geometry.attributes.color.needsUpdate = true;
    }

    renderer.render(scene, camera);
  }

  animate();

  // --- RESIZE ---
  window.addEventListener('resize', function () {
    var w = container.clientWidth;
    var h = container.clientHeight;
    camera.aspect = w / h;
    camera.updateProjectionMatrix();
    renderer.setSize(w, h);
  });

  // --- FADE with scroll ---
  window.addEventListener('scroll', function () {
    var scrollVH = window.scrollY / window.innerHeight;
    if (scrollVH > 2) {
      container.style.opacity = '0';
    } else if (scrollVH > 1) {
      container.style.opacity = (1 - (scrollVH - 1)).toString();
    } else {
      container.style.opacity = '1';
    }
  });
})();

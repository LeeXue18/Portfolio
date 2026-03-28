// ========== 滚动控制动画 ==========
function handleScroll() {
  const scrollY = window.scrollY;
  const title = document.getElementById('title');
  const intro = document.querySelector('.intro');
  const block = document.querySelector('.block');
  const v1 = document.querySelector('.v1');
  const v2 = document.querySelector('.v2');
  const v3 = document.querySelector('.v3');
  const v4 = document.querySelector('.v4');

  const endScroll = window.innerHeight / 2;
  const progress = Math.min(1, scrollY / endScroll);

  const top = 50 - 50 * progress;
  const scale = 1 + 1.5 * progress;
  const translateY = -50 + 50 * progress;
  const textValue = Math.round(255 - 255 * progress);
  const bgValue = Math.round(0 + (255 - 0) * progress);
  const textColor = `rgb(${textValue}, ${textValue}, ${textValue})`;
  const bgColor = `rgb(${bgValue}, ${bgValue}, ${bgValue})`;

  title.style.top = `${top}%`;
  title.style.transform = `translate(-50%, ${translateY}%) scale(${scale})`;
  title.style.color = textColor;
  document.body.style.backgroundColor = bgColor;
  document.documentElement.style.backgroundColor = bgColor;

  if (progress >= 1) {
    intro.classList.add('visible');
  } else {
    intro.classList.remove('visible');
  }

  if (scrollY > endScroll + 200) {
    const fadeProgress = Math.min(1, (scrollY - endScroll - 200) / 200);
    title.style.opacity = 1 - fadeProgress;
  } else {
    title.style.opacity = 1;
  }

  if (scrollY > endScroll + 200 && block) {
    block.classList.add('visible');
  } else if (block) {
    block.classList.remove('visible');
  }

  [v1, v2, v3, v4].forEach((el) => {
    if (el.getBoundingClientRect().top < window.innerHeight) {
      el.classList.add('visible');
    }
  });
}

window.addEventListener('scroll', handleScroll);
window.addEventListener('DOMContentLoaded', handleScroll);

// ========== 自定义鼠标逻辑，仅限 .v3 .img 区域 ==========
const customCursor = document.createElement('div');
customCursor.id = 'custom-cursor';
customCursor.innerHTML = `<img src="images/v3.png" alt="cursor">`;
document.body.appendChild(customCursor);

const cursorImg = customCursor.querySelector('img');
const v3Image = document.querySelector('.v3 .img');

// 初始样式设置
customCursor.style.position = 'fixed';
customCursor.style.pointerEvents = 'none';
customCursor.style.zIndex = '9999';
customCursor.style.transform = 'translate(-50%, -50%)';
customCursor.style.display = 'none';
cursorImg.style.transition = 'width 0.1s ease, height 0.1s ease';
cursorImg.style.display = 'block';
cursorImg.style.width = `240px`;
cursorImg.style.height = `300px`;

// 全局鼠标跟随（仅在显示时生效）
document.addEventListener('mousemove', (e) => {
  customCursor.style.left = e.clientX + 'px';
  customCursor.style.top = e.clientY + 'px';
});

// 鼠标进入 v3 图片区域 → 显示自定义鼠标 + 隐藏系统鼠标
v3Image.addEventListener('mouseenter', () => {
  customCursor.style.display = 'block';
  document.body.style.cursor = 'none';
});

// 鼠标在 v3 图片内移动 → 根据鼠标位置动态改变宽高
v3Image.addEventListener('mousemove', (e) => {
  const rect = v3Image.getBoundingClientRect();
  const relativeX = e.clientX - rect.left;
  const relativeY = e.clientY - rect.top;
  const percentX = relativeX / rect.width;
  const percentY = relativeY / rect.height;
  const offsetX = (percentX - 0.5) * 6;
  const offsetY = (percentY - 0.5) * 6;

  const baseWidth = 240;
  const baseHeight = 300;
  const maxStretch = 120;

  const newWidth = baseWidth + (-offsetX * maxStretch);
  const newHeight = baseHeight + (offsetY * maxStretch);

  cursorImg.style.width = `${newWidth}px`;
  cursorImg.style.height = `${newHeight}px`;
});

// 鼠标离开 v3 图片区域 → 隐藏自定义光标 + 恢复系统鼠标
v3Image.addEventListener('mouseleave', () => {
  customCursor.style.display = 'none';
  document.body.style.cursor = 'default';
  cursorImg.style.width = `240px`;
  cursorImg.style.height = `300px`;
});

// ========== v2聚光灯效果 ==========
const v2 = document.querySelector('.v2');
const mask = document.querySelector('.mask-overlay');

let isMaskActive = true; // 初始状态：遮罩启用

// 自动把 .name 和 .leftw 中的文字每个字母包一层 span
function wrapLettersInV2() {
  const v2 = document.querySelector('.v2');
  if (!v2) return;

  const nameP = v2.querySelectorAll('.name p');
  const leftwP = v2.querySelectorAll('.leftw p');

  [...nameP, ...leftwP].forEach(el => {
    const html = el.textContent.split('').map(char => {
      if (char === ' ') {
        return `<span class="shadow-letter">&nbsp;</span>`;
      } else {
        return `<span class="shadow-letter">${char}</span>`;
      }
    }).join('');
    el.innerHTML = html;
  });
}

// 初始化
wrapLettersInV2();

// 鼠标移动处理：更新遮罩位置和字母阴影
v2.addEventListener('mousemove', (e) => {
  if (!isMaskActive) return;

  const rect = v2.getBoundingClientRect();
  const x = e.clientX - rect.left;
  const y = e.clientY - rect.top;

  // 更新遮罩位置
  const maskStyle = `radial-gradient(circle 300px at ${x}px ${y}px, transparent 0%, black 100%)`;
  mask.style.webkitMaskImage = maskStyle;
  mask.style.maskImage = maskStyle;

  // 计算阴影方向（鼠标反方向）
  const shadowLetters = v2.querySelectorAll('.shadow-letter');
  shadowLetters.forEach(letter => {
    const letterRect = letter.getBoundingClientRect();
    const letterX = letterRect.left + letterRect.width / 2 - rect.left;
    const letterY = letterRect.top + letterRect.height / 2 - rect.top;

    const offsetX = (letterX - x) / 10;
    const offsetY = (letterY - y) / 10;

    letter.style.textShadow = `${offsetX}px ${offsetY}px 2px rgba(0, 0, 0, 0.6)`;
  });
});

// 鼠标移出 .v2 时把洞藏起来
v2.addEventListener('mouseleave', () => {
  if (!isMaskActive) return;
  const maskStyle = `radial-gradient(circle 300px at -999px -999px, transparent 0%, black 100%)`;
  mask.style.webkitMaskImage = maskStyle;
  mask.style.maskImage = maskStyle;
});

// 点击 .v2 开关遮罩
v2.addEventListener('click', () => {
  isMaskActive = !isMaskActive;

  if (!isMaskActive) {
    // 取消遮罩效果，透明背景
    mask.style.webkitMaskImage = 'none';
    mask.style.maskImage = 'none';
    mask.style.backgroundColor = 'transparent';
  } else {
    // 恢复遮罩，黑背景 + 洞藏起来
    const maskStyle = `radial-gradient(circle 300px at -999px -999px, transparent 0%, black 100%)`;
    mask.style.webkitMaskImage = maskStyle;
    mask.style.maskImage = maskStyle;
    mask.style.backgroundColor = 'black';
  }
});

// ========== intro文字打散效果 ==========
const bottomContent = document.querySelector('.bottom-content');
const paragraphs = bottomContent.querySelectorAll('.p1, .p2');
let isScattered = false;

// 初始包装字母
function wrapParagraphLetters() {
  paragraphs.forEach(p => {
    const words = p.textContent.trim().split(' ');

    const html = words.map((word, i) => {
      const letterSpans = word.split('').map(char =>
        `<span class="scatter-letter">${char}</span>`
      ).join('');

      if (i === 0) {
        // 第一个单词前不加空格
        return `<span class="scatter-word">${letterSpans}</span>`;
      } else {
        // 其他单词前加可控空格
        return `<span class="scatter-space">&nbsp;</span><span class="scatter-word">${letterSpans}</span>`;
      }
    }).join('');

    p.innerHTML = html;
  });
}

// 初始化文字包装
wrapParagraphLetters();

// 点击事件：文字打散/恢复
bottomContent.addEventListener('click', () => {
  const letters = bottomContent.querySelectorAll('.scatter-letter');
  
  if (!isScattered) {
    letters.forEach(letter => {
      const x = (Math.random() - 0.5) * 200;
      const y = (Math.random() - 0.5) * 200;
      const r = (Math.random() - 0.5) * 360;
      letter.classList.add('floating');
      letter.style.transform = `translate(${x}px, ${y}px) rotate(${r}deg)`;
    });
    isScattered = true;
  } else {
    letters.forEach(letter => {
      letter.style.transform = `translate(0, 0) rotate(0deg)`;
    });
    isScattered = false;
  }
});

// ========== v1拖尾效果 ==========
document.addEventListener('DOMContentLoaded', function () {
  const v1Element = document.querySelector('.v1');
  const trailElements = [];
  
  const images = [
    'images/111.png',
    'images/222.png',
    'images/333.png',
  ];

  let lastTrailTime = 0;
  const trailDelay = 50;

  v1Element.addEventListener('mousemove', function (e) {
    const now = Date.now();
    if (now - lastTrailTime < trailDelay) return;
    lastTrailTime = now;

    const rect = v1Element.getBoundingClientRect();
    const x = e.clientX - rect.left;
    const y = e.clientY - rect.top;

    const trail = document.createElement('img');
    trail.className = 'trail';
    trail.src = images[Math.floor(Math.random() * images.length)];

    const size = (Math.random() * 30 + 20) * 4;
    const rotation = Math.random() * 360;

    trail.style.left = `${x}px`;
    trail.style.top = `${y}px`;
    trail.style.width = `${size}px`;
    trail.style.height = `${size}px`;
    trail.style.transform = `translate(-50%, -50%) rotate(${rotation}deg) scale(1)`;

    v1Element.appendChild(trail);
    trailElements.push(trail);

    setTimeout(() => {
      trail.style.opacity = '0';
    }, 500);

    setTimeout(() => {
      trail.remove();
      const index = trailElements.indexOf(trail);
      if (index > -1) {
        trailElements.splice(index, 1);
      }
    }, 1000);
  });
});

// ========== v1文字掉落效果 ==========
function wrapWordsInV1Leftw() {
  const leftwP = document.querySelectorAll('.v1 .leftw p');
  leftwP.forEach(p => {
    const html = p.textContent.trim().split(' ').map(word => {
      return `<span class="drop-word">${word}</span>`;
    }).join(' ');
    p.innerHTML = html;
  });
}

// 初始化文字包装
wrapWordsInV1Leftw();

// 控制点击后文字掉落/恢复
let v1Dropped = false;
const v1Leftw = document.querySelector('.v1 .leftw');
v1Leftw.addEventListener('click', () => {
  const words = v1Leftw.querySelectorAll('.drop-word');
  v1Dropped = !v1Dropped;

  words.forEach((word, index) => {
    if (v1Dropped) {
      word.style.transitionDelay = `${index * 20}ms`;
      word.classList.add('falling');
    } else {
      word.style.transitionDelay = `${index * 20}ms`;
      word.classList.remove('falling');
    }
  });
});

/* ══════════════════════════════════════════
   VERDANT CIRCLE — app.js
   Standalone JavaScript for the community site.

   HOW TO USE:
   1. Save this file as app.js in the same folder as your index.html
   2. Add this line just before </body> in your HTML:
        <script src="app.js"></script>
   3. Make sure your HTML contains the matching element IDs/classes
      referenced below (lockscreen, puzzle stages, nav, members grid,
      chat board, etc.) — see the comments for each section.
══════════════════════════════════════════ */

document.addEventListener('DOMContentLoaded', () => {

  /* ══════════════════════════════════════════
     1. PUZZLE GATE
     Requires in HTML:
       #lockscreen, #main-site
       .puzzle-stage#stage0/#stage1/#stage2
       #ans0/#ans1/#ans2 (inputs), #err0/#err1/#err2
       #dot0/#dot1/#dot2 (progress dots)
       #transition-overlay (optional, for page-flip animation)
  ══════════════════════════════════════════ */
  const ANSWERS = [
    ['map', 'a map'],   // Puzzle 1: riddle answer
    ['verdant'],        // Puzzle 2: Caesar cipher answer (shift -3)
    ['34']               // Puzzle 3: Fibonacci sequence answer
  ];
  const SESSION_KEY = 'vc_unlocked';
  let currentStage = 0;

  function checkPuzzle(stage) {
    const input = document.getElementById('ans' + stage);
    const err   = document.getElementById('err' + stage);
    if (!input) return;
    const val = input.value.trim().toLowerCase();

    if (!val) {
      if (err) err.textContent = '↑ Please enter an answer.';
      return;
    }
    const correct = ANSWERS[stage].includes(val);
    if (!correct) {
      if (err) {
        err.textContent = stage === 0 ? 'Not quite. Think harder.' :
                           stage === 1 ? 'Wrong. Each letter shifted 3 back.' :
                                         'Incorrect. Add the last two numbers.';
        err.style.animation = 'none';
        requestAnimationFrame(() => { err.style.animation = ''; });
      }
      input.value = '';
      input.focus();
      return;
    }

    if (err) err.textContent = '';
    const doneDot = document.getElementById('dot' + stage);
    if (doneDot) { doneDot.classList.remove('active'); doneDot.classList.add('done'); }

    if (stage < 2) {
      const curStageEl = document.getElementById('stage' + stage);
      if (curStageEl) curStageEl.classList.remove('active');
      currentStage = stage + 1;
      const nextStageEl = document.getElementById('stage' + currentStage);
      const nextDot     = document.getElementById('dot' + currentStage);
      if (nextStageEl) nextStageEl.classList.add('active');
      if (nextDot) nextDot.classList.add('active');
      const nextInput = document.getElementById('ans' + currentStage);
      if (nextInput) nextInput.focus();
    } else {
      sessionStorage.setItem(SESSION_KEY, '1');
      unlockSite(true);
    }
  }

  function unlockSite(animate) {
    const lock = document.getElementById('lockscreen');
    const main = document.getElementById('main-site');

    if (!animate) {
      if (lock) lock.style.display = 'none';
      if (main) main.style.display = 'block';
      initSite();
      return;
    }

    if (lock) lock.classList.add('hidden');
    setTimeout(() => {
      if (lock) lock.style.display = 'none';
      if (main) main.style.display = 'block';

      const overlay = document.getElementById('transition-overlay');
      if (overlay) {
        overlay.style.transition = 'transform 0.5s cubic-bezier(0.76,0,0.24,1)';
        overlay.style.transform = 'scaleY(1)';
        setTimeout(() => {
          overlay.style.transformOrigin = 'top';
          overlay.style.transform = 'scaleY(0)';
          setTimeout(() => { overlay.style.transformOrigin = 'bottom'; }, 500);
        }, 400);
      }
      initSite();
    }, 600);
  }

  // Wire up puzzle buttons/inputs if present
  [0, 1, 2].forEach(stage => {
    const input = document.getElementById('ans' + stage);
    if (input) {
      input.addEventListener('keydown', e => { if (e.key === 'Enter') checkPuzzle(stage); });
    }
  });
  // Expose for inline onclick="checkPuzzle(0)" style buttons
  window.checkPuzzle = checkPuzzle;

  // Skip puzzle if already unlocked this session
  if (sessionStorage.getItem(SESSION_KEY)) {
    unlockSite(false);
  }

  /* ══════════════════════════════════════════
     2. SITE INIT (runs once unlocked)
  ══════════════════════════════════════════ */
  function initSite() {
    initTheme();
    initScrollReveal();
    initNavHighlight();
    initMembers();
    initChat();
    initStatusUpdates();
  }

  /* ══════════════════════════════════════════
     3. DARK / LIGHT THEME TOGGLE
     Requires: <html data-theme="dark">, #themeBtn button
  ══════════════════════════════════════════ */
  function initTheme() {
    const saved = localStorage.getItem('vc_theme') || 'dark';
    setTheme(saved, false);
  }
  function toggleTheme() {
    const cur = document.documentElement.getAttribute('data-theme');
    setTheme(cur === 'dark' ? 'light' : 'dark', true);
  }
  function setTheme(t, save) {
    document.documentElement.setAttribute('data-theme', t);
    const btn = document.getElementById('themeBtn');
    if (btn) btn.textContent = t === 'dark' ? '🌙' : '☀️';
    if (save) localStorage.setItem('vc_theme', t);
  }
  window.toggleTheme = toggleTheme;

  /* ══════════════════════════════════════════
     4. SCROLL REVEAL ANIMATIONS
     Requires: elements with class="reveal"
  ══════════════════════════════════════════ */
  function initScrollReveal() {
    const els = document.querySelectorAll('.reveal');
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); }
      });
    }, { threshold: 0.12 });
    els.forEach(el => obs.observe(el));
  }

  /* ══════════════════════════════════════════
     5. NAV ACTIVE-LINK HIGHLIGHT ON SCROLL
     Requires: <section id="..."> blocks, .nav-links a[href="#id"]
  ══════════════════════════════════════════ */
  function initNavHighlight() {
    const sections = document.querySelectorAll('section[id]');
    const links = document.querySelectorAll('.nav-links a');
    if (!sections.length || !links.length) return;
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => {
        if (e.isIntersecting) {
          links.forEach(a => a.classList.toggle('active', a.getAttribute('href') === '#' + e.target.id));
        }
      });
    }, { rootMargin: '-40% 0px -55% 0px' });
    sections.forEach(s => obs.observe(s));
  }

  /* ══════════════════════════════════════════
     6. MEMBERS + LIVE ONLINE/AWAY/OFFLINE STATUS
     Requires: #membersGrid container, #onlineCount stat element
  ══════════════════════════════════════════ */
  const MEMBERS = [
    { init: 'A', name: 'Aryan', role: 'Founder',     tags: ['Dev', 'Study Lead'],   status: 'online' },
    { init: 'Z', name: 'Zara',  role: 'Biz Lead',    tags: ['Sales', 'Design'],     status: 'online' },
    { init: 'K', name: 'Kai',   role: 'Events',      tags: ['Social', 'Photo'],     status: 'away' },
    { init: 'N', name: 'Nadia', role: 'Member',      tags: ['Research', 'Writing'], status: 'offline' },
    { init: 'R', name: 'Rayan', role: 'Member',      tags: ['Finance', 'Study'],    status: 'online' },
    { init: 'S', name: 'Sofia', role: 'Member',      tags: ['UX', 'Dev'],           status: 'away' },
    { init: 'M', name: 'Maya',  role: 'Member',      tags: ['Marketing'],           status: 'offline' },
    { init: '+', name: 'Invite',role: 'Send a link', tags: [],                      status: 'none', invite: true },
  ];

  function initMembers() {
    renderMembers();
    updateOnlineCount();
  }

  function renderMembers() {
    const grid = document.getElementById('membersGrid');
    if (!grid) return;
    grid.innerHTML = '';
    MEMBERS.forEach((m, i) => {
      const div = document.createElement('div');
      div.className = 'member-card reveal';
      div.setAttribute('data-member', i);
      if (m.invite) {
        div.innerHTML = `
          <div class="member-avatar" style="border-style:dashed;color:var(--dim);font-size:1.8rem;">+</div>
          <div class="member-name" style="color:var(--dim)">Invite</div>
          <div class="member-role" style="color:var(--dim)">Send a link</div>`;
        div.style.cursor = 'pointer';
        div.onclick = () => toast('📋 Invite link copied to clipboard.');
      } else {
        div.innerHTML = `
          <div class="member-status ${m.status}" id="mstatus${i}"></div>
          <div class="member-avatar">${m.init}</div>
          <div class="member-name">${m.name}</div>
          <div class="member-role">${m.role}</div>
          <div class="member-tags">${m.tags.map(t => `<span class="mtag">${t}</span>`).join('')}</div>`;
      }
      grid.appendChild(div);
    });
    const obs = new IntersectionObserver(entries => {
      entries.forEach(e => { if (e.isIntersecting) { e.target.classList.add('visible'); obs.unobserve(e.target); } });
    }, { threshold: 0.12 });
    grid.querySelectorAll('.reveal').forEach(el => obs.observe(el));
  }

  function initStatusUpdates() {
    const statuses = ['online', 'online', 'online', 'away', 'offline'];
    setInterval(() => {
      const idx = Math.floor(Math.random() * (MEMBERS.length - 1)); // skip invite card
      if (MEMBERS[idx].invite) return;
      MEMBERS[idx].status = statuses[Math.floor(Math.random() * statuses.length)];
      const dot = document.getElementById('mstatus' + idx);
      if (dot) dot.className = 'member-status ' + MEMBERS[idx].status;
      updateOnlineCount();
      updateChatAvatarStatuses();
    }, 18000 + Math.random() * 12000);
  }

  function updateOnlineCount() {
    const el = document.getElementById('onlineCount');
    if (!el) return;
    const online = MEMBERS.filter(m => !m.invite && m.status === 'online').length;
    el.textContent = online;
  }

  function updateChatAvatarStatuses() {
    document.querySelectorAll('[data-sender]').forEach(el => {
      const name = el.getAttribute('data-sender');
      const m = MEMBERS.find(x => x.name === name);
      if (m) {
        const dot = el.querySelector('.msg-av-status');
        if (dot) dot.className = 'msg-av-status ' + m.status;
      }
    });
  }

  /* ══════════════════════════════════════════
     7. CHAT — persists via localStorage
     Requires: #msgArea, #msgInput, #channelName, #channelDesc,
               #typingIndicator, .channel-item elements
  ══════════════════════════════════════════ */
  const CHAT_KEY = 'vc_chat_v2';
  let activeChannel = 'general';

  const SEED_MSGS = {
    'general': [
      { name: 'Aryan', text: 'Morning everyone — site is live. Let me know if anything looks off.', time: Date.now() - 7200000 },
      { name: 'Zara',  text: 'Looks amazing! The gallery needs our photos though 😄', time: Date.now() - 5400000 },
      { name: 'Kai',   text: 'Vote for July hangout is open — check Events 👆', time: Date.now() - 3600000 },
    ],
    'study-room': [
      { name: 'Rayan', text: 'Anyone got notes from last Tuesday? I missed the first 20 mins.', time: Date.now() - 10800000 },
      { name: 'Nadia', text: 'Sending the PDF now in #resources', time: Date.now() - 9000000 },
    ],
    'leads': [
      { name: 'Zara', text: 'New batch of 14 leads added to the workspace doc. Check it out.', time: Date.now() - 86400000 },
    ],
    'random': [
      { name: 'Kai',   text: 'Who wants chai before Saturday study session? I\'m making a run.', time: Date.now() - 3000000 },
      { name: 'Sofia', text: 'Yes please ☕ extra ginger', time: Date.now() - 2700000 },
    ],
  };

  function loadMessages(channel) {
    const all = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}');
    if (!all[channel] && SEED_MSGS[channel]) {
      all[channel] = SEED_MSGS[channel];
      localStorage.setItem(CHAT_KEY, JSON.stringify(all));
    }
    return all[channel] || [];
  }

  function saveMessage(channel, msg) {
    const all = JSON.parse(localStorage.getItem(CHAT_KEY) || '{}');
    if (!all[channel]) all[channel] = [];
    all[channel].push(msg);
    if (all[channel].length > 100) all[channel] = all[channel].slice(-100);
    localStorage.setItem(CHAT_KEY, JSON.stringify(all));
  }

  function formatTime(ts) {
    const d = new Date(ts);
    const now = new Date();
    const diff = now - d;
    if (diff < 86400000) return 'Today ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
    return d.toLocaleDateString('en-GB', { day: 'numeric', month: 'short' }) + ' ' + d.getHours() + ':' + String(d.getMinutes()).padStart(2, '0');
  }

  function renderMessages(channel) {
    const area = document.getElementById('msgArea');
    if (!area) return;
    area.innerHTML = '';
    loadMessages(channel).forEach(m => appendMsgEl(m.name, m.text, m.time, false));
    area.scrollTop = area.scrollHeight;
  }

  function appendMsgEl(name, text, ts, scroll = true) {
    const area = document.getElementById('msgArea');
    if (!area) return;
    const m = MEMBERS.find(x => x.name === name) || { init: name[0], status: 'offline' };
    const div = document.createElement('div');
    div.className = 'msg-item';
    div.setAttribute('data-sender', name);
    div.innerHTML = `
      <div class="msg-av">
        ${m.init || name[0]}
        <div class="msg-av-status ${m.status}"></div>
      </div>
      <div class="msg-body">
        <div class="msg-meta">
          <span class="msg-name">${name}</span>
          <span class="msg-time">${formatTime(ts)}</span>
        </div>
        <div class="msg-text">${text}</div>
      </div>`;
    area.appendChild(div);
    if (scroll) area.scrollTop = area.scrollHeight;
  }

  function initChat() {
    renderMessages('general');
    const sendBtn = document.querySelector('.msg-send');
    const input = document.getElementById('msgInput');
    if (sendBtn) sendBtn.addEventListener('click', sendMsgBtn);
    if (input) input.addEventListener('keydown', e => { if (e.key === 'Enter') sendMsgBtn(); });
    document.querySelectorAll('.channel-item').forEach(item => {
      item.addEventListener('click', () => {
        const label = item.textContent.trim().split(/\s+/)[0]; // fallback name from text
      });
    });
  }

  function switchChannel(el, name, desc) {
    document.querySelectorAll('.channel-item').forEach(c => c.classList.remove('active'));
    el.classList.add('active');
    const unread = el.querySelector('.channel-unread');
    if (unread) unread.remove();
    activeChannel = name;
    const nameEl = document.getElementById('channelName');
    const descEl = document.getElementById('channelDesc');
    const input = document.getElementById('msgInput');
    if (nameEl) nameEl.textContent = name;
    if (descEl) descEl.textContent = desc || '';
    if (input) input.placeholder = 'Message #' + name;
    renderMessages(name);
    if (name === 'general') {
      const badge = document.getElementById('chatBadge');
      if (badge) badge.style.display = 'none';
    }
  }
  window.switchChannel = switchChannel;

  const REPLY_POOL = [
    'Noted 👍', 'Agreed!', 'Let\'s do it.', 'Will check and get back.', 'Good point.',
    'On it.', 'Thanks for sharing!', 'See you there.', 'Sounds good.',
    'Added to the board.', 'Will be there.', 'Makes sense.',
  ];
  let typingTimer = null;

  function sendMsgBtn() {
    const inp = document.getElementById('msgInput');
    if (!inp) return;
    const val = inp.value.trim();
    if (!val) return;
    const ts = Date.now();
    saveMessage(activeChannel, { name: 'You', text: val, time: ts });
    appendMsgEl('You', val, ts);
    inp.value = '';

    clearTimeout(typingTimer);
    const responders = MEMBERS.filter(m => !m.invite && m.name !== 'You' && m.status !== 'offline');
    if (responders.length === 0) return;
    const responder = responders[Math.floor(Math.random() * responders.length)];
    const delay = 1200 + Math.random() * 1200;
    const typing = document.getElementById('typingIndicator');
    typingTimer = setTimeout(() => {
      if (typing) typing.textContent = responder.name + ' is typing...';
      setTimeout(() => {
        if (typing) typing.textContent = '';
        const reply = REPLY_POOL[Math.floor(Math.random() * REPLY_POOL.length)];
        const rts = Date.now();
        saveMessage(activeChannel, { name: responder.name, text: reply, time: rts });
        appendMsgEl(responder.name, reply, rts);
      }, 900 + Math.random() * 600);
    }, delay);
  }
  window.sendMsgBtn = sendMsgBtn;

  /* ══════════════════════════════════════════
     8. SMOOTH SCROLL (for nav / CTA buttons)
     Use: onclick="smoothScroll('#join')"
  ══════════════════════════════════════════ */
  function smoothScroll(sel) {
    const el = document.querySelector(sel);
    if (el) el.scrollIntoView({ behavior: 'smooth' });
  }
  window.smoothScroll = smoothScroll;

  /* ══════════════════════════════════════════
     9. JOIN / INVITE FORM — Formspree submission
     Requires: <form id="joinForm"> with <input name="email">
  ══════════════════════════════════════════ */
  const joinForm = document.getElementById('joinForm');
  if (joinForm) {
    joinForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const emailInput = joinForm.querySelector('input[name=email]');
      const email = emailInput ? emailInput.value : '';
      try {
        const resp = await fetch('https://formspree.io/f/mvzjqzjo', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json', 'Accept': 'application/json' },
          body: JSON.stringify({ email, source: 'Verdant Circle — Invite Request' })
        });
        if (resp.ok) {
          toast('✦ Invite sent — they\'ll receive the puzzle link shortly.');
          if (emailInput) emailInput.value = '';
        } else {
          toast('Something went wrong — try again.');
        }
      } catch (err) {
        toast('Network error — check your connection.');
      }
    });
  }

  /* ══════════════════════════════════════════
     10. TOAST NOTIFICATIONS
     Requires: #toast element
  ══════════════════════════════════════════ */
  let toastTimer = null;
  function toast(msg) {
    const t = document.getElementById('toast');
    if (!t) return;
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 3200);
  }
  window.toast = toast;

  /* ══════════════════════════════════════════
     11. EVENT RSVP CLICKS (optional helper)
     Use: onclick="toast('✓ RSVP noted — see you there.')"
     Already wired via the toast() function above.
  ══════════════════════════════════════════ */

});

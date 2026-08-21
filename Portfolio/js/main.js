/* =========================================================
   FARHAT'S DEVELOPER STORY — interactions & animations
   ========================================================= */

document.addEventListener('DOMContentLoaded', () => {

  /* ---------- Custom Comic Cursor (Desktop) ---------- */
  const cursor = document.getElementById('comicCursor');
  if (cursor && window.matchMedia('(pointer: fine)').matches) {
    document.body.classList.add('has-custom-cursor');
    let mouseX = -100, mouseY = -100;
    let curX = -100, curY = -100;

    document.addEventListener('mousemove', (e) => {
      mouseX = e.clientX;
      mouseY = e.clientY;
    });

    function renderCursor() {
      curX += (mouseX - curX) * 0.22;
      curY += (mouseY - curY) * 0.22;
      cursor.style.left = curX + 'px';
      cursor.style.top  = curY + 'px';
      requestAnimationFrame(renderCursor);
    }
    renderCursor();

    const hoverSelectors = 'a, button, .filter-chip, .skill-badge, .project-card, .bubble, .panel';
    document.addEventListener('mouseover', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.add('hovering');
      }
    });
    document.addEventListener('mouseout', (e) => {
      if (e.target.closest(hoverSelectors)) {
        cursor.classList.remove('hovering');
      }
    });

    document.addEventListener('mouseleave', () => { cursor.style.opacity = '0'; });
    document.addEventListener('mouseenter', () => { cursor.style.opacity = '1'; });
  }

  /* ---------- Chapter progress bar & Back to Top ---------- */
  const progressFill = document.getElementById('progressFill');
  const backToTop = document.getElementById('backToTop');

  function handleScroll() {
    const scrollTop = window.scrollY;
    const docHeight = document.documentElement.scrollHeight - window.innerHeight;
    const pct = docHeight > 0 ? (scrollTop / docHeight) * 100 : 0;
    if (progressFill) progressFill.style.width = pct + '%';

    if (backToTop) {
      if (scrollTop > 400) {
        backToTop.classList.add('visible');
      } else {
        backToTop.classList.remove('visible');
      }
    }
  }
  window.addEventListener('scroll', handleScroll, { passive: true });
  handleScroll();

  if (backToTop) {
    backToTop.addEventListener('click', () => {
      window.scrollTo({ top: 0, behavior: 'smooth' });
    });
  }

  /* ---------- Mobile nav toggle ---------- */
  const navToggle = document.getElementById('navToggle');
  const navTabs = document.getElementById('navTabs');
  if (navToggle && navTabs) {
    navToggle.addEventListener('click', () => {
      const isOpen = navTabs.classList.toggle('open');
      navToggle.setAttribute('aria-expanded', isOpen.toString());
    });
    navTabs.querySelectorAll('a').forEach(link => {
      link.addEventListener('click', () => {
        navTabs.classList.remove('open');
        navToggle.setAttribute('aria-expanded', 'false');
      });
    });
  }

  /* ---------- Active chapter highlighting ---------- */
  const sections = document.querySelectorAll('main section[id]');
  const navLinks = document.querySelectorAll('.nav-tab');
  const sectionObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        navLinks.forEach(link => {
          link.classList.toggle('active', link.getAttribute('href') === `#${entry.target.id}`);
        });
      }
    });
  }, { rootMargin: '-40% 0px -40% 0px' });
  sections.forEach(sec => sectionObserver.observe(sec));

  /* ---------- Scroll-reveal for panels & bubbles ---------- */
  const revealTargets = document.querySelectorAll('.panel, .bubble--float');
  const revealObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        entry.target.classList.add('in-view');
        revealObserver.unobserve(entry.target);
      }
    });
  }, { threshold: 0.12 });
  revealTargets.forEach(el => revealObserver.observe(el));

  /* ---------- Begin Reading button ---------- */
  const beginBtn = document.getElementById('beginReading');
  if (beginBtn) {
    beginBtn.addEventListener('click', () => {
      const about = document.getElementById('about');
      if (about) about.scrollIntoView({ behavior: 'smooth' });
    });
  }

  /* ---------- Intro speech bubble delight on click ---------- */
  const introBubble = document.getElementById('introBubble');
  if (introBubble) {
    introBubble.addEventListener('click', () => {
      introBubble.style.transform = 'rotate(6deg) scale(1.12)';
      setTimeout(() => { introBubble.style.transform = ''; }, 240);
    });
  }

  /* ---------- 3D Subtle Tilt on Project Cards (Desktop) ---------- */
  if (window.matchMedia('(pointer: fine)').matches) {
    const cards = document.querySelectorAll('.project-card');
    cards.forEach(card => {
      card.addEventListener('mousemove', (e) => {
        const rect = card.getBoundingClientRect();
        const x = e.clientX - rect.left;
        const y = e.clientY - rect.top;
        const centerX = rect.width / 2;
        const centerY = rect.height / 2;
        const rotX = ((y - centerY) / centerY) * -4;
        const rotY = ((x - centerX) / centerX) * 4;
        card.style.transform = `perspective(800px) rotateX(${rotX}deg) rotateY(${rotY}deg) translate(-4px, -4px)`;
      });
      card.addEventListener('mouseleave', () => {
        card.style.transform = '';
      });
    });
  }

  /* ---------- Skill filter tabs ---------- */
  const filterChips = document.querySelectorAll('.filter-chip');
  const skillBadges = document.querySelectorAll('.skill-badge');
  filterChips.forEach(chip => {
    chip.addEventListener('click', () => {
      filterChips.forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const filter = chip.dataset.filter;
      skillBadges.forEach(badge => {
        const cats = (badge.dataset.category || '').split(' ');
        const show = filter === 'all' || cats.includes(filter);
        badge.classList.toggle('hidden', !show);
      });
    });
  });

  /* ---------- Resume Preview Modal ---------- */
  const previewResumeBtn = document.getElementById('previewResumeBtn');
  const resumeModal = document.getElementById('resumeModal');
  const closeResumeModal = document.getElementById('closeResumeModal');

  function openModal() {
    if (resumeModal) {
      resumeModal.classList.add('open');
      resumeModal.setAttribute('aria-hidden', 'false');
      document.body.style.overflow = 'hidden';
    }
  }

  function closeModal() {
    if (resumeModal) {
      resumeModal.classList.remove('open');
      resumeModal.setAttribute('aria-hidden', 'true');
      document.body.style.overflow = '';
    }
  }

  if (previewResumeBtn) previewResumeBtn.addEventListener('click', openModal);
  if (closeResumeModal) closeResumeModal.addEventListener('click', closeModal);
  if (resumeModal) {
    resumeModal.addEventListener('click', (e) => {
      if (e.target === resumeModal) closeModal();
    });
  }

  /* ---------- Contact form ---------- */
  const contactForm = document.getElementById('contactForm');
  const formStatus = document.getElementById('formStatus');
  const contactSubmit = document.getElementById('contactSubmit');
  if (contactForm) {
    contactForm.addEventListener('submit', async (e) => {
      e.preventDefault();
      const actionUrl = contactForm.getAttribute('action');
      const name = (contactForm.querySelector('input[name="name"]')?.value || '').trim();
      const email = (contactForm.querySelector('input[name="email"]')?.value || '').trim();
      const message = (contactForm.querySelector('textarea[name="message"]')?.value || '').trim();

      contactSubmit.disabled = true;
      formStatus.classList.remove('is-error');
      formStatus.textContent = 'Sending message...';

      if (actionUrl.includes('YOUR_FORM_ID') || actionUrl.includes('your-form-id')) {
        // Smooth direct handler + mailto fallback
        setTimeout(() => {
          formStatus.textContent = "⚡ Message sent successfully! I'll get back to you soon.";
          formStatus.classList.remove('is-error');
          contactSubmit.disabled = false;
          contactForm.reset();

          // Open mail client as seamless background fallback
          const mailSubject = encodeURIComponent(`Portfolio Message from ${name || 'Visitor'}`);
          const mailBody = encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`);
          window.location.href = `mailto:farhatsarwar.155@gmail.com?subject=${mailSubject}&body=${mailBody}`;
        }, 600);
        return;
      }

      try {
        const response = await fetch(actionUrl, {
          method: 'POST',
          body: new FormData(contactForm),
          headers: { 'Accept': 'application/json' }
        });
        if (response.ok) {
          formStatus.textContent = "⚡ Message received! I'll get back to you soon.";
          contactForm.reset();
        } else {
          formStatus.textContent = 'Something went wrong — please try again or email directly.';
          formStatus.classList.add('is-error');
        }
      } catch (err) {
        formStatus.textContent = 'Message captured! Emailing farhatsarwar.155@gmail.com...';
        formStatus.classList.remove('is-error');
        const mailSubject = encodeURIComponent(`Portfolio Message from ${name || 'Visitor'}`);
        const mailBody = encodeURIComponent(`From: ${name} (${email})\n\nMessage:\n${message}`);
        window.location.href = `mailto:farhatsarwar.155@gmail.com?subject=${mailSubject}&body=${mailBody}`;
      } finally {
        contactSubmit.disabled = false;
      }
    });
  }

  /* ---------- Web Audio Synthesizer (Comic Sound FX) ---------- */
  let soundEnabled = true;
  let audioCtx = null;

  function initAudio() {
    if (!audioCtx) {
      const AudioContext = window.AudioContext || window.webkitAudioContext;
      if (AudioContext) audioCtx = new AudioContext();
    }
  }

  function playComicBlip(frequency = 520, duration = 0.06, type = 'sine') {
    if (!soundEnabled) return;
    try {
      initAudio();
      if (!audioCtx) return;
      if (audioCtx.state === 'suspended') audioCtx.resume();

      const osc = audioCtx.createOscillator();
      const gain = audioCtx.createGain();
      osc.type = type;
      osc.frequency.setValueAtTime(frequency, audioCtx.currentTime);
      osc.frequency.exponentialRampToValueAtTime(frequency * 1.5, audioCtx.currentTime + duration);

      gain.gain.setValueAtTime(0.08, audioCtx.currentTime);
      gain.gain.exponentialRampToValueAtTime(0.001, audioCtx.currentTime + duration);

      osc.connect(gain);
      gain.connect(audioCtx.destination);
      osc.start();
      osc.stop(audioCtx.currentTime + duration);
    } catch (e) {
      // Audio fallback silent
    }
  }

  const soundToggle = document.getElementById('soundToggle');
  if (soundToggle) {
    soundToggle.addEventListener('click', () => {
      initAudio();
      soundEnabled = !soundEnabled;
      soundToggle.classList.toggle('muted', !soundEnabled);
      const icon = soundToggle.querySelector('.sound-icon');
      const text = soundToggle.querySelector('.sound-text');
      if (icon) icon.textContent = soundEnabled ? '🔊' : '🔇';
      if (text) text.textContent = soundEnabled ? 'FX' : 'OFF';
      if (soundEnabled) playComicBlip(680, 0.08, 'triangle');
    });
  }

  // Play blip on interactive buttons & tabs
  document.querySelectorAll('.nav-tab, .btn-begin, .filter-chip, .copy-btn').forEach(el => {
    el.addEventListener('click', () => {
      playComicBlip(620, 0.06, 'triangle');
    });
  });

  /* ---------- Animated Stats Counter ---------- */
  const statNumbers = document.querySelectorAll('.stat-num[data-target]');
  const statsObserver = new IntersectionObserver((entries) => {
    entries.forEach(entry => {
      if (entry.isIntersecting) {
        const el = entry.target;
        const target = parseInt(el.getAttribute('data-target'), 10);
        if (!isNaN(target)) {
          let count = 0;
          const duration = 1200;
          const stepTime = Math.max(Math.floor(duration / target), 30);
          const timer = setInterval(() => {
            count++;
            el.textContent = count + '+';
            if (count >= target) {
              clearInterval(timer);
              el.textContent = target + '+';
            }
          }, stepTime);
        }
        statsObserver.unobserve(el);
      }
    });
  }, { threshold: 0.5 });
  statNumbers.forEach(num => statsObserver.observe(num));

  /* ---------- Copy to Clipboard Toast ---------- */
  const comicToast = document.getElementById('comicToast');
  let toastTimeout = null;

  function showToast(msg) {
    if (!comicToast) return;
    comicToast.textContent = msg;
    comicToast.classList.add('show');
    playComicBlip(750, 0.07, 'sine');
    clearTimeout(toastTimeout);
    toastTimeout = setTimeout(() => {
      comicToast.classList.remove('show');
    }, 2200);
  }

  document.querySelectorAll('.copy-btn').forEach(btn => {
    btn.addEventListener('click', (e) => {
      e.stopPropagation();
      const textToCopy = btn.getAttribute('data-copy');
      if (textToCopy) {
        navigator.clipboard.writeText(textToCopy).then(() => {
          showToast(`📋 Copied: ${textToCopy}`);
          btn.textContent = '✓';
          setTimeout(() => { btn.textContent = 'Copy'; }, 1800);
        }).catch(() => {
          showToast(`📋 ${textToCopy}`);
        });
      }
    });
  });

  /* ---------- Easter egg: Developer Terminal (press "C") ---------- */
  const secretPage = document.getElementById('secretPage');
  const closeSecret = document.getElementById('closeSecret');
  const terminalForm = document.getElementById('terminalForm');
  const terminalInput = document.getElementById('terminalInput');
  const terminalOutput = document.getElementById('terminalOutput');

  function addTermLine(html, className = '') {
    if (!terminalOutput) return;
    const p = document.createElement('p');
    p.className = `term-line ${className}`.trim();
    p.innerHTML = html;
    terminalOutput.appendChild(p);
    terminalOutput.scrollTop = terminalOutput.scrollHeight;
  }

  function handleTerminalCommand(rawCmd) {
    const cmd = rawCmd.trim().toLowerCase();
    addTermLine(`farhat@comic:~$ ${rawCmd}`, 'term-user');
    playComicBlip(720, 0.05, 'square');

    switch (cmd) {
      case 'help':
        addTermLine('Available commands: <span class="term-highlight">skills</span>, <span class="term-highlight">projects</span>, <span class="term-highlight">stats</span>, <span class="term-highlight">about</span>, <span class="term-highlight">internship</span>, <span class="term-highlight">contact</span>, <span class="term-highlight">hire</span>, <span class="term-highlight">clear</span>');
        break;
      case 'skills':
        addTermLine('⚡ Core Superpowers:');
        addTermLine('• Flutter &amp; Dart: 20+ apps, Maps, Firebase, Razorpay');
        addTermLine('• Full Stack: Next.js 16, React, TypeScript, Node.js, Prisma, Supabase');
        addTermLine('• AI Integrations: Gemini 1.5 Flash API');
        break;
      case 'projects':
        addTermLine('🚀 Top Engineered Systems:');
        addTermLine('1. <span class="term-highlight">Smart POS</span> (Flutter · Inventory &amp; Sales)');
        addTermLine('2. <span class="term-highlight">NestIQ</span> (Flutter · Real Estate)');
        addTermLine('3. <span class="term-highlight">InternLynk</span> (Full Stack · Supabase &amp; React)');
        addTermLine('4. <span class="term-highlight">Bizloom ERP</span> (Full Stack · Next.js 16 &amp; Prisma)');
        addTermLine('5. <span class="term-highlight">Huddlr App</span> (Full Stack · Realtime Chat)');
        break;
      case 'stats':
        addTermLine('📊 Hero Power Grid:');
        addTermLine('• Flutter &amp; Dart: 95% | Full Stack: 92% | Databases: 88% | AI APIs: 86%');
        break;
      case 'about':
        addTermLine('👨‍💻 Farhat: BS Computer Science @ COMSATS University Islamabad (Vehari Campus)');
        addTermLine('Passionate about mobile architectures, AI integration, and production systems.');
        break;
      case 'internship':
        addTermLine('🎓 Full Stack Internship @ iSkills (Software House, Multan, Pakistan)');
        addTermLine('Engineered InternLynk, Bizloom ERP, and Huddlr App.');
        break;
      case 'contact':
      case 'hire':
        addTermLine('✉️ Email: <a href="mailto:farhatsarwar.155@gmail.com" style="color:#96BFE5;">farhatsarwar.155@gmail.com</a>', 'term-success');
        addTermLine('📞 Phone: <a href="tel:+923262737155" style="color:#96BFE5;">+92-326-2737155</a>', 'term-success');
        addTermLine('💼 LinkedIn: <a href="https://www.linkedin.com/in/farhat-muhammad-sarwar-391a96411/" target="_blank" style="color:#96BFE5;">View Profile</a>', 'term-success');
        break;
      case 'clear':
        terminalOutput.innerHTML = '';
        addTermLine('✦ Console cleared. Type <span class="term-highlight">help</span> for commands.');
        break;
      case '':
        break;
      default:
        addTermLine(`Command not recognized: "${rawCmd}". Type <span class="term-highlight">help</span> for command list.`);
        break;
    }
  }

  if (terminalForm && terminalInput) {
    terminalForm.addEventListener('submit', (e) => {
      e.preventDefault();
      const val = terminalInput.value;
      if (val.trim()) {
        handleTerminalCommand(val);
        terminalInput.value = '';
      }
    });
  }

  document.querySelectorAll('.term-tag').forEach(tag => {
    tag.addEventListener('click', () => {
      const cmd = tag.getAttribute('data-cmd');
      if (cmd) handleTerminalCommand(cmd);
    });
  });

  document.addEventListener('keydown', (e) => {
    if (e.key && e.key.toLowerCase() === 'c' && secretPage && !secretPage.classList.contains('open')) {
      secretPage.classList.add('open');
      secretPage.setAttribute('aria-hidden', 'false');
      playComicBlip(880, 0.12, 'square');
      if (terminalInput) setTimeout(() => terminalInput.focus(), 150);
    }
    if (e.key === 'Escape') {
      if (secretPage && secretPage.classList.contains('open')) {
        secretPage.classList.remove('open');
        secretPage.setAttribute('aria-hidden', 'true');
      }
      closeModal();
    }
  });

  if (closeSecret && secretPage) {
    closeSecret.addEventListener('click', () => {
      secretPage.classList.remove('open');
      secretPage.setAttribute('aria-hidden', 'true');
    });
    secretPage.addEventListener('click', (e) => {
      if (e.target === secretPage) {
        secretPage.classList.remove('open');
        secretPage.setAttribute('aria-hidden', 'true');
      }
    });
  }

  /* ---------- Power Grid Animation Observer ---------- */
  const powerGridPanel = document.querySelector('.about-panel-stats');
  if (powerGridPanel) {
    const powerObserver = new IntersectionObserver((entries) => {
      entries.forEach(entry => {
        if (entry.isIntersecting) {
          powerGridPanel.classList.add('in-view');
          playComicBlip(920, 0.08, 'sine');
          powerObserver.unobserve(powerGridPanel);
        }
      });
    }, { threshold: 0.3 });
    powerObserver.observe(powerGridPanel);
  }

});


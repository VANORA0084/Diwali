(() => {
	const DIYA_COUNT = 9;
	const container = document.getElementById('diyas-container');
	const progress = document.getElementById('progress');
			// WebAudio setup (synthesized sounds so external files aren't required)
			const AudioCtx = window.AudioContext || window.webkitAudioContext;
			const audioCtx = new AudioCtx();
			// Check for optional on-disk audio elements

			const lightAudioEl = document.getElementById('light-audio');

			// Remove all fireworks sound/video/canvas from main page

	let litCount = 0;

	function updateProgress() {
		progress.textContent = `${litCount} / ${DIYA_COUNT} diyas lit`;
	}

	function createDiya(i) {
		const el = document.createElement('button');
		el.className = 'diya';
		el.setAttribute('aria-pressed','false');
		el.setAttribute('aria-label',`Diya ${i+1}`);
		el.innerHTML = `<div class="cup">
				<div class="flame" aria-hidden="true"></div>
				<div class="glow" aria-hidden="true"></div>
			</div>`;

		el.addEventListener('click', () => {
			if (el.classList.contains('lit')) return;
			el.classList.add('lit');
			el.setAttribute('aria-pressed','true');
					litCount += 1;
					playSynthLight();
			updateProgress();
					if (litCount >= DIYA_COUNT) {
						// All lit: redirect to fireworks page only
						try { localStorage.setItem('showConfetti', '1'); } catch(e){}
						setTimeout(() => {
							window.location.href = 'fireworks.html';
						}, 1200);
					}
		});

		// support keyboard
		el.addEventListener('keyup', (e) => {
			if (e.key === 'Enter' || e.key === ' ') el.click();
		});

		return el;
	}

	// generate diyas
	for (let i=0;i<DIYA_COUNT;i++) {
		container.appendChild(createDiya(i));
	}
	updateProgress();




		// --- Synthesized sounds (no external files required) ---
		function playSynthLight() {
			if (!audioCtx) return;
			const now = audioCtx.currentTime;
			// short bell / pluck
			const o = audioCtx.createOscillator();
			const g = audioCtx.createGain();
			o.type = 'sine';
			o.frequency.setValueAtTime(880 + Math.random()*120, now);
			g.gain.setValueAtTime(0, now);
			g.gain.linearRampToValueAtTime(0.18, now + 0.01);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 0.8 + Math.random()*0.2);
			o.connect(g);
			g.connect(audioCtx.destination);
			o.start(now);
			o.stop(now + 1.2);
		}

		function playFireworksSound() {
			if (!audioCtx) return;
			const now = audioCtx.currentTime;
			// explosion (low rumble)
			const b = audioCtx.createBufferSource();
			const length = audioCtx.sampleRate * 1.4;
			const buffer = audioCtx.createBuffer(1, length, audioCtx.sampleRate);
			const data = buffer.getChannelData(0);
			for (let i = 0; i < length; i++) {
				// pink-ish noise shaped for boom
				data[i] = (Math.random()*2-1) * Math.exp(-3 * i / length) * (Math.random()*0.8 + 0.2);
			}
			b.buffer = buffer;
			const bp = audioCtx.createBiquadFilter();
			bp.type = 'lowpass';
			bp.frequency.setValueAtTime(1200, now);
			b.connect(bp);
			const g = audioCtx.createGain();
			g.gain.setValueAtTime(0.0001, now);
			g.gain.linearRampToValueAtTime(0.8, now + 0.02);
			g.gain.exponentialRampToValueAtTime(0.0001, now + 2.5);
			bp.connect(g);
			g.connect(audioCtx.destination);
			b.start(now);

			// crackle layer (short noise bursts)
			const crackleCount = 12;
			for (let i = 0; i < crackleCount; i++) {
				const t = now + 0.05 + i * 0.05 + Math.random() * 0.12;
				const dur = 0.06 + Math.random() * 0.08;
				const src = audioCtx.createBufferSource();
				const l = Math.floor(audioCtx.sampleRate * dur);
				const buf = audioCtx.createBuffer(1, l, audioCtx.sampleRate);
				const ch = buf.getChannelData(0);
				for (let j = 0; j < l; j++) ch[j] = (Math.random() * 2 - 1) * Math.pow(1 - j / l, 2);
				src.buffer = buf;
				const g2 = audioCtx.createGain();
				g2.gain.setValueAtTime(0.4 * (1 - i / crackleCount), t);
				src.connect(g2);
				const hpf = audioCtx.createBiquadFilter();
				hpf.type = 'highpass';
				hpf.frequency.setValueAtTime(800 + Math.random()*1200, t);
				g2.connect(hpf);
				hpf.connect(audioCtx.destination);
				src.start(t);
			}
		}

	// Fireworks animation (simple particle system)
		function triggerFireworks() {
				// Prefer video (MP4) if available
				const gif = document.getElementById('fireworks-gif');
				if (fireworksVideoEl && fireworksVideoEl.querySelector('source')) {
					// hide gif if present
					if (gif) gif.classList.add('hidden');
					fireworksVideoEl.classList.remove('hidden');
					try {
						fireworksVideoEl.currentTime = 0;
						// Unmute only if user has interacted (we assume they have clicked to light diyas)
						fireworksVideoEl.muted = false;
						fireworksVideoEl.play().catch(()=>{});
					} catch(e){}
				} else {
					if (gif && gif.querySelector('img')) gif.classList.remove('hidden');
				}

				// show canvas
				canvas.classList.remove('hidden');
				resizeCanvas();

				// if audio files exist and have duration, prefer them
				const useFiles = (el) => el && el.duration && !isNaN(el.duration) && el.duration > 0;
				if (useFiles(fireworksAudioEl)) {
					try { fireworksAudioEl.currentTime = 0; fireworksAudioEl.play().catch(()=>{}); } catch(e){}
				} else playFireworksSound();

				runFireworksAnimation();

				// set confetti flag for wish page
				try { localStorage.setItem('showConfetti', '1'); } catch(e){}

				// after a few seconds, redirect to fireworks.html
				setTimeout(() => {
					window.location.href = 'fireworks.html';
				}, 5200);
		}

	// canvas helpers
	function resizeCanvas() {
		canvas.width = window.innerWidth * devicePixelRatio;
		canvas.height = window.innerHeight * devicePixelRatio;
		canvas.style.width = window.innerWidth + 'px';
		canvas.style.height = window.innerHeight + 'px';
		if (ctx) ctx.setTransform(devicePixelRatio,0,0,devicePixelRatio,0,0);
	}

	window.addEventListener('resize', resizeCanvas);

	// simple particle-based fireworks
	function runFireworksAnimation() {
		if (!ctx) return;
		const particles = [];
		let running = true;

		function spawnFirework(x, y) {
			const hue = Math.random() * 360;
			const count = 40 + Math.floor(Math.random()*60);
			for (let i=0;i<count;i++) {
				const a = Math.random() * Math.PI * 2;
				const v = (Math.random()*4 + 1) * (Math.random() < 0.5 ? 1 : 0.6);
				particles.push({
					x, y,
					vx: Math.cos(a) * v,
					vy: Math.sin(a) * v,
					life: 60 + Math.random()*60,
					age: 0,
					hue,
				});
			}
		}

		// launch several fireworks
		const launches = 8;
		for (let i=0;i<launches;i++) {
			setTimeout(()=>{
				const x = 100 + Math.random()*(window.innerWidth-200);
				const y = 100 + Math.random()*(window.innerHeight/2);
				spawnFirework(x, y);
			}, i*400);
		}

		function frame(){
			ctx.clearRect(0,0,canvas.width,canvas.height);
			for (let i=particles.length-1;i>=0;i--) {
				const p = particles[i];
				p.age++;
				p.x += p.vx;
				p.y += p.vy + 0.03 * p.age;
				p.vx *= 0.995; p.vy *= 0.995;
				const t = p.age / p.life;
				const alpha = Math.max(0, 1 - t);
				ctx.beginPath();
				ctx.fillStyle = `hsla(${p.hue},90%,60%,${alpha})`;
				ctx.arc(p.x, p.y, Math.max(1, 2*(1 - t)), 0, Math.PI*2);
				ctx.fill();
				if (p.age > p.life) particles.splice(i,1);
			}
			if (particles.length > 0) requestAnimationFrame(frame);
			else {
				// stop and hide canvas after a short delay
				setTimeout(()=>{
					canvas.classList.add('hidden');
				}, 600);
			}
		}

		requestAnimationFrame(frame);
	}

	// Init canvas size now
	resizeCanvas();

})();

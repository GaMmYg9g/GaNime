// ============================================
// GENERADOR DE SONIDOS PARA GaNime
// ============================================

let audioCtx = null;

function initAudio() {
    if (!audioCtx) {
        audioCtx = new(window.AudioContext || window.webkitAudioContext)();
    }
}

// ============================================
// SONIDO - DING SUAVE (Agregar)
// ============================================
function sonidoDingSuave() {
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.08);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.3);
        osc.start(now);
        osc.stop(now + 0.3);
    } catch (e) {}
}

// ============================================
// SONIDO - FADE DESCENDENTE (Eliminar)
// ============================================
function sonidoFadeDescendente() {
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'triangle';
        osc.frequency.setValueAtTime(500, now);
        osc.frequency.linearRampToValueAtTime(150, now + 0.3);
        gain.gain.setValueAtTime(0.12, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.35);
        osc.start(now);
        osc.stop(now + 0.35);
    } catch (e) {}
}

// ============================================
// SONIDO - PAPER TEAR (Vaciar)
// ============================================
function sonidoPaperTear() {
    try {
        initAudio();
        const now = audioCtx.currentTime;
        for (let i = 0; i < 8; i++) {
            const osc = audioCtx.createOscillator();
            const gain = audioCtx.createGain();
            osc.connect(gain);
            gain.connect(audioCtx.destination);
            osc.type = 'square';
            const freq = 800 - i * 80 + Math.random() * 40;
            osc.frequency.value = freq;
            gain.gain.setValueAtTime(0.04, now + i * 0.04);
            gain.gain.linearRampToValueAtTime(0, now + i * 0.04 + 0.06);
            osc.start(now + i * 0.04);
            osc.stop(now + i * 0.04 + 0.06);
        }
    } catch (e) {}
}

// ============================================
// SONIDO - NOTIFICATION POP (Notificaciones)
// ============================================
function sonidoNotificationPop() {
    try {
        initAudio();
        const now = audioCtx.currentTime;
        const osc = audioCtx.createOscillator();
        const gain = audioCtx.createGain();
        osc.connect(gain);
        gain.connect(audioCtx.destination);
        osc.type = 'sine';
        osc.frequency.setValueAtTime(880, now);
        osc.frequency.setValueAtTime(1100, now + 0.06);
        osc.frequency.setValueAtTime(880, now + 0.12);
        gain.gain.setValueAtTime(0.15, now);
        gain.gain.linearRampToValueAtTime(0, now + 0.25);
        osc.start(now);
        osc.stop(now + 0.25);

        const osc2 = audioCtx.createOscillator();
        const gain2 = audioCtx.createGain();
        osc2.connect(gain2);
        gain2.connect(audioCtx.destination);
        osc2.type = 'sine';
        osc2.frequency.setValueAtTime(660, now + 0.12);
        gain2.gain.setValueAtTime(0.06, now + 0.12);
        gain2.gain.linearRampToValueAtTime(0, now + 0.3);
        osc2.start(now + 0.12);
        osc2.stop(now + 0.3);
    } catch (e) {}
}

// ============================================
// FUNCIÓN PRINCIPAL
// ============================================

function reproducirSonido(tipo) {
    try {
        initAudio();
        if (!audioCtx) return;
        if (audioCtx.state === 'suspended') {
            audioCtx.resume();
        }
        switch (tipo) {
            case 'agregar': 
                sonidoDingSuave();
                break;
            case 'eliminar': 
                sonidoFadeDescendente();
                break;
            case 'vaciar': 
                sonidoPaperTear();
                break;
            case 'notificacion': 
                sonidoNotificationPop();
                break;
        }
    } catch (e) {}
}

// Exponer función
window.reproducirSonido = reproducirSonido;
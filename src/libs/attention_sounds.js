const MASTER_GAIN = 0.32;
const MIN_INTERVAL = 150;
const SOUNDS = {
	press: [
		{ source: { type: 'noise' }, filter: { type: 'highpass', frequency: 2400 }, envelope: { attack: 0.0003, decay: 0.009 }, gain: 0.13 },
		{ source: { type: 'sine', frequency: 680 }, envelope: { attack: 0.0006, decay: 0.022, release: 0.008 }, gain: 0.24 }
	],
	tick: [
		{ source: { type: 'square', frequency: 2100 }, filter: { type: 'bandpass', frequency: 2600, resonance: 1.6 }, envelope: { attack: 0.0004, decay: 0.028 }, gain: 0.24 }
	],
	release: [
		{ source: { type: 'noise' }, filter: { type: 'lowpass', frequency: 1600, resonance: 0.9 }, envelope: { attack: 0.001, decay: 0.055 }, gain: 0.32 }
	],
	page: [
		{ source: { type: 'sine', frequency: { start: 430, end: 640 } }, envelope: { attack: 0.002, decay: 0.11, release: 0.03 }, gain: 0.4 }
	],
	pulse: [
		{ source: { type: 'sine', frequency: 330 }, filter: { type: 'lowpass', frequency: 2200 }, envelope: { attack: 0.002, decay: 0.13, release: 0.04 }, gain: 0.5 }
	]
};
const TOAST_SOUNDS = {
	success: 'page',
	info: 'tick',
	neutral: 'tick',
	warning: 'pulse',
	error: 'release'
};

let context = null;
let master = null;
let lastPlayedAt = 0;

const getContext = () => {
	if (!context || context.state === 'closed') {
		context = new AudioContext();
		master = context.createGain();
		master.gain.value = MASTER_GAIN;
		master.connect(context.destination);
	}
	return context;
};

const createSource = (source, start, duration) => {
	if (source.type === 'noise') {
		const length = Math.ceil(context.sampleRate * (duration + 0.1));
		const buffer = context.createBuffer(1, length, context.sampleRate);
		const samples = buffer.getChannelData(0);
		for (let index = 0; index < length; index++) {
			samples[index] = Math.random() * 2 - 1;
		}
		const node = context.createBufferSource();
		node.buffer = buffer;
		node.start(start);
		node.stop(start + duration + 0.1);
		return node;
	}

	const node = context.createOscillator();
	node.type = source.type;
	if (_.isNumber(source.frequency)) {
		node.frequency.setValueAtTime(source.frequency, start);
	} else {
		node.frequency.setValueAtTime(source.frequency.start, start);
		node.frequency.exponentialRampToValueAtTime(Math.max(source.frequency.end, 1), start + duration);
	}
	node.start(start);
	node.stop(start + duration + 0.1);
	return node;
};

const playLayer = (layer, start) => {
	const { attack = 0, decay, release = 0 } = layer.envelope;
	const duration = attack + decay + release;
	const envelope = context.createGain();
	envelope.gain.setValueAtTime(0.0001, start);
	if (attack > 0) {
		envelope.gain.linearRampToValueAtTime(layer.gain, start + attack);
	} else {
		envelope.gain.setValueAtTime(layer.gain, start);
	}
	envelope.gain.setTargetAtTime(0.0001, start + attack, decay / 3);

	const source = createSource(layer.source, start, duration);
	const nodes = [source, envelope];
	if (layer.filter) {
		const filter = context.createBiquadFilter();
		filter.type = layer.filter.type;
		filter.frequency.setValueAtTime(layer.filter.frequency, start);
		filter.Q.value = layer.filter.resonance ?? 1;
		source.connect(filter);
		filter.connect(envelope);
		nodes.push(filter);
	} else {
		source.connect(envelope);
	}
	envelope.connect(master);
	source.onended = () => {
		_.each(nodes, (node) => { node.disconnect(); });
	};
};

const play = (name) => {
	if (navigator.userActivation?.hasBeenActive === false) {
		return;
	}

	const now = performance.now();
	if (now - lastPlayedAt < MIN_INTERVAL) {
		return;
	}

	lastPlayedAt = now;
	const sound = () => {
		const start = context.currentTime;
		_.each(SOUNDS[name], (layer) => { playLayer(layer, start); });
	};
	try {
		if (getContext().state === 'running') {
			sound();
		} else {
			context.resume().then(sound, () => {});
		}
	} catch (error) {}
};

document.addEventListener('toast-shown', (event) => {
	play(TOAST_SOUNDS[event.detail?.type] ?? 'tick');
});

document.addEventListener('show.bs.dialog', (event) => {
	if (!event.defaultPrevented && event.target.matches('[data-attention]')) {
		play('pulse');
	}
});

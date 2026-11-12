import { LitElement, html, css } from 'lit';

const PARTICLE_COUNT = 800;
const PARTICLE_MOBILE_COUNT = 160;
const PARTICLE_MOBILE_BREAKPOINT = 768;
const PARTICLE_SIZE = 5;
const PARTICLE_OPACITY = 0.3;
const PARTICLE_DRIFT = 0.8;
const PARTICLE_SPREAD = 1.2;
const PARTICLE_FOV = 500;
const PARTICLE_DISTANCE = 450;
const PARTICLE_DEPTH = 200;
const PARTICLE_MAX_RATIO = 2;

export class Particles extends LitElement {
	static styles = css`:host { display: block; pointer-events: none; } canvas { display: block; width: 100%; height: 100%; }`;

	#canvas = null;
	#context = null;
	#resizeObserver = null;
	#frame = null;
	#width = 0;
	#height = 0;
	#particles = [];

	firstUpdated() {
		this.#canvas = this.renderRoot.querySelector('canvas');
		this.#context = this.#canvas.getContext('2d');
		this.#start();
	}

	connectedCallback() {
		super.connectedCallback();
		if (this.#canvas) {
			this.#start();
		}
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#resizeObserver?.disconnect();
		this.#resizeObserver = null;
		cancelAnimationFrame(this.#frame);
		this.#frame = null;
	}

	#start() {
		this.#resizeObserver = new ResizeObserver(() => { this.#size(); });
		this.#resizeObserver.observe(this.#canvas);
		this.#frame = requestAnimationFrame(() => { this.#animate(); });
	}

	#spread() {
		return _.random(Math.max(this.#width, this.#height) * PARTICLE_SPREAD, true);
	}

	#spawn() {
		return {
			angle: _.random(Math.PI * 2, true),
			radius: this.#spread(),
			y: _.random(-this.#height, this.#height, true),
			size: _.random(PARTICLE_SIZE * 0.6, PARTICLE_SIZE * 1.4, true),
			angularSpeed: _.random(0.0015, 0.0025, true),
			opacity: _.clamp(_.random(PARTICLE_OPACITY - 0.2, PARTICLE_OPACITY + 0.2, true), 0, 1),
			scale: 1
		};
	}

	#size() {
		this.#width = Math.max(1, this.#canvas.clientWidth);
		this.#height = Math.max(1, this.#canvas.clientHeight);
		const ratio = _.clamp(window.devicePixelRatio || 1, 1, PARTICLE_MAX_RATIO);
		this.#canvas.width = Math.round(this.#width * ratio);
		this.#canvas.height = Math.round(this.#height * ratio);
		this.#context.setTransform(ratio, 0, 0, ratio, 0, 0);
		this.#particles = _.times((window.innerWidth < PARTICLE_MOBILE_BREAKPOINT ? PARTICLE_MOBILE_COUNT : PARTICLE_COUNT), () => { return this.#spawn(); });
	}

	#animate() {
		this.#frame = requestAnimationFrame(() => { this.#animate(); });
		_.each(this.#particles, (particle) => {
			particle.angle += particle.angularSpeed;
			particle.y -= PARTICLE_DRIFT;
			if (particle.y < -this.#height) {
				particle.y = this.#height;
				particle.radius = this.#spread();
			}
			particle.scale = PARTICLE_FOV / Math.max(1, PARTICLE_FOV + PARTICLE_DISTANCE + Math.sin(particle.angle) * PARTICLE_DEPTH);
		});
		this.#particles.sort((a, b) => a.scale - b.scale);

		this.#context.clearRect(0, 0, this.#width, this.#height);
		this.#context.fillStyle = getComputedStyle(this).color;
		_.each(this.#particles, (particle) => {
			this.#context.globalAlpha = particle.opacity;
			this.#context.beginPath();
			this.#context.arc(this.#width / 2 + Math.cos(particle.angle) * particle.radius * particle.scale, this.#height / 2 + particle.y * particle.scale, particle.size * particle.scale, 0, Math.PI * 2);
			this.#context.fill();
		});
	}

	render() {
		return html`<canvas></canvas>`;
	}
}

customElements.define('u-particles', Particles);

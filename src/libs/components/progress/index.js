import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';

export class Progress extends LitElement {
	static styles = [sheet, css`:host { display: block; }`];

	static get properties() {
		return {
			shadow: { type: Boolean, reflect: true, converter: {
				fromAttribute: (value) => { return value === null || value === '' || value === 'true' }
			} }
		};
	}

	constructor() {
		super();
		this.shadow = true;
	}

	render() {
		return html`
			<div class="progress ${classMap({ 'shadow-none': this.shadow === false })}" role="progressbar" style="height: 6px;">
				<slot></slot>
			</div>
		`;
	}
}

export class ProgressBar extends LitElement {
	static styles = [sheet, css`:host { display: block; } .progress-bar { width: 100%; height: 100%; }`];

	static get properties() {
		return {
			color: { type: String, reflect: true, converter: {
                fromAttribute: (value) => { return value ?? 'blue'; }
            } },
			tint: { type: String, reflect: true, converter: {
                fromAttribute: (value) => { return value ?? 300; }
            }},
			width: { type: Number, reflect: true },
			warningThreshold: { type: Number, reflect: true, attribute: 'warning-threshold', converter: {
                fromAttribute: (value) => { return value ?? 80; }
            } },
			dangerThreshold: { type: Number, reflect: true, attribute: 'danger-threshold', converter: {
                fromAttribute: (value) => { return value ?? 90; }
            } },
			striped: { type: Boolean, reflect: true, converter: {
				fromAttribute: (value) => { return value === null || value === '' || value === 'true' }
			} },
			animated: { type: Boolean, reflect: true, converter: {
				fromAttribute: (value) => { return value === null || value === '' || value === 'true' }
			} },
			tip: { type: String, reflect: true }
		};
	}

	#tooltip = null;

	constructor() {
		super();
		this.color = 'blue';
		this.tint = 300;
		this.width = 0;
		this.warningThreshold = 100;
		this.dangerThreshold = 100;
		this.striped = false;
		this.animated = false;
		this.tip = '';
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#tooltip?.dispose();
		this.#tooltip = null;
	}

	firstUpdated() {
		const progressBar = this.renderRoot.querySelector('.progress-bar');
		if (progressBar) {
			this.#tooltip = new bootstrap.Tooltip(progressBar);
		}
	}

	render() {
		const hasTint = !['white', 'black'].includes(this.color);
		const classes = {
			[`bd-${this.color}${hasTint ? `-${this.tint}` : ''}`]: this.width < this.warningThreshold,
			[`bg-orange-${this.tint}`]: this.width >= this.warningThreshold && this.width < this.dangerThreshold,
			[`bg-red-${this.tint}`]: this.width >= this.dangerThreshold,
			'progress-bar-striped': this.striped,
			'progress-bar-animated': this.animated
		};

		return html`
			<style>:host { width: ${this.width}%; }</style>
			<div
				class="progress-bar ${classMap(classes)}"
				data-bs-original-title="${this.tip}"
				@mouseenter=${() => { this.#tooltip?.show(); }}
				@mouseleave=${() => { this.#tooltip?.hide(); }}
			>
			</div>
		`;
	}
}

customElements.define('u-progress', Progress);
customElements.define('u-progress-bar', ProgressBar);

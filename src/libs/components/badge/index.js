import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';

export class Badge extends LitElement {
	static styles = [sheet, css`:host { display: inline-block; }`];

	static get properties() {
		return {
			color: { type: String, reflect: true, converter: {
				fromAttribute: (value) => { return value ?? 'blue'; }
			} },
			tint: { type: String, reflect: true, converter: {
				fromAttribute: (value) => { return value ?? 100; }
			}},
			pill: { type: Boolean, reflect: true },
			border: { type: Boolean, reflect: true },
			tip: { type: String, reflect: true }
		};
	}

	#tooltip = null;

	constructor() {
		super();
		this.color = 'blue';
		this.tint = 100;
		this.pill = false;
		this.border = false;
		this.tip = '';
		this.addEventListener('mouseleave', () => { this.#tooltip?.hide(); });
	}

	connectedCallback() {
		super.connectedCallback();
		this.#tooltip = new bootstrap.Tooltip(this, { selector: false, trigger: 'hover', title: () => { return this.tip; } });
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#tooltip?.dispose();
		this.#tooltip = null;
	}

	render() {
		const hasTint = !['white', 'black'].includes(this.color);
		const classes = {
			[`bd-${this.color}${hasTint ? `-${this.tint}` : ''}`]: true,
			'rounded-pill': this.pill,
			'border border-white': this.border
		};
		return html`
			<div class="d-flex align-items-center badge ${classMap(classes)} fw-normal">
				<slot></slot>
			</div>
		`;
	}
}

customElements.define('u-badge', Badge);

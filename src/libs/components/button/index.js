import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from "../styles.js";

export class Button extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			variant: { type: String, reflect: true },
			size: { type: String, reflect: true },
			outline: { type: Boolean, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true }
		};
	}

	#initialDisabled = false;
	#tooltip;

	constructor() {
		super();
		this.internals = this.attachInternals();
		this.variant = 'primary';
		this.size = '';
		this.outline = false;
		this.tip = '';
		this.disabled = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialDisabled = this.hasAttribute('disabled');
	}

	formResetCallback() {
		this.disabled = this.#initialDisabled;
	}

	firstUpdated() {
		this.#tooltip = new bootstrap.Tooltip(this.renderRoot.querySelector('span'));
	}

	render() {
		const classes = {
			[`btn${this.outline ? '-outline' : ''}-${this.variant}`]: true,
			[`btn-${this.size}`]: this.size ? true : false
		};
		return html`
			<span
				data-bs-toggle="tooltip"
				data-bs-original-title="${this.tip ? this.tip : ''}"
				@mouseenter=${() => { this.#tooltip.show(); }}
				@mouseleave=${() => { this.#tooltip.hide(); }}
			>
				<button
					type="button"
					class="btn ${classMap(classes)} d-inline-flex flex-column align-items-center"
					?disabled=${this.disabled}
				>
					<slot></slot>
				</button>
			</span>
		`;
	}
}

customElements.define('u-button', Button);

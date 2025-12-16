import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from "../styles.js";

export class Button extends LitElement {
	static formAssociated = true;
	static styles = [sheet, css`:host { display: inline-block; }`];

	static get properties() {
		return {
			variant: { type: String, reflect: true, converter: {
                fromAttribute: (value) => { return value ?? 'primary'; }
            }},
			size: { type: String, reflect: true },
			outline: { type: Boolean, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			loadingText: { type: String, reflect: true, attribute: 'loading-text' }
		};
	}

	#initialSlotContent = [];
	#initialTip = '';
	#initialDisabled = false;
	#tooltip = null;

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
		this.#initialSlotContent = Array.from(this.childNodes).map(node => node.cloneNode(true));
		this.#initialTip = this.tip;
		this.#initialDisabled = this.hasAttribute('disabled');
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#tooltip?.dispose();
		this.#tooltip = null;
	}

	formResetCallback() {
		this.reset();
		this.tip = this.#initialTip;
		this.disabled = this.#initialDisabled;
	}

	firstUpdated() {
		const span = this.renderRoot.querySelector('span');
		if (span) {
			this.#tooltip = new bootstrap.Tooltip(span);
		}
	}

	loading() {
		this.disabled = true;
		this.innerHTML = this.loadingText || 'Loading...';
	}

	reset() {
		this.innerHTML = '';
        this.#initialSlotContent.forEach(node => {
            this.appendChild(node.cloneNode(true));
        });
		this.disabled = false;
	}

	render() {
		const classes = {
			[`btn${this.outline ? '-outline' : ''}-${this.variant}`]: true,
			[`btn-${this.size}`]: !!this.size
		};
		return html`
			<span
				class="d-inline-block"
				data-bs-original-title="${this.tip}"
				@mouseenter=${() => { this.#tooltip?.show(); }}
				@mouseleave=${() => { this.#tooltip?.hide(); }}
			>
				<button
					type="button"
					class="btn ${classMap(classes)} d-inline-flex align-items-center"
					?disabled=${this.disabled}
				>
					<slot></slot>
				</button>
			</span>
		`;
	}
}

customElements.define('u-button', Button);

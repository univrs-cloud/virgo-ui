import { LitElement, html, css } from 'lit';
import { classMap } from 'lit/directives/class-map.js';
import { sheet } from '../styles.js';

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
			subtle: { type: Boolean, reflect: true },
			tip: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			loadingText: { type: String, reflect: true, attribute: 'loading-text' },
			type: { type: String, reflect: true, converter: { fromAttribute: (value) => value ?? 'button' } }
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
		this.subtle = false;
		this.tip = '';
		this.disabled = false;
		this.addEventListener('mouseleave', () => { this.#tooltip?.hide(); });
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialSlotContent = Array.from(this.childNodes).map(node => node.cloneNode(true));
		this.#initialTip = this.tip;
		this.#initialDisabled = this.hasAttribute('disabled');
		this.#tooltip = new bootstrap.Tooltip(this, { selector: false, trigger: 'hover', title: () => { return this.tip; } });
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
			'btn-outline': this.outline,
			'btn-subtle': !this.outline && this.subtle,
			'btn-solid': !this.outline && !this.subtle,
			[`theme-${this.variant}`]: true,
			[`btn-${this.size}`]: !!this.size
		};
		return html`
			<span class="d-inline-block">
				<button
					type="${this.type || 'button'}"
					class="${classMap(classes)} d-inline-flex align-items-center"
					?disabled=${this.disabled}
					@click=${this.#handleClick}
				>
					<slot></slot>
				</button>
			</span>
		`;
	}

	#handleClick(event) {
		if (this.type === 'submit' && !this.disabled) {
			this.closest('form')?.dispatchEvent(new event.constructor('submit', event));
		}
	}
}

customElements.define('u-button', Button);

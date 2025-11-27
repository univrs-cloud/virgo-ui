import { LitElement, html } from 'lit';
import { sheet } from "../styles.js";

export class Switch extends LitElement {
	static formAssociated = true;
	static styles = [sheet];

	static get properties() {
		return {
			onValue: { type: String },
			offValue: { type: String },
			onLabel: { type: String },
			offLabel: { type: String },
			label: { type: String, reflect: true },
			checked: { type: Boolean, reflect: true },
			disabled: { type: Boolean, reflect: true }
		}
	}

	#initialChecked = false;
	#initialDisabled = false;

	constructor() {
		super();
		this.internals = this.attachInternals();

		this.onValue = '';
		this.offValue = '';
		this.onLabel = '';
		this.offLabel = '';
		this.label = '';
		this.checked = false;
		this.disabled = false;
	}

	connectedCallback() {
		super.connectedCallback();
		this.#initialChecked = this.hasAttribute('checked');
		this.#initialDisabled = this.hasAttribute('disabled');
		this.value = this.checked ? this.onValue : this.offValue;
		this.internals.setFormValue(this.value);
	}

	async formResetCallback() {
		this.checked = this.#initialChecked;
		this.disabled = this.#initialDisabled;
		await this.updateComplete;
		const input = this.renderRoot.querySelector('input');
  		input.checked = this.checked;
		input.dispatchEvent(new Event('change'));
	}

	render() {
		return html`
			${this.label ? html`<small class="fw-light text-body-tertiary">${this.label}</small>` : ''}
			<div class="d-flex align-items-center mb-3">
				${this.offLabel ? html`<div class="form-check form-switch form-check-inline ps-0 mb-0 me-2"><label class="form-check-label">${this.offLabel}</label> </div>` : ''}
				<div class="form-check form-switch form-check-inline mb-0">
					<input
						type="checkbox"
						class="form-check-input"
						role="switch"
						aria-checked=${this.checked}
						.checked=${this.checked}
						?disabled=${this.disabled}
						@change=${this.#onChange}
					>
					${this.onLabel ? html`<label class="form-check-label">${this.onLabel}</label>` : ''}
				</div>
			</div>
		`;
	}

	#onChange(event) {
		this.checked = event.target.checked;
		this.value = this.checked ? this.onValue : this.offValue;
		this.internals.setFormValue(this.value);
		this.dispatchEvent(new CustomEvent('switch-changed', { detail: event, bubbles: true, composed: true }));
	}
}

customElements.define('u-switch', Switch);

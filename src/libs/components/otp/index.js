import { LitElement, html } from 'lit';
import { classMap } from 'lit/directives/class-map.js';

export class Otp extends LitElement {
	static get properties() {
		return {
			name: { type: String, reflect: true },
			label: { type: String, reflect: true },
			length: { type: Number, reflect: true },
			align: { type: String, reflect: true },
			autocomplete: { type: String, reflect: true },
			disabled: { type: Boolean, reflect: true },
			error: { type: String }
		};
	}

	#error = '';
	#otp = null;
	#controller = null;

	constructor() {
		super();
		this.name = '';
		this.label = '';
		this.length = 6;
		this.align = 'start';
		this.autocomplete = 'one-time-code';
		this.disabled = false;
	}

	set error(value) {
		const oldValue = this.#error;
		this.#error = value;
		this.classList.toggle('is-invalid', Boolean(value));
		this.requestUpdate('error', oldValue);
	}

	get error() {
		return this.#error;
	}

	set value(value) {
		this.#otp?.setValue(value ?? '');
	}

	get value() {
		return this.querySelector('.otp-input')?.value ?? '';
	}

	createRenderRoot() {
		return this;
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#controller?.abort();
		this.#otp?.dispose();
		this.#otp = null;
	}

	firstUpdated() {
		const input = this.querySelector('.otp-input');
		this.#otp = new bootstrap.OtpInput(this.querySelector('.otp'));
		this.#controller = new AbortController();
		const signal = this.#controller.signal;
		input.addEventListener('input', () => {
			this.error = '';
		}, { signal });
		input.addEventListener('keypress', (event) => {
			if (event.code.toLowerCase() === 'enter') {
				this.closest('form')?.dispatchEvent(new event.constructor('submit', event));
			}
		}, { signal });
		this.closest('form')?.addEventListener('reset', () => {
			requestAnimationFrame(() => { this.#otp?.setValue(''); });
		}, { signal });
	}

	focus() {
		this.#otp?.focus();
	}

	render() {
		return html`
			<div class="text-${this.align} mb-7">
				<label class="form-label d-block fw-light fg-4">${this.label}</label>
				<div class="position-relative">
					<div class="otp d-inline-flex align-top ${classMap({ 'is-invalid': this.error })}">
						<input
							type="text"
							class="otp-input"
							name=${this.name}
							maxlength=${this.length}
							autocomplete=${this.autocomplete}
							aria-label=${this.label}
							?disabled=${this.disabled}
						>
					</div>
					<div class="invalid-feedback lh-1 z-1 position-absolute top-100 start-0 end-0 ${classMap({ 'd-block': this.error })}">${this.error || ''}</div>
				</div>
			</div>
		`;
	}
}

customElements.define('u-otp', Otp);

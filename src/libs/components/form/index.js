import { LitElement, html } from 'lit';
import validator from 'validator';

export class Form extends LitElement {
	static formAssociated = true;

	static get properties() {
		return {
			valid: { type: Boolean, reflect: true },
			validation: { type: Array }
		};
	}

	#validation = [];
	#validationTimeouts = {};
	#validationListeners = new Map();
	#isResetting = false;
	#form = null;
	#observer = null;

	constructor() {
		super();
		this.validator = validator;
	}

	set validation(value) {
		this.#validation = value;
		this.#clearValidationListeners();
		this.#setupLiveValidation();
	}

	get validation() {
		return this.#validation;
	}

	createRenderRoot() {
		return this;
	}

	connectedCallback() {
		super.connectedCallback();
		
		const form = document.createElement('form');
		form.noValidate = true;
		while (this.firstChild) {
			form.appendChild(this.firstChild);
		}
		this.appendChild(form);
		this.#form = form;
		form.addEventListener('submit', (event) => {
			event.preventDefault();
			if (this.#isFormValid()) {
				this.dispatchEvent(new CustomEvent('valid', {
					detail: event,
					bubbles: true,
					composed: true
				}));
			} else {
				form.querySelector('.is-invalid').focus();
			}
		});
		form.addEventListener('reset', () => {
			this.#clearValidationErrors();
        });
		
		// Watch for new children added to u-form and move them into the form
		this.#observer = new MutationObserver((mutations) => {
			mutations.forEach((mutation) => {
				mutation.addedNodes.forEach((node) => {
					// Don't move the form itself
					if (node !== this.#form && node.nodeType === Node.ELEMENT_NODE) {
						this.#form.appendChild(node);
					}
				});
			});
		});
		
		this.#observer.observe(this, { childList: true });
	}

	disconnectedCallback() {
		super.disconnectedCallback();
		this.#observer?.disconnect();
		this.#clearValidationListeners();
	}

	render() {
		return html`<slot></slot>`;
	}

	submit() {
		this.#form?.submit();
	}

	reset() {
		this.#isResetting = true;
		this.#form?.reset();
		requestAnimationFrame(() => {
			this.#isResetting = false;
		});
	}

	getData() {
		if (!this.#form) {
			return {};
		}
		
		const formData = new FormData(this.#form);
		const data = {};
		
		for (let [key, value] of formData.entries()) {
			data[key] = value;
		}
		
		return data;
	}

	#isFormValid() {
		this.#validateForm();
		return this.#form.querySelectorAll('.is-invalid').length === 0;
	}

	#validateForm() {
		if (!this.validation || this.validation.length === 0) {
			return;
		}

		this.validation.forEach((field) => {
			const inputs = this.#form.querySelectorAll(field.selector);
			inputs.forEach((input) => {
				this.#validateField(input, field.selector);;
			})
		});
	}

	#validateField(input, selector) {
		const fieldConfig = this.validation.find((field) => { return field.selector === selector; });
		if (!fieldConfig) {
			return;
		}
		
		const value = input.value;
		const rules = fieldConfig.rules;
		let error = '';
		for (const [ruleName, ruleConfig] of Object.entries(rules)) {
			error = this.#validateRule(ruleName, value, ruleConfig, input);
			if (error) {
				break;
			}
		}
		input.error = error;
	}

	#validateRule(ruleName, value, ruleConfig, input) {
		if (ruleName === 'custom') {
			// Can be a direct function or object with validate + message
			const customFn = typeof ruleConfig === 'function' ? ruleConfig : ruleConfig.validate;
			const errorMessage = typeof ruleConfig === 'object' && ruleConfig.message ? ruleConfig.message : 'Validation failed';
			
			if (typeof customFn === 'function') {
				const result = customFn(value, input, this);
				// true = valid, string = custom error, anything else = use default message
				if (result === true) {
					return ''; // Valid
				}
				if (typeof result === 'string') {
					return result; // Custom error message from function
				}
				return errorMessage; // Invalid, use configured message
			}
			return '';
		}

		// Handle 'isEmpty' as a special "required" rule (inverted logic)
		if (ruleName === 'isEmpty') {
			const errorMessage = typeof ruleConfig === 'string' ? ruleConfig : ruleConfig?.message;
			if (this.validator.isEmpty(value.toString().trim())) {
				return errorMessage;
			}
			return '';
		}

		const errorMessage = typeof ruleConfig === 'string' ? ruleConfig : ruleConfig?.message;
		
		let options;
		if (typeof ruleConfig === 'object' && ruleConfig !== null) {
			options = { ...ruleConfig };
			delete options.message;
		}

		// Try to call validator function dynamically
		// Use ruleName as-is (e.g., 'isEmail', 'isLatLong')
		const validatorFnName = ruleName;
		
		if (typeof this.validator[validatorFnName] === 'function') {
			try {
				let isValid;
				// Call the validator function with value and options
				if (!options || Object.keys(options).length === 0) {
					isValid = this.validator[validatorFnName](value.toString());
				} else {
					const optionKeys = Object.keys(options);
					if (optionKeys.length === 1 && typeof options[optionKeys[0]] === 'function') {
						isValid = this.validator[validatorFnName](value.toString(), options[optionKeys[0]]());
					} else {
						isValid = this.validator[validatorFnName](value.toString(), options);
					}
				}
				if (!isValid) {
					return errorMessage;
				}
			} catch (error) {
				console.warn(`Validation error for rule '${ruleName}':`, error);
				return errorMessage;
			}
		} else {
			console.warn(`Unknown validation rule: ${ruleName}. No validator function found: ${validatorFnName}`);
		}

		return '';
	}

	#setupLiveValidation(debounceMs = 300) {
		if (!this.#validation || !this.#form) {
			return;
		}

		this.#validation.forEach((field) => {
			const inputs = this.#form.querySelectorAll(field.selector);
			inputs.forEach((input, index) => {
				const uniqueId = `${field.selector}-${index}`;
				if (this.#validationListeners.has(uniqueId)) {
					return;
				}

				const valueChangedListener = () => {
					if (this.#isResetting) {
						return;
					}

					clearTimeout(this.#validationTimeouts[uniqueId]);
					this.#validationTimeouts[uniqueId] = setTimeout(() => {
						this.#validateField(input, field.selector);
					}, debounceMs);
				};

				const blurListener = () => {
					if (this.#isResetting) {
						return;
					}

					this.#validateField(input, field.selector);
				};

				input.addEventListener('value-changed', valueChangedListener);
				input.addEventListener('blur', blurListener);

				this.#validationListeners.set(uniqueId, {
					valueChanged: valueChangedListener,
					blur: blurListener,
					input
				});
			});
		});
	}

	#clearValidationErrors() {
		this.validation.forEach((field) => {
			const inputs = this.#form.querySelectorAll(field.selector);
			inputs.forEach((input) => {
				input.error = '';
			});
		});
	}

	#clearValidationListeners() {
		this.#validationListeners.forEach(({ valueChanged, blur, input }) => {
			input.removeEventListener('value-changed', valueChanged);
			input.removeEventListener('blur', blur);
		});
		this.#validationListeners.clear();
	}
}

customElements.define('u-form', Form);

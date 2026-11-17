const DAYS = ['monday', 'tuesday', 'wednesday', 'thursday', 'friday', 'saturday', 'sunday'];
const KINDS = ['frequently', 'hourly', 'daily', 'weekly', 'monthly', 'yearly'];
const RESERVED_NAMES = ['default', 'paused', 'ignore', 'backup'];
const UNIT_HOURS = { hours: 1, days: 24, weeks: 168, months: 730.5, years: 8766 };
const KIND_HOURS = { frequently: 0.25, hourly: 1, daily: 24, weekly: 168, monthly: 730.5, yearly: 8766 };
const MAX_SPANS = {
	frequently: { hours: 48 },
	hourly: { hours: 336 },
	daily: { hours: 2191.5 },
	weekly: { hours: 4383 },
	monthly: { hours: 43830 },
	yearly: { hours: 87660 }
};
const PRESETS = { all: DAYS, work: _.take(DAYS, 5), weekend: _.takeRight(DAYS, 2) };

const countOf = (kind, { amount, unit }, { days, from, to }) => {
	let share = 1;
	if (kind === 'daily') {
		share = _.size(days) / 7;
	}
	if (kind === 'frequently' || kind === 'hourly') {
		share = (_.size(days) / 7) * ((to - from) / 24);
	}
	if (!amount || !share) {
		return 0;
	}

	return Math.max(1, Math.ceil((amount * UNIT_HOURS[unit] / KIND_HOURS[kind] * share) - 1e-9));
};

const isWholeNumber = (value, min, max) => {
	const number = Number(value);
	return (_.trim(value) !== '' && Number.isInteger(number) && number >= min && number <= max);
};

export const defaultRule = () => {
	return {
		name: '',
		keep: {
			frequently: { amount: 0, unit: 'hours' },
			hourly: { amount: 36, unit: 'hours' },
			daily: { amount: 30, unit: 'days' },
			weekly: { amount: 0, unit: 'weeks' },
			monthly: { amount: 1, unit: 'years' },
			yearly: { amount: 0, unit: 'years' }
		},
		schedule: { days: [...DAYS], from: 0, to: 24 }
	};
};

export const validation = (form, getRules) => {
	return [
		{
			selector: '.rule-name',
			rules: {
				isEmpty: `Can't be empty`,
				custom: {
					validate: (value) => {
						const name = _.trim(value);
						if (!/^[a-z0-9][a-z0-9 _-]*$/i.test(name)) {
							return 'Letters, digits, spaces, dashes and underscores only';
						}

						if (_.size(name) > 40) {
							return 'At most 40 characters';
						}

						if (_.includes(RESERVED_NAMES, _.toLower(name))) {
							return 'This name is used by the system';
						}

						const previousName = _.toLower(form.getData().previousName);
						return !_.some(getRules(), (rule) => { return _.toLower(rule.name) === _.toLower(name) && _.toLower(rule.name) !== previousName; });
					},
					message: 'Must be unique'
				}
			}
		},
		{
			selector: '.keep-amount',
			rules: {
				custom: {
					validate: (value, input) => {
						if (input.closest('.keep-fields').classList.contains('d-none')) {
							return true;
						}

						if (!isWholeNumber(value, 1, 9999)) {
							return 'A whole number from 1 to 9999';
						}

						const { rule } = readRule(form);
						const kind = input.getAttribute('name');
						const unit = rule.keep[kind].unit;
						const maximum = Math.floor((MAX_SPANS[kind].hours / UNIT_HOURS[unit]) + 1e-9);
						if (Number(value) > maximum) {
							return `At most ${maximum} ${(maximum === 1 ? _.trimEnd(unit, 's') : unit)}`;
						}

						if (countOf(kind, rule.keep[kind], rule.schedule) > 9999) {
							return 'Too long';
						}

						return true;
					}
				}
			}
		}
	];
};

export const readRule = (form) => {
	const data = form.getData();
	return {
		previousName: data.previousName,
		rule: {
			name: _.trim(data.name),
			keep: _.fromPairs(_.map(KINDS, (kind) => { return [kind, { amount: (form.querySelector(`.kind-toggle[data-kind="${kind}"]`)?.checked ? Number(data[kind]) : 0), unit: data[`${kind}Unit`] }]; })),
			schedule: {
				days: _.map(form.querySelectorAll('.schedule-day.active'), (chip) => { return chip.dataset.day; }),
				from: Number(data.from),
				to: Number(data.to)
			}
		}
	};
};

export const toggleDay = (event) => {
	const chip = event.target.closest('.schedule-day');
	if (chip) {
		chip.classList.toggle('active');
		return;
	}

	const preset = PRESETS[event.target.closest('[data-days-preset]')?.dataset.daysPreset];
	if (preset) {
		_.each(event.currentTarget.querySelectorAll('.schedule-day'), (current) => { current.classList.toggle('active', _.includes(preset, current.dataset.day)); });
	}
};

export const renderPreview = (form) => {
	const preview = form.querySelector('.rule-preview');
	if (!preview) {
		return;
	}

	const { rule } = readRule(form);
	const counts = _.map(KINDS, (kind) => { return countOf(kind, rule.keep[kind], rule.schedule); });
	const total = _.sum(_.map(counts, (count) => { return (Number.isFinite(count) ? count : 0); }));
	const reach = _.max(_.map(KINDS, (kind, index) => { return (counts[index] > 0 ? rule.keep[kind].amount * UNIT_HOURS[rule.keep[kind].unit] / 24 : 0); }));
	preview.textContent = (total > 0 && reach > 0 ? `Keeps up to ${total} ${(total === 1 ? 'snapshot' : 'snapshots')} for ${moment.duration(reach, 'days').humanize()}.` : '');
};

export const moveHours = (event) => {
	const input = event.target.closest('.hour-range-from, .hour-range-to');
	if (!input) {
		return;
	}

	const range = input.closest('.hour-range');
	const from = range.querySelector('.hour-range-from');
	const to = range.querySelector('.hour-range-to');
	if (input === from && Number(from.value) >= Number(to.value)) {
		from.value = Number(to.value) - 1;
	}
	if (input === to && Number(to.value) <= Number(from.value)) {
		to.value = Number(from.value) + 1;
	}
	renderHours(range.closest('.dialog-body'));
};

export const renderHours = (body) => {
	const range = body.querySelector('.hour-range');
	if (!range) {
		return;
	}

	const from = Number(range.querySelector('.hour-range-from').value);
	const to = Number(range.querySelector('.hour-range-to').value);
	const pad = (hour) => { return `${_.padStart(String(hour), 2, '0')}:00`; };
	range.style.setProperty('--hour-range-from', from / 24);
	range.style.setProperty('--hour-range-to', to / 24);
	body.querySelector('.hour-range-value').textContent = `${pad(from)} to ${pad(to)}`;
};

export const checkKinds = (form) => {
	const hasKind = _.some(form.querySelectorAll('.kind-toggle'), (toggle) => { return toggle.checked; });
	form.querySelector('.kinds-error').classList.toggle('d-block', !hasKind);
	return hasKind;
};

export const toggleKind = (event) => {
	const kind = event.target.closest('.kind-toggle')?.dataset.kind;
	if (!kind) {
		return;
	}

	event.currentTarget.querySelector(`.keep-fields[data-kind="${kind}"]`).classList.toggle('d-none', !event.target.checked);
	const isScheduled = _.some(event.currentTarget.querySelectorAll('.kind-toggle'), (toggle) => { return _.includes(['frequently', 'hourly', 'daily'], toggle.dataset.kind) && toggle.checked; });
	event.currentTarget.querySelector('.schedule-section').classList.toggle('d-none', !isScheduled);
	checkKinds(event.currentTarget);
};

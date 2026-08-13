const STEPS = [
	{ name: 'welcome', path: '/' },
	{ name: 'interface', path: '/network/interface' },
	{ name: 'host', path: '/network/host' },
	{ name: 'ports', path: '/network/ports' },
	{ name: 'storage', path: '/storage' },
	{ name: 'password', path: '/password' },
	{ name: 'fleet', path: '/fleet' },
	{ name: 'finish', path: '/finish' }
];

let completedSteps = [];

const completeStep = (name) => {
	if (_.includes(completedSteps, name)) {
		return;
	}

	completedSteps.push(name);
};

// Entering a step means everything ahead of it is behind us — a refresh deep in the wizard resumes
// there instead of starting over, since the steps it skipped were completed before the reload.
const completeStepsBefore = (name) => {
	_.each(_.slice(STEPS, 0, Math.max(_.findIndex(STEPS, { name }), 0)), (step) => { completeStep(step.name); });
};

const isStepCompleted = (name) => {
	return _.includes(completedSteps, name);
};

const stepPath = (name) => {
	return _.find(STEPS, { name })?.path;
};

// The last step has nowhere to go yet, so it stays where it is until the next one is added.
const nextStepPath = (name) => {
	return _.nth(STEPS, _.findIndex(STEPS, { name }) + 1)?.path || stepPath(name);
};

const previousStepPath = (name) => {
	return _.nth(STEPS, Math.max(_.findIndex(STEPS, { name }) - 1, 0))?.path;
};

export {
	STEPS,
	completeStep,
	completeStepsBefore,
	isStepCompleted,
	stepPath,
	nextStepPath,
	previousStepPath
};

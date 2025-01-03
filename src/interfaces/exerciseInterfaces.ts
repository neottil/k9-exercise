// Describes the effort distribution for various working areas
interface WorkingArea {
    mental: number;
    flexibility: number;
    strength: number;
    balance: number;
    cardio: number;
}

// Describes the focus on different body target areas
interface BodyTarget {
    ant: number;       // Anterior muscles
    post: number;      // Posterior muscles
    core: number;      // Core muscles
    backbone: number;  // Backbone-related muscles
    fullBody: number;  // Full body engagement
}

const movementPlans = ["Mediano", "Trasverso", "Dorsale"] as const;
type MovementPlan = typeof movementPlans[number];

interface Exercise {
    id: string;
    type: string;
    description: string;

    workingArea: WorkingArea;
    bodyTarget: BodyTarget;

    movementPlan: MovementPlan[];
    tools: string[];

    setup: string;
    user: string | undefined;
}

const defaultWorkingArea: WorkingArea = {
    mental: 0,
    flexibility: 0,
    strength: 0,
    balance: 0,
    cardio: 0,
}

const defaultBodyTarget: BodyTarget = {
    ant: 0,
    post: 0,
    core: 0,
    backbone: 0,
    fullBody: 0,
}

const defaultExercise: Exercise = {
    id: "",
    type: "",
    description: "",
    workingArea: defaultWorkingArea,
    bodyTarget: defaultBodyTarget,
    movementPlan: [],
    tools: [],
    setup: "",
    user: "",
};

export type {
    Exercise
}

export {
    defaultExercise,
    defaultWorkingArea,
    defaultBodyTarget,
    movementPlans
}

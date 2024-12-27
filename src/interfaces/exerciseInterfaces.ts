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

/*
as const:
Trasforma l'array in un tipo readonly e ogni elemento in un valore letterale.
Senza as const, TypeScript considererebbe l'array come string[] anziché un insieme di stringhe specifiche.

typeof movementPlans:
Ottiene il tipo dell'array (readonly ["Mediano", "Trasverso", "Dorsale"]).

typeof movementPlans[number]:
Usa l'indice number per estrarre i tipi degli elementi dell'array, producendo il tipo unione: "Mediano" | "Trasverso" | "Dorsale".
*/
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

const defaultExercise: Exercise = {
    id: "",
    type: "",
    description: "",
    workingArea: {
        mental: 0,
        flexibility: 0,
        strength: 0,
        balance: 0,
        cardio: 0,
    },
    bodyTarget: {
        ant: 0,
        post: 0,
        core: 0,
        backbone: 0,
        fullBody: 0,
    },
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
    movementPlans
}

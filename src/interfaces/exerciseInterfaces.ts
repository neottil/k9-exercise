import { FailoverStatusCode } from "aws-cdk-lib/aws-cloudfront";

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

type MovementPlan = "MEDIANO" | "TRASVERSO" | "DORSALE";

interface Exercise {
    id: string;
    type: string;
    description: string;

    workingArea: WorkingArea;
    bodyTarget: BodyTarget;

    movementPlan: MovementPlan[];
    tools: string[];

    setup: string;
    user: string;
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
    defaultExercise
}
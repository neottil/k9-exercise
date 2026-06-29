// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

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
    ant: number;
    post: number;
    core: number;
    backbone: number;
    fullBody: number;
}

const movementPlans = ["Mediano", "Trasverso", "Dorsale"] as const;
type MovementPlan = typeof movementPlans[number];

// Metadati di un'immagine associata all'esercizio. Il binario vive su minIO;
// qui c'è solo il riferimento. Il client invia questi oggetti come "immagini da
// mantenere"; il server risolve per id e usa i propri metadati autorevoli.
interface ExerciseImage {
    id: string;
    key: string;
    filename?: string;
    mimeType?: string;
    size?: number;
    uploadedAt?: string;
    uploadedBy?: string;
}

interface Exercise {
    id: string;
    type: string;
    variant: string;
    description: string;

    instructorLevel: string;

    workingArea: WorkingArea;
    bodyTarget: BodyTarget;

    movementPlan: MovementPlan[];
    tools: string[];
    difficultyLevel: number;

    setup: string;
    images: ExerciseImage[];
    user: string | undefined;
    userUpdate: string | undefined;
}

const defaultWorkingArea: WorkingArea = {
    mental: 0,
    flexibility: 0,
    strength: 0,
    balance: 0,
    cardio: 0,
};

const defaultBodyTarget: BodyTarget = {
    ant: 0,
    post: 0,
    core: 0,
    backbone: 0,
    fullBody: 0,
};

const defaultExercise: Exercise = {
    id: "",
    type: "",
    variant: "",
    description: "",
    instructorLevel: "BSS",
    workingArea: defaultWorkingArea,
    bodyTarget: defaultBodyTarget,
    movementPlan: [],
    tools: [],
    difficultyLevel: 1,
    setup: "",
    images: [],
    user: "",
    userUpdate: ""
};

// Massimo immagini per esercizio (allineato al limite server MAX_IMAGES).
const MAX_IMAGES = 3;

export type {
    Exercise,
    ExerciseImage,
}

export {
    defaultExercise,
    defaultWorkingArea,
    defaultBodyTarget,
    movementPlans,
    MAX_IMAGES
}

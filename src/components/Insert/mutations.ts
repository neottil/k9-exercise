export const createExercise = /* GraphQL */ `
  mutation CreateExercise(
    $condition: ModelExerciseConditionInput
    $input: CreateExerciseInput!
  ) {
    createExercise(condition: $condition, input: $input) {
      bodyTarget {
        ant
        backbone
        core
        fullBody
        post
      }
      createdAt
      description
      id
      movementPlan
      setup
      tools
      type
      updatedAt
      user
      userUpdate
      difficultyLevel
      workingArea {
        balance
        cardio
        flexibility
        mental
        strength
      }
    }
  }
`;

export const updateExercise = /* GraphQL */ `
  mutation UpdateExercise(
    $condition: ModelExerciseConditionInput
    $input: UpdateExerciseInput!
  ) {
    updateExercise(condition: $condition, input: $input) {
      bodyTarget {
        ant
        backbone
        core
        fullBody
        post
      }
      createdAt
      description
      id
      movementPlan
      setup
      tools
      type
      updatedAt
      user
      userUpdate
      difficultyLevel
      workingArea {
        balance
        cardio
        flexibility
        mental
        strength
      }
    }
  }
`;

export const getExercise = /* GraphQL */ `
  query GetExercise($id: ID!) {
    getExercise(id: $id) {
      bodyTarget {
        ant
        backbone
        core
        fullBody
        post
      }
      description
      id
      movementPlan
      setup
      tools
      type
      user
      userUpdate
      difficultyLevel
      workingArea {
        balance
        cardio
        flexibility
        mental
        strength
      }
    }
  }
`;
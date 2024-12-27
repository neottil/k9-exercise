/* tslint:disable */
/* eslint-disable */
// this is an auto generated file. This will be overwritten

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

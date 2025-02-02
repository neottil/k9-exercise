export const listExercises = /* GraphQL */ `
  query ListExercises {
    listExercises {
      items {
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
  }
`;

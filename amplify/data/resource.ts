import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Exercise: a
    .model({
      id: a.id().required(),
      type: a.string().required(),
      description: a.string().required(),
      workingArea: a.customType({
        mental: a.integer(),
        flexibility: a.integer(),
        strength: a.integer(),
        balance: a.integer(),
        cardio: a.integer()
      }),
      bodyTarget: a.customType({
        ant: a.integer(),
        post: a.integer(),
        core: a.integer(),
        backbone: a.integer(),
        fullBody: a.integer()
      }),
      movementPlan: a.string().array(),
      tools: a.string().array(),
      setup: a.string(),
      user: a.email(),
    })
    .authorization((allow) => [allow.publicApiKey()]),
});


export type Schema = ClientSchema<typeof schema>;

export const data = defineData({
  schema,
  authorizationModes: {
    defaultAuthorizationMode: "apiKey",
    apiKeyAuthorizationMode: {
      expiresInDays: 30,
    },
  },
});

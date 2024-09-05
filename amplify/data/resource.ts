import { type ClientSchema, a, defineData } from "@aws-amplify/backend";

const schema = a.schema({
  Exercise: a
    .model({
      id: a.id().required(),
      type: a.string().required(),
      description: a.string(),
      workingArea: a.customType({
        mental: a.integer(),
        flexibility: a.integer(),
        strength: a.integer(),
        balance: a.integer(),
        cardio: a.integer()
      }),
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

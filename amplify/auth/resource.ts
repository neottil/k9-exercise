import { defineAuth } from '@aws-amplify/backend';

/**
 * Define and configure your auth resource
 * @see https://docs.amplify.aws/gen2/build-a-backend/auth
 */
export const auth = defineAuth({
  loginWith: {
    email: {
      verificationEmailStyle: "CODE",
      verificationEmailSubject: "K9 Cross Training Exercise Database",
      verificationEmailBody: (createCode) => `Benvenuto! \nUtilizza questo codice per confermare il tuo account: ${createCode()}`,
    }
  }
});

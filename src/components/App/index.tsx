import { withAuthenticator } from "@aws-amplify/ui-react";
import App from "./app";

const withAuthApp = withAuthenticator(App);

export default withAuthApp;

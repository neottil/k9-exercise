import {
  withAuthenticator,
} from "@aws-amplify/ui-react";
import App from "./components/AppDesign";

const withAuthApp = withAuthenticator(App);

export default withAuthApp;

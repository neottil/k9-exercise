import {
  withAuthenticator,
} from "@aws-amplify/ui-react";
import App from "./app";
import "./index.css";

const withAuthApp = withAuthenticator(App);

export default withAuthApp;

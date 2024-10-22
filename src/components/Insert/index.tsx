import { withAuthenticator } from "@aws-amplify/ui-react";
import Insert from "./insert";

const withAuthInsert = withAuthenticator(Insert);

export default withAuthInsert;

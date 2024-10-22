import { WithAuthenticatorProps } from "@aws-amplify/ui-react";

const Insert = ({ user }: WithAuthenticatorProps) => {
  return <div>INSERT PAGE {!user ? user : ""}</div>;
};

export default Insert;

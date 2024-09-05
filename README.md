# K9-EXERCISE-APP

## Starting from aws amplify template

For detailed instructions refer to the [guide section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws).

## Set up local env

From Amplify console, select the application and the deployed branch. Yuo will see the deployment history and deployment backend resources. At the bottom of the page you will see a tab for Deployed backend resources. Click on the tab and then click the Download amplify_outputs.json file button.
Insert the downloaded file in root of project.

[Guide section](https://docs.amplify.aws/react/start/quickstart/#4-set-up-local-environment)

Run sandbok aws amplifi env before run application locally:
```
npx ampx sandbox
```


const filters = {type: "stand2", area: {mental: 2}};
const data = [{type: "stand2", desc: "this is stand 2", area: {mental:2, flex:1}},{type: "stand2", desc: "this is stand 3", area: {mental:5, flex:1}},{type: "kickback", desc: "this is kickback", area: {mental:2, flex:4}}];

const typeFilter = (exercise) => !filters.type || exercise.type == filters.type;
const areaMentalFilter = (exercise) => !filters?.area?.mental || exercise.area.mental == filters.area.mental;

const filtered = data.filter(typeFilter).filter(areaMentalFilter);

console.log(filtered);
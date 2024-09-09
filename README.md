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

## Dynamo table structure

```json
{
  "id": {
    "S": "fe90563c-ef2e-4961-8c92-f37945cb6430"
  },
  "bodyTarget": {
    "M": {
      "ant": {
        "N": "3"
      },
      "backbone": {
        "N": "0"
      },
      "core": {
        "N": "1"
      },
      "fullBody": {
        "N": "0"
      },
      "post": {
        "N": "3"
      }
    }
  },
  "createdAt": {
    "S": "2024-09-05T16:27:36.609Z"
  },
  "description": {
    "S": "Il cane posiziona le zampe anteriori sull'attrezzo e successivamente le posteriori"
  },
  "movementPlan": {
    "SS": [
      "Mediano"
    ]
  },
  "setup": {
    "S": "Balance disc posto a terra"
  },
  "tools": {
    "SS": [
      "Balance disc"
    ]
  },
  "type": {
    "S": "Stand 2 stazioni"
  },
  "updatedAt": {
    "S": "2024-09-05T16:27:36.609Z"
  },
  "user": {
    "S": "neot.luka.89@gmail.com"
  },
  "workingArea": {
    "M": {
      "balance": {
        "N": "3"
      },
      "cardio": {
        "N": "0"
      },
      "flexibility": {
        "N": "0"
      },
      "mental": {
        "N": "1"
      },
      "strength": {
        "N": "1"
      }
    }
  },
  "__typename": {
    "S": "Exercise"
  }
}
```
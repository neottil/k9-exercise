# K9-EXERCISE-APP

## Starting from aws amplify template

For detailed instructions refer to the [guide section](https://docs.amplify.aws/react/start/quickstart/#deploy-a-fullstack-app-to-aws).

## Set up local env

From Amplify console, select the application and the deployed branch. You will see the deployment history and deployment backend resources. At the bottom of the page you will see a tab for Deployed backend resources. Click on the tab and then click the Download amplify_outputs.json file button.
Insert the downloaded file in root of project.

[Guide section](https://docs.amplify.aws/react/start/quickstart/#4-set-up-local-environment)

Run sandbok aws amplify env before run application locally:

```shell
npx ampx sandbox

npm run dev

npx ampx sandbox delete
```

## Dynamo table structure

```json
{
  "id": {
    "S": "fe90563c-ef2e-4961-8c92-f37945cb6430"
  },
  "bodyTarget": {
    "M": {
      "ant": {
        "N": "2"
      },
      "backbone": {
        "N": "3"
      },
      "core": {
        "N": "1"
      },
      "fullBody": {
        "N": "4"
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
    "L": [
      {
        "S": "Mediano"
      },
      {
        "S": "Sagittale"
      }
    ]
  },
  "setup": {
    "S": "Balance disc posto a terra"
  },
  "tools": {
    "L": [
      {
        "S": "Attrezzo 1"
      },
      {
        "S": "AttrezzoTest"
      },
      {
        "S": "Balance disc"
      }
    ]
  },
  "type": {
    "S": "Stand 2 stazioni X"
  },
  "updatedAt": {
    "S": "2024-10-18T14:43:57.893Z"
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

## TODO'S

- user session limit
- user groups
- new item only for admin
- user nickname/username
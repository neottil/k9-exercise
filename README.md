# K9-EXERCISE-APP

## Set up local env


## Check before push

Run "npm run build" before push to verify if build run correctly.

Update version with

```
# Incrementa la versione maggiore
npm version major

# Incrementa la versione minore
npm version minor

# Incrementa la patch
npm version patch
```

## TODO'S

- When insert exercise by default set a state to TO_APPROVE. Exercise in his state are not be shown in View.
- Login/user passato da sito. Come integrare i due sistemi.
- Save the filters in state so the query runs again when the user navigates back in the browser.
- trace update changes in table
- Use build.rollupOptions.output.manualChunks to improve chunking: https://rollupjs.org/configuration-options/#output-manualchunks

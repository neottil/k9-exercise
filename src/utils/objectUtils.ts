const deepCopy = <T>(obj: T): T => JSON.parse(JSON.stringify(obj));

const filterObjectByType = <T extends Record<string, any>>(obj: any, typeSchema: T): T => {
  if (typeof obj !== "object" || obj === null) {
    return obj as T; // Valori primitivi vengono restituiti direttamente
  }

  if (Array.isArray(obj)) {
    // Gestione degli array: applica ricorsivamente la funzione
    return obj.map(item => filterObjectByType(item, typeSchema)) as unknown as T;
  }

  // Per oggetti: filtra le chiavi in base al tipo fornito
  return Object.keys(typeSchema).reduce((acc, key) => {
    if (key in obj) {
      (acc as Record<string, any>)[key] = filterObjectByType(obj[key], (typeSchema as any)[key]);
    }
    return acc;
  }, {} as T);
};

export {
  deepCopy,
  filterObjectByType
}
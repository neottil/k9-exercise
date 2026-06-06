import {
  Box,
  Checkbox,
  FormControlLabel,
  IconButton,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
} from "@mui/material";
import HighlightOffIcon from "@mui/icons-material/HighlightOff";

// ── Label maps ────────────────────────────────────────────────────────────────

export const WORKING_AREA_LABELS: Record<string, string> = {
  mental:      "Mentale",
  flexibility: "Flessibilità",
  strength:    "Forza",
  balance:     "Equilibrio",
  cardio:      "Cardio",
};

export const BODY_TARGET_LABELS: Record<string, string> = {
  ant:      "Anteriore",
  post:     "Posteriore",
  core:     "Core",
  backbone: "Colonna",
  fullBody: "Fullbody",
};

const VALUES = [0, 1, 2, 3, 4, 5] as const;

// ── Read-only bars (DataGrid cells, summary views) ────────────────────────────

interface StatBarsProps {
  data: Record<string, number>;
  labels: Record<string, string>;
  /** Mostra tutte le dimensioni, anche a zero. Default: false (nasconde gli zeri). */
  showAll?: boolean;
}

/** Stile condiviso per ToggleButtonGroup in modalità read-only. */
const readOnlyGroupSx = {
  flex: 1,
  pointerEvents: "none" as const,
  "& .MuiToggleButtonGroup-grouped": { flex: 1, minWidth: 0, py: 0.25 },
};

/**
 * Toggle buttons read-only per workingArea o bodyTarget — stesso stile
 * di StatBarsField/StatBarsFilter ma non interattivo.
 * Per default nasconde le dimensioni con valore 0; con showAll=true le mostra tutte.
 */
export const StatBars = ({ data, labels, showAll = false }: StatBarsProps) => {
  const entries = Object.entries(labels).filter(([key]) => showAll || (data[key] ?? 0) > 0);

  if (entries.length === 0) {
    return (
      <Typography variant="body2" color="text.disabled" sx={{ fontStyle: "italic" }}>
        —
      </Typography>
    );
  }

  return (
    <Box sx={{ width: "100%", py: 0.5 }}>
      {entries.map(([key, label]) => {
        const value = data[key] ?? 0;
        return (
          <Box
            key={key}
            sx={{
              display: "flex",
              alignItems: "center",
              gap: 1.5,
              mb: 0.75,
              "&:last-child": { mb: 0 },
            }}
          >
            <Typography
              variant="caption"
              sx={{ width: 72, flexShrink: 0, color: "text.secondary" }}
            >
              {label}
            </Typography>
            <ToggleButtonGroup value={value} exclusive size="small" sx={readOnlyGroupSx}>
              {VALUES.map((v) => <ToggleButton key={v} value={v}>{v}</ToggleButton>)}
            </ToggleButtonGroup>
          </Box>
        );
      })}
    </Box>
  );
};

// ── Singolo valore con barra inline (Admin diff sub-rows) ─────────────────────

interface StatBarInlineProps {
  value: number;
}

/**
 * Toggle buttons read-only su riga singola — usato nelle card di confronto
 * del diff admin per i sotto-campi di workingArea e bodyTarget.
 * Usa width:"100%" perché il parent è un Box block (non flex).
 * Stile neutro (grigio) per non interferire con i colori di diff rosso/verde.
 */
export const StatBarInline = ({ value }: StatBarInlineProps) => (
  <ToggleButtonGroup
    value={value}
    exclusive
    size="small"
    sx={{
      width: "100%",
      pointerEvents: "none",
      "& .MuiToggleButtonGroup-grouped": {
        flex: 1,
        minWidth: 0,
        py: 0.25,
        color: "text.secondary",
        borderColor: "divider",
        "&.Mui-selected": {
          color: "text.primary",
          backgroundColor: "action.selected",
        },
      },
    }}
  >
    {VALUES.map((v) => <ToggleButton key={v} value={v}>{v}</ToggleButton>)}
  </ToggleButtonGroup>
);

// ── Barre interattive con Slider (form inserimento / modifica) ────────────────

interface StatBarsFieldProps {
  data: Record<string, number>;
  labels: Record<string, string>;
  /** Prefisso del campo, es. "workingArea" o "bodyTarget". */
  fieldPrefix: string;
  /** Callback compatibile con updateExerciseToSave(name, value). */
  onChange: (name: string, value: number) => void;
}

/**
 * Versione interattiva di StatBars: ogni dimensione è editabile tramite
 * ToggleButtonGroup — 6 pulsanti (0–5) cliccabili direttamente, senza trascinamento.
 * Chiama onChange con il path composto `fieldPrefix.key` e il nuovo valore numerico.
 */
export const StatBarsField = ({
  data,
  labels,
  fieldPrefix,
  onChange,
}: StatBarsFieldProps) => (
  <Box sx={{ mt: 0.5 }}>
    {Object.entries(labels).map(([key, label]) => {
      const value = data[key] ?? 0;
      return (
        <Box
          key={key}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1.5,
            mb: 0.75,
            "&:last-child": { mb: 0 },
          }}
        >
          <Typography variant="body2" sx={{ width: 84, flexShrink: 0 }}>
            {label}
          </Typography>
          <ToggleButtonGroup
            value={value}
            exclusive
            onChange={(_, v) => onChange(`${fieldPrefix}.${key}`, v ?? 0)}
            size="small"
            sx={{
              flex: 1,
              "& .MuiToggleButtonGroup-grouped": { flex: 1, minWidth: 0, py: 0.25 },
            }}
          >
            {VALUES.map((v) => (
              <ToggleButton key={v} value={v}>
                {v}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>
        </Box>
      );
    })}
  </Box>
);

// ── Filtro interattivo con Slider + checkbox "=" (pannello filtri view) ───────

interface StatBarsFilterEntry {
  value: number;
  operation: "eq" | "gte";
}

interface StatBarsFilterProps {
  data: Record<string, StatBarsFilterEntry>;
  labels: Record<string, string>;
  /** Prefisso del campo, es. "workingArea" o "bodyTarget". */
  fieldPrefix: string;
  /** Callback con firma (name, value, operation). */
  onChangeCallback: (name: string, value: number, operation: "eq" | "gte") => void;
  /** Callback per reset del singolo sotto-campo. */
  resetCallback: (name: string) => void;
}

/**
 * Filtro visuale per workingArea / bodyTarget.
 * Ogni dimensione ha un ToggleButtonGroup (0–5) cliccabile direttamente
 * e un checkbox "=" per scegliere tra ricerca esatta (=) e per minimo (>=, default).
 * Mostra un pulsante reset per riga quando il filtro è attivo.
 */
export const StatBarsFilter = ({
  data,
  labels,
  fieldPrefix,
  onChangeCallback,
  resetCallback,
}: StatBarsFilterProps) => (
  <Box sx={{ mt: 1, px: 0.5 }}>
    {Object.entries(labels).map(([key, label]) => {
      const entry = data[key] ?? { value: 0, operation: "gte" };
      const { value, operation } = entry;
      const isActive = value > 0 || operation === "eq";
      const fieldName = `${fieldPrefix}.${key}`;

      return (
        <Box
          key={key}
          sx={{
            display: "flex",
            alignItems: "center",
            gap: 1,
            mb: 0.75,
            "&:last-child": { mb: 0 },
          }}
        >
          {/* Etichetta dimensione */}
          <Typography
            variant="body2"
            sx={{
              width: 84,
              flexShrink: 0,
              color: isActive ? "text.primary" : "text.secondary",
              fontWeight: isActive ? 600 : 400,
              transition: "color 150ms",
            }}
          >
            {label}
          </Typography>

          {/* Pulsanti valore 0–5 */}
          <ToggleButtonGroup
            value={value}
            exclusive
            onChange={(_, v) => onChangeCallback(fieldName, v ?? 0, operation)}
            size="small"
            sx={{
              flex: 1,
              "& .MuiToggleButtonGroup-grouped": { flex: 1, minWidth: 0, py: 0.25 },
            }}
          >
            {VALUES.map((v) => (
              <ToggleButton key={v} value={v}>
                {v}
              </ToggleButton>
            ))}
          </ToggleButtonGroup>

          {/* Checkbox operazione "=" */}
          <FormControlLabel
            label="="
            labelPlacement="end"
            control={
              <Checkbox
                size="small"
                checked={operation === "eq"}
                onChange={(e) =>
                  onChangeCallback(fieldName, value, e.target.checked ? "eq" : "gte")
                }
                sx={{ p: 0.5 }}
              />
            }
            sx={{ m: 0, gap: 0.25, whiteSpace: "nowrap" }}
          />

          {/* Reset riga — visibile solo se filtro attivo */}
          <IconButton
            size="small"
            onClick={() => resetCallback(fieldName)}
            disabled={!isActive}
            sx={{
              p: 0.25,
              opacity: isActive ? 1 : 0,
              transition: "opacity 150ms",
              pointerEvents: isActive ? "auto" : "none",
            }}
            title="Azzera filtro"
          >
            <HighlightOffIcon fontSize="small" />
          </IconButton>
        </Box>
      );
    })}
  </Box>
);

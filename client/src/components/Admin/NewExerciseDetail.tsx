import { useCallback, useState } from "react";
import { Box, Button, Divider, Typography } from "@mui/material";
import CheckIcon from "@mui/icons-material/Check";
import CloseIcon from "@mui/icons-material/Close";
import type { NewExercise } from "../../interfaces/adminInterfaces";
import type { Exercise } from "../../interfaces/exerciseInterfaces";
import ExerciseForm from "../Insert/ExerciseForm";

interface NewExerciseDetailProps {
  exercise: NewExercise;
  onApprove: (exercise: Exercise) => void;
  onReject: () => void;
  loading: boolean;
}

const NewExerciseDetail = ({ exercise, onApprove, onReject, loading }: NewExerciseDetailProps) => {
  const [edited, setEdited] = useState<Exercise>({ ...exercise });

  const update = useCallback((name: string, value: string | string[] | number) => {
    setEdited((prev) => {
      const next = { ...prev };
      const keys = name.split(".");
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      let temp: any = next;
      for (let i = 0; i < keys.length - 1; i++) temp = temp[keys[i]];
      temp[keys[keys.length - 1]] = value;
      return next;
    });
  }, []);

  const formattedDate = exercise.createdAt
    ? new Date(exercise.createdAt).toLocaleString("it-IT", { dateStyle: "medium", timeStyle: "short" })
    : "—";

  return (
    <Box sx={{ display: "flex", flexDirection: "column", height: "100%" }}>

      <Box sx={{ flex: 1, overflowY: "auto", p: 2, display: "flex", flexDirection: "column", gap: 2 }}>
        <Box>
          <Typography variant="body2" color="text.secondary">
            Inserito da <strong>{exercise.user || "—"}</strong> il {formattedDate}
          </Typography>
        </Box>
        <Divider />
        <ExerciseForm exercise={edited} onChange={update} />
      </Box>

      <Box sx={{ px: 2, py: 1.5, borderTop: 1, borderColor: "divider", display: "flex", gap: 2, justifyContent: "flex-end", flexShrink: 0 }}>
        <Button variant="contained" color="error" startIcon={<CloseIcon />} onClick={onReject} disabled={loading}>
          Rifiuta
        </Button>
        <Button variant="contained" color="success" startIcon={<CheckIcon />} onClick={() => onApprove(edited)} disabled={loading}>
          Approva
        </Button>
      </Box>

    </Box>
  );
};

export default NewExerciseDetail;

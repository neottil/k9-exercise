// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useEffect, useMemo, useRef, useState, type ChangeEvent } from "react";
import { Box, IconButton, InputLabel, Typography } from "@mui/material";
import AddPhotoAlternateIcon from "@mui/icons-material/AddPhotoAlternate";
import DeleteIcon from "@mui/icons-material/Delete";
import { type ExerciseImage } from "../../interfaces/exerciseInterfaces";
import { exerciseImageUrl } from "../../api/exercises";
import { compressImage } from "../../utils/imageCompression";

export interface ImagesFieldProps {
  exerciseId: string;
  existing: ExerciseImage[];
  newFiles: File[];
  max: number;
  onRemoveExisting: (id: string) => void;
  onAddFiles: (files: File[]) => void;
  onRemoveNew: (index: number) => void;
}

const THUMB = 96;

const thumbBoxSx = {
  position: "relative" as const,
  width: THUMB,
  height: THUMB,
  borderRadius: 1,
  overflow: "hidden",
  border: "1px solid",
  borderColor: "divider",
  flex: "0 0 auto",
};

const thumbImgSx = { width: "100%", height: "100%", objectFit: "cover" as const, display: "block" };

const deleteBtnSx = {
  position: "absolute" as const,
  top: 2,
  right: 2,
  bgcolor: "rgba(0,0,0,0.55)",
  color: "white",
  p: "2px",
  "&:hover": { bgcolor: "rgba(0,0,0,0.75)" },
};

const ImagesField = ({
  exerciseId,
  existing,
  newFiles,
  max,
  onRemoveExisting,
  onAddFiles,
  onRemoveNew,
}: ImagesFieldProps) => {
  const inputRef = useRef<HTMLInputElement>(null);
  const [busy, setBusy] = useState(false);

  // Object URL per l'anteprima dei nuovi file (non ancora caricati).
  const newPreviews = useMemo(() => newFiles.map((f) => URL.createObjectURL(f)), [newFiles]);
  useEffect(
    () => () => newPreviews.forEach((url) => URL.revokeObjectURL(url)),
    [newPreviews]
  );

  const total = existing.length + newFiles.length;
  const remaining = Math.max(0, max - total);

  const onPick = async (e: ChangeEvent<HTMLInputElement>) => {
    const picked = Array.from(e.target.files ?? []);
    e.target.value = ""; // consente di riselezionare lo stesso file
    if (picked.length === 0) return;
    setBusy(true);
    try {
      const accepted = picked.slice(0, remaining);
      const compressed = await Promise.all(accepted.map(compressImage));
      onAddFiles(compressed);
    } finally {
      setBusy(false);
    }
  };

  return (
    <Box>
      <InputLabel sx={{ mb: 0.5 }}>
        Immagini{" "}
        <Typography component="span" variant="caption" color="text.secondary">
          ({total}/{max})
        </Typography>
      </InputLabel>
      <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, alignItems: "center" }}>
        {existing.map((img) => (
          <Box key={img.id} sx={thumbBoxSx}>
            <Box component="img" src={exerciseImageUrl(exerciseId, img.id)} alt={img.filename ?? ""} sx={thumbImgSx} />
            <IconButton size="small" sx={deleteBtnSx} onClick={() => onRemoveExisting(img.id)} title="Rimuovi immagine">
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}

        {newFiles.map((file, i) => (
          <Box key={`new-${i}`} sx={thumbBoxSx}>
            <Box component="img" src={newPreviews[i]} alt={file.name} sx={thumbImgSx} />
            <IconButton size="small" sx={deleteBtnSx} onClick={() => onRemoveNew(i)} title="Rimuovi immagine">
              <DeleteIcon sx={{ fontSize: 16 }} />
            </IconButton>
          </Box>
        ))}

        {remaining > 0 && (
          <IconButton
            onClick={() => inputRef.current?.click()}
            disabled={busy}
            sx={{
              width: THUMB,
              height: THUMB,
              border: "1px dashed",
              borderColor: "divider",
              borderRadius: 1,
            }}
            title="Aggiungi immagine"
          >
            <AddPhotoAlternateIcon />
          </IconButton>
        )}
      </Box>
      <input
        ref={inputRef}
        type="file"
        accept="image/*"
        multiple
        hidden
        onChange={onPick}
      />
    </Box>
  );
};

export default ImagesField;

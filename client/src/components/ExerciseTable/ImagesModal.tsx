// Copyright (c) 2026 Luca Neotti
// Licensed under the Elastic License v2.0 — see LICENSE for details.

import { useEffect, useState } from "react";
import {
  Box,
  CircularProgress,
  Dialog,
  DialogContent,
  IconButton,
  Typography,
} from "@mui/material";
import ChevronLeftIcon from "@mui/icons-material/ChevronLeft";
import ChevronRightIcon from "@mui/icons-material/ChevronRight";
import CloseIcon from "@mui/icons-material/Close";
import BrokenImageIcon from "@mui/icons-material/BrokenImage";
import { type ExerciseImage } from "../../interfaces/exerciseInterfaces";
import { fetchExerciseImage } from "../../api/exercises";

export interface ImagesModalProps {
  open: boolean;
  exerciseId: string;
  images: ExerciseImage[];
  onClose: () => void;
}

// Modale a carosello: all'apertura scarica tutte le immagini dell'esercizio e
// le tiene in memoria (object URL) finché resta montata; al cleanup le libera.
const ImagesModal = ({ open, exerciseId, images, onClose }: ImagesModalProps) => {
  const [urls, setUrls] = useState<(string | null)[]>([]);
  const [loading, setLoading] = useState(false);
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (!open) return;
    let active = true;
    const created: string[] = [];
    setLoading(true);
    setIndex(0);

    Promise.all(
      images.map((img) =>
        fetchExerciseImage(exerciseId, img.id)
          .then((blob) => {
            const url = URL.createObjectURL(blob);
            created.push(url);
            return url;
          })
          .catch(() => null)
      )
    ).then((result) => {
      if (!active) {
        created.forEach((u) => URL.revokeObjectURL(u));
        return;
      }
      setUrls(result);
      setLoading(false);
    });

    return () => {
      active = false;
      created.forEach((u) => URL.revokeObjectURL(u));
      setUrls([]);
    };
  }, [open, exerciseId, images]);

  const count = images.length;
  const prev = () => setIndex((i) => (i - 1 + count) % count);
  const next = () => setIndex((i) => (i + 1) % count);
  const currentUrl = urls[index];

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      <DialogContent sx={{ p: 1 }}>
        <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
          <Typography variant="body2" color="text.secondary">
            {count > 0 ? `${index + 1} / ${count}` : "Nessuna immagine"}
          </Typography>
          <IconButton size="small" onClick={onClose} title="Chiudi">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box
          sx={{
            position: "relative",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            minHeight: 320,
            bgcolor: "action.hover",
            borderRadius: 1,
          }}
        >
          {loading ? (
            <CircularProgress />
          ) : currentUrl ? (
            <Box
              component="img"
              src={currentUrl}
              alt={images[index]?.filename ?? `Immagine ${index + 1}`}
              sx={{ maxWidth: "100%", maxHeight: "70vh", objectFit: "contain", display: "block" }}
            />
          ) : (
            <Box sx={{ textAlign: "center", color: "text.disabled" }}>
              <BrokenImageIcon sx={{ fontSize: 48 }} />
              <Typography variant="body2">Immagine non disponibile</Typography>
            </Box>
          )}

          {count > 1 && !loading && (
            <>
              <IconButton
                onClick={prev}
                sx={{ position: "absolute", left: 8, bgcolor: "rgba(0,0,0,0.4)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.6)" } }}
                title="Precedente"
              >
                <ChevronLeftIcon />
              </IconButton>
              <IconButton
                onClick={next}
                sx={{ position: "absolute", right: 8, bgcolor: "rgba(0,0,0,0.4)", color: "white", "&:hover": { bgcolor: "rgba(0,0,0,0.6)" } }}
                title="Successiva"
              >
                <ChevronRightIcon />
              </IconButton>
            </>
          )}
        </Box>
      </DialogContent>
    </Dialog>
  );
};

export default ImagesModal;

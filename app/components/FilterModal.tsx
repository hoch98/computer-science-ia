"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Box,
  Typography,
  Slider,
  Checkbox,
  Button,
} from "@mui/material";
import { ACTIVITY_TYPES } from "../types";

interface FilterModalProps {
  open: boolean;
  onClose: () => void;
  grade: number;
  onGradeChange: (grade: number) => void;
  useCalendarPDF: boolean;
  onUseCalendarPDFChange: (value: boolean) => void;
  selectedTypes: Set<string>;
  onTypeToggle: (typeName: string, isChecked: boolean) => void;
  setTimetableModalOpen: (f:boolean) => void;
}

export default function FilterModal({
  open,
  onClose,
  grade,
  onGradeChange,
  useCalendarPDF,
  onUseCalendarPDFChange,
  selectedTypes,
  onTypeToggle,
  setTimetableModalOpen
}: FilterModalProps) {
  return (
    <>
      <Dialog
        open={open}
        onClose={onClose}
        fullWidth
        maxWidth="sm"
        sx={{ borderRadius: "16px", p: 1 }}
      >
        <DialogTitle sx={{ fontWeight: 600, fontFamily: "sans-serif" }}>
          Filter & Preferences
        </DialogTitle>

        <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3 }}>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontFamily: "sans-serif" }}>
              Grade
            </Typography>
            <Box sx={{ px: 2 }}>
              <Slider
                value={grade}
                step={1}
                min={9}
                max={12}
                sx={{ width: "100%" }}
                marks={[
                  { value: 9, label: "9" },
                  { value: 10, label: "10" },
                  { value: 11, label: "11" },
                  { value: 12, label: "12" },
                ]}
                onChange={(_event, value) => onGradeChange(value as number)}
              />
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1.5, fontFamily: "sans-serif" }}>
              Timetable
            </Typography>
            <Box
              sx={{
                display: "flex",
                flexDirection: { xs: "column", sm: "row" },
                gap: 2,
                alignItems: "center",
                justifyContent: { xs: "center", sm: "flex-start" },
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  alignItems: "center",
                  gap: 0.5,
                  marginLeft: { xs: "60px", md: "30px" },
                }}
              >
                <Checkbox
                  checked={useCalendarPDF}
                  onChange={() => onUseCalendarPDFChange(!useCalendarPDF)}
                />
                <input
                  type="file"
                  accept=".pdf"
                  style={{ fontSize: "14px" }}
                  disabled={!useCalendarPDF}
                />
              </Box>
              <Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
                <Checkbox
                  checked={!useCalendarPDF}
                  onChange={() => onUseCalendarPDFChange(!useCalendarPDF)}
                />
                <input
                  type="button"
                  value="Import Manually"
                  style={{ fontSize: "14px", padding: "4px 8px" }}
                  disabled={useCalendarPDF}
                  onClick={() => setTimetableModalOpen(true)}
                />
              </Box>
            </Box>
          </Box>

          <Box>
            <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontFamily: "sans-serif" }}>
              Activity Type
            </Typography>
            <Box sx={{ display: "flex", flexWrap: "wrap", gap: 1.5 }}>
              {ACTIVITY_TYPES.map((typeName) => (
                <Box key={typeName} sx={{ display: "flex", alignItems: "center" }}>
                  <Checkbox
                    size="small"
                    checked={selectedTypes.has(typeName)}
                    onChange={(e) => onTypeToggle(typeName, e.target.checked)}
                  />
                  <Typography variant="body2" sx={{ fontFamily: "sans-serif" }}>
                    {typeName}
                  </Typography>
                </Box>
              ))}
            </Box>
          </Box>
        </DialogContent>

        <DialogActions sx={{ px: 3, py: 1.5 }}>
          <Button
            onClick={onClose}
            sx={{ textTransform: "none", borderRadius: "8px", fontWeight: "400" }}
          >
            Close
          </Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
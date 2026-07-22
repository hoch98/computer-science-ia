"use client";

import {
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
  Typography,
  Button,
} from "@mui/material";
import { SelectedActivitySchedule } from "../types";
import { getFullDayName, formatScheduleTime } from "../utils";

interface ScheduleModalProps {
  open: boolean;
  onClose: () => void;
  selectedActivity: SelectedActivitySchedule | null;
}

export default function ScheduleModal({ open, onClose, selectedActivity }: ScheduleModalProps) {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="xs"
      sx={{ borderRadius: "16px", p: 1 }}
    >
      <DialogTitle sx={{ fontWeight: 600, fontFamily: "sans-serif" }}>
        {selectedActivity?.name}
      </DialogTitle>
      <DialogContent dividers>
        {selectedActivity?.schedules && selectedActivity.schedules.length > 0 ? (
          <List disablePadding>
            {selectedActivity.schedules.map((schedule, index) => (
              <ListItem
                key={schedule.id || index}
                sx={{
                  px: 0,
                  py: 1,
                  borderBottom:
                    index !== selectedActivity.schedules.length - 1
                      ? "1px solid #E0E0E0"
                      : "none",
                }}
              >
                <ListItemText
                  primary={getFullDayName(schedule.dayOfWeek)}
                  secondary={`${formatScheduleTime(schedule.startTime)} - ${formatScheduleTime(
                    schedule.endTime
                  )}`}
                  sx={{ fontFamily: "sans-serif" }}
                />
              </ListItem>
            ))}
          </List>
        ) : (
          <Typography variant="body2" sx={{ color: "#747474", fontStyle: "italic", my: 1 }}>
            No schedule details available for this activity.
          </Typography>
        )}
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
  );
}
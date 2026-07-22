"use client";

import { useState, useEffect } from "react";
import {
  Dialog,
  DialogContent,
  Box,
  Typography,
  TextField,
  Button,
  IconButton,
  MenuItem,
  Select,
  FormControl,
  InputLabel,
} from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import { TimetableEvent } from "../types";

interface TimetableModalProps {
  open: boolean;
  onClose: () => void;
  events: TimetableEvent[];
  onSave: (events: TimetableEvent[]) => void;
}

const DAYS = ["Mon", "Tue", "Wed", "Thur", "Fri"] as const;
const HOURS = [6, 7, 8, 9, 10, 11, 12, 1, 2, 3, 4, 5, 6];

const convertTimeToMinutes = (timeNum: number) => {
  const hours = Math.floor(timeNum / 100);
  const mins = timeNum % 100;
  return (hours - 6) * 60 + mins;
};

export default function TimetableModal({ open, onClose, events, onSave }: TimetableModalProps) {

  const [localEvents, setLocalEvents] = useState<TimetableEvent[]>([]);

  const [activityName, setActivityName] = useState("");
  const [selectedDay, setSelectedDay] = useState<"Mon" | "Tue" | "Wed" | "Thur" | "Fri">("Mon");
  const [startTimeStr, setStartTimeStr] = useState("08:00");
  const [endTimeStr, setEndTimeStr] = useState("09:30");

  // sets main event as temporary events on modal open to erase progress
  useEffect(() => {
    if (open) {
      setLocalEvents(events);
      setActivityName("");
    }
  }, [open, events]);

  const parseTimeTo24hNum = (timeStr: string): number => {
    const [h, m] = timeStr.split(":").map(Number);
    return h * 100 + m;
  };

  const handleAddEvent = () => {
    if (!activityName.trim()) return;

    const startNum = parseTimeTo24hNum(startTimeStr);
    const endNum = parseTimeTo24hNum(endTimeStr);

    if (endNum <= startNum) {
      alert("End time must be after start time!");
      return;
    }

    const newEvent: TimetableEvent = {
      id: Date.now().toString(),
      title: activityName,
      day: selectedDay,
      startTime: startNum,
      endTime: endNum,
    };

    setLocalEvents((prev) => [...prev, newEvent]);
    setActivityName("");
  };

  const handleSave = () => {
    onSave(localEvents);
  };

  const handleRemoveEvent = (id: string) => {
    setLocalEvents((prev) => prev.filter((ev) => ev.id !== id));
  };

  const HOUR_HEIGHT = 50; 
  const TOTAL_GRID_HEIGHT = (HOURS.length - 1) * HOUR_HEIGHT;

  return (
    <Dialog
      open={open}
      onClose={onClose}
      fullWidth
      maxWidth="lg"
      sx={{
        "& .MuiDialog-paper": {
          borderRadius: "24px",
          p: 3,
          backgroundColor: "#FFFFFF",
          width: "90vw",
          maxWidth: "1200px",
          minHeight: "720px", 
          mt: 6,
          mx: 6,
          mb: 3, 
        },
      }}
    >
      <Box sx={{ position: "absolute", top: 16, right: 16 }}>
        <IconButton onClick={onClose} size="small">
          <CloseIcon />
        </IconButton>
      </Box>

      <DialogContent sx={{ p: 1, display: "flex", gap: 4, alignItems: "flex-start" }}>
        <Box sx={{ flex: 1, display: "flex", flexDirection: "column" }}>
          <Box sx={{ display: "grid", gridTemplateColumns: "60px repeat(5, 1fr)", mb: 1, textAlign: "center" }}>
            <Box />
            {DAYS.map((day) => (
              <Typography key={day} variant="body1" sx={{ color: "#333" }}>
                {day}
              </Typography>
            ))}
          </Box>

          <Box
            sx={{
              display: "grid",
              gridTemplateColumns: "60px 1fr",
              position: "relative",
              height: `${TOTAL_GRID_HEIGHT}px`,
            }}
          >
            <Box sx={{ position: "relative", height: "100%" }}>
              {HOURS.map((h, index) => {
                const label = index < 6 ? `${h}am` : (h === 12 ? `12pm` : `${h}pm`);
                return (
                  <Typography
                    key={index}
                    variant="caption"
                    sx={{
                      position: "absolute",
                      top: `${index * HOUR_HEIGHT}px`,
                      right: 0,
                      width: "100%",
                      color: "#666",
                      fontSize: "0.85rem",
                      transform: "translateY(-50%)",
                      textAlign: "right",
                      pr: 1.5,
                    }}
                  >
                    {label}
                  </Typography>
                );
              })}
            </Box>

            <Box
              sx={{
                position: "relative",
                display: "grid",
                gridTemplateColumns: "repeat(5, 1fr)",
                border: "1px solid #7F7F7F",
                height: "100%",
              }}
            >
              {HOURS.slice(0, -1).map((_, idx) => (
                <Box
                  key={idx}
                  sx={{
                    position: "absolute",
                    top: `${idx * HOUR_HEIGHT}px`,
                    left: 0,
                    right: 0,
                    borderBottom: "1px solid #D1D1D1",
                  }}
                />
              ))}

              {DAYS.map((day, dIdx) => (
                <Box
                  key={day}
                  sx={{
                    position: "relative",
                    borderRight: dIdx < 4 ? "1px solid #7F7F7F" : "none",
                    height: "100%",
                  }}
                >
                  {localEvents
                    .filter((ev) => ev.day === day)
                    .map((ev) => {
                      const startMins = convertTimeToMinutes(ev.startTime);
                      const endMins = convertTimeToMinutes(ev.endTime);
                      const topPx = (startMins / 60) * HOUR_HEIGHT;
                      const heightPx = ((endMins - startMins) / 60) * HOUR_HEIGHT;

                      return (
                        <Box
                          key={ev.id}
                          onClick={() => handleRemoveEvent(ev.id)}
                          sx={{
                            position: "absolute",
                            top: `${topPx + 2}px`,
                            left: "3px",
                            right: "3px",
                            height: `${heightPx - 4}px`,
                            backgroundColor: "#8C98A6",
                            color: "#FFF",
                            borderRadius: "10px",
                            display: "flex",
                            alignItems: "center",
                            justifyContent: "center",
                            px: 1,
                            textAlign: "center",
                            boxShadow: "0px 1px 3px rgba(0,0,0,0.15)",
                            fontSize: "0.85rem",
                            fontWeight: 400,
                            zIndex: 2,
                            overflow: "hidden",
                            cursor: "pointer",
                            transition: "background-color 0.15s ease",
                            "&:hover": {
                              backgroundColor: "#6f7a86",
                            },
                          }}
                        >
                          <Typography
                            variant="caption"
                            sx={{
                              fontSize: "0.85rem",
                              lineHeight: 1.2,
                              color: "#FFF",
                            }}
                          >
                            {ev.title}
                          </Typography>
                        </Box>
                      );
                    })}
                </Box>
              ))}
            </Box>
          </Box>
        </Box>

        <Box
          sx={{
            width: "300px",
            display: "flex",
            flexDirection: "column",
            gap: 2.5, 
            pt: 4,
          }}
        >
          <TextField
            placeholder="Activity Name"
            variant="outlined"
            value={activityName}
            onChange={(e) => setActivityName(e.target.value)}
            sx={{
              backgroundColor: "#EAEAEA",
              borderRadius: "4px",
              "& fieldset": { borderColor: "#000" },
            }}
          />

          <FormControl fullWidth size="small">
            <InputLabel>Day</InputLabel>
            <Select
              value={selectedDay}
              label="Day"
              onChange={(e) => setSelectedDay(e.target.value as any)}
              sx={{ backgroundColor: "#EAEAEA" }}
            >
              {DAYS.map((d) => (
                <MenuItem key={d} value={d}>
                  {d}
                </MenuItem>
              ))}
            </Select>
          </FormControl>

          <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
            <TextField
              type="time"
              label="Start_"
              value={startTimeStr}
              onChange={(e) => setStartTimeStr(e.target.value)}
              sx={{
                backgroundColor: "#EAEAEA",
                borderRadius: "4px",
                "& fieldset": { borderColor: "#000" },
              }}
            />
            <Typography sx={{ fontWeight: "bold" }}>—</Typography>
            <TextField
              type="time"
              label="End_"
              value={endTimeStr}
              onChange={(e) => setEndTimeStr(e.target.value)}
              sx={{
                backgroundColor: "#EAEAEA",
                borderRadius: "4px",
                "& fieldset": { borderColor: "#000" },
              }}
            />
          </Box>

          <Box sx={{ display: "flex", gap: 1.5, mt: 1 }}>
            <Button
              variant="contained"
              onClick={handleAddEvent}
              sx={{
                flex: 1,
                backgroundColor: "#DCEADB",
                color: "#000",
                textTransform: "none",
                fontSize: "1rem",
                borderRadius: "12px",
                border: "1px solid #000",
                py: 1,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#c8dec6", boxShadow: "none" },
              }}
            >
              Add Event
            </Button>

            <Button
              variant="contained"
              onClick={handleSave}
              sx={{
                flex: 1,
                backgroundColor: "#00FF00",
                color: "#000",
                fontSize: "1rem",
                lineHeight: 1.2,
                textTransform: "none",
                borderRadius: "12px",
                border: "1px solid #000",
                py: 1,
                boxShadow: "none",
                "&:hover": { backgroundColor: "#00dd00", boxShadow: "none" },
              }}
            >
              Save Timetable
            </Button>
          </Box>
        </Box>
      </DialogContent>
    </Dialog>
  );
}
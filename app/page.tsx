"use client";

import { useState, useEffect } from "react";
import {
  TextField,
  Box,
  Button,
  IconButton,
  Autocomplete,
  Chip,
  Typography,
  Fade,
  Slider,
  Checkbox,
  CircularProgress,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  List,
  ListItem,
  ListItemText,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";

import type { Activity } from "@prisma/client";

interface ActivitySelectorProps {
  allActivities: Activity[];
}

interface ActivitySchedule {
  id: number;
  activityId: number;
  dayOfWeek: string;
  startTime: number | null;
  endTime: number | null;
}

interface Recommendation {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  tags: string[];
  activity_schedules: ActivitySchedule[];
  cosine_similarity: number;
}

const ACTIVITY_TYPES = [
  "Service - Local",
  "Service - College",
  "Service - Global Concerns",
  "Sport, Health & Fitness",
  "Global & College Affairs",
  "Art, Design & Technology",
  "Language & Culture",
  "Music and Instrumental Teaching Programme",
  "Drama & Dance",
  "Academic - Languages",
];

// Helper function to format 24h/minutes numbers into readable time (e.g., 900 -> 09:00 AM, 1430 -> 02:30 PM)
const formatScheduleTime = (time: number | null): string => {
  if (time === null || time === undefined) return "N/A";
  
  const hours = Math.floor(time / 100);
  const minutes = time % 100;
  
  const date = new Date();
  date.setHours(hours, minutes, 0, 0);
  
  return date.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    hour12: true,
  });
};

function getFullDayName(shorthand: string) {
  const dayMap: Record<string, string> = {
    Mon: "Monday",
    Tue: "Tuesday",
    Wed: "Wednesday",
    Thu: "Thursday",
    Fri: "Friday",
    Sat: "Saturday",
    Sun: "Sunday",
  };

  return dayMap[shorthand] || shorthand;
}

export default function ActivitySelector({ allActivities }: ActivitySelectorProps) {
  const [value, setValue] = useState<Activity | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [options, setOptions] = useState<Activity[]>([]);
  const [error, setError] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  // Filter / Constraints Dialog State
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const handleOpenFilterModal = () => setOpenFilterModal(true);
  const handleCloseFilterModal = () => setOpenFilterModal(false);

  const [useCalendarPDF, setUseCalendarPDF] = useState(true);
  const [grade, setGrade] = useState(9);

  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(ACTIVITY_TYPES)
  );

  // State for Schedule Dialog Popup
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedActivityForSchedule, setSelectedActivityForSchedule] = useState<{
    name: string;
    schedules: ActivitySchedule[];
  } | null>(null);

  const handleOpenScheduleModal = (name: string, schedules: ActivitySchedule[]) => {
    setSelectedActivityForSchedule({ name, schedules });
    setScheduleModalOpen(true);
  };

  const handleCloseScheduleModal = () => {
    setScheduleModalOpen(false);
    setSelectedActivityForSchedule(null);
  };

  async function findActivityByName(query: string): Promise<Activity[]> {
    if (query.trim() === "") {
      return [];
    }
    try {
      const response = await fetch(
        `/api/activities/name/${encodeURIComponent(query)}`
      );
      if (!response.ok) {
        throw new Error("Network request failed");
      }
      const data: Activity[] = await response.json();
      return data;
    } catch (error) {
      console.warn(
        "Server search failed. Falling back to locally loaded activities:",
        error
      );
      return allActivities.filter((activity) =>
        activity.name.toLowerCase().includes(query.toLowerCase())
      );
    }
  }

  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      const results = await findActivityByName(inputValue);
      if (active) {
        setOptions(results);
      }
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [inputValue]);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => {
        setShowAlert(false);
      }, 2000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleRemoveActivity = (idToRemove: number) => {
    setActivities(activities.filter((activity) => activity.id !== idToRemove));
  };

  const handleRecommend = async () => {
    if (activities.length === 0) {
      alert("No activities added!");
      return;
    }
    setIsRecommending(true);
    try {
      const response = await fetch("/api/activities/ranking", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          activities: activities.map((a) => a.id),
          unavailable_slots: [],
          grade: grade,
          tags: Array.from(selectedTypes),
        }),
      });

      if (!response.ok) {
        throw new Error("Failed to fetch recommendations");
      }

      const data = await response.json();
      setRecommendations(data);
    } catch (error) {
      console.error("Error fetching recommendations:", error);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleTypeToggle = (typeName: string, isChecked: boolean) => {
    setSelectedTypes((prevTypes) => {
      const nextTypes = new Set(prevTypes);
      if (isChecked) {
        nextTypes.add(typeName);
      } else {
        nextTypes.delete(typeName);
      }
      return nextTypes;
    });
  };

  return (
    <>
      <Box
        sx={{
          minHeight: "100vh",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          backgroundColor: "#F7F9FC",
          padding: { xs: "20px", md: "40px" },
          boxSizing: "border-box",
        }}
      >
        <Box
          sx={{
            width: "100%",
            maxWidth: "1500px",
            position: "relative",
          }}
        >
          {/* Schedule Inspector Dialog */}
          <Dialog
            open={scheduleModalOpen}
            onClose={handleCloseScheduleModal}
            fullWidth
            maxWidth="xs"
            sx={{ borderRadius: "16px", p: 1 }}
          >
            <DialogTitle sx={{ fontWeight: 600, fontFamily: "sans-serif" }}>
              {selectedActivityForSchedule?.name}
            </DialogTitle>
            <DialogContent dividers>
              {selectedActivityForSchedule?.schedules &&
              selectedActivityForSchedule.schedules.length > 0 ? (
                <List disablePadding>
                  {selectedActivityForSchedule.schedules.map((schedule, index) => (
                    <ListItem
                      key={schedule.id || index}
                      sx={{
                        px: 0,
                        py: 1,
                        borderBottom:
                          index !== selectedActivityForSchedule.schedules.length - 1
                            ? "1px solid #E0E0E0"
                            : "none",
                      }}
                    >
                      <ListItemText
                        primary={getFullDayName(schedule.dayOfWeek)}
                        secondary={`${formatScheduleTime(
                          schedule.startTime
                        )} - ${formatScheduleTime(schedule.endTime)}`}
                        sx={{
                          fontFamily: "sans-serif"
                        }}
                      />
                    </ListItem>
                  ))}
                </List>
              ) : (
                <Typography
                  variant="body2"
                  sx={{ color: "#747474", fontStyle: "italic", my: 1 }}
                >
                  No schedule details available for this activity.
                </Typography>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 1.5 }}>
              <Button
                onClick={handleCloseScheduleModal}
                sx={{ textTransform: "none", borderRadius: "8px", fontWeight: "400" }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          {/* Constraints & Settings Dialog */}
          <Dialog
            open={openFilterModal}
            onClose={handleCloseFilterModal}
            fullWidth
            maxWidth="sm"
            sx={{ borderRadius: "16px", p: 1 }}
          >
            <DialogTitle sx={{ fontWeight: 600, fontFamily: "sans-serif" }}>
              Filter & Preferences
            </DialogTitle>

            <DialogContent dividers sx={{ display: "flex", flexDirection: "column", gap: 3 }}>
              {/* Grade Section */}
              <Box>
                <Typography variant="subtitle1" sx={{ fontWeight: 600, mb: 1, fontFamily: "sans-serif" }}>
                  Grade
                </Typography>
                <Box sx={{ px: 2 }}>
                  <Slider
                    defaultValue={9}
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
                    value={grade}
                    onChange={(_event, value) => {
                      setGrade(value as number);
                    }}
                  />
                </Box>
              </Box>

              {/* Timetable Section */}
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
                    justifyContent: { xs: "center", sm: "flex-start" } 
                  }}
                >
                  <Box sx={{ display: "flex", alignItems: "center", gap: 0.5, marginLeft: {xs: "60px", md: "30px"}}}>
                    <Checkbox
                      checked={useCalendarPDF}
                      onChange={() => setUseCalendarPDF(!useCalendarPDF)}
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
                      onChange={() => setUseCalendarPDF(!useCalendarPDF)}
                    />
                    <input
                      type="button"
                      value="Import Manually"
                      style={{ fontSize: "14px", padding: "4px 8px" }}
                      disabled={useCalendarPDF}
                    />
                  </Box>
                </Box>
              </Box>

              {/* Activity Types Section */}
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
                        onChange={(e) => handleTypeToggle(typeName, e.target.checked)}
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
                onClick={handleCloseFilterModal}
                sx={{ textTransform: "none", borderRadius: "8px", fontWeight: "400" }}
              >
                Close
              </Button>
            </DialogActions>
          </Dialog>

          <Fade in={showAlert} timeout={{ enter: 300, exit: 1000 }}>
            <Box
              sx={{
                position: "fixed",
                top: "10%",
                left: "50%",
                transform: "translateX(-50%)",
                backgroundColor: "#FFD2D2",
                color: "#D8000C",
                border: "1px solid #D8000C",
                padding: "12px 24px",
                borderRadius: "8px",
                zIndex: 9999,
                pointerEvents: "none",
              }}
            >
              <Typography sx={{ fontWeight: 400, fontSize: "1rem" }}>
                Activity already added
              </Typography>
            </Box>
          </Fade>

          <Box
            sx={{
              display: "flex",
              flexDirection: { xs: "column", md: "row" },
              gap: "40px",
              width: "100%",
              boxSizing: "border-box",
            }}
          >
            <Box sx={{ flex: 4, display: "flex", flexDirection: "column", gap: "24px" }}>
              <Autocomplete
                disablePortal
                freeSolo
                value={value}
                onChange={(_event, newValue) => {
                  if (newValue && typeof newValue === "object") {
                    const exists = activities.some((act) => act.id === newValue.id);
                    if (exists) {
                      setError(true);
                      setShowAlert(true);
                    } else {
                      setActivities([...activities, newValue]);
                      setError(false);
                    }
                  }
                  setValue(null);
                  setInputValue("");
                }}
                inputValue={inputValue}
                onInputChange={(_event, newInputValue) => {
                  setInputValue(newInputValue);
                  if (error) setError(false);
                }}
                getOptionLabel={(option) => (typeof option === "string" ? option : option.name)}
                options={options}
                sx={{ width: "100%" }}
                slotProps={{
                  paper: {
                    sx: {
                      border: "1px solid #7F7F7F",
                      borderTop: "none",
                      borderRadius: "0px 0px 12px 12px",
                      boxShadow: "none",
                      marginTop: "-2px",
                      backgroundColor: "#F0EFF1",
                    },
                  },
                }}
                renderOption={(props, option) => {
                  const { key, ...optionProps } = props;
                  return (
                    <li key={key} {...optionProps} style={{ padding: 0 }}>
                      <Box
                        sx={{
                          display: "flex",
                          flexDirection: "column",
                          gap: "12px",
                          width: "100%",
                          padding: "20px 24px",
                          borderBottom: "1px solid #D5D4D6",
                          backgroundColor: "#F0EFF1",
                        }}
                      >
                        <Typography
                          variant="body1"
                          sx={{ fontWeight: 400, color: "#000", fontSize: "1.1rem", textAlign: "left" }}
                        >
                          {option.name}
                        </Typography>
                        <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
                          <Chip
                            label={option.type}
                            size="medium"
                            sx={{
                              fontSize: "13px",
                              borderRadius: "6px",
                              backgroundColor: "#EAD1DC",
                              border: "1px solid #7F7F7F",
                              color: "black",
                              px: 1,
                              height: "28px",
                            }}
                          />
                        </Box>
                      </Box>
                    </li>
                  );
                }}
                renderInput={(params) => (
                  <TextField
                    {...params}
                    placeholder="Search Activity..."
                    error={error}
                    sx={{
                      backgroundColor: "#D3E2F4",
                      fontFamily: "sans-serif",
                      borderRadius: "12px",
                      "& .MuiOutlinedInput-root": {
                        height: "54px",
                        "& fieldset": {
                          borderColor: "#7F7F7F",
                          borderWidth: "1px",
                          borderRadius: "12px",
                        },
                      },
                      "& .MuiInputBase-input": {
                        fontFamily: "sans-serif",
                        fontSize: "1.1rem",
                        padding: "0 16px",
                      },
                    }}
                  />
                )}
              />

              <Box
                sx={{
                  backgroundColor: "#D3E2F4",
                  border: "1px solid #7F7F7F",
                  borderRadius: "20px",
                  height: { xs: "300px", md: "60vh" },
                  padding: "32px 24px",
                  boxSizing: "border-box",
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "16px",
                }}
              >
                <Typography
                  variant="h5"
                  sx={{ fontWeight: 600, color: "#3A3A3A", textAlign: "left", fontFamily: "sans-serif", mb: 1 }}
                >
                  Recommended for You
                </Typography>

                {isRecommending ? (
                  <Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: "100%" }}>
                    <CircularProgress sx={{ color: "#7F7F7F" }} />
                  </Box>
                ) : recommendations.length > 0 ? (
                  recommendations.map((rec) => (
                    <Box
                      key={rec.activity_id}
                      sx={{
                        display: "flex",
                        flexDirection: "column",
                        gap: "12px",
                        padding: "20px 24px",
                        border: "1px solid #7F7F7F",
                        borderRadius: "12px",
                        backgroundColor: "#F0EFF1",
                      }}
                    >
                      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                        <Typography 
                          variant="body1" 
                          sx={{ fontWeight: 400, color: "#000", fontSize: "1.1rem", textAlign: "left", fontFamily: "sans-serif" }}
                        >
                          {rec.activity_name}
                        </Typography>
                        <Chip 
                          label={`Match: ${rec.cosine_similarity.toFixed(1)}%`}
                          size="small"
                          sx={{ 
                            backgroundColor: "#E2ECD5", 
                            fontWeight: 600, 
                            border: "1px solid #7F7F7F", 
                            fontFamily: "sans-serif" 
                          }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
                        <Chip
                          label={rec.activity_type}
                          size="medium"
                          sx={{
                            fontSize: "13px",
                            borderRadius: "6px",
                            backgroundColor: "#EAD1DC",
                            border: "1px solid #7F7F7F",
                            color: "black",
                            px: 1,
                            height: "28px",
                            fontFamily: "sans-serif",
                          }}
                        />
                        {rec.activity_schedules && rec.activity_schedules.length > 0 && (
                          <Chip
                            label="View Schedule"
                            size="medium"
                            onClick={() =>
                              handleOpenScheduleModal(rec.activity_name, rec.activity_schedules)
                            }
                            sx={{
                              fontSize: "13px",
                              borderRadius: "6px",
                              backgroundColor: "#FFF",
                              border: "1px solid #7F7F7F",
                              color: "black",
                              px: 1,
                              height: "28px",
                              fontFamily: "sans-serif",
                              cursor: "pointer",
                              "&:hover": {
                                backgroundColor: "#F5F5F5",
                              },
                            }}
                          />
                        )}
                        {rec.tags && rec.tags.map((tag) => (
                          <Chip
                            key={tag}
                            label={tag}
                            size="medium"
                            sx={{
                              fontSize: "13px",
                              borderRadius: "6px",
                              backgroundColor: "#D3E2F4",
                              border: "1px solid #7F7F7F",
                              color: "black",
                              px: 1,
                              height: "28px",
                              fontFamily: "sans-serif",
                            }}
                          />
                        ))}
                      </Box>
                    </Box>
                  ))
                ) : (
                  <Typography variant="body1" sx={{ fontFamily: "sans-serif", color: "#5A5A5A", fontStyle: "italic", mt: 2 }}>
                    Add activities to your list and click Search to see recommendations.
                  </Typography>
                )}
              </Box>
            </Box>

            <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: "24px" }}>
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                  gap: "16px",
                  height: "54px",
                }}
              >
                <Button
                  variant="contained"
                  onClick={handleRecommend}
                  disabled={isRecommending}
                  sx={{
                    fontWeight: "400",
                    flexGrow: 1,
                    backgroundColor: "#E2ECD5",
                    color: "black",
                    fontSize: "1.05rem",
                    textTransform: "none",
                    borderRadius: "12px",
                    border: "solid #7F7F7F 1px",
                    boxShadow: "none",
                    "&:hover": { backgroundColor: "#d1e0c2", boxShadow: "none" },
                    "&.Mui-disabled": { backgroundColor: "#e2ecd5", color: "rgba(0,0,0,0.4)" }
                  }}
                >
                  {isRecommending ? "Searching..." : "Search"}
                </Button>

                <IconButton
                  sx={{
                    backgroundColor: "#EEEEEE",
                    border: "solid 1px #7F7F7F",
                    height: "100%",
                    aspectRatio: "1/1",
                    borderRadius: "12px",
                    color: "black",
                    "&:hover": { backgroundColor: "#e0e0e0" },
                  }}
                  onClick={handleOpenFilterModal}
                  aria-label="settings"
                >
                  <SettingsIcon sx={{ fontSize: "1.5rem" }} />
                </IconButton>
              </Box>

              <Box
                sx={{
                  backgroundColor: "#D3E2F4",
                  border: "1px solid #7F7F7F",
                  borderRadius: "20px",
                  padding: "32px 24px",
                  boxSizing: "border-box",
                  height: { xs: "auto", md: "60vh" },
                  overflowY: "auto",
                  display: "flex",
                  flexDirection: "column",
                  gap: "20px",
                }}
              >
                <Typography
                  variant="h6"
                  sx={{ fontWeight: 600, color: "#3A3A3A", textAlign: "left", mb: "4px" }}
                >
                  Your Activities
                </Typography>

                <Box sx={{ display: "flex", flexDirection: "column", gap: "16px" }}>
                  {activities.map((activity) => (
                    <Box
                      key={activity.id}
                      sx={{
                        display: "flex",
                        flexDirection: "row",
                        alignItems: "center",
                        justifyContent: "space-between",
                        padding: "16px 20px",
                        border: "1px solid #7F7F7F",
                        borderRadius: "12px",
                        backgroundColor: "#F0EFF1",
                        flexShrink: 0,
                      }}
                    >
                      <Typography
                        variant="body1"
                        sx={{ fontWeight: 400, color: "text.primary", textAlign: "left" }}
                      >
                        {activity.name}
                      </Typography>
                      <IconButton
                        size="small"
                        onClick={() => handleRemoveActivity(activity.id)}
                        sx={{ color: "grey.600", p: 0.5 }}
                      >
                        <CloseIcon fontSize="small" sx={{ fontSize: "1.2rem" }} />
                      </IconButton>
                    </Box>
                  ))}
                  
                  {activities.length === 0 && (
                     <Typography variant="body2" sx={{ color: "#7F7F7F", fontStyle: "italic", textAlign: "center", mt: 2 }}>
                       No activities added yet.
                     </Typography>
                  )}
                </Box>
              </Box>
            </Box>
          </Box>
        </Box>
      </Box>
    </>
  );
}
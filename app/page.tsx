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
  Modal,
  Slider,
  Checkbox,
  CircularProgress,
} from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import CloseIcon from "@mui/icons-material/Close";

import type { Activity } from "@prisma/client";

interface ActivitySelectorProps {
  allActivities: Activity[];
}

interface Recommendation {
  activity_id: number;
  activity_name: string;
  activity_type: string;
  tags: string[];
  cosine_similarity: number;
}

const modalStyle = {
  position: "absolute" as const,
  top: "50%",
  left: "50%",
  transform: "translate(-50%, -50%)",
  width: "700px",
  bgcolor: "background.paper",
  borderRadius: "16px",
  boxShadow: 24,
  p: 4,
};

export default function ActivitySelector({ allActivities }: ActivitySelectorProps) {
  const [value, setValue] = useState<Activity | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [activities, setActivities] = useState<Activity[]>([]);
  const [options, setOptions] = useState<Activity[]>([]);
  const [error, setError] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);

  const [open, setOpen] = useState(false);
  const handleOpen = () => setOpen(true);
  const handleClose = () => setOpen(false);

  const [useCalendarID, setUseCalendarID] = useState(true);
  const [calendarID, setCalendarID] = useState("");
  const [grade, setGrade] = useState(9);

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
    if (activities.length == 0) {alert("No activities added!"); return;}
    setIsRecommending(true);
    try {
      const response = await fetch('/api/activities/ranking', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          activities: activities.map(a => a.id),
          unavailable_slots: [], 
          grade: grade
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
          <Modal
            open={open}
            onClose={handleClose}
            aria-labelledby="modal-modal-title"
            aria-describedby="modal-modal-description"
          >
            <Box sx={modalStyle}>
              <Typography variant="h6" component="h2" sx={{ fontWeight: 500 }}>
                Filter
              </Typography>
              <hr style={{ border: "0", borderTop: "1px solid #E0E0E0", margin: "16px 0" }} />
              <Typography variant="body1" component="h2" sx={{ fontWeight: 500, mb: 1 }}>
                Grade
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "center", px: 2, mb: 2 }}>
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
              <Typography variant="body1" component="h2" sx={{ fontWeight: 500, mb: 1 }}>
                Timetable
              </Typography>
              <Box sx={{ display: "flex", justifyContent: "space-evenly" }}>
                <Box>
                  <Checkbox
                    checked={useCalendarID}
                    onChange={() => {
                      setUseCalendarID(!useCalendarID);
                    }}
                  />
                  <span
                    style={{
                      color: !useCalendarID ? "#747474" : "black",
                      fontFamily: "sans-serif",
                    }}
                  >
                    Import using calendar ID
                  </span>
                  <input
                    type="text"
                    style={{
                      marginTop: "20px",
                      marginLeft: "10px",
                      width: "100px",
                      fontSize: "medium",
                      textAlign: "center",
                    }}
                    disabled={!useCalendarID}
                    value={calendarID}
                    onChange={(e) => {
                      setCalendarID(e.target.value);
                    }}
                  />
                </Box>
                <Box>
                  <Checkbox
                    checked={!useCalendarID}
                    onChange={() => {
                      setUseCalendarID(!useCalendarID);
                    }}
                  />
                  <input
                    type="button"
                    style={{ marginTop: "20px", fontSize: "medium" }}
                    value="Import Manually"
                  />
                </Box>
              </Box>
            </Box>
          </Modal>

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
                  <Box sx={{ display: 'flex', justifyContent: 'center', alignItems: 'center', height: '100%' }}>
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
                            backgroundColor: '#E2ECD5', 
                            fontWeight: 600, 
                            border: '1px solid #7F7F7F', 
                            fontFamily: "sans-serif" 
                          }}
                        />
                      </Box>

                      <Box sx={{ display: "flex", gap: "12px", flexWrap: "wrap" }}>
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
                  <Typography variant="body1" sx={{fontFamily: "sans-serif", color: "#5A5A5A", fontStyle: "italic", mt: 2 }}>
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
                  {isRecommending ? 'Searching...' : 'Search'}
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
                  onClick={handleOpen}
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
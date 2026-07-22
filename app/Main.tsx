"use client";

import { useState, useEffect } from "react";
import { Box, Button, IconButton, Typography, Fade } from "@mui/material";
import SettingsIcon from "@mui/icons-material/Settings";
import type { Activity } from "@prisma/client";

import { Recommendation, ActivitySchedule, SelectedActivitySchedule, ACTIVITY_TYPES } from "./types";
import ActivitySearchInput from "./components/ActivitySearchInput";
import RecommendationsList from "./components/RecommendationsList";
import SelectedActivitiesList from "./components/SelectedActivitiesList";
import ScheduleModal from "./components/ScheduleModal";
import FilterModal from "./components/FilterModal";
import TimetableModal from "./components/TimetableModal";

import { TimetableEvent } from "./types";

export default function Main() {
  const [activities, setActivities] = useState<Activity[]>([]);
  const [error, setError] = useState(false);
  const [showAlert, setShowAlert] = useState(false);

  const [recommendations, setRecommendations] = useState<Recommendation[]>([]);
  const [isRecommending, setIsRecommending] = useState(false);
  
  // timetable modal state
  const [timetableModalOpen, setTimetableModalOpen] = useState(false);
  const [events, setEvents] = useState<TimetableEvent[]>([]);

  // filter modal states
  const [openFilterModal, setOpenFilterModal] = useState(false);
  const [useCalendarPDF, setUseCalendarPDF] = useState(true);
  const [grade, setGrade] = useState(9);
  const [selectedTypes, setSelectedTypes] = useState<Set<string>>(
    () => new Set(ACTIVITY_TYPES)
  );

  // schedule modal states
  const [scheduleModalOpen, setScheduleModalOpen] = useState(false);
  const [selectedActivityForSchedule, setSelectedActivityForSchedule] =
    useState<SelectedActivitySchedule | null>(null);

  useEffect(() => {
    if (showAlert) {
      const timer = setTimeout(() => setShowAlert(false), 2000);
      return () => clearTimeout(timer);
    }
  }, [showAlert]);

  const handleAddActivity = (newActivity: Activity) => {
    const exists = activities.some((act) => act.id === newActivity.id);
    if (exists) {
      setError(true);
      setShowAlert(true);
    } else {
      setActivities((prev) => [...prev, newActivity]);
      setError(false);
    }
  };

  const handleRemoveActivity = (idToRemove: number) => {
    setActivities((prev) => prev.filter((act) => act.id !== idToRemove));
  };

  const handleOpenScheduleModal = (name: string, schedules: ActivitySchedule[]) => {
    setSelectedActivityForSchedule({ name, schedules });
    setScheduleModalOpen(true);
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
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          activities: activities.map((a) => a.id),
          unavailable_slots: events, // funnel events as unavailabilities
          grade,
          tags: Array.from(selectedTypes),
        }),
      });

      if (!response.ok) throw new Error("Failed to fetch recommendations");

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error("Error fetching recommendations:", err);
    } finally {
      setIsRecommending(false);
    }
  };

  const handleTypeToggle = (typeName: string, isChecked: boolean) => {
    setSelectedTypes((prevTypes) => {
      const nextTypes = new Set(prevTypes);
      if (isChecked) nextTypes.add(typeName);
      else nextTypes.delete(typeName);
      return nextTypes;
    });
  };

  return (
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
      <Box sx={{ width: "100%", maxWidth: "1500px", position: "relative" }}>
        {/* modals */}
        <ScheduleModal
          open={scheduleModalOpen}
          onClose={() => {
            setScheduleModalOpen(false);
            setSelectedActivityForSchedule(null);
          }}
          selectedActivity={selectedActivityForSchedule}
        />

        <FilterModal
          open={openFilterModal}
          onClose={() => setOpenFilterModal(false)}
          grade={grade}
          onGradeChange={setGrade}
          useCalendarPDF={useCalendarPDF}
          onUseCalendarPDFChange={setUseCalendarPDF}
          selectedTypes={selectedTypes}
          onTypeToggle={handleTypeToggle}
          setTimetableModalOpen={setTimetableModalOpen}
          setEvents={setEvents}
        />

        {/* duplicate selected activity alert */}
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
            <ActivitySearchInput
              onSelectActivity={handleAddActivity}
              error={error}
              setError={setError}
            />

            <RecommendationsList
              recommendations={recommendations}
              isLoading={isRecommending}
              onOpenScheduleModal={handleOpenScheduleModal}
            />
          </Box>

          <Box sx={{ flex: 2, display: "flex", flexDirection: "column", gap: "24px" }}>
            <Box sx={{ display: "flex", justifyContent: "space-between", gap: "16px", height: "54px" }}>
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
                  "&.Mui-disabled": { backgroundColor: "#e2ecd5", color: "rgba(0,0,0,0.4)" },
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
                onClick={() => setOpenFilterModal(true)}
                aria-label="settings"
              >
                <SettingsIcon sx={{ fontSize: "1.5rem" }} />
              </IconButton>
            </Box>

            <SelectedActivitiesList
              activities={activities}
              onRemoveActivity={handleRemoveActivity}
            />
          </Box>
        </Box>
      </Box>

      <TimetableModal
        open={timetableModalOpen}
        onClose={() => setTimetableModalOpen(false)}
        events={events}
        onSave={(newEvents:any) => {
          setEvents(newEvents);
          setTimetableModalOpen(false);
        }}
      />
    </Box>
  );
}
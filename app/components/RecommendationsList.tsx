"use client";

import { Box, Typography, CircularProgress, Chip } from "@mui/material";
import { Recommendation, ActivitySchedule } from "../types";

interface RecommendationsListProps {
  recommendations: Recommendation[];
  isLoading: boolean;
  onOpenScheduleModal: (name: string, schedules: ActivitySchedule[]) => void;
}

export default function RecommendationsList({
  recommendations,
  isLoading,
  onOpenScheduleModal,
}: RecommendationsListProps) {
  return (
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

      {isLoading ? (
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
                sx={{
                  fontWeight: 400,
                  color: "#000",
                  fontSize: "1.1rem",
                  textAlign: "left",
                  fontFamily: "sans-serif",
                }}
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
                  fontFamily: "sans-serif",
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
                  onClick={() => onOpenScheduleModal(rec.activity_name, rec.activity_schedules)}
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
                    "&:hover": { backgroundColor: "#F5F5F5" },
                  }}
                />
              )}
              {rec.tags &&
                rec.tags.map((tag) => (
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
        <Typography
          variant="body1"
          sx={{ fontFamily: "sans-serif", color: "#5A5A5A", fontStyle: "italic", mt: 2 }}
        >
          Add activities to your list and click Search to see recommendations.
        </Typography>
      )}
    </Box>
  );
}
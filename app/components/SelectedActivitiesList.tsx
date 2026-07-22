"use client";

import { Box, Typography, IconButton } from "@mui/material";
import CloseIcon from "@mui/icons-material/Close";
import type { Activity } from "@prisma/client";

interface SelectedActivitiesListProps {
  activities: Activity[];
  onRemoveActivity: (id: number) => void;
}

export default function SelectedActivitiesList({
  activities,
  onRemoveActivity,
}: SelectedActivitiesListProps) {
  return (
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
              onClick={() => onRemoveActivity(activity.id)}
              sx={{ color: "grey.600", p: 0.5 }}
            >
              <CloseIcon fontSize="small" sx={{ fontSize: "1.2rem" }} />
            </IconButton>
          </Box>
        ))}

        {activities.length === 0 && (
          <Typography
            variant="body2"
            sx={{ color: "#7F7F7F", fontStyle: "italic", textAlign: "center", mt: 2 }}
          >
            No activities added yet.
          </Typography>
        )}
      </Box>
    </Box>
  );
}
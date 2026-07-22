"use client";

import { useState, useEffect } from "react";
import { Autocomplete, TextField, Box, Typography, Chip } from "@mui/material";
import type { Activity } from "@prisma/client";

interface ActivitySearchInputProps {
  onSelectActivity: (activity: Activity) => void;
  error: boolean;
  setError: (error: boolean) => void;
}

export default function ActivitySearchInput({
  onSelectActivity,
  error,
  setError,
}: ActivitySearchInputProps) {
  const [value, setValue] = useState<Activity | null>(null);
  const [inputValue, setInputValue] = useState("");
  const [options, setOptions] = useState<Activity[]>([]);

  async function findActivityByName(query: string): Promise<Activity[]> {
    if (query.trim() === "") return [];
    try {
      const response = await fetch(`/api/activities/name/${encodeURIComponent(query)}`);
      if (!response.ok) throw new Error("Network request failed");
      return await response.json();
    } catch (err) {
      console.warn("Server search failed: ", err);
      return []
    }
  }

  useEffect(() => {
    let active = true;

    const fetchOptions = async () => {
      const results = await findActivityByName(inputValue);
      if (active) setOptions(results);
    };

    fetchOptions();

    return () => {
      active = false;
    };
  }, [inputValue]);

  return (
    <Autocomplete
      disablePortal
      freeSolo
      value={value}
      onChange={(_event, newValue) => {
        if (newValue && typeof newValue === "object") {
          onSelectActivity(newValue);
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
  );
}
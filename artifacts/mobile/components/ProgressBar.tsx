import React from "react";
import { View, StyleSheet } from "react-native";
import { useColors } from "@/hooks/useColors";

interface ProgressBarProps {
  progress: number; // 0 to 1
}

export function ProgressBar({ progress }: ProgressBarProps) {
  const colors = useColors();
  return (
    <View style={[styles.track, { backgroundColor: colors.border }]}>
      <View
        style={[
          styles.fill,
          { backgroundColor: colors.primary, width: `${Math.min(100, Math.max(0, progress * 100))}%` },
        ]}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  track: {
    height: 3,
    borderRadius: 2,
    overflow: "hidden",
    width: "100%",
  },
  fill: {
    height: 3,
    borderRadius: 2,
  },
});

import React from "react";
import { TouchableOpacity, StyleSheet, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { KineticText } from "./KineticText";
import * as Haptics from "expo-haptics";

interface SelectionCardProps {
  label: string;
  sublabel?: string;
  icon?: React.ReactNode;
  selected: boolean;
  onPress: () => void;
}

export function SelectionCard({ label, sublabel, icon, selected, onPress }: SelectionCardProps) {
  const colors = useColors();

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.8}
      style={[
        styles.card,
        {
          backgroundColor: colors.card,
          borderWidth: 1.5,
          borderColor: selected ? colors.primary : colors.border,
        },
      ]}
    >
      {selected && (
        <View style={[styles.selectedBar, { backgroundColor: colors.primary }]} />
      )}
      <View style={styles.content}>
        {sublabel && (
          <KineticText variant="label" style={{ color: colors.mutedForeground, marginBottom: 4 }}>
            {sublabel}
          </KineticText>
        )}
        <KineticText variant="title" style={{ fontSize: 18, letterSpacing: 0.5, textTransform: "uppercase" }}>
          {label}
        </KineticText>
      </View>
      {icon && <View style={styles.icon}>{icon}</View>}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  card: {
    borderRadius: 16,
    paddingHorizontal: 20,
    paddingVertical: 20,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    overflow: "hidden",
    position: "relative",
  },
  selectedBar: {
    position: "absolute",
    left: 0,
    top: 0,
    bottom: 0,
    width: 3,
  },
  content: {
    flex: 1,
  },
  icon: {
    marginLeft: 12,
  },
});

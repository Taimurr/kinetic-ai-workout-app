import React from "react";
import { TouchableOpacity, StyleSheet, ActivityIndicator, View } from "react-native";
import { useColors } from "@/hooks/useColors";
import { KineticText } from "./KineticText";
import * as Haptics from "expo-haptics";

interface PrimaryButtonProps {
  label: string;
  onPress: () => void;
  disabled?: boolean;
  loading?: boolean;
  icon?: React.ReactNode;
  variant?: "lime" | "dark";
}

export function PrimaryButton({ label, onPress, disabled, loading, icon, variant = "lime" }: PrimaryButtonProps) {
  const colors = useColors();

  const handlePress = () => {
    if (!disabled && !loading) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      onPress();
    }
  };

  return (
    <TouchableOpacity
      onPress={handlePress}
      activeOpacity={0.85}
      disabled={disabled || loading}
      style={[
        styles.button,
        {
          backgroundColor: variant === "lime" ? (disabled ? "#4A5A00" : colors.primary) : colors.surface,
          borderWidth: variant === "dark" ? 1 : 0,
          borderColor: colors.border,
        },
      ]}
    >
      {loading ? (
        <ActivityIndicator color={variant === "lime" ? "#000" : colors.primary} size="small" />
      ) : (
        <View style={styles.inner}>
          <KineticText
            variant="label"
            style={{
              color: variant === "lime" ? (disabled ? "#8A9A00" : "#000000") : colors.text,
              fontSize: 14,
              letterSpacing: 2,
            }}
          >
            {label}
          </KineticText>
          {icon && <View style={styles.icon}>{icon}</View>}
        </View>
      )}
    </TouchableOpacity>
  );
}

const styles = StyleSheet.create({
  button: {
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    paddingHorizontal: 24,
  },
  inner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  icon: {
    marginLeft: 4,
  },
});

import React from "react";
import { Pressable, StyleSheet, View } from "react-native";
import Animated, {
  useSharedValue,
  useAnimatedStyle,
  withSpring,
  withTiming,
  interpolateColor,
} from "react-native-reanimated";
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
  const scale = useSharedValue(1);
  const selectedProgress = useSharedValue(selected ? 1 : 0);

  React.useEffect(() => {
    selectedProgress.value = withTiming(selected ? 1 : 0, { duration: 200 });
  }, [selected]);

  const animatedStyle = useAnimatedStyle(() => ({
    transform: [{ scale: scale.value }],
    borderColor: interpolateColor(
      selectedProgress.value,
      [0, 1],
      [colors.border, colors.primary]
    ),
  }));

  const barStyle = useAnimatedStyle(() => ({
    opacity: selectedProgress.value,
    transform: [{ scaleY: selectedProgress.value }],
  }));

  const handlePressIn = () => {
    scale.value = withSpring(0.97, { damping: 20, stiffness: 400 });
  };

  const handlePressOut = () => {
    scale.value = withSpring(1, { damping: 15, stiffness: 300 });
  };

  const handlePress = () => {
    Haptics.selectionAsync();
    onPress();
  };

  return (
    <Pressable
      onPress={handlePress}
      onPressIn={handlePressIn}
      onPressOut={handlePressOut}
    >
      <Animated.View
        style={[
          styles.card,
          { backgroundColor: colors.card, borderWidth: 1.5 },
          animatedStyle,
        ]}
      >
        <Animated.View style={[styles.selectedBar, { backgroundColor: colors.primary }, barStyle]} />
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
      </Animated.View>
    </Pressable>
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

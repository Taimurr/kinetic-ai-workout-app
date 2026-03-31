import React, { useEffect, useRef } from "react";
import { View, StyleSheet, Animated, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";
import { KineticText } from "@/components/KineticText";

export default function GeneratingScreen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { isGeneratingPlan, weeklyPlan } = useApp();
  const pulseAnim = useRef(new Animated.Value(0.3)).current;

  useEffect(() => {
    const pulse = Animated.loop(
      Animated.sequence([
        Animated.timing(pulseAnim, { toValue: 1, duration: 900, useNativeDriver: true }),
        Animated.timing(pulseAnim, { toValue: 0.3, duration: 900, useNativeDriver: true }),
      ])
    );
    pulse.start();
    return () => pulse.stop();
  }, []);

  useEffect(() => {
    if (!isGeneratingPlan && weeklyPlan) {
      router.replace("/(tabs)/plan");
    }
  }, [isGeneratingPlan, weeklyPlan]);

  const topInset = Platform.OS === "web" ? 67 : insets.top;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={{ paddingTop: topInset }}>
        <KineticText variant="brand" lime style={{ textAlign: "center" }}>KINETIC</KineticText>
      </View>

      <View style={styles.center}>
        <Animated.View style={[styles.dot, { backgroundColor: colors.primary, opacity: pulseAnim }]} />
        <View style={styles.textGroup}>
          <KineticText variant="title" style={{ textAlign: "center", marginBottom: 8 }}>
            BUILDING YOUR PLAN
          </KineticText>
          <KineticText variant="muted" style={{ textAlign: "center", color: colors.mutedForeground }}>
            Calibrating exercises to your profile...
          </KineticText>
        </View>

        <View style={styles.steps}>
          {["Analyzing your goal", "Selecting exercises", "Scheduling your week"].map((step, i) => (
            <View key={i} style={styles.step}>
              <Animated.View style={[styles.stepDot, { backgroundColor: colors.primary, opacity: pulseAnim }]} />
              <KineticText variant="label" style={{ color: colors.mutedForeground }}>{step}</KineticText>
            </View>
          ))}
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, paddingHorizontal: 24 },
  center: { flex: 1, justifyContent: "center", alignItems: "center", gap: 40 },
  dot: { width: 64, height: 64, borderRadius: 32 },
  textGroup: { alignItems: "center" },
  steps: { gap: 16, alignSelf: "stretch" },
  step: { flexDirection: "row", alignItems: "center", gap: 12 },
  stepDot: { width: 8, height: 8, borderRadius: 4 },
});

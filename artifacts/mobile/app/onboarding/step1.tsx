import { Dumbbell, Flame, UserRound, Zap } from "lucide-react-native";
import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Platform } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";

import { KineticText } from "@/components/KineticText";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectionCard } from "@/components/SelectionCard";
import { useApp, type Goal } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const GOALS: { value: Goal; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { value: "strength", label: "Strength", sublabel: "HEAVY LIFTING", icon: <Dumbbell size={22} color="#9CA3AF" /> },
  { value: "muscle_gain", label: "Muscle Gain", sublabel: "HYPERTROPHY", icon: <UserRound size={22} color="#9CA3AF" /> },
  { value: "weight_loss", label: "Weight Loss", sublabel: "CALORIE BURN", icon: <Flame size={22} color="#9CA3AF" /> },
  { value: "general_fitness", label: "General Fitness", sublabel: "WELL-BEING", icon: <Zap size={22} color="#9CA3AF" /> },
];

export default function Step1Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setProfile, profile } = useApp();
  const [selected, setSelected] = useState<Goal | null>(profile?.goal ?? null);

  const handleContinue = () => {
    if (!selected) return;
    setProfile({ ...(profile ?? {} as any), goal: selected });
    router.push("/onboarding/step2");
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <KineticText variant="brand" lime>KINETIC</KineticText>
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>STEP 1 OF 5</KineticText>
      </View>

      <ProgressBar progress={1 / 5} />

      <ScrollView
        style={styles.scroll}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.question}>
          <KineticText variant="headline">WHAT'S YOUR</KineticText>
          <KineticText variant="headline" lime>GOAL?</KineticText>
        </View>

        <View style={styles.cards}>
          {GOALS.map((goal) => (
            <SelectionCard
              key={goal.value}
              label={goal.label}
              sublabel={goal.sublabel}
              icon={goal.icon}
              selected={selected === goal.value}
              onPress={() => setSelected(goal.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryButton
          label="CONTINUE"
          onPress={handleContinue}
          disabled={!selected}
          icon={<KineticText style={{ color: selected ? "#000" : "#8A9A00", fontSize: 18 }}>→</KineticText>}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1 },
  header: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingHorizontal: 24,
    paddingBottom: 16,
  },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  question: { marginBottom: 32, marginTop: 24 },
  cards: { gap: 12 },
  footer: {
    paddingHorizontal: 24,
    paddingTop: 16,
  },
});

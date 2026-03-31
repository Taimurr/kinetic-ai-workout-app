import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft } from "lucide-react-native";

import { KineticText } from "@/components/KineticText";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectionCard } from "@/components/SelectionCard";
import { useApp, type Experience } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const LEVELS: { value: Experience; label: string; sublabel: string; desc: string }[] = [
  { value: "beginner", label: "Complete Beginner", sublabel: "BEGINNER", desc: "Never trained with weights before" },
  { value: "some_experience", label: "Some Experience", sublabel: "6-12 MONTHS", desc: "Know the basics, building consistency" },
  { value: "intermediate", label: "Intermediate", sublabel: "1-2 YEARS", desc: "Comfortable with major lifts" },
];

export default function Step2Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setProfile, profile } = useApp();
  const [selected, setSelected] = useState<Experience | null>(profile?.experience ?? null);

  const handleContinue = () => {
    if (!selected || !profile) return;
    setProfile({ ...profile, experience: selected });
    router.push("/onboarding/step3");
  };

  const topInset = Platform.OS === "web" ? 67 : insets.top;
  const bottomInset = Platform.OS === "web" ? 34 : insets.bottom;

  return (
    <View style={[styles.container, { backgroundColor: colors.background }]}>
      <View style={[styles.header, { paddingTop: topInset + 16 }]}>
        <View style={styles.headerLeft}>
          <TouchableOpacity onPress={() => router.back()} style={styles.back}>
            <ChevronLeft size={20} color={colors.mutedForeground} />
          </TouchableOpacity>
          <KineticText variant="brand" lime>KINETIC</KineticText>
        </View>
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>STEP 2 OF 5</KineticText>
      </View>

      <ProgressBar progress={2 / 5} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.question}>
          <KineticText variant="headline">EXPERIENCE</KineticText>
          <KineticText variant="headline" lime>LEVEL?</KineticText>
        </View>

        <View style={styles.cards}>
          {LEVELS.map((level) => (
            <SelectionCard
              key={level.value}
              label={level.label}
              sublabel={level.sublabel}
              selected={selected === level.value}
              onPress={() => setSelected(level.value)}
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
  headerLeft: { flexDirection: "row", alignItems: "center", gap: 8 },
  back: { padding: 4 },
  scroll: { flex: 1 },
  scrollContent: { paddingHorizontal: 24, paddingBottom: 24 },
  question: { marginBottom: 32, marginTop: 24 },
  cards: { gap: 12 },
  footer: { paddingHorizontal: 24, paddingTop: 16 },
});

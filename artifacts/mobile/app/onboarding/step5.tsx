import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Calendar } from "lucide-react-native";

import { KineticText } from "@/components/KineticText";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectionCard } from "@/components/SelectionCard";
import { useApp } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const DAYS: { value: 2 | 3 | 4 | 5; label: string; sublabel: string }[] = [
  { value: 2, label: "2 DAYS", sublabel: "MINIMAL" },
  { value: 3, label: "3 DAYS", sublabel: "BALANCED" },
  { value: 4, label: "4 DAYS", sublabel: "COMMITTED" },
  { value: 5, label: "5 DAYS", sublabel: "DEDICATED" },
];

export default function Step5Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setProfile, profile, completeOnboarding } = useApp();
  const [selected, setSelected] = useState<2 | 3 | 4 | 5 | null>(profile?.daysPerWeek ?? null);
  const [loading, setLoading] = useState(false);

  const handleContinue = async () => {
    if (!selected || !profile) return;
    setLoading(true);
    const finalProfile = { ...profile, daysPerWeek: selected };
    setProfile(finalProfile);
    router.push("/onboarding/generating");
    await completeOnboarding(finalProfile);
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
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>STEP 5 OF 5</KineticText>
      </View>

      <ProgressBar progress={1} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.question}>
          <KineticText variant="headline">DAYS PER</KineticText>
          <KineticText variant="headline" lime>WEEK?</KineticText>
        </View>

        <View style={styles.cards}>
          {DAYS.map((d) => (
            <SelectionCard
              key={d.value}
              label={d.label}
              sublabel={d.sublabel}
              icon={<Calendar size={22} color="#9CA3AF" />}
              selected={selected === d.value}
              onPress={() => setSelected(d.value)}
            />
          ))}
        </View>
      </ScrollView>

      <View style={[styles.footer, { paddingBottom: bottomInset + 24 }]}>
        <PrimaryButton
          label="BUILD MY PLAN"
          onPress={handleContinue}
          disabled={!selected}
          loading={loading}
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

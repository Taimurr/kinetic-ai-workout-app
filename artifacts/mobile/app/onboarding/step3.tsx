import React, { useState } from "react";
import { ScrollView, View, StyleSheet, Platform, TouchableOpacity } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { router } from "expo-router";
import { ChevronLeft, Building2, Dumbbell, PersonStanding } from "lucide-react-native";

import { KineticText } from "@/components/KineticText";
import { ProgressBar } from "@/components/ProgressBar";
import { PrimaryButton } from "@/components/PrimaryButton";
import { SelectionCard } from "@/components/SelectionCard";
import { useApp, type Equipment } from "@/context/AppContext";
import { useColors } from "@/hooks/useColors";

const EQUIPMENT: { value: Equipment; label: string; sublabel: string; icon: React.ReactNode }[] = [
  { value: "full_gym", label: "Full Gym", sublabel: "ALL EQUIPMENT", icon: <Building2 size={22} color="#9CA3AF" /> },
  { value: "dumbbells_only", label: "Dumbbells Only", sublabel: "HOME GYM", icon: <Dumbbell size={22} color="#9CA3AF" /> },
  { value: "barbells_and_dumbbells", label: "Barbells & Dumbbells", sublabel: "POWERLIFTING", icon: <Dumbbell size={22} color="#9CA3AF" /> },
  { value: "bodyweight_only", label: "Bodyweight Only", sublabel: "NO EQUIPMENT", icon: <PersonStanding size={22} color="#9CA3AF" /> },
];

export default function Step3Screen() {
  const colors = useColors();
  const insets = useSafeAreaInsets();
  const { setProfile, profile } = useApp();
  const [selected, setSelected] = useState<Equipment | null>(profile?.equipment ?? null);

  const handleContinue = () => {
    if (!selected || !profile) return;
    setProfile({ ...profile, equipment: selected });
    router.push("/onboarding/step4");
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
        <KineticText variant="label" style={{ color: colors.mutedForeground }}>STEP 3 OF 5</KineticText>
      </View>

      <ProgressBar progress={3 / 5} />

      <ScrollView style={styles.scroll} contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        <View style={styles.question}>
          <KineticText variant="headline">AVAILABLE</KineticText>
          <KineticText variant="headline" lime>EQUIPMENT?</KineticText>
        </View>

        <View style={styles.cards}>
          {EQUIPMENT.map((eq) => (
            <SelectionCard
              key={eq.value}
              label={eq.label}
              sublabel={eq.sublabel}
              icon={eq.icon}
              selected={selected === eq.value}
              onPress={() => setSelected(eq.value)}
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

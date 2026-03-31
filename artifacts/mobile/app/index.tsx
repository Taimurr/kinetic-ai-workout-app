import { Redirect } from "expo-router";
import { useApp } from "@/context/AppContext";

export default function IndexScreen() {
  const { onboardingCompleted } = useApp();

  if (onboardingCompleted) {
    return <Redirect href="/(tabs)/plan" />;
  }

  return <Redirect href="/onboarding/step1" />;
}

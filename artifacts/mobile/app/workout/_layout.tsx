import { Stack } from "expo-router";

export default function WorkoutLayout() {
  return (
    <Stack screenOptions={{ headerShown: false, animation: "slide_from_right" }}>
      <Stack.Screen name="detail" />
      <Stack.Screen name="session" />
      <Stack.Screen name="complete" />
    </Stack>
  );
}

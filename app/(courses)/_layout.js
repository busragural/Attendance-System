import { Stack } from "expo-router";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="courses" />
        <Stack.Screen name="courseDetail" />
      </Stack>
    </>
  );
}

import { Stack } from "expo-router";

export default function Layout() {
  return (
    <>
      <Stack screenOptions={{ headerShown: false }}>
        <Stack.Screen name="courses" />
        <Stack.Screen name="courseDetail" />
        <Stack.Screen name="attendanceList" />
        <Stack.Screen name="courseStatistics"/>
        <Stack.Screen name="signatureDetail"/>
        <Stack.Screen name="limitBreachList"/>
        <Stack.Screen name="courseParticipants"/>
      </Stack>
    </>
  );
}

import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import PrimaryButton from "./PrimaryButton";
import { GlobalStyles } from "../constants/styles"

const WeekCard = ({ weekDate, onPress, attendedCount, notAttendedCount }) => {
  const total = attendedCount + notAttendedCount;
  return (
    <Card attendance="attended">
      <Text style={styles.lecture}>{`Hafta: ${weekDate}`}</Text>
      <View style={styles.detailsContainer}>
        <View style={styles.attendanceContainer}>
          <Text style={styles.attendanceText}>Katılım: {attendedCount}/{total}</Text>
        </View>
        <View style={styles.buttonContainer}>
          <PrimaryButton onPress={onPress}>Katılım Listesi</PrimaryButton>
        </View>
      </View>
    </Card>
  );
};

export default WeekCard;

const styles = StyleSheet.create({
  lecture: {
    color: GlobalStyles.surfaceColors.text,
    fontWeight: "600",
    fontSize: 16
  },

  buttonContainer: {
    marginLeft: "auto",
    flexDirection: "row",
    justifyContent: "center",
  },
  attendanceContainer: {
    flex: 1,
  },
  attendanceText: {
    color: GlobalStyles.surfaceColors.dark,
    fontWeight: "500",
    fontSize: 16
  },
  detailsContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center'
  },
});

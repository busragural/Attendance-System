import React from "react";
import { StyleSheet, Text, View } from "react-native";
import Card from "./Card";
import PrimaryButton from "./PrimaryButton";
import { GlobalStyles } from "../constants/styles"

const WeekCard = ({ weekDate, onPress }) => {
  return (
    <Card>
      <Text style={styles.lecture}>{`Hafta: ${weekDate}`}</Text>
      <View style={styles.buttonContainer}>
        <PrimaryButton onPress={onPress}>Katılım Listesi</PrimaryButton>
      </View>
    </Card>
  );
};

export default WeekCard;

const styles = StyleSheet.create({
  lecture: {
    color: GlobalStyles.surfaceColors.text,
  },

  buttonContainer: {
    marginLeft: "auto",
    flexDirection: "row",
    justifyContent: "center",
  },
});

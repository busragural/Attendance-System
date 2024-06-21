import { Dimensions, StyleSheet, View } from "react-native";
import { GlobalStyles } from "../constants/styles";

function Card({ children, attendance }) {
  return (
    <View style={[styles.card, attendance === 'attended' ? styles.attendedCard : styles.notAttendedCard]}>
      {children}
    </View>
  );
}

export default Card;

const deviceWidth = Dimensions.get('window').width;
const styles = StyleSheet.create({
  card: {
    marginTop: deviceWidth < 380 ? 12 : 24,
    marginHorizontal: 14,
    padding: 16,
    borderRadius: 8,
    elevation: 8,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
    justifyContent: "center",
    //alignItems: "flex-start"
  },

  attendedCard: {
    backgroundColor: GlobalStyles.surfaceColors.secondaryRed,
  },
  notAttendedCard: {
    backgroundColor: GlobalStyles.surfaceColors.error,
  },
});
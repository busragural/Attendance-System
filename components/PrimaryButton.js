import { Text, View, Pressable, StyleSheet } from "react-native";
import { GlobalStyles } from "../constants/styles";
function PrimaryButton({ children, onPress }) {
  return (
    <View style={styles.buttonOuterContainer}>
      <Pressable
        style={({ pressed }) =>
          pressed
            ? [styles.pressed, styles.buttonInnerContainer]
            : styles.buttonInnerContainer
        }
        onPress={onPress}
        android_ripple={{ color: GlobalStyles.surfaceColors.secondary400 }}
      >
        <Text style={styles.buttonText}>{children}</Text>
      </Pressable>
    </View>
  );
}

export default PrimaryButton;

const styles = StyleSheet.create({
  buttonInnerContainer: {
    backgroundColor: GlobalStyles.surfaceColors.secondary400,
    paddingVertical: 10,
    //paddingHorizontal: 16,
    elevation: 3,
  },
  buttonText: {
    color: GlobalStyles.surfaceColors.primary,
    textAlign: "center",
    fontSize: 15,
    marginHorizontal:10
  },
  buttonOuterContainer: {
    borderRadius: 10,
    margin: 5,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
  },
});

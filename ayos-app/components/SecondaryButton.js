import { Text, View, Pressable, StyleSheet } from "react-native";
import { GlobalStyles } from "../constants/styles";
function SecondaryButton({ children, onPress }) {
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

export default SecondaryButton;

const styles = StyleSheet.create({
  buttonInnerContainer: {
    paddingVertical: 10,
    paddingHorizontal: 16,
    elevation: 3,
  },
  buttonText: {
    color: GlobalStyles.surfaceColors.secondary400,
    textAlign: "center",
    fontSize: 15,
    marginHorizontal:10
  },
  buttonOuterContainer: {
    borderWidth: 2,
    borderColor: GlobalStyles.surfaceColors.secondary400,
    borderRadius: 10,
    margin: 5,
    overflow: "hidden",
  },
  pressed: {
    opacity: 0.75,
  },
});

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useState } from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import PrimaryButton from "../../components/PrimaryButton";
import SecondaryButton from "../../components/SecondaryButton";
import { GlobalStyles } from "../../constants/styles";
// import ErrorText from "../../components/ErrorText";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();

  const handleLogin = () => {
    const user = {
      mail: email,
      password: password,
    };
    axios
      .post("http://192.168.1.58:8000/login", user, {
        headers: {
          "Content-Type": "application/json",
        },
      })
      .then((response) => {
        const token = response.data.token;
        AsyncStorage.setItem("auth", token);
        router.replace("(courses)/courses");
      })
      .catch((error) => {
        console.error("Login failed:", error.message);
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.allScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
    >
      <View style={styles.loginContainer}>
        <Image
          style={styles.image}
          source={require("../../assets/images/star.png")}
        />
        <View style={styles.inputArea}>
          <View style={styles.inputFields}>
            <View style={styles.inputField}>
              <Text style={styles.label}>Mail</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                onChangeText={(value) => setEmail(value)}
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.label}>Password</Text>
              <TextInput
                style={styles.input}
                secureTextEntry={true}
                onChangeText={(value) => setPassword(value)}
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton onPress={handleLogin}>Login</PrimaryButton>
            </View>
          </View>
          {/* {error && <ErrorText>{error}</ErrorText>} */}
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default login;

const styles = StyleSheet.create({
  allScreen: {
    flex: 1,
  },

  loginContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.surfaceColors.primary,
    padding: 20,
    justifyContent: "center",
    alignItems: "center",
  },
  title: {
    fontWeight: "bold",
    color: GlobalStyles.surfaceColors.secondary500,
    fontSize: 32,
    textAlign: "center",
    paddingTop: 50,
    paddingBottom: 20,
  },
  image: {
    flex: 2,
    width: "100%",
    height: Platform.OS === "ios" ? "100%" : "50%",
    resizeMode: "contain",
    marginTop: Platform.OS === "ios" ? 20 : 70,
    //backgroundColor: GlobalStyles.surfaceColors.secondary500,
  },
  inputArea: {
    flex: 3,
    justifyContent: "center",
  },
  inputFields: {
    flexDirection: "column",
    backgroundColor: GlobalStyles.surfaceColors.gray50,
    borderRadius: 10,
    padding: 30,
  },
  inputField: {
    margin: 5,
  },
  label: {
    color: GlobalStyles.surfaceColors.secondary400,
    fontSize: 15,
  },
  input: {
    borderWidth: 2,
    borderColor: GlobalStyles.surfaceColors.secondary400,
    borderRadius: 10,
    width: 300,
    padding: 10,
    marginTop: 5,
  },
  buttonContainer: {
    paddingTop: 10,
  },
});

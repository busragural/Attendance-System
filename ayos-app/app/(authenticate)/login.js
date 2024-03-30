import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import PrimaryButton from "../../components/PrimaryButton";
import { GlobalStyles } from "../../constants/styles";
import ErrorText from "../../components/ErrorText";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";


const login = () => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;

  useEffect(() => {
    const checkToken = async () => {
      const token = await AsyncStorage.getItem("auth");
      if (token) {
        router.replace("(courses)/courses");
      }
    };
  
    checkToken();
  }, []);

  const handleLogin = () => {
    const user = {
      email: email,
      password: password,
    };
    console.log(user);
    axios
      .post(`http://${ip_address}:8000/login`, user, {
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
        setError("Mail veya şifre hatalı.");
      });
  };

  return (
    <KeyboardAvoidingView
      style={styles.allScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : -200} // Adjust the offset for Android
    >
      <View style={styles.loginContainer}>
        <Image
          style={styles.image}
          source={require("../../assets/images/star.png")}
        />
        <View style={styles.inputArea}>
          <View style={styles.inputFields}>
            <View style={styles.inputField}>
              {error && <ErrorText>{error}</ErrorText>}
              <Text style={styles.label}>Mail</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                onChangeText={(value) => setEmail(value)}
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                secureTextEntry={true}
                onChangeText={(value) => setPassword(value)}
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton onPress={handleLogin}>Giriş Yap</PrimaryButton>
            </View>
          </View>
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
    //padding: 20,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "android" ? 20 : 0,
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
    marginTop: 20,
    marginBottom: 10,
    //backgroundColor: GlobalStyles.surfaceColors.secondary500,
  },
  inputArea: {
    flex: 3,
    justifyContent: "center",
    width: "100%",
  },
  inputFields: {
    flexDirection: "column",
    //backgroundColor: GlobalStyles.surfaceColors.gray50,
    borderRadius: 10,
    padding: 30,
    width: "100%",
  },
  inputField: {
    margin: 5,
    width: "100%",
  },
  label: {
    color: GlobalStyles.surfaceColors.dark,
    fontSize: 15,
  },
  input: {
    borderWidth: 2,
    borderColor: GlobalStyles.surfaceColors.dark,
    borderRadius: 10,
    width: "100%",
    padding: 10,
    marginTop: 5,
  },
  buttonContainer: {
    paddingTop: 10,
  },
});

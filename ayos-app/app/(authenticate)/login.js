import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  View,
  TouchableOpacity,
} from "react-native";
import React, { useEffect, useState } from "react";
import PrimaryButton from "../../components/PrimaryButton";
import { GlobalStyles } from "../../constants/styles";
import ErrorText from "../../components/ErrorText";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';


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

  const handleRegister = () => {
    router.replace("/register");
  };

  Notifications.setNotificationHandler({
    handleNotification: async () => ({
      shouldShowAlert: true,
      shouldPlaySound: false,
      shouldSetBadge: false,
    }),
  });

  return (
    <KeyboardAvoidingView
      style={styles.allScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >

      <View style={styles.loginContainer}>
        <Image
          style={styles.image}
          source={require("../../assets/images/star.png")}
        />
        <Text style={styles.title} >AYOS</Text>
        <View style={styles.inputArea}>
          <View style={styles.inputFields}>
            <View style={styles.inputField}>
              {error && <ErrorText>{error}</ErrorText>}
              <Text style={styles.label}>Email</Text>
              <TextInput
                style={styles.input}
                keyboardType="email-address"
                placeholder="email@yildiz.edu.tr"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                onChangeText={(value) => setEmail(value)}
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.label}>Şifre</Text>
              <TextInput
                style={styles.input}
                placeholder="*******"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                secureTextEntry={true}
                onChangeText={(value) => setPassword(value)}
              />
            </View>

            <View style={styles.buttonContainer}>
              <PrimaryButton onPress={handleLogin}>Giriş Yap</PrimaryButton>
            </View>


          </View>

          <View style={styles.registerContainer}>
            <Text style={styles.registerText}>Hesabınız yok mu?  </Text>
            <TouchableOpacity onPress={handleRegister}>
              <Text style={styles.registerButton}>Kayıt olun.</Text>
            </TouchableOpacity>
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
    backgroundColor: GlobalStyles.surfaceColors.primary,
  },

  loginContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    //paddingBottom: Platform.OS === "android" ? 20 : 0,
  },

  title: {
    fontWeight: "900",
    color: GlobalStyles.surfaceColors.secondary400,
    fontSize: 60,
    textAlign: "center",
    paddingVertical: 30,
  },
  image: {
    flex: 2,
    width: "100%",
    //height: Platform.OS === "ios" ? "100%" : "50%",
    height: "100%",
    resizeMode: "contain",
    marginTop: 30,

  },
  inputArea: {
    flex: 3,
    width: "100%",
    alignItems: "center",
    backgroundColor: GlobalStyles.surfaceColors.primary,
    elevation: Platform.OS === "android" ? 15 : 20,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: Platform.OS === "android" ? 30 : 6,
    shadowOpacity: Platform.OS === "android" ? 0.75 : 0.55,
    marginHorizontal: 16,
    borderRadius: 16,
    paddingHorizontal: 8,
  },
  inputFields: {
    flexDirection: "column",
    borderRadius: 10,
    padding: 30,
    width: "100%",
    justifyContent: "center",
    alignItems: "center",
  },
  inputField: {
    margin: 5,
    width: "100%",
  },
  label: {
    color: GlobalStyles.surfaceColors.dark,
    fontSize: 16,
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
    paddingTop: 20,
    width: '100%',
  },
  registerButton: {
    color: GlobalStyles.surfaceColors.secondaryRed,
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold"
  },
  registerContainer: {
    flexDirection: "row",

  },
  registerText: {
    color: GlobalStyles.surfaceColors.dark,
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,

  }

});

import {
  Image,
  KeyboardAvoidingView,
  Platform,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useState } from "react";
import PrimaryButton from "../../components/PrimaryButton";
import { GlobalStyles } from "../../constants/styles";
import ErrorText from "../../components/ErrorText";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";

const register = () => {
  const [name, setName] = useState("");
  const [surname, setSurname] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState("");
  const router = useRouter();
  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;

  const handleRegister = () => {

    if (!name.trim() || !surname.trim() || !email.trim() || !password.trim()) {
      setError("Lütfen tüm alanları doldurunuz.");
      return;
    }

    const newUser = {
      name: name,
      surname: surname,
      email: email,
      password: password,
    };
    console.log(newUser);
    axios
      .post(`http://${ip_address}:8000/register`, newUser, {
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
        console.error("Registration failed:", error.message);
        setError("Kayıt başarısız. Lütfen tekrar deneyin.");
      });
  };

  handleLogin = () => {
    router.replace("/login");

  }
  return (
    <KeyboardAvoidingView
      style={styles.allScreen}
      behavior={Platform.OS === "ios" ? "padding" : "height"}
      keyboardVerticalOffset={Platform.OS === "ios" ? 0 : 20}
    >
      <View style={styles.registerContainer}>
        <Text style={styles.title} >AYOS</Text>
        <Text style={styles.registerTitle} >Yeni hesap oluştur.</Text>

        <View style={styles.inputArea}>
          <View style={styles.inputFields}>
            <View style={styles.inputField}>
              {error && <ErrorText>{error}</ErrorText>}
              <Text style={styles.label}>İsim</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setName(value)}
              />
            </View>

            <View style={styles.inputField}>
              <Text style={styles.label}>Soyisim</Text>
              <TextInput
                style={styles.input}
                onChangeText={(value) => setSurname(value)}
              />
            </View>

            <View style={styles.inputField}>
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
              <PrimaryButton onPress={handleRegister}>Kayıt Ol</PrimaryButton>
            </View>
          </View>
          <View style={styles.loginContainer}>
            <Text style={styles.loginText}>Hesabınız var mı?  </Text>
            <TouchableOpacity onPress={handleLogin}>
              <Text style={styles.loginButton}>Giriş yapın.</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    </KeyboardAvoidingView>
  );
};

export default register;

const styles = StyleSheet.create({
  allScreen: {
    flex: 1,
  },

  registerContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.surfaceColors.primary,
    justifyContent: "center",
    alignItems: "center",
    paddingBottom: Platform.OS === "android" ? 20 : 0,
  },
  image: {
    flex: 2,
    width: "100%",
    height: Platform.OS === "ios" ? "100%" : "50%",
    resizeMode: "contain",
    marginTop: 20,
    marginBottom: 10,
  },
  title: {
    fontWeight: "900",
    color: GlobalStyles.surfaceColors.secondary400,
    fontSize: 60,
    textAlign: "center",
    paddingVertical: 30,
  },
  registerTitle: {
    fontWeight: "500",
    color: GlobalStyles.surfaceColors.secondaryRed,
    fontSize: 24,
    textAlign: "center",
    paddingVertical: 30,

  },

  inputArea: {
    flex: 3,
    width: "100%",
    alignItems: "center",
    backgroundColor: GlobalStyles.surfaceColors.primary,
    elevation: Platform.OS === "android" ? 10 : 20,
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
  loginButton: {
    color: GlobalStyles.surfaceColors.secondaryRed,
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,
    fontWeight: "bold"
  },
  loginContainer: {
    flexDirection: "row",

  },
  loginText: {
    color: GlobalStyles.surfaceColors.dark,
    textAlign: "center",
    marginTop: 10,
    fontSize: 16,

  }
});

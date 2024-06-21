import {
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Card from "../../components/Card";
import { GlobalStyles } from "../../constants/styles";
import { AntDesign } from "@expo/vector-icons";
import Loading from "../../components/Loading";

const CourseParticipants = () => {
  const routes = useRouter();
  const params = useLocalSearchParams();
  const courseCode = params.courseCode;
  const [participants, setParticipants] = useState([]);
  const [loading, setLoading] = useState(false);

  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;

  useEffect(() => {
    const fetchParticipants = async () => {
      try {
        setLoading(true);
        const token = await AsyncStorage.getItem("auth");
        const response = await axios.get(
          `http://${ip_address}:8000/user/courseParticipants/${courseCode}`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        setParticipants(response.data.participants);
        setLoading(false);
      } catch (error) {
        console.error("Error fetching participants:", error.message);
        setLoading(false);
      }
    };

    fetchParticipants();
  }, [courseCode]);

  const goBackToCourses = () => {
    routes.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={goBackToCourses}>
          <View style={styles.backIconView}>
            <AntDesign name="arrowleft" size={30} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerText}>ÖĞRENCİ LİSTESİ</Text>
      </View>
      <Loading visible={loading} />
      {!loading && (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.cardContainer}>
            {participants.length === 0 ? (
              <Card >
                <Text style={styles.cardText}>Kayıt bulunamadı.</Text>
              </Card>
            ) : (
              participants.map((participant, index) => (
                <Card attendance="attended" key={index}>
                  <View style={styles.insideCard}>
                    <Text style={styles.cardText}>
                      {participant.studentNumber} - {participant.name}{" "}
                      {participant.surname}
                    </Text>
                  </View>
                </Card>
              ))
            )}
          </View>
        </ScrollView>
      )}
    </ScrollView>
  );
};

export default CourseParticipants;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  cardText: {
    color: GlobalStyles.surfaceColors.text,
    fontSize: 16
  },
  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    padding: 18,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
  },
  headerText: {
    color: GlobalStyles.surfaceColors.primary,
    fontSize: 24,
    fontWeight: "bold",
    marginLeft: "auto",
    marginRight: "auto",
  },
  backIconView: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    marginTop: 16,
    color: GlobalStyles.surfaceColors.secondary500,
  },
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    marginBottom: 20,
  },
  insideCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 10,
    flex: 1,
  },
  attendanceButton: {
    justifyContent: "flex-end",
  },
});

import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Card from "../../components/Card";
import { GlobalStyles } from "../../constants/styles";
import { AntDesign } from "@expo/vector-icons";

const attendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;
  const params = useLocalSearchParams();
  const courseCode = params.courseCode;
  const courseWeek = params.courseWeek;
  const router = useRouter();

  const [studentInfo, setStudentInfo] = useState({});

  const formatDate = (inputDate) => {
    const parts = inputDate.split(".");
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    const formattedDate = new Date(`${year}-${month}-${day}`);
    const isoFormattedDate = formattedDate.toISOString().split("T")[0];

    return isoFormattedDate;
  };

  useEffect(() => {
    const apiUrl = `http://${ip_address}:8000/attendanceList`;
    const studentsInfoApiUrl = `http://${ip_address}:8000/studentsInfo`;

    const updatedWeek = formatDate(courseWeek);
    console.log(updatedWeek);
    axios
      .get(`http://${ip_address}:8000/courseId?courseCode=${courseCode}`)
      .then((response) => {
        const data = response.data;
        const courseId = data.courseId;

        AsyncStorage.getItem("auth")
          .then((token) => {
            axios
              .get(`${apiUrl}?courseId=${courseId}&courseWeek=${updatedWeek}`, {
                headers: {
                  Authorization: `Bearer ${token}`,
                },
              })
              .then((response) => {
                const data = response.data;
                console.log("hangidata", data);
                setAttendanceData(data.attendanceList);

                const studentIds = data.attendanceList.map(
                  (item) => item.studentId
                );

                const attendances = data.attendanceList.map(
                  (item) => item.attendance
                );
                console.log("attendances", attendances);
                console.log("studentIds", studentIds);

                axios
                  .get(
                    `${studentsInfoApiUrl}?studentIds=${studentIds.join(",")}`
                  )
                  .then((response) => {
                    const studentInfoMap = {};
                    const studentsInfo = response.data.studentsInfo;
                    console.log("testzzz", studentsInfo);
                    // Her öğrenci için bilgileri studentInfoMap'e ekle
                    studentsInfo.forEach((student, index) => {
                      const studentId = studentIds[index];
                      const attendance = attendances[index];

                      studentInfoMap[studentId] = {
                        ...student,
                        attendance: attendance
                      };
                    });

                    // State'i güncelle
                    setStudentInfo(studentInfoMap);

                  })
                  .catch((error) => {
                    console.error(
                      "Error fetching student information:",
                      error.message
                    );
                  });
              })
              .catch((error) => {
                console.error("Error fetching attendance list:", error.message);
              });
          })

          .catch((error) =>
            console.error("Error getting token from AsyncStorage:", error)
          );
      })
      .catch((error) => console.error("Error fetching course ID:", error));
  }, [courseCode, courseWeek]);

  const goBackToCourses = () => {
    router.back();
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={goBackToCourses}>
          <View style={styles.backIconView}>
            <AntDesign name="arrowleft" size={30} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerText}>KATILIM LİSTESİ</Text>
      </View>

      {attendanceData.length === 0 ? (
        <Card>
          <Text style={styles.cardText}>Kayıt bulunamadı.</Text>
        </Card>
      
    ) : (
      Object.values(studentInfo).map((item, index) => (
        <Card key={index}>
          <Text style={styles.cardText}>StudentID: {item.studentId}</Text>
          <Text style={styles.cardText}>Name: {item.name}</Text>
          <Text style={styles.cardText}>Surname: {item.surname}</Text>
          <Text style={styles.cardText}>Email: {item.email}</Text>
          <Text style={styles.cardText}>
            Attendance: {item.attendance ? "Present" : "Absent"}
          </Text>
        </Card>
      ))
    )}
    </ScrollView>
  );
};

export default attendanceList;

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },

  cardText: {
    color: GlobalStyles.surfaceColors.text,

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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16,
    textAlign: "center",
    marginTop: 16,
    color: GlobalStyles.surfaceColors.secondary500,
  },
});

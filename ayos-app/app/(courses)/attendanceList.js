import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Card from "../../components/Card";
import { GlobalStyles } from "../../constants/styles";

const attendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);

  const params = useLocalSearchParams();
  const courseCode = params.courseCode;
  const courseWeek = params.courseWeek;

  const [studentInfo, setStudentInfo] = useState({});

  const formatDate = (inputDate) => {
    // Tarihi parçalara bölelim
    const parts = inputDate.split(".");

    // Günlük, ay ve yıl değerlerini alalım
    const day = parts[0];
    const month = parts[1];
    const year = parts[2];

    // Yeni bir tarih nesnesi oluşturalım
    const formattedDate = new Date(`${year}-${month}-${day}`);

    // ISO tarih formatına çevirelim
    const isoFormattedDate = formattedDate.toISOString().split("T")[0];

    return isoFormattedDate;
  };

  useEffect(() => {
    const apiUrl = "http://192.168.1.47:8000/attendanceList";
    const studentsInfoApiUrl = "http://192.168.1.47:8000/studentsInfo";

    const updatedWeek = formatDate(courseWeek);
    console.log(updatedWeek);
    axios
      .get(`http://192.168.1.47:8000/courseId?courseCode=${courseCode}`)
      .then((response) => {
        const data = response.data; // Use response.data directly

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
                const data = response.data; // Use response.data directly
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
                console.log(JSON.stringify(studentIds));
                // Retrieve student information based on student IDs
                axios
                  .get(
                    `${studentsInfoApiUrl}?studentIds=${studentIds.join(",")}`
                  )
                  .then((response) => {
                    const studentInfoMap = {};
                    const studentsInfo = response.data.studentsInfo;

                    studentsInfo.forEach((student, index) => {
                      studentInfoMap[student.studentNumber] = {
                        ...student,
                        attendance: attendances[index],
                      };
                    });

                    setStudentInfo(studentInfoMap);
                    console.log("buradaki ne", studentInfoMap);
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

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Attendance List for Week: {courseWeek}</Text>

      {Object.values(studentInfo).map((item, index) => (
        <Card key={index}>
          <Text style={styles.cardText}>StudentID: {item.studentNumber}</Text>
          <Text style={styles.cardText}>Name: {item.name}</Text>
          <Text style={styles.cardText}>Surname: {item.surname}</Text>
          <Text style={styles.cardText}>Email: {item.email}</Text>
          <Text style={styles.cardText}>
            Attendance: {item.attendance ? "Present" : "Absent"}
          </Text>
        </Card>
      ))}
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
  title: {
    fontSize: 18,
    fontWeight: "bold",
    marginBottom: 16, // Add some margin at the bottom for spacing
    textAlign: "center",
    marginTop: 16,
    color: GlobalStyles.surfaceColors.secondary500,
  },
});

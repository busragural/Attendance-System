import { ScrollView, StyleSheet, Text, TouchableOpacity, View } from "react-native";
import React, { useEffect, useState } from "react";
import { useLocalSearchParams, useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import Card from "../../components/Card";
import { GlobalStyles } from "../../constants/styles";
import { AntDesign } from "@expo/vector-icons";
import Loading from "../../components/Loading";
import * as Notifications from 'expo-notifications';

const attendanceList = () => {
  const [attendanceData, setAttendanceData] = useState([]);
  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;
  const params = useLocalSearchParams();
  const courseCode = params.courseCode;
  const courseWeek = params.courseWeek;
  console.log("couea", courseWeek);
  const router = useRouter();

  const [studentInfo, setStudentInfo] = useState({});
  const [studentInfo2, setStudentInfo2] = useState({});
  const [loading, setLoading] = useState(false);


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
    setLoading(true);
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
                    studentsInfo.forEach((student, index) => {
                      const studentId = studentIds[index];
                      const attendance = attendances[index];

                      studentInfoMap[studentId] = {
                        ...student,
                        attendance: attendance
                      };
                    });


                    setStudentInfo(studentInfoMap);
                    setLoading(false);
                  })
                  .catch((error) => {
                    console.error(
                      "Error fetching student information:",
                      error.message
                    );
                    setLoading(false);
                  });
              })
              .catch((error) => {
                console.error("Error fetching attendance list:", error.message);
                setLoading(false);
              });

          })


          .catch((error) => {
            console.error("Error getting token from AsyncStorage:", error);
            setLoading(false);
          });
      })
      .catch((error) => {
        console.error("Error fetching course ID:", error);
        setLoading(false);
      });


  }, [courseCode, courseWeek]);

  const goBackToCourses = () => {
    router.back();
  };




  const toggleAttendance = (studentId) => {
    const objectId = Object.keys(studentInfo).find(id => studentInfo[id].studentId === studentId);

    if (objectId) {
      const updatedAttendance = !studentInfo[objectId].attendance;
      const studentInfoCopy = { ...studentInfo };
      studentInfoCopy[objectId].attendance = updatedAttendance;

      setStudentInfo(studentInfoCopy);
      updateAttendanceOnServer(objectId, updatedAttendance, formatDate(courseWeek));
    } else {
      console.error("Student not found with ID:", studentId);
    }
  };

  const updateAttendanceOnServer = async (studentId, attendance, date) => {
    console.log("attendance ne olu", attendance)
    try {
      const token = await AsyncStorage.getItem("auth");
      await axios.post(`http://${ip_address}:8000/updateAttendance`, {
        studentId,
        courseCode,
        attendance,
        date
      }, {
        headers: {
          Authorization: `Bearer ${token}`
        }
      });
      console.log("Attendance updated successfully");


    } catch (error) {
      console.error("Error updating attendance:", error);
    }
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
      <Loading visible={loading} />
      {!loading && (
        <ScrollView contentContainerStyle={styles.contentContainer}>
          <View style={styles.cardContainer}>
            {attendanceData.length === 0 ? (
              <Card>
                <Text style={styles.cardText}>Kayıt bulunamadı.</Text>
              </Card>
            ) : (
              Object.values(studentInfo).map((item, index) => (
                <Card key={index} attendance={item.attendance ? 'attended' : 'notAttended'}>
                  <View style={styles.insideCard}>
                    <Text style={styles.cardText}>{item.studentId} - {item.name} {item.surname}</Text>
                    <TouchableOpacity onPress={() => toggleAttendance(item.studentId)} style={styles.attendanceButton}>
                      <AntDesign name={item.attendance ? 'checkcircle' : 'checkcircleo'} size={24} color="white" />
                    </TouchableOpacity>
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
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 20,
    paddingHorizontal: 10,
  },
  cardContainer: {
    marginBottom: 20,
  },
  cardText: {
    color: GlobalStyles.surfaceColors.text,
  },
  insideCard: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: 10,
    flex: 1
  },
  attendanceButton: {
    justifyContent: 'flex-end'
  }
});

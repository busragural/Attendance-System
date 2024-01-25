import { ScrollView, StyleSheet, Text, View } from "react-native";
import React, { useEffect, useState } from "react";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import { GlobalStyles } from "../../constants/styles";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

const courses = ({ navigate }) => {
  const routes = useRouter();
  const [userCourses, setUserCourses] = useState([]);

  useEffect(() => {
    // Kullanıcının derslerini çekme işlemi
    AsyncStorage.getItem("auth")
      .then((token) => {
        axios
          .get("http://192.168.1.58:8000/user/courses", {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          })
          .then((coursesResponse) => {
            const fetchedCourses = coursesResponse.data.courses;
            setUserCourses(fetchedCourses);
          })
          .catch((coursesError) => {
            console.error("Error fetching user courses:", coursesError.message);
          });
      })
      .catch((error) => {
        console.error("Error getting token from AsyncStorage:", error.message);
      });
  }, []);
  return (
    <ScrollView style={styles.lecturesContainer}>
      {userCourses.map((course) => (
        <Card key={course.code} style={styles.courseCard}>
          <Text style={styles.lecture}>{course.code}</Text>
          <Text style={styles.lecture}>{course.name}</Text>
          <View style={styles.buttonContainer}>
            <PrimaryButton
              onPress={() => {
                console.log("Navigating to courseDetail with course:", course);

                routes.push({
                  pathname: "/courseDetail",
                  params: {
                    courseName: course.name,
                    courseCode: course.code,
                    courseWeek: course.week,
                    courseStartDate: course.startDate
                  },
                });
              }}
            >
              <AntDesign
                name="arrowright"
                size={24}
                color="white"
                style={styles.icon}
              />
            </PrimaryButton>
          </View>
        </Card>
      ))}
    </ScrollView>
  );
};

export default courses;

const styles = StyleSheet.create({
  lecturesContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.surfaceColors.primary,
  },
  courseCard: {
    flexDirection: "row", // Kart içindeki elemanları yatay düzende sırala
    justifyContent: "space-between", // Elemanları kartın içinde eşit aralıklarla düzenle
    alignItems: "center", // Elemanları dikey ortala
    padding: 16,
  },
  lecture: {
    color: "white",
  },
  buttonContainer: {
    marginLeft: "auto",
  },
});

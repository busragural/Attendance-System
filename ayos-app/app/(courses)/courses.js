import {
  Alert,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import { GlobalStyles } from "../../constants/styles";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";

const courses = () => {
  const routes = useRouter();
  const [userCourses, setUserCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);


  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("auth");
        const coursesResponse = await axios.get("http://192.168.1.47:8000/user/courses", {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        });
        const fetchedCourses = coursesResponse.data.courses;
        setUserCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching user courses:", error.message);
      }
    };

    fetchData();
  }, []);

 
  const handleLogout = async () => {
    try {

      await AsyncStorage.removeItem("auth");
      routes.navigate("/login");
      Alert.alert("Başarılı", "Çıkış yapıldı.");
    } catch (error) {
      console.error("Error logging out:", error.message);
    }
  };
  const handleCardPress = (course) => {
    if (selectedCourse && selectedCourse.code === course.code) {
      // If the same card is pressed again, clear the selection
      setSelectedCourse(null);
    } else {
      // Set the selected course
      setSelectedCourse(course);
    }
  };

  const handleWeekInfoPress = () => {
    routes.push({
      pathname: "/courseDetail",
      params: {
        courseName: selectedCourse.name,
        courseCode: selectedCourse.code,
        courseWeek: selectedCourse.week,
        courseStartDate: selectedCourse.startDate,
      },
    });
  };

  const handleStatisticsPress = () => {
    routes.push({
      pathname: "/statistics",
      params: {
        // Pass any necessary parameters for the statistics page
        courseId: selectedCourse.id, // Example parameter, replace it with the actual parameter you need
      },
    });
  };

  return (
    <ScrollView style={styles.lecturesContainer}>
      <View style={styles.headerContainer}>
        <Text style={styles.headerText}>DERSLERİM</Text>
        <TouchableOpacity onPress={handleLogout}>
          <View style={styles.logoutIconView}>
            <AntDesign name="logout" size={30} style={styles.logoutIcon} />
          </View>
        </TouchableOpacity>
      </View>

      {userCourses.map((course) => (
        <TouchableOpacity key={course.code} onPress={() => handleCardPress(course)}>
          <Card style={styles.courseCard}>
            <Text style={styles.lecture}>{course.code.toUpperCase()}</Text>
            <Text style={styles.lecture}>{course.name.toUpperCase()}</Text>
          </Card>
          {selectedCourse && selectedCourse.code === course.code && (
            <View style={styles.optionsContainer}>
              <TouchableOpacity onPress={handleWeekInfoPress} style={styles.optionButton}>
                <Text style={styles.optionText}>Hafta Bilgisi</Text>
                <AntDesign name="arrowright" size={24} color="white" />
              </TouchableOpacity>
              <TouchableOpacity onPress={handleStatisticsPress} style={styles.optionButton}>
                <Text style={styles.optionText}>İstatistik</Text>
                <AntDesign name="arrowright" size={24} color="white" />
              </TouchableOpacity>
            </View>
          )}
        </TouchableOpacity>
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
    marginLeft: "auto", // Pushes the text to the left
    marginRight: "auto", 
  },
  logoutIconView: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },
  logoutIcon: {
    color: GlobalStyles.surfaceColors.primary,
  },
  courseCard: {
    flexDirection: "row", 
    justifyContent: "space-between", 
    alignItems: "center", 
    padding: 16,
  },
  lecture: {
    color: "white",
    fontSize: 16,
    marginVertical: 10,
  },
  buttonContainer: {
    marginLeft: "auto",
  },
  optionsContainer: {
    flexDirection: "column",
    padding: 16
  },
  optionButton: {
    padding: 16,
    marginTop: 2,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
    borderRadius: 8,
    shadowColor: "black",
    flexDirection: "row",
    justifyContent: "space-between"
  },
  optionText: {
    color: "white",
  },
});

import {
  Alert,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useEffect, useState } from "react";
import Card from "../../components/Card";
import PrimaryButton from "../../components/PrimaryButton";
import SecondaryButton from "../../components/SecondaryButton";
import { GlobalStyles } from "../../constants/styles";
import { useRouter } from "expo-router";
import axios from "axios";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { AntDesign } from "@expo/vector-icons";
import * as DocumentPicker from "expo-document-picker";




const courses = () => {
  const routes = useRouter();
  const [userCourses, setUserCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isAddCourseModalVisible, setAddCourseModalVisible] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseWeek, setNewCourseWeek] = useState("");
  const [newCourseStartDate, setNewCourseStartDate] = useState("");
  const [csvFileName, setCsvFileName] = useState(""); // State for CSV file name
  const [csvData, setCsvData] = useState(null);

  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;

  useEffect(() => {
    const fetchData = async () => {
      try {
        const token = await AsyncStorage.getItem("auth");
        const coursesResponse = await axios.get(
          `http://${ip_address}:8000/user/courses`,
          {
            headers: {
              Authorization: `Bearer ${token}`,
            },
          }
        );
        const fetchedCourses = coursesResponse.data.courses;
        setUserCourses(fetchedCourses);
      } catch (error) {
        console.error("Error fetching user courses:", error.message);
      }
    };

    fetchData();
  }, []);

  const handlePickCsv = () => {
    DocumentPicker.getDocumentAsync({ type: "text/csv" })
      .then((result) => {
        console.log("DocumentPicker result:", result);
        console.log(result.canceled);

        const asset = result.assets[0]; // assets dizisinin ilk öğesine erişim
        const { mimeType, name, uri } = asset; // asset öğesinden gerekli bilgileri al

        console.log("mimeType", mimeType);
        console.log("name", name);
        console.log("uri", uri);

        setCsvFileName(name);
        fetch(uri)
          .then(response => response.text())
          .then(fileData => {
            // CSV verilerini ayarla
            setCsvData(fileData);
            console.log("aq",fileData);
          })
          .catch(error => {
            console.error("Error reading file:", error);
          });
      })
      .catch((error) => {
        console.error("Error picking CSV file:", error.message);
      });
  };






  // Yeni ders ekleme fonksiyonu
  const handleAddCourse = async () => {
    try {
      if (
        !newCourseName ||
        !newCourseCode ||
        !newCourseStartDate ||
        !newCourseWeek
      ) {
        Alert.alert("Hata", "Bos alanlari doldurunuz.");
        return;
      }

      // Text inputlardan alınan değerleri gönderme işlemi
      const token = await AsyncStorage.getItem("auth");
      const addCourseResponse = await axios.post(
        `http://${ip_address}:8000/user/addCourse`,
        {
          name: newCourseName,
          code: newCourseCode,
          week: newCourseWeek,
          startDate: newCourseStartDate,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const newCourse = addCourseResponse.data.course;
      setUserCourses([...userCourses, newCourse]);

      console.log(userCourses);

      // CSV dosyasını gönderme işlemi
      if (csvData) {
        // formData oluştur
        console.log("Buraya girebildi mi");
        const formData = new FormData();
        formData.append("csvData", csvData); // CSV verisini formData'ya ekle
  
        // Axios ile uploadCsv endpointine POST isteği gönder
        const uploadCsvResponse = await axios.post(
          `http://${ip_address}:8000/uploadCsv`,
          {
            csvData: csvData, // CSV verisini gönder
            courseCode: newCourseCode
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );
  
        // uploadCsvResponse'dan gelen verileri kontrol et ve gerekli işlemleri yap
        console.log("CSV dosyası yüklendi:", uploadCsvResponse.data);
      }
      setAddCourseModalVisible(false);
    } catch (error) {
      console.error("Error adding new course:", error.message);
    }
  };



  const handleDeleteCourse = async (course) => {
    try {
      const confirmDelete = await new Promise((resolve) => {
        // Alert ile kullanıcıya silme işlemini onaylamasını sor
        Alert.alert(
          "Dersi Sil",
          `Dersi silmek istediğinizden emin misiniz?`,
          [
            {
              text: "İptal",
              onPress: () => resolve(false),
              style: "cancel",
            },
            {
              text: "Sil",
              onPress: () => resolve(true),
            },
          ],
          { cancelable: false }
        );
      });

      if (!confirmDelete) {
        // Kullanıcı silmeyi iptal etti
        return;
      }

      const token = await AsyncStorage.getItem("auth");
      await axios.delete(
        `http://${ip_address}:8000/user/deleteCourse/${course._id}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedCourses = userCourses.filter((c) => c._id !== course._id);
      setUserCourses(updatedCourses);

      setSelectedCourse(null);
    } catch (error) {
      console.error("Error deleting course:", error.message);
    }
  };



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
      setSelectedCourse(null);
    } else {
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
      pathname: "/courseStatistics",
      params: {
        courseCode: selectedCourse.code,
        courseStartDate: selectedCourse.startDate,
        courseWeek: selectedCourse.week,
      },
    });
  };

  return (
    <View style={styles.container}>
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
          <TouchableOpacity
            key={course.code}
            onPress={() => handleCardPress(course)}
          >
            <Card style={styles.courseCard}>
              <TouchableOpacity
                style={styles.deleteIconContainer}
                onPress={() => handleDeleteCourse(course)}
              >
                <AntDesign name="delete" size={28} color="white" />
              </TouchableOpacity>
              <Text style={styles.lecture}>{course.code.toUpperCase()}</Text>
              <Text style={styles.lecture}>{course.name.toUpperCase()}</Text>
            </Card>
            {selectedCourse && selectedCourse.code === course.code && (
              <View style={styles.optionsContainer}>
                <TouchableOpacity
                  onPress={handleWeekInfoPress}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>Hafta Bilgisi</Text>
                  <AntDesign name="arrowright" size={24} color="white" />
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={handleStatisticsPress}
                  style={styles.optionButton}
                >
                  <Text style={styles.optionText}>İstatistik</Text>
                  <AntDesign name="arrowright" size={24} color="white" />
                </TouchableOpacity>
              </View>
            )}
          </TouchableOpacity>
        ))}

        {/* Add Course Button */}
        <View style={styles.addButtonContainer}>
          <PrimaryButton
            style={styles.addButton}
            onPress={() => setAddCourseModalVisible(true)}
          >
            <AntDesign name="plus" size={24} color="white" />
          </PrimaryButton>
        </View>

        <Modal
          visible={isAddCourseModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddCourseModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <Text style={styles.modalHeaderText}>Yeni Ders Ekle</Text>
              <TextInput
                style={styles.input}
                placeholder="Ders Adı"
                placeholderTextColor="#999"
                onChangeText={(text) => setNewCourseName(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Ders Kodu"
                placeholderTextColor="#999"
                onChangeText={(text) => setNewCourseCode(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Hafta Sayısı"
                placeholderTextColor="#999"
                onChangeText={(text) => setNewCourseWeek(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Başlangıç Haftası"
                placeholderTextColor="#999"
                onChangeText={(text) => setNewCourseStartDate(text)}
              />



              {/* CSV dosyasını seçme butonu */}
              <TouchableOpacity onPress={handlePickCsv}>
                <Text style={styles.uploadButton}>CSV Dosyası Seç</Text>
              </TouchableOpacity>
              {/* Seçilen dosya adını gösterme */}
              {csvFileName !== "" && (
                <Text style={{ marginTop: 10 }}>
                  Seçilen CSV Dosyası: {csvFileName}
                </Text>
              )}

              <PrimaryButton onPress={handleAddCourse}>Onayla</PrimaryButton>

              <TouchableOpacity onPress={() => setAddCourseModalVisible(false)}>
                <Text style={styles.modalCloseText}>Kapat</Text>
              </TouchableOpacity>
            </View>
          </View>
        </Modal>
      </ScrollView>
    </View>
  );
};

export default courses;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    position: "relative",
  },
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
    marginLeft: "auto",
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
  deleteIconContainer: {
    position: "absolute",
    top: 8,
    right: 8,
    zIndex: 1,
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
    padding: 16,
  },
  optionButton: {
    padding: 16,
    marginTop: 2,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
    borderRadius: 8,
    shadowColor: "black",
    flexDirection: "row",
    justifyContent: "space-between",
  },
  optionText: {
    color: "white",
  },
  addButtonContainer: {
    margin: 16,
    alignSelf: "flex-end",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    width: "80%",
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
    elevation: 5,
  },
  modalHeaderText: {
    fontSize: 20,
    fontWeight: "bold",
    marginBottom: 10,
  },
  input: {
    height: 40,
    borderColor: "gray",
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
  },
  modalCloseText: {
    color: "blue",
    marginTop: 10,
    textAlign: "center",
  },
  uploadButton: {
    backgroundColor: '#007bff',
    color: 'white',
    padding: 10,
    borderRadius: 5,
    textAlign: 'center',
    marginTop: 10,
  },
});

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
import Loading from "../../components/Loading";
import DateTimePickerModal from "react-native-modal-datetime-picker";
import FAB from "../../components/FAB";




const courses = () => {
  const routes = useRouter();
  const [userCourses, setUserCourses] = useState([]);
  const [selectedCourse, setSelectedCourse] = useState(null);
  const [isAddCourseModalVisible, setAddCourseModalVisible] = useState(false);
  const [newCourseName, setNewCourseName] = useState("");
  const [newCourseCode, setNewCourseCode] = useState("");
  const [newCourseWeek, setNewCourseWeek] = useState("");
  const [newCourseLimit, setNewCourseLimit] = useState("");
  const [newCourseStartDate, setNewCourseStartDate] = useState("");
  const [csvFileName, setCsvFileName] = useState(""); // State for CSV file name
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);


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

  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0]; // Format the date as desired
    setSelectedDate(date);
    setNewCourseStartDate(formattedDate); // Set the formatted date
    hideDatePicker();
  };


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
            console.log("aaat", fileData);
          })
          .catch(error => {
            console.error("Error reading file:", error);
          });
      })
      .catch((error) => {
        console.error("Error picking CSV file:", error.message);
      });
  };


  const handleCardPress = (course) => {
    if (selectedCourse && selectedCourse.code === course.code) {
      setSelectedCourse(null);
    } else {
      setSelectedCourse(course);
    }
  };



  // Yeni ders ekleme fonksiyonu
  const handleAddCourse = async () => {
    try {
      if (
        !newCourseName ||
        !newCourseCode ||
        !newCourseStartDate ||
        !newCourseWeek ||
        !newCourseLimit
      ) {
        Alert.alert("Hata", "Boş alanları doldurunuz.");
        return;
      }
      setLoading(true);

      // Text inputlardan alınan değerleri gönderme işlemi
      const token = await AsyncStorage.getItem("auth");
      const addCourseResponse = await axios.post(
        `http://${ip_address}:8000/user/addCourse`,
        {
          name: newCourseName,
          code: newCourseCode,
          week: newCourseWeek,
          limit: newCourseLimit,
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
      setLoading(false);
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
    Alert.alert(
      "Çıkış Yap",
      "Çıkış yapmak istediğinizden emin misiniz?",
      [
        {
          text: "Hayır",
          onPress: () => console.log("Cancel Pressed"),
          style: "cancel",
        },
        {
          text: "Evet",
          onPress: async () => {
            try {
              await AsyncStorage.removeItem("auth");
              routes.navigate("/login");
            } catch (error) {
              console.error("Error logging out:", error.message);
            }
          }
        }
      ],
      { cancelable: false }
    );
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
        courseLimit: selectedCourse.limit
      },
    });
  };

  const handleSignatureDetailPress = () => {
    routes.push({
      pathname: "/signatureDetail",
      params: {
        courseCode: selectedCourse.code,
        courseStartDate: selectedCourse.startDate,
        courseWeek: selectedCourse.week,
      },
    });
  };


  const handleLimitBreachListPress = () => {
    routes.push({
      pathname: "/limitBreachList",
      params: {
        courseCode: selectedCourse.code,
      },
    });
  };

  const handleViewParticipants = (course) => {
    routes.push({
      pathname: "/courseParticipants",
      params: {
        courseCode: course.code,
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

        <ScrollView contentContainerStyle={styles.contentContainer} >

          {userCourses.map((course) => (
            <TouchableOpacity
              key={course.code}
              onPress={() => handleCardPress(course)}
            >
              <Card style={styles.courseCard} attendance="attended">

                <View style={styles.iconsContainer}>
                  <TouchableOpacity
                    style={styles.deleteIconContainer}
                    onPress={() => handleDeleteCourse(course)}
                  >
                    <AntDesign name="delete" size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    style={styles.viewIconContainer}
                    onPress={() => handleViewParticipants(course)}
                  >
                    <AntDesign name="eyeo" size={28} color="white" />
                  </TouchableOpacity>
                </View>
                <Text style={styles.lectureCode}>{course.code.toUpperCase()}</Text>
                <Text style={styles.lecture}>{course.name}</Text>
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
                  <TouchableOpacity
                    onPress={handleSignatureDetailPress}
                    style={styles.optionButton}
                  >
                    <Text style={styles.optionText}>İmza Benzerlikleri</Text>
                    <AntDesign name="arrowright" size={24} color="white" />
                  </TouchableOpacity>

                  <TouchableOpacity
                    onPress={handleLimitBreachListPress}
                    style={styles.optionButton}
                  >
                    <Text style={styles.optionText}>Devamsızlık</Text>
                    <AntDesign name="arrowright" size={24} color="white" />
                  </TouchableOpacity>


                </View>
              )}
            </TouchableOpacity>
          ))}
        </ScrollView>

        <Modal
          visible={isAddCourseModalVisible}
          animationType="slide"
          transparent={true}
          onRequestClose={() => setAddCourseModalVisible(false)}
        >
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity style={styles.closeButton} onPress={() => setAddCourseModalVisible(false)}>
                <AntDesign name="close" size={30} color={GlobalStyles.surfaceColors.dark} />
              </TouchableOpacity>
              <View style={styles.modalHeaderTextContainer}>
                <Text style={styles.modalHeaderText}>DERS EKLE</Text>
              </View>

              <TextInput
                style={styles.input}
                placeholder="Ders Adı"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                onChangeText={(text) => setNewCourseName(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Ders Kodu"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                onChangeText={(text) => setNewCourseCode(text)}
              />
              <TextInput
                style={styles.input}
                placeholder="Toplam Hafta Sayısı"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                keyboardType="numeric"
                onChangeText={(text) => setNewCourseWeek(text)}
              />

              <TextInput
                style={styles.input}
                placeholder="Devamsızlık Sınırı (Hafta Sayısı)"
                keyboardType="numeric"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                onChangeText={(text) => setNewCourseLimit(text)}
              />

              <View style={styles.datePickerContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Başlangıç Tarihi"
                  value={newCourseStartDate}
                  editable={false}
                  placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                  onPress={showDatePicker}
                />
                <TouchableOpacity style={styles.datePickerButton} onPress={showDatePicker}>
                  <Text style={styles.datePickerButtonText}>Seç</Text>
                </TouchableOpacity>
              </View>

              <DateTimePickerModal
                isVisible={isDatePickerVisible}
                mode="date"
                onConfirm={handleConfirm}
                onCancel={hideDatePicker}
                customStyles={{
                  datePicker: {
                    backgroundColor: "white",
                  },
                  datePickerText: {
                    color: "black",
                  },
                  dateInput: {
                    color: "black",
                  },
                  placeholderText: {
                    color: "black",
                  },
                  btnTextConfirm: {
                    color: "blue",
                  },
                  btnTextCancel: {
                    color: "red",
                  },
                }}
                themeVariant="light"
              />

              <View style={styles.datePickerContainer}>
                <TextInput
                  style={styles.input}
                  placeholder="Öğrenci Listesi (CSV)"
                  value={csvFileName}
                  editable={false}
                  placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                  onPress={handlePickCsv}
                />
                <TouchableOpacity style={styles.datePickerButton} onPress={handlePickCsv}>
                  <Text style={styles.datePickerButtonText}>Seç</Text>
                </TouchableOpacity>
              </View>
              <PrimaryButton onPress={handleAddCourse}>Onayla</PrimaryButton>
              <Loading visible={loading} />

            </View>
          </View>
        </Modal>
      </ScrollView>
      <FAB onPress={() => setAddCourseModalVisible(true)} />

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
  contentContainer: {
    flexGrow: 1,
    paddingVertical: 6,

  },
  courseCard: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    padding: 16,
  },
  iconsContainer:{
    position: "absolute",
    flexDirection: "row",
    top: 6,
    right: 6,
    gap: 6
  },
  deleteIconContainer: {
    zIndex: 1,
  },
  viewIconContainer: {
    zIndex: 1,
  },
  lecture: {
    color: GlobalStyles.surfaceColors.text,
    fontSize: 16,
    marginBottom: 10,
  },
  lectureCode: {
    color: GlobalStyles.surfaceColors.text,
    fontSize: 20,
    marginVertical: 10,
    fontWeight: "bold",
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
    borderRadius: 8,
    elevation: 8,
    shadowColor: "black",
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    shadowOpacity: 0.25,
    marginTop: 22,
  },
  modalContent: {
    width: "80%",
    backgroundColor: GlobalStyles.surfaceColors.primary,
    padding: 20,
    borderRadius: 10,
    elevation: 5,
    position: 'relative',
  },
  closeButton: {
    position: 'absolute',
    right: 10,
    top: 10,
  },
  modalHeaderTextContainer: {
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: 10,
  },
  modalHeaderText: {
    fontSize: 24,
    fontWeight: '800',
    textAlign: 'center',
    color: GlobalStyles.surfaceColors.dark,
    margin: 8,
  },
  input: {
    height: 40,
    borderColor: GlobalStyles.surfaceColors.secondary500,
    borderWidth: 1,
    marginBottom: 10,
    paddingLeft: 10,
    borderRadius: 8,
    flexGrow: 1,
  },
  modalCloseText: {
    color: "blue",
    marginTop: 10,
    textAlign: "center",
  },

  datePickerContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',


  },
  datePickerButton: {
    height: 40,
    paddingHorizontal: 20,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
    borderRadius: 8,
    marginLeft: 8,
    justifyContent: 'center',
    alignItems: 'center',
    textAlignVertical: 'center',
  },
  datePickerButtonText: {
    color: 'white',
    fontSize: 16,
    fontWeight: "700",
  },


});

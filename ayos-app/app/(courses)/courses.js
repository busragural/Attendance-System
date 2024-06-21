import {
  Alert,
  Modal,
  RefreshControl,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";
import React, { useCallback, useEffect, useState } from "react";
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
import Feather from '@expo/vector-icons/Feather';
import Ionicons from '@expo/vector-icons/Ionicons';

import MaterialIcons from '@expo/vector-icons/MaterialIcons';



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
  const [csvFileName, setCsvFileName] = useState("");
  const [csvData, setCsvData] = useState(null);
  const [loading, setLoading] = useState(false);
  const [isDatePickerVisible, setDatePickerVisible] = useState(false);
  const [selectedDate, setSelectedDate] = useState(null);
  const [selectedEditCourse, setSelectedEditCourse] = useState(null);
  const [isEditCourseModalVisible, setEditCourseModalVisible] = useState(false);
  const [refreshing, setRefreshing] = useState(false);


  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;


  const fetchData = useCallback(async () => {
    setRefreshing(true);
    try {
      const token = await AsyncStorage.getItem("auth");
      const response = await axios.get(`http://${ip_address}:8000/user/courses`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      setUserCourses(response.data.courses);
    } catch (error) {
      console.error("Error fetching user courses:", error);
    } finally {
      setRefreshing(false);
    }
  }, [ip_address]);

  useEffect(() => {
    fetchData();
  }, [fetchData]);

  const onRefresh = () => {
    fetchData();
  };


  const showDatePicker = () => {
    setDatePickerVisible(true);
  };

  const hideDatePicker = () => {
    setDatePickerVisible(false);
  };

  const handleConfirm = (date) => {
    const formattedDate = date.toISOString().split('T')[0];
    setSelectedDate(date);
    setNewCourseStartDate(formattedDate);
    hideDatePicker();
  };


  const handlePickCsv = () => {
    DocumentPicker.getDocumentAsync({ type: "text/csv" })
      .then((result) => {
        console.log("DocumentPicker result:", result);
        console.log(result.canceled);

        const asset = result.assets[0];
        const { mimeType, name, uri } = asset;

        console.log("mimeType", mimeType);
        console.log("name", name);
        console.log("uri", uri);

        setCsvFileName(name);
        fetch(uri)
          .then(response => response.text())
          .then(fileData => {
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

  const handleAddCourse = async () => {
    try {
      if (
        !newCourseName ||
        !newCourseCode ||
        !newCourseStartDate ||
        !newCourseWeek ||
        !newCourseLimit ||
        !csvFileName
      ) {
        Alert.alert("Hata", "Boş alanları doldurunuz.");
        return;
      }
      setLoading(true);

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


      if (csvData) {

        const formData = new FormData();
        formData.append("csvData", csvData);

        const uploadCsvResponse = await axios.post(
          `http://${ip_address}:8000/uploadCsv`,
          {
            csvData: csvData,
            courseCode: newCourseCode
          },
          {
            headers: {
              "Content-Type": "application/json",
              Authorization: `Bearer ${token}`,
            },
          }
        );

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
        courseCode: selectedCourse.code,
      },
    });
  };

  const openEditCourseModal = (course) => {
    setSelectedEditCourse(course);
    setNewCourseLimit(course.limit);
    setEditCourseModalVisible(true);
  };

  const handleUpdateCourse = async () => {
    try {
      if (!newCourseLimit) {
        Alert.alert("Hata", "Devamsızlık sınırını giriniz.");
        return;
      }
      setLoading(true);

      const token = await AsyncStorage.getItem("auth");
      const response = await axios.post(
        `http://${ip_address}:8000/user/updateCourse`,
        {
          code: selectedEditCourse.code,
          limit: newCourseLimit,
        },
        {
          headers: {
            Authorization: `Bearer ${token}`,
          },
        }
      );

      const updatedCourse = response.data.course;
      const updatedCourses = userCourses.map((course) =>
        course._id === updatedCourse._id ? updatedCourse : course
      );

      setUserCourses(updatedCourses);
      setLoading(false);
      setEditCourseModalVisible(false);
    } catch (error) {
      console.error("Error updating course:", error.message);
    }
  };

  return (
    <View style={styles.container}
    // refreshControl={
    //   <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
    // }
    >
      <ScrollView style={styles.lecturesContainer}>
        <View style={styles.headerContainer}>
          <Text style={styles.headerText}>DERSLERİM</Text>
          <TouchableOpacity onPress={handleLogout}>
            <View style={styles.logoutIconView}>
              <AntDesign name="logout" size={30} style={styles.logoutIcon} />
            </View>
          </TouchableOpacity>
        </View>

        <ScrollView contentContainerStyle={styles.contentContainer}>
          {userCourses.length === 0 ? (
            <Card style={styles.courseCard}>
              <Text style={styles.optionText}>Kayıt bulunamadı. Aşağıdaki butona tıklayarak yeni ders ekle! </Text>
            </Card>
          ) : (
            userCourses.map((course) => (
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
                      <MaterialIcons name="delete-outline" size={28} color="white" />
                    </TouchableOpacity>
                    <TouchableOpacity
                      style={styles.viewIconContainer}
                      onPress={() => openEditCourseModal(course)}
                    >
                      <Feather name="edit-2" size={24} color="white" />
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
                    <TouchableOpacity
                      onPress={handleViewParticipants}
                      style={styles.optionButton}
                    >
                      <Text style={styles.optionText}>Öğrenci Listesi</Text>
                      <AntDesign name="arrowright" size={24} color="white" />
                    </TouchableOpacity>
                  </View>
                )}
              </TouchableOpacity>
            ))
          )}
        </ScrollView>

        <Modal visible={isEditCourseModalVisible} animationType="slide" transparent={true}>
          <View style={styles.modalContainer}>
            <View style={styles.modalContent}>
              <TouchableOpacity
                onPress={() => setEditCourseModalVisible(false)}
                style={styles.closeButton}
              >
                <Ionicons name="close" size={30} color="black" />
              </TouchableOpacity>
              <View style={styles.modalHeaderTextContainer}>
                <Text style={styles.modalHeaderText}>DEVAMSIZLIK SINIRI</Text>
              </View>
              <TextInput
                placeholder="Mevcut Devamsızlık Sınırı"
                value={selectedEditCourse ? `Mevcut Sınır: ${selectedEditCourse.limit} hafta` : ""}
                editable={false}
                style={styles.input}
              />
              <TextInput
                placeholder="Yeni Devamsızlık Sınırı"
                placeholderTextColor={GlobalStyles.surfaceColors.placeholder}
                value={newCourseLimit}
                onChangeText={setNewCourseLimit}
                style={styles.input}
                keyboardType="numeric"
              />
              <PrimaryButton onPress={handleUpdateCourse}>Güncelle</PrimaryButton>
              <Loading visible={loading} />
            </View>
          </View>
        </Modal>


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
  iconsContainer: {
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

import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
  RefreshControl
} from "react-native";
import React, { useEffect, useState } from "react";

import { GlobalStyles } from "../../constants/styles";
import { AntDesign } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";
import WeekCard from "../../components/WeekCard";
import ImageModal from "../../components/ImageModal";
import * as ImageManipulator from 'expo-image-manipulator';
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Notifications from 'expo-notifications';
import { DeviceMotion } from 'expo-sensors';
import Loading from "../../components/Loading";
import axios from "axios";



const courseDetail = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startWeek, setStartWeek] = useState(null);
  const [endWeek, setEndWeek] = useState(null);
  const [imageResults, setImageResults] = useState([]);
  const [loading, setLoading] = useState(false);
  const [firstHalfSelected, setFirstHalfSelected] = useState(false);
  const [secondHalfSelected, setSecondHalfSelected] = useState(false);
  const [deviceOrientation, setDeviceOrientation] = useState('portrait');
  const [weeklyAttendanceSummary, setWeeklyAttendanceSummary] = useState([]);



  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseName = params.courseName;
  const courseCode = params.courseCode;
  const courseWeek = parseInt(params.courseWeek, 10); // Assuming courseWeek is provided as a string
  const courseStartDate = params.courseStartDate;
  const [refreshing, setRefreshing] = useState(false);

  useEffect(() => {
    const getNotificationPermissions = async () => {
      const { status } = await Notifications.requestPermissionsAsync();
      if (status !== 'granted') {
        alert('You need to enable notifications to use this feature.');
      }
    };

    getNotificationPermissions();

    const subscription = Notifications.addNotificationResponseReceivedListener(handleNotificationResponse);
    return () => subscription.remove();


  }, []);

  useEffect(() => {
    DeviceMotion.addListener(motionData => {
      const { alpha, beta, gamma } = motionData.rotation;

      // alpha: dönüş açısı, beta: ön-arka eğim, gamma: yan eğim
      if (gamma > 45) {
        setDeviceOrientation('right');
      } else if (gamma < -45) {
        setDeviceOrientation('left');
      } else if (beta > 45) {
        setDeviceOrientation('upsideDown');
      } else {
        setDeviceOrientation('portrait');
      }
    });

    return () => {
      DeviceMotion.removeAllListeners();
    };
  }, []);

  useEffect(() => {
    fetchWeeklyAttendanceSummary(false); // İlk yüklemede refreshing olmasın
  }, [courseCode]);

  const fetchWeeklyAttendanceSummary = async (isRefreshing) => {
    if (isRefreshing) {
      setRefreshing(true); // Sadece swipe yapıldığında refreshing aktif edilir
    } else {
      setLoading(true); // İlk yüklemelerde loading kullanılır
    }
    try {
      const response = await axios.get(`http://${ip_address}:8000/course/weeklyAttendanceSummary?courseCode=${courseCode}`);
      if (response.data && response.data.weeklyAttendanceSummary) {
        setWeeklyAttendanceSummary(response.data.weeklyAttendanceSummary);
      } else {
        setWeeklyAttendanceSummary([]);
      }
    } catch (error) {
      console.error("Error fetching weekly attendance summary:", error);
    } finally {
      if (isRefreshing) {
        setRefreshing(false); // Refreshing durumu sonlandır
      } else {
        setLoading(false); // Loading durumu sonlandır
      }
    }
  };

  const onRefresh = () => {
    fetchWeeklyAttendanceSummary(true); // Swipe refresh için true gönder
  };

  const goBackToCourses = () => {
    router.back();
  };

  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your camera!");
      return;
    }

    const options = {
      title: "Select Photo",
      storageOptions: {
        skipBackup: true,
        path: "images",
      },
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [15, 11],

    };
    const result = await ImagePicker.launchCameraAsync(options);
    console.log(result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      const selectedImageUri = selectedImage.uri;

      // Fotoğrafı dinamik olarak döndürme
      let rotation = 0;
      if (deviceOrientation === 'right') {
        rotation = -90;
      } else if (deviceOrientation === 'left') {
        rotation = 90;
      } else if (deviceOrientation === 'upsideDown') {
        rotation = 180;
      }
      console.log("orie", deviceOrientation);


      if (!selectedImageUri.endsWith('.jpg')) {
        // If the image is not in JPEG format, manipulate it to convert to JPEG
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ rotate: rotation }],
          // Resize action instead of format
          { compress: 1, format: ImageManipulator.SaveFormat.JPEG } // Adjust compress factor if needed
        );
        setSelectedImages((prevImages) => [...prevImages, manipResult.uri]);
        //setSelectedImages([manipResult.uri]);
        console.log("Selected Image:", manipResult.uri);

      } else {
        setSelectedImages((prevImages) => [...prevImages, selectedImageUri]);
        console.log("Selected Images:", selectedImages);
      }
    }
  };


  const openGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your gallery!");
      return;
    }

    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 1,
      allowsMultipleSelection: true,
      maxFiles: 6,
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);
    console.log(result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      result.assets.forEach(async (selectedImage) => {
        if (selectedImage.uri.endsWith('.jpeg') || selectedImage.uri.endsWith('.jpg')) { // jpeg yap
          const manipResult = await ImageManipulator.manipulateAsync(
            selectedImage.uri,
            [{ resize: { width: selectedImage.width, height: selectedImage.height } }],
            { compress: 1, base64: false }
          );
          setSelectedImages((prevImages) => [...prevImages, manipResult.uri]);
        } else {
          alert("Please select JPEG images only.");
        }
      });
    }
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToRemove)
    );
  };


  const calculateWeekDates = (startDate, numberOfWeeks) => {
    const dates = [];
    let date = new Date(startDate);
    for (let i = 0; i < numberOfWeeks; i++) {
      dates.push(new Date(date).toLocaleDateString('tr-TR'));
      date.setDate(date.getDate() + 7);
    }
    return dates;
  };

  const weekDates = calculateWeekDates(courseStartDate, courseWeek);


  const toggleFirstHalf = () => {
    setFirstHalfSelected(true);
    setSecondHalfSelected(false);
  };

  const toggleSecondHalf = () => {
    setFirstHalfSelected(false);
    setSecondHalfSelected(true);
  };

  const renderWeekSelectionButtons = () => {
    const totalWeeks = calculateWeekDates();
    const middleIndex = Math.floor(totalWeeks.length / 2);

    return (
      <View style={styles.weekSelectionContainer}>
        <TouchableOpacity
          style={firstHalfSelected ? styles.selectedButton : styles.button}
          onPress={toggleFirstHalf}
        >
          <Text style={firstHalfSelected ? styles.selectedButtonText : styles.buttonText}>İlk yarı</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={secondHalfSelected ? styles.selectedButton : styles.button}
          onPress={toggleSecondHalf}
        >
          <Text style={secondHalfSelected ? styles.selectedButtonText : styles.buttonText}>Son yarı</Text>
        </TouchableOpacity>
      </View>
    );
  };


  const sendSignatureToServer = async (signatureData) => {
    const semesterHalf = firstHalfSelected ? "firstHalf" : "secondHalf";

    try {
      const response = await fetch(`http://${ip_address}:8000/addSignatures`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({ signatureData, courseCode, semesterHalf, courseWeek })
      });
      const responseData = await response.json();
      console.log('Server Response:', responseData);
    } catch (error) {
      console.error('Error sending data to the server:', error);
    }
  };


  async function sendNotification() {
    await Notifications.scheduleNotificationAsync({
      content: {
        title: "Yoklama Bilgisi Güncellendi",
        body: "Devamsızlık sınırını aşan öğrencileri inceleyin.",
        data: { screen: 'LimitBreachesScreen' }, // Ekstra bilgi gönderebilirsiniz
      },
      trigger: null, // Hemen gönderir
    });
  }

  async function handleNotificationResponse(response) {
    console.log("notif", response);

    // Bildirim tıklandığında yönlendirme
    router.push({
      pathname: "/limitBreachList",
      params: {
        courseCode: courseCode,
      },
    });
  }

  const sendImagesToServer = async () => {
    const formData = new FormData();
    selectedImages.forEach((image, index) => {
      const imageName = `image_${index + 1}.jpeg`;
      formData.append(imageName, {
        uri: image,
        name: imageName,
        type: "image/png",
      });
    });

    const semesterHalf = firstHalfSelected ? "firstHalf" : "secondHalf";

    const attendanceData = {};

    try {
      const response = await fetch(`http://${ip_address}:5001/upload-images`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        const responseData = await response.json();
        console.log(responseData);

        sendSignatureToServer(responseData);

        for (const studentNumber in responseData) {
          const studentData = responseData[studentNumber];
          for (const studentNumber in studentData) {
            const student = studentData[studentNumber];
            attendanceData[studentNumber] = student.attendance;
          }
        }

        console.log("ne gidiyor ", attendanceData);

        const token = await AsyncStorage.getItem('auth');

        // Token'i kontrol et
        if (token === null) {
          console.log('Token not found in AsyncStorage');
          return;
        }

        const updateResponse = await fetch(`http://${ip_address}:8000/addAttendance`, {
          method: "POST",
          headers: {
            "Content-Type": "application/json",
            Authorization: `Bearer ${token}`,
          },
          body: JSON.stringify({
            courseCode: courseCode,
            attendanceData: attendanceData,
            semesterHalf: semesterHalf,
          }),
        });

        if (updateResponse.ok) {
          console.log(`Attendance updated successfully for all students`);
          await sendNotification();

        } else {
          console.log(`Failed to update attendance for all students`);
        }
      } else {
        console.log("Failed to send images to server");
      }
    } catch (error) {
      console.error("Error sending images to server:", error.message);
    }
  };


  const formatDate = (dateStr) => {
    const parts = dateStr.split('.');
    return `${parts[2]}-${parts[1].padStart(2, '0')}-${parts[0].padStart(2, '0')}`;
  };

  const weekDatesFormatted = weekDates.map(date => formatDate(date));

  return (
    <ScrollView style={styles.lecturesContainer}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }>
      <View style={styles.headerContainer}>
        <TouchableOpacity onPress={goBackToCourses}>
          <View style={styles.backIconView}>
            <AntDesign name="arrowleft" size={30} color="white" />
          </View>
        </TouchableOpacity>
        <Text style={styles.headerText}>HAFTALAR</Text>
        <TouchableOpacity onPress={toggleModal}>
          <View style={styles.camIconView}>
            <AntDesign name="camera" size={30} style={styles.camIcon} />
          </View>
        </TouchableOpacity>
      </View>
      <Loading visible={loading} />
      {!loading && weekDatesFormatted.map((weekDateFormatted, index) => {
        const attendance = weeklyAttendanceSummary.find(w => w._id === weekDateFormatted);
        return (
          <View style={styles.weekCardContainer} key={index}>
            <WeekCard

              weekDate={weekDates[index]} // Gösterim için orijinal formatı kullanın
              attendedCount={attendance ? attendance.attendedCount : 0}
              notAttendedCount={attendance ? attendance.notAttendedCount : 0}
              onPress={() =>
                router.push({
                  pathname: "/attendanceList",
                  params: {
                    courseCode: courseCode,
                    courseWeek: weekDates[index] // Rota parametresi için de orijinal tarih formatını kullanın
                  },
                })
              }
            />
          </View>
        );
      })}
      <ImageModal
        isModalVisible={isModalVisible}
        toggleModal={toggleModal}
        openCamera={openCamera}
        openGallery={openGallery}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        removeImage={removeImage}
        firstHalfSelected={firstHalfSelected}
        secondHalfSelected={secondHalfSelected}
        renderWeekPicker={renderWeekSelectionButtons}
        sendImagesToServer={sendImagesToServer}
        calculateWeekDates={calculateWeekDates}
      />
    </ScrollView>
  );
};

export default courseDetail;

const styles = StyleSheet.create({
  lecturesContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.surfaceColors.primary,
   
  },

  headerContainer: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 18,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
    
  },
  headerText: {
    color: GlobalStyles.surfaceColors.primary,
    fontSize: 24,
    fontWeight: "bold",
  },
  camIconView: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
  },

  camIcon: {
    color: GlobalStyles.surfaceColors.primary,
  },

  modalText: {
    fontSize: 15,
    marginBottom: 10,
    textAlign: "center",
  },

  selectedImageText: {
    fontSize: 12,
    marginTop: 10,
  },
  weekCardContainer: {
    flex: 1,
    paddingBottom: 4
  },

  weekPickerContainer: {
    marginTop: 10,
  },

  iosPickerItemText: {
    fontSize: 8,
  },
  datePickerContainer: {
    borderWidth: 1,
    borderRadius: 5,
    borderColor: GlobalStyles.surfaceColors.secondaryRed,
    overflow: "hidden",
    marginBottom: 10,
  },

  placeholderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  placeholderImage: {
    width: 100,
    height: 100,
    backgroundColor: GlobalStyles.surfaceColors.gray,
    margin: 5,
  },
  weekSelectionContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingVertical: 10,
    //paddingHorizontal: 20,  
  },
  button: {
    flex: 1,  // Butonların esnekliğini ayarla
    borderWidth: 1,
    borderColor: GlobalStyles.surfaceColors.secondary500,
    borderRadius: 10,
    padding: 10,
    backgroundColor: 'white',
    color: GlobalStyles.surfaceColors.dark,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  selectedButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: GlobalStyles.surfaceColors.secondary500,
    borderRadius: 5,
    padding: 10,
    backgroundColor: GlobalStyles.surfaceColors.secondary500,
    marginHorizontal: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  buttonText: {
    fontSize: 16,
    fontWeight: "500",
    color: GlobalStyles.surfaceColors.dark,
  },
  selectedButtonText: {
    fontSize: 16,
    fontWeight: "500",
    color: GlobalStyles.surfaceColors.text,
  },
});

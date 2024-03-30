import {
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
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

const courseDetail = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [startWeek, setStartWeek] = useState(null);
  const [endWeek, setEndWeek] = useState(null);
  const ip_address = process.env.EXPO_PUBLIC_BASE_IP;
  const router = useRouter();
  const params = useLocalSearchParams();
  const courseName = params.courseName;
  const courseCode = params.courseCode;
  const courseWeek = params.courseWeek;
  const courseStartDate = params.courseStartDate;

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
    };
    const result = await ImagePicker.launchCameraAsync(options);
    console.log(result);
  
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets[0];
      const selectedImageUri = selectedImage.uri;
      
      if (!selectedImageUri.endsWith('.jpg')) {
        // If the image is not in JPEG format, manipulate it to convert to JPEG
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: selectedImage.width, height: selectedImage.height } }], // Resize action instead of format
          { compress: 1, base64: false } // Adjust compress factor if needed
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
      allowsEditing: true,
      quality: 1,
      multiple: true,
      maxFiles: 6,
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);
    console.log(result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImage = result.assets.find(asset => asset.uri.endsWith('.jpg')); // Find the first JPEG image
      if (selectedImage) {
        const manipResult = await ImageManipulator.manipulateAsync(
          selectedImage.uri,
          [{ resize: { width: selectedImage.width, height: selectedImage.height } }], // Resize action instead of format
          { compress: 1, base64: false } // Adjust compress factor if needed
        );
        setSelectedImages((prevImages) => [...prevImages, manipResult.uri]);
        //setSelectedImages([manipResult.uri]);
        console.log("Selected Image:", manipResult.uri);
      } else {
        alert("Please select a JPEG image.");
      }
    }
  };

  const removeImage = (indexToRemove) => {
    setSelectedImages((prevImages) =>
      prevImages.filter((_, index) => index !== indexToRemove)
    );
  };

  const calculateWeekDates = () => {
    const weekDates = [];
    const startDate = new Date(courseStartDate);

    for (let i = 0; i < courseWeek; i++) {
      const weekStartDate = new Date(
        startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
      );
      const formattedWeekDate = weekStartDate.toLocaleDateString("tr-TR"); // Use "tr-TR" for Turkish locale
      weekDates.push(formattedWeekDate);
    }

    return weekDates;
  };

  const handleStartWeekSelection = (week) => {
    setStartWeek(week === "null" ? null : week);
  };

  const handleEndWeekSelection = (week) => {
    setEndWeek(week === "null" ? null : week);
  };

  const renderWeekPicker = () => {
    const weeks = calculateWeekDates();
    const pickerItemTextStyle =
      Platform.OS === "ios"
        ? styles.iosPickerItemText
        : styles.androidPickerItemText;

    return (
      <View style={styles.weekPickerContainer}>
        <View style={styles.datePickerContainer}>
          <Picker
            selectedValue={startWeek}
            onValueChange={(itemValue) => handleStartWeekSelection(itemValue)}
          >
            <Picker.Item label="Başlangıç Haftası" value="null" />
            {weeks.map((weekDate, index) => (
              <Picker.Item
                key={index}
                label={`Hafta ${index + 1}`}
                value={weekDate}
                style={pickerItemTextStyle}
              />
            ))}
          </Picker>
        </View>

        <View style={styles.datePickerContainer}>
          <Picker
            selectedValue={endWeek}
            onValueChange={(itemValue) => handleEndWeekSelection(itemValue)}
          >
            <Picker.Item label="Bitiş Haftası" value="null" />
            {weeks.map((weekDate, index) => (
              <Picker.Item
                key={index}
                label={`Hafta ${index + 1}`}
                value={weekDate}
                style={pickerItemTextStyle}
              />
            ))}
          </Picker>
        </View>
      </View>
    );
  };

  const sendImagesToServer = async () => {
    const formData = new FormData();
    selectedImages.forEach((image, index) => {
      const imageName = `image_${index + 1}`;
      formData.append(imageName, {
        uri: image,
        name: imageName,
        type: "image/png", 
      });
    });

    try {
      const response = await fetch(`http://${ip_address}:5000/upload-images`, {
        method: "POST",
        body: formData,
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      if (response.ok) {
        const responseData = await response.text();
        console.log(responseData);
      } else {
        console.log("Failed to send images to server");
      }
    } catch (error) {
      console.error("Error sending images to server:", error.message);
    }
  };
  return (
    <ScrollView style={styles.lecturesContainer}>
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
      {calculateWeekDates().map((weekDate, index) => (
        <WeekCard
          key={index}
          weekDate={weekDate}
          onPress={() =>
            router.push({
              pathname: "/attendanceList",
              params: {
                courseCode: courseCode,
                courseWeek: weekDate,
              },
            })
          }
        />
      ))}
      <ImageModal
        isModalVisible={isModalVisible}
        toggleModal={toggleModal}
        openCamera={openCamera}
        openGallery={openGallery}
        selectedImages={selectedImages}
        setSelectedImages={setSelectedImages}
        removeImage={removeImage}
        startWeek={startWeek}
        endWeek={endWeek}
        renderWeekPicker={renderWeekPicker}
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
});

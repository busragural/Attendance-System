import {
  FlatList,
  Image,
  Modal,
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
import { AntDesign } from "@expo/vector-icons";
import SecondaryButton from "../../components/SecondaryButton";
import * as ImagePicker from "expo-image-picker";
import { useLocalSearchParams, useRouter } from "expo-router";
import { Picker } from "@react-native-picker/picker";

const courseDetail = () => {
  const [isModalVisible, setModalVisible] = useState(false);
  const [selectedImages, setSelectedImages] = useState([]);
  const [selectedWeeks, setSelectedWeeks] = useState([]);

  const route = useRouter();
  const params = useLocalSearchParams();

  const courseName = params.courseName;
  const courseCode = params.courseCode;
  const courseWeek = params.courseWeek;
  const courseStartDate = params.courseStartDate;
  const [startWeek, setStartWeek] = useState(null);
  const [endWeek, setEndWeek] = useState(null);

  const handleStartWeekSelection = (week) => {
    setStartWeek(week);
  };

  const handleEndWeekSelection = (week) => {
    setEndWeek(week);
  };
  const renderWeekPicker = () => {
    const weeks = calculateWeekDates();

    return (
      <View style={styles.weekPickerContainer}>
        <Picker
          selectedValue={startWeek}
          onValueChange={(itemValue) => handleStartWeekSelection(itemValue)}
        >
          <Picker.Item label="Select Start Week" value={null} />
          {weeks.map((weekDate, index) => (
            <Picker.Item
              key={index}
              label={`Hafta ${index + 1}`}
              value={weekDate}
            />
          ))}
        </Picker>

        <Picker
          selectedValue={endWeek}
          onValueChange={(itemValue) => handleEndWeekSelection(itemValue)}
        >
          <Picker.Item label="Select End Week" value={null} />
          {weeks.map((weekDate, index) => (
            <Picker.Item
              key={index}
              label={`Hafta ${index + 1}`}
              value={weekDate}
            />
          ))}
        </Picker>
      </View>
    );
  };
  const toggleModal = () => {
    setModalVisible(!isModalVisible);
  };

  const openCamera = async () => {
    const permissionResult = await ImagePicker.requestCameraPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this appp to access your camera!");
      return;
    }

    const options = {
      title: "Select Photo",
      storageOptions: {
        skipBackup: true,
        path: "images",
      },
    };
    const result = await ImagePicker.launchCameraAsync(options);
    console.log(result);
    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUri = result.assets[0].uri;
      setSelectedImages((prevImages) => [...prevImages, selectedImageUri]);
      console.log("Selected Images:", selectedImages);
    }
  };
  const openGallery = async () => {
    const permissionResult =
      await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (permissionResult.granted === false) {
      alert("You've refused to allow this app to access your gallery!");
      return;
    }
    let continuePicking = true;
    const selectedImageUris = [];

    
    const options = {
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 1,
      multiple: true, // Allow multiple selection
      maxFiles: 6, // Maximum 6 files
    };

    const result = await ImagePicker.launchImageLibraryAsync(options);
    console.log(result);

    if (!result.canceled && result.assets && result.assets.length > 0) {
      const selectedImageUris = result.assets.map((asset) => asset.uri);
      setSelectedImages((prevImages) => [...prevImages, ...selectedImageUris]);
      console.log("Selected Images:", selectedImages);
    }
  };

  const calculateWeekDates = () => {
    const weekDates = [];
    const startDate = new Date(courseStartDate);

    for (let i = 0; i < courseWeek; i++) {
      const weekStartDate = new Date(
        startDate.getTime() + i * 7 * 24 * 60 * 60 * 1000
      );
      weekDates.push(weekStartDate.toLocaleDateString()); // Burada tarih formatını isteğinize göre ayarlayabilirsiniz
    }

    return weekDates;
  };

  return (
    <ScrollView style={styles.lecturesContainer}>
      <TouchableOpacity onPress={toggleModal}>
        <View style={styles.camIconView}>
          <AntDesign name="camera" size={36} style={styles.camIcon} />
        </View>
      </TouchableOpacity>
      {calculateWeekDates().map((weekDate, index) => (
        <Card style={styles.courseCard}>
          <Text key={index} style={styles.lecture}>{`${
            index + 1
          }. Hafta: ${weekDate}`}</Text>
          <View style={styles.buttonContainer}>
            <PrimaryButton>Katılım Listesi</PrimaryButton>
          </View>
        </Card>
      ))}
      <Modal
        animationType="slide"
        transparent={true}
        visible={isModalVisible}
        onRequestClose={toggleModal}
      >
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <Text style={styles.modalText}>Görsel Ekle</Text>
            <SecondaryButton onPress={openCamera}>Fotoğraf Çek</SecondaryButton>
            <SecondaryButton onPress={openGallery}>
              Galeriden Seç
            </SecondaryButton>

            {/* Use fixed width and height for the container */}
            <View style={styles.imageContainer}>
              <FlatList
                data={selectedImages}
                keyExtractor={(item, index) => index.toString()}
                renderItem={({ item }) => (
                  <Image
                    source={{ uri: item }}
                    style={{ width: 100, height: 100, margin: 5 }}
                  />
                )}
                horizontal={true}
              />
            </View>

           
              <Text style={styles.weekPickerToggleText}>
                {startWeek
                  ? `Başlangıç Haftası: ${startWeek}`
                  : "Başlangıç Haftası Seç"}
              </Text>
              <Text style={styles.weekPickerToggleText}>
                {endWeek ? `Bitiş Haftası: ${endWeek}` : "Bitiş Haftası Seç"}
              </Text>
            
            {renderWeekPicker()}

            <TouchableOpacity
              onPress={() => {
                // Check if both start and end weeks are selected
                if (startWeek && endWeek) {
                  console.log("Selected Start Week:", startWeek);
                  console.log("Selected End Week:", endWeek);
                  setSelectedImages([]);
                  toggleModal();
                } else {
                  alert("Please select both start and end weeks.");
                }
              }}
            >
              <Text style={styles.closeButton}>Gönder</Text>
            </TouchableOpacity>
          </View>
        </View>
      </Modal>
    </ScrollView>
  );
};

export default courseDetail;

const styles = StyleSheet.create({
  lecturesContainer: {
    flex: 1,
    backgroundColor: GlobalStyles.surfaceColors.primary,
  },
  lecture: {
    color: "white",
  },
  camIconView: {
    alignItems: "flex-end",
    justifyContent: "flex-end",
    margin: 16,
  },
  imageContainer: {
    width: 300, // Set your desired fixed width
    height: 100, // Set your desired fixed height
  },
  camIcon: {
    color: "black",
  },
  buttonContainer: {
    marginLeft: "auto",
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: "white",
    padding: 20,
    borderRadius: 10,
  },
  modalText: {
    fontSize: 15,
    marginBottom: 10,
  },
  selectedImageText: {
    fontSize: 12,
    marginTop: 10,
  },
  closeButton: {
    color: "blue",
    textAlign: "center",
    marginTop: 10,
  },
  weekPickerContainer: {
    marginTop: 10,
  },
  weekPickerToggleText: {
    fontSize: 15,
    marginBottom: 10,
    color: "blue",
  },
});

import React from "react";
import {
    Alert,
  FlatList,
  Image,
  Modal,
  ScrollView,
  StyleSheet,
  Text,
  TouchableOpacity,
  View,
} from "react-native";
import { AntDesign } from "@expo/vector-icons";
import { BlurView } from "expo-blur";
import { GlobalStyles } from "../constants/styles"
import PrimaryButton from "./PrimaryButton";
import SecondaryButton from "./SecondaryButton";

const ImageModal = ({
  isModalVisible,
  toggleModal,
  openCamera,
  openGallery,
  selectedImages,
  setSelectedImages,
  removeImage,
  startWeek,
  endWeek,
  renderWeekPicker,
  sendImagesToServer,
  calculateWeekDates

}) => {
  return (
    <Modal
      animationType="slide"
      transparent={true}
      visible={isModalVisible}
      onRequestClose={toggleModal}
    >
      <BlurView intensity={100} tint="dark" style={styles.blurContainer}>
        <View style={styles.modalContainer}>
          <View style={styles.modalContent}>
            <PrimaryButton onPress={openCamera}>Fotoğraf Çek</PrimaryButton>
            <SecondaryButton onPress={openGallery}>
              Galeriden Seç
            </SecondaryButton>

            <View style={styles.imageContainer}>
              {selectedImages.length > 0 ? (
                <FlatList
                  data={selectedImages}
                  keyExtractor={(item, index) => index.toString()}
                  renderItem={({ item, index }) => (
                    <View
                      style={styles.imageItemContainer}
                      key={index.toString()}
                    >
                      <Image
                        source={{ uri: item }}
                        style={{ width: 100, height: 100, margin: 5 }}
                      />
                      <TouchableOpacity
                        style={styles.closeIconContainer}
                        onPress={() => removeImage(index)}
                      >
                        <AntDesign name="close" size={20} color="white" />
                      </TouchableOpacity>
                    </View>
                  )}
                  horizontal={true}
                />
              ) : (
                <ScrollView
                  horizontal={true}
                  contentContainerStyle={styles.placeholderContainer}
                >
                  {Array.from({ length: 5 }, (_, index) => (
                    <View key={index} style={styles.placeholderImage} />
                  ))}
                </ScrollView>
              )}
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
            <View style={styles.buttonContainer}>
              <TouchableOpacity
                onPress={() => {
                  toggleModal();
                }}
              >
                <Text style={styles.cancelButton}>Vazgeç</Text>
              </TouchableOpacity>
              <TouchableOpacity
                onPress={() => {
                  if (startWeek && endWeek && selectedImages.length > 0) {
                    const startDateIndex =
                      calculateWeekDates().indexOf(startWeek);
                    const endDateIndex =
                      calculateWeekDates().indexOf(endWeek);

                    if (startDateIndex > endDateIndex) {
                      Alert.alert(
                        "Hata",
                        "Lütfen geçerli başlangıç ve bitiş haftaları seçtiğinizden emin olun.",
                        [
                          {
                            text: "Tamam",
                            onPress: () => console.log("Tamam pressed"),
                          },
                        ]
                      );
                      return;
                    }

                    console.log("Selected Start Week:", startWeek);
                    console.log("Selected End Week:", endWeek);
                    sendImagesToServer(); // Resimleri sunucuya gönder
                    setSelectedImages([]); // Seçilen resimleri temizle
                    toggleModal();
                  } else if (selectedImages.length === 0) {
                    Alert.alert("Uyarı", "En az bir görsel seçin.", [
                      { text: "Tamam" },
                    ]);
                  } else {
                    Alert.alert(
                      "Uyarı",
                      "Başlangıç ve bitiş haftalarını seçin.",
                      [{ text: "Tamam" }]
                    );
                  }
                }}
              >
                <Text style={styles.closeButton}>Gönder</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </BlurView>
    </Modal>
  );
};

const styles = StyleSheet.create({
  blurContainer: {
    ...StyleSheet.absoluteFillObject,
    zIndex: 1,
  },
  modalContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  modalContent: {
    backgroundColor: GlobalStyles.surfaceColors.text,
    padding: 20,
    borderRadius: 10,
  },
  imageContainer: {
    width: 300,
    height: 100,
  },
  imageItemContainer: {
    position: "relative",
  },
  closeIconContainer: {
    position: "absolute",
    top: 5,
    right: 5,
    borderRadius: 10,
    padding: 5,
    zIndex: 2,
  },
  weekPickerToggleText: {
    fontSize: 15,
    margin: 10,
    color: GlobalStyles.surfaceColors.dark,
  },
  buttonContainer: {
    marginLeft: "auto",
    flexDirection: "row",
    justifyContent: "center",
  },
  cancelButton: {
    color: GlobalStyles.surfaceColors.error,
    textAlign: "center",
    marginTop: 10,
    fontSize: 15,
  },
  closeButton: {
    color: GlobalStyles.surfaceColors.secondary500,
    textAlign: "center",
    marginTop: 10,
    marginLeft: 10,
    fontSize: 15,
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

export default ImageModal;

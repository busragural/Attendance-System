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
  firstHalfSelected,
  secondHalfSelected,
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
            <TouchableOpacity style={styles.crossButton} onPress={toggleModal} >
              <AntDesign name="close" size={30} color = {GlobalStyles.surfaceColors.dark} />
            </TouchableOpacity>
            <View style={styles.imageButtons} >
              <PrimaryButton onPress={openCamera}>Fotoğraf Çek</PrimaryButton>
              <SecondaryButton onPress={openGallery}>
                Galeriden Seç
              </SecondaryButton>
            </View>


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
                        style={{ width: 90, height: 90, margin: 5, borderRadius: 10,}}
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
                  {Array.from({ length: 3 }, (_, index) => (
                    <View key={index} style={styles.placeholderImage} />
                  ))}
                </ScrollView>
              )}
            </View>

            {renderWeekPicker()}
            
              <TouchableOpacity
              style={styles.sendButton}
                onPress={() => {
                  if ((firstHalfSelected || secondHalfSelected) && selectedImages.length > 0) {
                   
                    console.log("Selected1", firstHalfSelected);
                    console.log("Selected2", secondHalfSelected);
                    sendImagesToServer(); 
                    setSelectedImages([]); 
                    toggleModal();
                  } else if (selectedImages.length === 0) {
                    Alert.alert("Uyarı", "En az bir görsel seçin.", [
                      { text: "Tamam" },
                    ]);
                  } else {
                    Alert.alert(
                      "Uyarı",
                      "Bir dönem seçin.",
                      [{ text: "Tamam" }]
                    );
                  }
                }}
              >
                
                <Text style={styles.sendButtonText}>Gönder</Text>
              </TouchableOpacity>
            
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
    position: "absolute"
  },
  crossButton: {
    position: 'absolute',
    right: 10,
    top: 10,
    zIndex: 10,
  },
  imageContainer: {
    width: 300,
    height: 100,
    marginBottom: 18,
    borderRadius: 10,
  },
  imageButtons:{
    flexDirection: "column",
    paddingVertical: 20,
  },
  imageItemContainer: {
    position: "relative",
    borderRadius: 10,

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
  
  placeholderContainer: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginTop: 10,
  },
  placeholderImage: {
    width: 90,
    height: 90,
    backgroundColor: GlobalStyles.surfaceColors.gray,
    margin: 5,
    borderRadius: 10,

  },
  sendButton:{
    color: GlobalStyles.surfaceColors.text,
    backgroundColor: GlobalStyles.surfaceColors.secondaryRed,
    paddingVertical: 10,
    elevation: 3,
    borderWidth: 2,
    borderColor: GlobalStyles.surfaceColors.secondaryRed,
    borderRadius: 10,
    marginVertical: 5,
    overflow: "hidden",
  },
  sendButtonText: {
    color: GlobalStyles.surfaceColors.text,
    textAlign: "center",
    fontSize: 16,
  },
});

export default ImageModal;

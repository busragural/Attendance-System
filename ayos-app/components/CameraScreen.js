import React, { useRef, useState } from 'react';
import { View, Button, Text, StyleSheet, Alert } from 'react-native';
import { Camera } from 'expo-camera';
import * as ImageManipulator from 'expo-image-manipulator';

const CameraScreen = () => {
  const [hasPermission, setHasPermission] = useState(null);
  const cameraRef = useRef(null);

  const getPermissions = async () => {
    const { status } = await Camera.requestCameraPermissionsAsync();
    setHasPermission(status === 'granted');
  };

  React.useEffect(() => {
    getPermissions();
  }, []);

  const takePicture = async () => {
    if (cameraRef.current) {
      const options = { quality: 0.5, base64: true, fixOrientation: true, exif: true };
      const photo = await cameraRef.current.takePictureAsync(options);
      console.log(photo.uri);

      // Example to manipulate the image
      const manipResult = await ImageManipulator.manipulateAsync(
        photo.uri,
        [{ rotate: 0 }],
        { compress: 1, format: ImageManipulator.SaveFormat.JPEG }
      );
      console.log(manipResult.uri);
      // Perform further actions with the manipulated image if needed
    }
  };

  if (hasPermission === null) {
    return <View />;
  }
  if (hasPermission === false) {
    return <Text>No access to camera</Text>;
  }

  return (
    <View style={{ flex: 1 }}>
      <Camera style={{ flex: 1 }} type={Camera.Constants.Type.back} ref={cameraRef}>
        <View style={styles.buttonContainer}>
          <Button title="Take Picture" onPress={takePicture} />
        </View>
      </Camera>
    </View>
  );
};

const styles = StyleSheet.create({
  buttonContainer: {
    flex: 1,
    backgroundColor: 'transparent',
    flexDirection: 'row',
    margin: 20,
    justifyContent: 'center',
    alignItems: 'flex-end',
  },
});

export default CameraScreen;

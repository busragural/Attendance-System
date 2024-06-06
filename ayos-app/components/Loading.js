// Loading.js
import React from 'react';
import { View, ActivityIndicator, StyleSheet, Modal, TouchableOpacity } from 'react-native';
import { GlobalStyles } from '../constants/styles';

const Loading = ({ visible }) => {
  return (
    <Modal
      transparent={true}
      animationType="none"
      visible={visible}
      onRequestClose={() => {}}
    >
      <View style={styles.modalBackground}>
        <TouchableOpacity style={styles.touchableArea} activeOpacity={1} />
        <View style={styles.activityIndicatorWrapper}>
          <ActivityIndicator animating={visible} size="large" color={GlobalStyles.surfaceColors.dark} />
        </View>
      </View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  modalBackground: {
    flex: 1,
    alignItems: 'center',
    flexDirection: 'column',
    justifyContent: 'space-around',
  },
  touchableArea: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'transparent',
  },
  activityIndicatorWrapper: {
    //backgroundColor: '#FFFFFF',
    height: 100,
    width: 100,
    borderRadius: 10,
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center'
  }
});

export default Loading;

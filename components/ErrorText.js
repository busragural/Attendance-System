import React from 'react'
import { StyleSheet, Text, View } from 'react-native';
import { GlobalStyles } from '../constants/styles';

function ErrorText({children}){
  return (
    <View style={styles.container}>
        <Text style={styles.errorText}>{children}</Text>
    </View>
    
  )
}

export default ErrorText;

const styles = StyleSheet.create({
    container: {
      flex: 1,
      
    },
    errorText: {
        color: GlobalStyles.surfaceColors.secondaryRed,
    }
  });

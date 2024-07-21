import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import bleManagerService from '../BleManagerService';

const Page4 = ({ navigation }) => {
  const [seconds, setSeconds] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setSeconds(prevSeconds => prevSeconds + 1);
    }, 1000);

    return () => clearInterval(timer);
  }, []);

  const handleAbort = () => {
    bleManagerService.sendDataToConnectedDevices('abort')
      .then(() => {
        console.log('Abort command sent');
        navigation.navigate('Page1');
      })
      .catch(error => {
        console.error('Failed to send abort command', error);
      });
  };

  return (
    <View style={styles.container}>
      <Text style={styles.timerText}>{`Timer: ${seconds}s`}</Text>
      <RectButton style={styles.button} onPress={handleAbort}>
        <Text style={styles.buttonText}>Abort</Text>
      </RectButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  timerText: {
    fontSize: 48,
    marginBottom: 20,
  },
  button: {
    backgroundColor: 'red',
    padding: 15,
    borderRadius: 5,
  },
  buttonText: {
    color: 'white',
    fontSize: 24,
  },
});

export default Page4;

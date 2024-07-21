import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import bleManagerService from '../BleManagerService';
import { NativeEventEmitter, NativeModules } from 'react-native';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const Page3 = ({ navigation }) => {
  const [logs, setLogs] = useState([]);

  useEffect(() => {
    const handleUpdateValueForCharacteristic = (data) => {
      const newLog = {
        value: data.value,
        timestamp: new Date().toLocaleString(),
      };
      setLogs((prevLogs) => [...prevLogs, newLog]);
    };

    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic);

    return () => {
      bleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic');
    };
  }, []);

  const clearLogs = () => {
    setLogs([]);
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>BLE Log</Text>
      <ScrollView style={styles.logContainer}>
        {logs.map((log, index) => (
          <View key={index} style={styles.logEntry}>
            <Text style={styles.logText}>{log.timestamp}</Text>
            <Text style={styles.logText}>{log.value}</Text>
          </View>
        ))}
      </ScrollView>
      <RectButton style={styles.button} onPress={clearLogs}>
        <Text style={styles.buttonText}>Clear Logs</Text>
      </RectButton>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    padding: 20,
  },
  text: {
    fontSize: 24,
    marginBottom: 20,
  },
  logContainer: {
    flex: 1,
    width: '100%',
    marginBottom: 20,
  },
  logEntry: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    padding: 10,
    borderBottomWidth: 1,
    borderBottomColor: '#ccc',
  },
  logText: {
    fontSize: 16,
  },
  button: {
    backgroundColor: 'blue',
    padding: 15,
    borderRadius: 5,
    marginTop: 20,
    width: '100%',
    alignItems: 'center',
  },
  buttonText: {
    color: 'white',
    fontSize: 16,
  },
});

export default Page3;

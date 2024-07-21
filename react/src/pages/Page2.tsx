import React, { useEffect, useState } from 'react';
import { View, Text, ScrollView, TouchableOpacity, NativeEventEmitter, NativeModules } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import styles from '../styles';
import bleManagerService from '../BleManagerService';

const BleManagerModule = NativeModules.BleManager;
const bleManagerEmitter = new NativeEventEmitter(BleManagerModule);

const Page2 = ({ navigation }) => {
  const [devices, setDevices] = useState([]);
  const [isConnected, setIsConnected] = useState(false);
  const [connectivityStatus, setConnectivityStatus] = useState('Not connected');

  useEffect(() => {
    const handleDiscoverPeripheral = (device) => {
      setDevices((prevDevices) => {
        if (!prevDevices.find(d => d.id === device.id)) {
          return [...prevDevices, device];
        }
        return prevDevices;
      });
    };

    const handleStopScan = () => {
      console.log('Scan is stopped');
    };

    const handleDisconnectedPeripheral = (data) => {
      console.log('Disconnected from ' + data.peripheral);
      setIsConnected(false);
      updateConnectivityStatus();
    };

    const handleUpdateValueForCharacteristic = (data) => {
      console.log(`Received data from ${data.peripheral} characteristic ${data.characteristic}`, data.value);
    };

    bleManagerEmitter.addListener('BleManagerDiscoverPeripheral', handleDiscoverPeripheral);
    bleManagerEmitter.addListener('BleManagerStopScan', handleStopScan);
    bleManagerEmitter.addListener('BleManagerDisconnectPeripheral', handleDisconnectedPeripheral);
    bleManagerEmitter.addListener('BleManagerDidUpdateValueForCharacteristic', handleUpdateValueForCharacteristic);

    // Check connectivity status on mount
    updateConnectivityStatus();

    // Set up interval to check connectivity status periodically
    const interval = setInterval(() => {
      updateConnectivityStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      bleManagerEmitter.removeAllListeners('BleManagerDiscoverPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerStopScan');
      bleManagerEmitter.removeAllListeners('BleManagerDisconnectPeripheral');
      bleManagerEmitter.removeAllListeners('BleManagerDidUpdateValueForCharacteristic');
      clearInterval(interval); // Clean up interval on unmount
    };
  }, []);

  const updateConnectivityStatus = async () => {
    setConnectivityStatus(await bleManagerService.getConnectivityStatus());
    setIsConnected(await bleManagerService.isConnected());
  };

  const scanDevices = () => {
    setDevices([]);
    bleManagerService.startScan();
  };

  const connectToDevice = (id) => {
    bleManagerService.connect(id).then(() => {
      setIsConnected(true);
      updateConnectivityStatus();
    });
  };

  const disconnectAllDevices = () => {
    bleManagerService.disconnectAll()
      .then(() => {
        console.log('Successfully disconnected from all devices');
        setIsConnected(false);
        updateConnectivityStatus();
      })
      .catch((error) => {
        console.error('Failed to disconnect from all devices', error);
      });
  };

  return (
    <View style={styles.container}>
      <View style={styles.horizontalContainer}>
        <RectButton style={[styles.button, styles.threeButtons]} onPress={scanDevices}>
          <Text style={styles.buttonText}>Scan Devices</Text>
        </RectButton>
        <RectButton style={[styles.button, styles.threeButtons]} onPress={disconnectAllDevices}>
          <Text style={styles.buttonText}>Disconnect all devices</Text>
        </RectButton>
      </View>

      <Text style={styles.text}>BLE connectivity: {connectivityStatus}</Text>

      <View style={styles.line} />

      <ScrollView style={styles.scrollContainer}>
        {devices.filter(device => device.name).map((device, index) => (
          <TouchableOpacity key={index} style={styles.deviceItem} onPress={() => connectToDevice(device.id)}>
            <Text style={styles.deviceText}>{device.name}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>
    </View>
  );
};

export default Page2;

import BleManager from 'react-native-ble-manager';
import { NativeModules, Platform } from 'react-native';

const BleManagerModule = NativeModules.BleManager;

class BleManagerService {
  constructor() {
    if (!BleManagerService.instance) {
      BleManager.start({ showAlert: false });
      this.devices = [];
      this.connectedDevices = new Set();
      this.connectedDeviceNames = new Map();
      this.serviceUUIDs = new Map();
      this.characteristicUUIDs = new Map();
      BleManagerService.instance = this;
    }

    return BleManagerService.instance;
  }

  startScan = () => {
    if (Platform.OS === 'ios') {
      BleManager.checkState();
    }

    this.devices = []; // Clear previous devices
    BleManager.scan([], 5, true).then(() => {
      console.log('Scanning...');
    });
  };

  connect = (id) => {
    return BleManager.connect(id).then(() => {
      console.log('Connected to ' + id);
      this.connectedDevices.add(id);
      return BleManager.retrieveServices(id).then((peripheralInfo) => {
        console.log('Peripheral Info:', peripheralInfo);

        // Ensure the correct structure of peripheralInfo
        if (peripheralInfo.services.length > 0 && peripheralInfo.characteristics.length > 0) {
          const serviceUUID = peripheralInfo.services[0].uuid;
          const characteristic = peripheralInfo.characteristics.find(c => c.service === serviceUUID);

          if (characteristic) {
            const characteristicUUID = characteristic.characteristic;
            console.log('Service UUID:', serviceUUID);
            console.log('Characteristic UUID:', characteristicUUID);

            // Save these to use later in sendData
            this.serviceUUIDs.set(id, serviceUUID);
            this.characteristicUUIDs.set(id, characteristicUUID);

            const deviceName = peripheralInfo.name || peripheralInfo.id;
            this.connectedDeviceNames.set(id, deviceName);
            BleManager.stopScan(); // Stop scanning once connected
          } else {
            console.error('Characteristic not found for service:', serviceUUID);
          }
        } else {
          console.error('No services or characteristics found');
        }
      });
    }).catch((error) => {
      console.log('Connection error', error);
    });
  };

  disconnect = (id) => {
    return BleManager.disconnect(id).then(() => {
      console.log('Disconnected from ' + id);
      this.connectedDevices.delete(id);
      this.connectedDeviceNames.delete(id);
      this.serviceUUIDs.delete(id);
      this.characteristicUUIDs.delete(id);
    }).catch((error) => {
      console.log('Disconnection error', error);
    });
  };

  disconnectAll = () => {
    const disconnectPromises = Array.from(this.connectedDevices).map(id => this.disconnect(id));
    return Promise.all(disconnectPromises)
      .then(() => {
        console.log('Successfully disconnected from all devices');
      })
      .catch((error) => {
        console.error('Failed to disconnect from all devices', error);
      });
  };

  isConnected = async () => {
    for (let id of this.connectedDevices) {
      const isConnected = await BleManager.isPeripheralConnected(id, []);
      if (isConnected) {
        return true;
      }
    }
    return false;
  };

  getConnectivityStatus = async () => {
    if (await this.isConnected()) {
      const connectedDeviceNames = Array.from(this.connectedDeviceNames.values()).join(', ');
      return `Connected to: ${connectedDeviceNames}`;
    } else {
      return 'Not connected';
    }
  };

  listDevices = () => {
    return this.devices;
  };

  sendData = (id, data) => {
    const serviceUUID = this.serviceUUIDs.get(id);
    const characteristicUUID = this.characteristicUUIDs.get(id);
  
    if (!serviceUUID || !characteristicUUID) {
      console.error('Service or Characteristic UUID not found for device', id);
      return Promise.reject(new Error('Service or Characteristic UUID not found'));
    }
  
    // Log the data being sent
    console.log(`Sending data to device ${id}: ${data}`);
    console.log(`Service UUID: ${serviceUUID}`);
    console.log(`Characteristic UUID: ${characteristicUUID}`);
  
    // Convert data to Uint8Array using TextEncoder
    const encoder = new TextEncoder();
    const encodedData = encoder.encode(data);
  
    // Convert Uint8Array to a regular array
    const byteArray = Array.from(encodedData);
  
    return BleManager.write(id, serviceUUID, characteristicUUID, byteArray)
      .then(() => {
        console.log(`Data sent successfully to device ${id}`);
      })
      .catch((error) => {
        console.error(`Send data error for device ${id}`, error);
      });
  };
  

  sendDataToConnectedDevices = (data) => {
    console.log(`Sending data to all connected devices: ${data}`);
  
    const sendPromises = Array.from(this.connectedDevices).map(id => {
      return this.sendData(id, data);
    });
  
    return Promise.all(sendPromises)
      .then(() => {
        console.log('Data sent to all connected devices successfully');
      })
      .catch((error) => {
        console.error('Error sending data to connected devices:', error);
      });
  };
  
  receiveData = (id, serviceUUID, characteristicUUID) => {
    return BleManager.read(id, serviceUUID, characteristicUUID).then((data) => {
      console.log('Data received', data);
    }).catch((error) => {
      console.log('Receive data error', error);
    });
  };
}

const instance = new BleManagerService();
Object.freeze(instance);

export default instance;

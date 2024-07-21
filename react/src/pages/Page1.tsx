import React, { useEffect, useState } from 'react';
import { View, Text, TextInput, Keyboard } from 'react-native';
import { RectButton } from 'react-native-gesture-handler';
import bleManagerService from '../BleManagerService';
import styles from '../styles';

const Page1 = ({ navigation }) => {
  const [inputValues, setInputValues] = useState({
    input1: '20',
    input2: '2',
    input3: '1',
    input4: '4',
  });
  const [isConnected, setIsConnected] = useState(false);
  const [connectivityStatus, setConnectivityStatus] = useState('Not connected');
  const [operationTime, setOperationTime] = useState(0);
  const [isCounting, setIsCounting] = useState(false);

  const startCounter = () => {
    setOperationTime(0);
    setIsCounting(true);
  };
  useEffect(() => {
    let timer;
    if (isCounting) {
      timer = setInterval(() => {
        setOperationTime(prevTime => prevTime + 1);
      }, 1000);
    } else if (!isCounting && operationTime !== 0) {
      clearInterval(timer);
    }
    return () => clearInterval(timer);
  }, [isCounting, operationTime]);
  
  useEffect(() => {
    const updateConnectivityStatus = async () => {
      setConnectivityStatus(await bleManagerService.getConnectivityStatus());
      setIsConnected(await bleManagerService.isConnected());
    };

    // Check connectivity status on mount
    updateConnectivityStatus();

    // Set up interval to check connectivity status periodically
    const interval = setInterval(() => {
      updateConnectivityStatus();
    }, 5000); // Check every 5 seconds

    return () => {
      clearInterval(interval); // Clean up interval on unmount
    };
  }, []);

  const handleInputChange = (name, value) => {
    setInputValues({
      ...inputValues,
      [name]: value,
    });
  };

  const [fillingValveOpen, setFillingValveOpen] = useState(false);
  const [vacuumValveOpen, setVacuumValveOpen] = useState(false);
  const [samplingValveOpen, setSamplingValveOpen] = useState(false);

  const handleValvePress = (valve, isOpen, setValveState, openCommand, closeCommand) => {
    const command = isOpen ? closeCommand : openCommand;
    bleManagerService.sendDataToConnectedDevices(command)
      .then(() => {
        console.log(`Command '${command}' sent to all devices`);
        setValveState(!isOpen);
      })
      .catch(error => {
        console.error(`Failed to send command '${command}'`, error);
      });
  };

  const formatTime = (seconds) => {
    const hrs = Math.floor(seconds / 3600);
    const mins = Math.floor((seconds % 3600) / 60);
    const secs = seconds % 60;
    return `${hrs.toString().padStart(2, '0')}:${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const handleSetPress = (inputName) => {
    let value = inputValues[inputName];
    let command;
  
    if (inputName === 'input4') {
      // Purge cycles should not be multiplied
      command = `numPurgeCycles${value}`;
    } else {
      // Other inputs should be multiplied by 60000
      let intValue = parseFloat(value) * 60000;
      switch (inputName) {
        case 'input1':
          command = `samplingTime${intValue}`;
          break;
        case 'input2':
          command = `fillingTime${intValue}`;
          break;
        case 'input3':
          command = `purgeFillTime${intValue}`;
          break;
        default:
          return;
      }
    }
  
    // Send the command over BLE
    bleManagerService.sendDataToConnectedDevices(command)
      .then(() => {
        console.log(`Command '${command}' sent to all devices`);
      })
      .catch(error => {
        console.error(`Failed to send command '${command}'`, error);
      });
  
    Keyboard.dismiss(); // Dismiss the keyboard
  };

  const handleConnectDisconnect = async () => {
    if (isConnected) {
      await bleManagerService.disconnectAll();
      setIsConnected(false);
      setConnectivityStatus('Not connected');
    } else {
      navigation.navigate('BLE connectivity');
    }
  };

  const handleSendCommand = async (text) => {
    try {
      const isConnected = await bleManagerService.isConnected();
      if (isConnected) {
        bleManagerService.sendDataToConnectedDevices(text)
          .then(() => {
            console.log(`Command '${text}' sent to all devices`);
          })
          .catch(error => {
            console.error(`Failed to send command '${text}'`, error);
          });
      } else {
        console.error('No devices are connected');
      }
    } catch (error) {
      console.error('Error checking connection status', error);
    }
  };

  return (
    <View style={styles.container}>

<View style={styles.horizontalContainer}>
  <RectButton
    style={[
      styles.button,
      styles.connectButton,
      isConnected && { backgroundColor: '#FF3B30' }
    ]}
    onPress={handleConnectDisconnect}
  >
    <Text style={styles.buttonText}>
      {isConnected ? 'Disconnect' : 'Connect'}
    </Text>
  </RectButton>
  <RectButton
    style={[styles.button, styles.connectButton]}
    onPress={() => navigation.navigate('Logs')}
  >
    <Text style={styles.buttonText}>Logs</Text>
  </RectButton>
  <View style={styles.counterContainer}>
    <Text style={styles.counterText}>{formatTime(operationTime)}</Text>
  </View>
</View>

      <View style={styles.line} />

      <View style={styles.verticalContainer}>
      <View style={styles.horizontalContainer}>
        <Text style={styles.labelText}>Sampling time (min)</Text>
        <TextInput
          style={styles.numberInput}
          keyboardType="numeric"
          placeholder="Enter number 1"
          value={inputValues.input1}
          onChangeText={(value) => handleInputChange('input1', value)}
        />
        <RectButton style={[styles.button, styles.setButtons]} onPress={() => handleSetPress('input1')}>
          <Text style={styles.buttonText}>Set</Text>
        </RectButton>
      </View>
      <View style={styles.horizontalContainer}>
        <Text style={styles.labelText}>Filling time (min)</Text>
        <TextInput
          style={styles.numberInput}
          keyboardType="numeric"
          placeholder="Enter number 2"
          value={inputValues.input2}
          onChangeText={(value) => handleInputChange('input2', value)}
        />
        <RectButton style={[styles.button, styles.setButtons]} onPress={() => handleSetPress('input2')}>
          <Text style={styles.buttonText}>Set</Text>
        </RectButton>
      </View>
      <View style={styles.horizontalContainer}>
        <Text style={styles.labelText}>Purge fill time (min)</Text>
        <TextInput
          style={styles.numberInput}
          keyboardType="numeric"
          placeholder="Enter number 3"
          value={inputValues.input3}
          onChangeText={(value) => handleInputChange('input3', value)}
        />
        <RectButton style={[styles.button, styles.setButtons]} onPress={() => handleSetPress('input3')}>
          <Text style={styles.buttonText}>Set</Text>
        </RectButton>
      </View>
      <View style={styles.horizontalContainer}>
        <Text style={styles.labelText}>Purge cycles (#)</Text>
        <TextInput
          style={styles.numberInput}
          keyboardType="numeric"
          placeholder="4"
          value={inputValues.input4}
          onChangeText={(value) => handleInputChange('input4', value)}
        />
        <RectButton style={[styles.button, styles.setButtons]} onPress={() => handleSetPress('input4')}>
          <Text style={styles.buttonText}>Set</Text>
        </RectButton>
      </View>
    </View>

      <View style={styles.line} />

      <View style={styles.horizontalContainer}>
        <RectButton style={[styles.button, styles.opButtons]} onPress={() => handleSendCommand('sampleAndPurgeBag')}>
          <Text style={styles.buttonText}>sample & purge</Text>
        </RectButton>
        <RectButton style={[styles.button, styles.opButtons]} onPress={() => handleSendCommand('sampleBag')}>
          <Text style={styles.buttonText}>sample bag</Text>
        </RectButton>
      </View>
      <View style={styles.horizontalContainer}>
        <RectButton style={[styles.button, styles.opButtons]} onPress={() => handleSendCommand('purgeBag')}>
          <Text style={styles.buttonText}>purge bag</Text>
        </RectButton>
        <RectButton style={[styles.button, styles.valveButtons]} onPress={() => handleSendCommand('abort')}>
          <Text style={styles.buttonText}>abort</Text>
      </RectButton>
      </View>

      <View style={styles.line} />

      <View style={styles.verticalContainer}>
      <View style={styles.horizontalContainer}>
        <RectButton
          style={[
            styles.button,
            styles.valveButtons,
            fillingValveOpen ? styles.softRed : styles.softGrey
          ]}
          onPress={() =>
            handleValvePress(
              'filling',
              fillingValveOpen,
              setFillingValveOpen,
              'openAirValve',
              'closeAirValve'
            )
          }
        >
          <Text style={styles.buttonText}>Filling</Text>
        </RectButton>
        <RectButton
          style={[
            styles.button,
            styles.valveButtons,
            vacuumValveOpen ? styles.softRed : styles.softGrey
          ]}
          onPress={() =>
            handleValvePress(
              'vacuum',
              vacuumValveOpen,
              setVacuumValveOpen,
              'openVacuumValve',
              'closeVacuumValve'
            )
          }
        >
          <Text style={styles.buttonText}>Vacuum</Text>
        </RectButton>
      </View>
      <View style={styles.horizontalContainer}>
        <RectButton
          style={[
            styles.button,
            styles.valveButtons,
            samplingValveOpen ? styles.softRed : styles.softGrey
          ]}
          onPress={() =>
            handleValvePress(
              'sampling',
              samplingValveOpen,
              setSamplingValveOpen,
              'openSamplingValve',
              'closeSamplingValve'
            )
          }
        >
          <Text style={styles.buttonText}>Sampling</Text>
        </RectButton>
        <RectButton
          style={[styles.button, styles.valveButtons, styles.softGrey]}
          onPress={() =>
            bleManagerService.sendDataToConnectedDevices('closeAllValves')
              .then(() => {
                console.log(`Command 'closeAllValves' sent to all devices`);
                setFillingValveOpen(false);
                setVacuumValveOpen(false);
                setSamplingValveOpen(false);
              })
              .catch(error => {
                console.error(`Failed to send command 'closeAllValves'`, error);
              })
          }
        >
          <Text style={styles.buttonText}>Close all valves</Text>
        </RectButton>
      </View>
    </View>
      <Text style={styles.text}>{connectivityStatus}</Text>
    </View>
  );
};

export default Page1;

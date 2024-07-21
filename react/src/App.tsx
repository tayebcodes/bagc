import 'react-native-gesture-handler';
import * as React from 'react';
import { NavigationContainer } from '@react-navigation/native';
import { createStackNavigator } from '@react-navigation/stack';
import Page1 from './pages/Page1';
import Page2 from './pages/Page2';
import Page3 from './pages/Page3';

const Stack = createStackNavigator();

export default function App() {
  return (
    <NavigationContainer>
      <Stack.Navigator initialRouteName="Home">
        <Stack.Screen name="Home" component={Page1} />
        <Stack.Screen name="BLE connectivity" component={Page2} />
        <Stack.Screen name="Logs" component={Page3} />
      </Stack.Navigator>
    </NavigationContainer>
  );
}

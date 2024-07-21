import { StyleSheet } from 'react-native';

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-start',
    alignItems: 'center',
    padding: 20,
    backgroundColor: '#F5F5F5', // Light grey background
  },
  horizontalContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    width: '100%',
    marginBottom: 5,
  },
  verticalContainer: {
    flexDirection: 'column',
    justifyContent: 'flex-start',
    alignItems: 'center',
    width: '100%',
    marginTop: 20,
  },
  labelText: {
    width: '50%', // Adjust the width as needed
    fontSize: 16,
    marginRight: 10,
    color: '#333', // Dark grey text
  },
  button: {
    padding: 12,
    borderRadius: 10,
    marginHorizontal: 10,
    marginVertical: 5,
    backgroundColor: '#007AFF', // iOS blue button
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 5,
    elevation: 5,
    justifyContent: 'center',
    alignItems: 'center',
  },
  connectButton: {
    backgroundColor: '#007AFF', // iOS blue button
  },
  setButtons: {
    width: '15%',
    backgroundColor: '#007AFF', // iOS blue button
  },
  opButtons: {
    width: '45%',
    backgroundColor: '#34C759', // iOS green button
  },
  valveButtons: {
    width: '45%',
    backgroundColor: '#FF3B30', // iOS red button
  },
  buttonText: {
    color: 'white', // White text
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
  numberInput: {
    borderColor: '#C7C7CC', // iOS light grey border
    borderWidth: 1,
    padding: 10,
    margin: 10,
    borderRadius: 8,
    width: 80,
    backgroundColor: '#FFF', // White background
  },
  line: {
    width: '100%',
    height: 1,
    backgroundColor: '#C7C7CC', // iOS light grey line
    marginVertical: 10,
  },
  dynamicText: {
    fontSize: 24,
    color: '#000', // Black text
    margin: 10,
  },
  centeredText: {
    textAlign: 'center',
    color: '#8E8E93', // iOS grey text
  },
  marginTop20: {
    marginTop: 20,
  },
  marginBottom20: {
    marginBottom: 20,
  },
  scrollContainer: {
    width: '100%',
  },
  deviceItem: {
    padding: 15,
    borderBottomWidth: 1,
    borderBottomColor: '#C7C7CC', // iOS light grey border
    backgroundColor: '#FFF', // White background
  },
  deviceText: {
    fontSize: 18,
    color: '#333', // Dark grey text
  },
  box: {
    width: '90%',
    padding: 20,
    backgroundColor: 'white', // White background
    borderRadius: 10,
    shadowColor: '#000', // Black shadow
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 5,
    elevation: 5,
    marginBottom: 20,
  },
  label: {
    fontSize: 18,
    fontWeight: 'bold',
    marginBottom: 10,
    color: '#333', // Dark grey text
    textAlign: 'center',
  },
  // Additional colors
  softBlue: {
    backgroundColor: '#007AFF', // iOS blue
  },
  softGreen: {
    backgroundColor: '#34C759', // iOS green
  },
  softRed: {
    backgroundColor: '#FF3B30', // iOS red
  },
  softOrange: {
    backgroundColor: '#FF9500', // iOS orange
  },
  softYellow: {
    backgroundColor: '#FFCC00', // iOS yellow
  },
  softPurple: {
    backgroundColor: '#AF52DE', // iOS purple
  },
  softGrey: {
    backgroundColor: '#8E8E93', // iOS grey
  },
  lightGreyBackground: {
    backgroundColor: '#F2F2F7', // iOS light grey background
  },
  darkText: {
    color: '#1C1C1E', // iOS dark text
  },
  lightText: {
    color: '#F5F5F5', // iOS light text
  },
  counterContainer: {
    marginLeft: 10,
    paddingVertical: 5,
    paddingHorizontal: 10,
    borderWidth: 1,
    borderColor: '#C7C7CC', // iOS light grey border
    borderRadius: 8,
    justifyContent: 'center',
    alignItems: 'center',
    backgroundColor: '#FFF', // White background
  },
  counterText: {
    fontSize: 16,
    color: '#333',
  },
});

export default styles;

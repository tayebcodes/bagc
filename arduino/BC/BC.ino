#include <Arduino.h>
#include "BLEUtils.h"

// Control and sensor pins
int bagSensorPin = 25;   // select the input pin for the potentiometer
int bagVoltagePin = 26;  // select the pin for the voltage for bag sensor
int fillPin = 12;        // bag filling pin
int vacuumPin = 14;      // bag vacuum pin
int samplePin = 27;      // bag sampling pin

// Control variables
bool startPurging = false;
bool startSampling = false;
unsigned long operationStartTime = 0;
unsigned long startSamplingTime = 0;
unsigned long currentPurgeCycleTime =0;
int currentPurgeCycle = 0;

bool abortFlag = false;
bool samplingActive = false;
bool purgeActive = false;
bool processActive = false;
unsigned long samplingStartTime;
unsigned long lastCheckTime = 0;
const unsigned long checkInterval = 1000; // Check every 1000 ms (1 second)

// Process states
enum State {
  IDLE,
  SAMPLING,
  PURGING,
  SAMPLE_AND_PURGE
};
State currentState = IDLE;

const char* deviceName = "BC_BLE";
const char* serviceUUID = "12345678-1234-1234-1234-123456789012";
const char* characteristicUUID = "87654321-4321-4321-4321-210987654321";
bool deviceConnected = false; // Track connection status
BLECharacteristic *pCharacteristic;

/// Variables
int samplingTime = 5000 ; //in milliseconds
int fillingTime = 12000; // Bag filling time after purge in milliseconds
int numPurgeCycles = 2 ; // Number of purge cycles before filling the bag
int purgeFillTime = 3000 ; // The bag filling time for each purge cycle in milliseconds
int maxVacuumTime = 1200000; // The maxmimum time for vacuum valve to stop vacuum if something goes wrong and I am not present

void setup() {
  // Initialize serial communication
  Serial.begin(115200);

  // Initialize pins
  pinMode(bagSensorPin, INPUT);
  pinMode(bagVoltagePin, OUTPUT);
  pinMode(fillPin, OUTPUT);
  pinMode(vacuumPin, OUTPUT); // Set to OUTPUT to control the vacuum pin
  pinMode(samplePin, OUTPUT);

  // Initialize BLE with parameters
  setupBLE(deviceName, serviceUUID, characteristicUUID);

  // Initial debug message
  Serial.println("Setup complete. Entering main loop...");
}

void loop() {
  checkBLEandReadvertise();
  unsigned long currentTime = millis();

  if (currentTime - lastCheckTime >= checkInterval) {
    lastCheckTime = currentTime;
    if (abortFlag) {
      CloseAllValves();
      currentState = IDLE;
      abortFlag = false;
    } else {
      switch (currentState) {
        case IDLE:
          // Idle state: do nothing
          break;

        case SAMPLING:
          sampleBag(currentTime);
          break;

        case SAMPLE_AND_PURGE:
          sampleBag(currentTime);
          break;

        case PURGING:
          purgeBag(currentTime);
          break;
      }
    }
  }
  delay(500); // Delay for 500 ms to prevent excessive CPU usage
}

void sampleBag(unsigned long currentTime) {
  if (startSampling) {
    openSam();
    samplingStartTime = currentTime;
    Serial.print("Sampling valve opened at (s): ");
    Serial.println((samplingStartTime - operationStartTime)/1000);
    startSampling = false;
  } else {
    if (currentTime - samplingStartTime >= samplingTime) {
      closeSam();
      unsigned long completedSamplingTime = currentTime - samplingStartTime;
      Serial.print("Sampling was performed for requested period (s): ");
      Serial.println(samplingTime / 1000);
      Serial.print("Actual sampling time was (s): ");
      Serial.println(completedSamplingTime / 1000);
      if (currentState == SAMPLING) {
        Serial.println("Since sampling with no purge was requested, system is set to IDLE");
        currentState = IDLE;
      } else if (currentState == SAMPLE_AND_PURGE) {
        Serial.println("Since sample and purge was requested, system is set to PURGE");
        currentState = PURGING;
        startPurging = true;
      }
    } else if (is_bag_empty()) {
      closeSam();
      unsigned long completedSamplingTime = currentTime - samplingStartTime;
      Serial.print("Sampling was interrupted due to empty bag before requested sampling time (s): ");
      Serial.println(samplingTime / 1000);
      Serial.print("Actual sampling time was (s): ");
      Serial.println(completedSamplingTime / 1000);
      if (currentState == SAMPLING) {
        Serial.println("Since sampling with no purge was requested, system is set to IDLE");
        currentState = IDLE;
      } else if (currentState == SAMPLE_AND_PURGE) {
        Serial.println("Since sample and purge was requested, system is set to PURGE");
        currentState = PURGING;
        startPurging = true;
      }
    }
  }
}

void purgeBag(unsigned long currentTime) {
  static unsigned long currentPurgeStartTime = 0;

  if (startPurging) {
    openVac();
    unsigned long purgingStartTime = (currentTime - operationStartTime) / 1000;
    Serial.print("Timestamp for nitial vacuum valve opening for purging (s): ");
    Serial.println(purgingStartTime);
    Serial.print("Purging will be performed for number of specified cycles: ");
    Serial.println(numPurgeCycles);
    Serial.print("The fill time for each purge cycle is (s): ");
    Serial.println(purgeFillTime / 1000);
    currentPurgeCycle = 0;
    startPurging = false;
  } else if (digitalRead(vacuumPin) == HIGH && digitalRead(fillPin) == LOW) { // for the case that the vacuum valve is open
    if (is_bag_empty()) {
      closeVac();
      openAir();
      currentPurgeCycle += 1;
      Serial.print("Empty bag detected, continuing to purge cycle #: ");
      Serial.println(currentPurgeCycle);
      currentPurgeStartTime = currentTime;
    }
  } else if (digitalRead(vacuumPin) == LOW && digitalRead(fillPin) == HIGH) { // for the case the filling valve is open
    if (currentPurgeCycle < numPurgeCycles) { // case of a regular purge cycle
      if (currentTime - currentPurgeStartTime >= purgeFillTime) {
        closeAir();
        openVac();
        Serial.print("Filling time for current purge cycle achieved (s): ");
        Serial.println((currentTime - currentPurgeStartTime) / 1000);
      }
    } else if (currentPurgeCycle == numPurgeCycles) {
      if (currentTime - currentPurgeStartTime >= fillingTime) {
        closeAir();
        CloseAllValves();
        Serial.print("Purging was performed for cycle numbers: ");
        Serial.println(currentPurgeCycle);
        Serial.print("The bag was filled for the duration of (s): ");
        Serial.println(fillingTime / 1000);
        Serial.println("System is set to IDLE");
        currentState = IDLE;
      }
    }
  }
}



void decodeAndExecute(const std::string& command) {
  // Send back the received command to confirm receipt
  sendString(command.c_str());

  size_t delimiterPos = command.find_first_of("-0123456789");
  std::string key;
  std::string value;

  if (delimiterPos != std::string::npos) {
    key = command.substr(0, delimiterPos);
    value = command.substr(delimiterPos);
  } else {
    key = command;
  }

  // Process the command
  if (!value.empty()) {
    // Convert the value to a long integer, assuming it's a base-10 integer
    long intValue = strtol(value.c_str(), NULL, 10);
    // parameter setting logic
    if (key == "samplingTime") { samplingTime = intValue; Serial.print("Sampling time set to: "); Serial.println(samplingTime); }
    else if (key == "fillingTime") { fillingTime = intValue; Serial.print("Filling time set to: "); Serial.println(fillingTime); }
    else if (key == "numPurgeCycles") { numPurgeCycles = intValue; Serial.print("Purge cycles set to: "); Serial.println(numPurgeCycles); }
    else if (key == "purgeFillTime") { purgeFillTime = intValue; Serial.print("Purge fill time set to: "); Serial.println(purgeFillTime); }
    else if (key == "maxVacuumTime") { maxVacuumTime = intValue; Serial.print("Max vacuum time set to: "); Serial.println(maxVacuumTime); }
    else { Serial.println("Unknown command"); }
  } else {
    // Handle commands without values
    if (key == "abort") { abortFlag = true; Serial.println("Abort command received"); CloseAllValves(); }
    else if (key == "openAirValve") { openAir(); Serial.print("Air valve opened"); }
    else if (key == "closeAirValve") { closeAir(); Serial.print("Air valve closed"); }
    else if (key == "openVacuumValve") { openVac(); Serial.print("Vacuum valve opened"); }
    else if (key == "closeVacuumValve") { closeVac(); Serial.print("Vacuum valve closed"); }
    else if (key == "openSamplingValve") { openSam(); Serial.print("Sampling valve opened"); }
    else if (key == "closeSamplingValve") { closeSam(); Serial.print("Sampling valve closed"); }
    else if (key == "closeAllValves") { CloseAllValves(); Serial.print("All valves were closed"); }
    // Operation logics
    else if (key == "sampleBag") { Serial.println("Sampling command received..."); currentState = SAMPLING; startSampling = true; operationStartTime = millis(); abortFlag = false; }
    else if (key == "purgeBag") { Serial.println("Purge command received..."); currentState = PURGING; startPurging = true; operationStartTime = millis(); abortFlag = false; }
    else if (key == "sampleAndPurgeBag") { Serial.println("Sampling and purge command received..."); currentState = SAMPLE_AND_PURGE; startSampling = true; operationStartTime = millis(); abortFlag = false; }
    else { Serial.println("Unknown command"); }
  }
}


void openAir() { digitalWrite(fillPin, HIGH); }
void closeAir() { digitalWrite(fillPin, LOW); }
void openVac() { digitalWrite(vacuumPin, HIGH); }
void closeVac() { digitalWrite(vacuumPin, LOW); }
void openSam() { digitalWrite(samplePin, HIGH); }
void closeSam() { digitalWrite(samplePin, LOW); }
void CloseAllValves() { closeAir(); closeVac(); closeSam(); }

int is_bag_empty() {
  digitalWrite(bagVoltagePin, HIGH);
  delay(1); // Delay to ensure voltage stabilization
  int sensorValue = analogRead(bagSensorPin);
  if (sensorValue > 2000) {
    return true ;
  } else {
    return false;
  }
  digitalWrite(bagVoltagePin, LOW);
}

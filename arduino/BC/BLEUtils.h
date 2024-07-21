#ifndef BLEUTILS_H
#define BLEUTILS_H

#include <BLEDevice.h>
#include <BLEServer.h>
#include <BLEUtils.h>
#include <BLE2902.h>
#include <string>

// Declare the decodeAndExecute function so it can be used in BLEUtils.h
extern void decodeAndExecute(const std::string& command);

// Track connection status
extern bool deviceConnected;
extern BLECharacteristic *pCharacteristic;

class MyServerCallbacks: public BLEServerCallbacks {
  void onConnect(BLEServer* pServer) override {
    deviceConnected = true;
    Serial.println("Client connected");
  }

  void onDisconnect(BLEServer* pServer) override {
    deviceConnected = false;
    Serial.println("Client disconnected");
    BLEDevice::startAdvertising(); // Start advertising again
    Serial.println("Started advertising again");
  }
};

class MyCharacteristicCallbacks: public BLECharacteristicCallbacks {
  void onWrite(BLECharacteristic *pCharacteristic) override {
    std::string value = std::string(pCharacteristic->getValue().c_str());
    if (value.length() > 0) {
      Serial.print("Received Value: ");
      Serial.println(value.c_str());
      // Project-specific function to decode and execute the command
      decodeAndExecute(value);
    }
  }
};

void setupBLE(const char* deviceName, const char* serviceUUID, const char* characteristicUUID) {
  // Initialize BLE
  BLEDevice::init(deviceName);
  BLEServer *pServer = BLEDevice::createServer();
  pServer->setCallbacks(new MyServerCallbacks());

  // Create BLE Service
  BLEService *pService = pServer->createService(serviceUUID);

  // Create a BLE Characteristic
  pCharacteristic = pService->createCharacteristic(
                      characteristicUUID,
                      BLECharacteristic::PROPERTY_READ   |
                      BLECharacteristic::PROPERTY_WRITE  |
                      BLECharacteristic::PROPERTY_NOTIFY
                    );

  // Add a descriptor
  pCharacteristic->addDescriptor(new BLE2902());

  // Set characteristic callback
  pCharacteristic->setCallbacks(new MyCharacteristicCallbacks());

  // Start the service
  pService->start();

  // Start advertising
  BLEAdvertising *pAdvertising = BLEDevice::getAdvertising();
  pAdvertising->addServiceUUID(serviceUUID);
  pAdvertising->setScanResponse(false);
  pAdvertising->setMinPreferred(0x06);  // Functions that help with iPhone connections issue
  pAdvertising->setMinPreferred(0x12);
  BLEDevice::startAdvertising();
  Serial.println("BLE server is ready and advertising...");
}

void checkBLEandReadvertise() {
  if (!deviceConnected) {
    BLEDevice::startAdvertising();
    Serial.println("Re-advertising...");
  }
}

void sendString(String message) {
  if (deviceConnected) {
    pCharacteristic->setValue(message.c_str());
    pCharacteristic->notify();
    Serial.print("Sent Value: ");
    Serial.println(message);
  } else {
    Serial.println("Cannot send, no device connected");
  }
}

#endif // BLEUTILS_H

import sys
import asyncio
from PyQt5.QtWidgets import (
    QApplication, QWidget, QVBoxLayout, QHBoxLayout, QPushButton,
    QLabel, QLineEdit, QTextEdit, QListWidget, QSpinBox, QFormLayout, QSizePolicy, QFrame, QGroupBox
)
from PyQt5.QtCore import QThread, pyqtSignal, pyqtSlot, QObject, Qt

from bleak import BleakClient, BleakScanner

class BLEWorker(QObject):
    device_discovered = pyqtSignal(str, str)
    message_received = pyqtSignal(str)

    def __init__(self):
        super().__init__()
        self.client = None
        self.device_address = None
        self.characteristic_uuid = "87654321-4321-4321-4321-210987654321"
        self.connected = False

    async def scan_devices(self):
        self.message_received.emit("Starting scan...")
        try:
            devices = await BleakScanner.discover()
            if not devices:
                self.message_received.emit("No devices found")
            for device in devices:
                if device.name:
                    self.device_discovered.emit(device.address, device.name)
                    self.message_received.emit(f"Discovered device: {device.name} ({device.address})")
        except Exception as e:
            self.message_received.emit(f"Error scanning devices: {e}")

    async def connect_device(self, address):
        self.message_received.emit(f"Connecting to {address}...")
        try:
            self.client = BleakClient(address)
            await self.client.connect()
            self.connected = await self.client.is_connected()
            if self.connected:
                self.client.set_disconnected_callback(self.on_disconnect)
                await self.client.start_notify(self.characteristic_uuid, self.notification_handler)
                self.message_received.emit(f"Connected to {address}")
        except Exception as e:
            self.message_received.emit(f"Error connecting to device: {e}")

    async def disconnect_device(self):
        self.message_received.emit("Disconnecting...")
        try:
            if self.client and self.connected:
                await self.client.disconnect()
                self.connected = False
                self.message_received.emit("Disconnected")
        except Exception as e:
            self.message_received.emit(f"Error disconnecting from device: {e}")

    def on_disconnect(self, client):
        self.connected = False
        self.message_received.emit("Disconnected from device")

    def notification_handler(self, sender, data):
        try:
            message = data.decode("utf-8")
            self.message_received.emit(f"Received: {message}")
        except Exception as e:
            self.message_received.emit(f"Error in notification handler: {e}")

    async def send_message(self, message):
        try:
            if self.client and self.connected:
                await self.client.write_gatt_char(self.characteristic_uuid, message.encode("utf-8"))
                self.message_received.emit(f"Sent: {message}")
        except Exception as e:
            self.message_received.emit(f"Error sending message: {e}")

    @pyqtSlot(str)
    def process_command(self, command):
        asyncio.run(self.send_message(command))

class MainWindow(QWidget):
    def __init__(self):
        super().__init__()
        self.initUI()
        self.worker_thread = QThread()
        self.worker = BLEWorker()
        self.worker.moveToThread(self.worker_thread)
        self.worker.device_discovered.connect(self.add_device)
        self.worker.message_received.connect(self.display_message)
        self.worker_thread.start()
        
        self.air_valve_open = False
        self.vacuum_valve_open = False
        self.sampling_valve_open = False

    def initUI(self):
        self.setWindowTitle('BLE Client')
        self.setGeometry(100, 100, 800, 600)

        main_layout = QHBoxLayout(self)
        
        self.layout = QVBoxLayout()
        right_layout = QVBoxLayout()
        left_layout = QVBoxLayout()
        main_layout.addLayout(left_layout, stretch=80)
        main_layout.addLayout(right_layout, stretch=20)

        ##################################################################################################################
        ### BLE connectivity section #####################################################################################
        ##################################################################################################################
        group_box = QGroupBox("BLE Connectivity")
        group_layout = QVBoxLayout()

        self.scan_button = QPushButton('Scan for Devices')
        self.scan_button.clicked.connect(self.scan_devices)
        group_layout.addWidget(self.scan_button)

        self.device_list = QListWidget()
        group_layout.addWidget(self.device_list)

        self.connect_button = QPushButton('Connect to Device')
        self.connect_button.clicked.connect(self.connect_device)
        group_layout.addWidget(self.connect_button)

        self.disconnect_button = QPushButton('Disconnect from Device')
        self.disconnect_button.clicked.connect(self.disconnect_device)
        group_layout.addWidget(self.disconnect_button)

        group_box.setLayout(group_layout)
        right_layout.addWidget(group_box)

        ##################################################################################################################
        ### parameter section ############################################################################################
        ##################################################################################################################
        parameter_box = QGroupBox("Parameters")
        parameter_layout = QFormLayout()

        self.add_parameter_input("Sampling Time (s):", "samplingTime", parameter_layout)
        self.add_parameter_input("Filling Time (s):", "fillingTime", parameter_layout)
        self.add_parameter_input("Purge Fill Time (s):", "purgeFillTime", parameter_layout)
        self.add_parameter_input("Number of Purge Cycles:", "numPurgeCycles", parameter_layout)

        parameter_box.setLayout(parameter_layout)
        right_layout.addWidget(parameter_box)
        ##################################################################################################################
        ### automated operations section #################################################################################
        ##################################################################################################################
        command_box = QGroupBox("Operations")
        command_layout = QVBoxLayout()

        self.sample_button = QPushButton('Sample Bag')
        self.sample_button.clicked.connect(lambda: self.send_command("sampleBag"))
        command_layout.addWidget(self.sample_button)

        self.purge_button = QPushButton('Purge Bag')
        self.purge_button.clicked.connect(lambda: self.send_command("purgeBag"))
        command_layout.addWidget(self.purge_button)

        self.sample_purge_button = QPushButton('Sample and Purge Bag')
        self.sample_purge_button.clicked.connect(lambda: self.send_command("sampleAndPurgeBag"))
        command_layout.addWidget(self.sample_purge_button)

        self.abort_button = QPushButton('Abort')
        self.abort_button.clicked.connect(lambda: self.send_command("abort"))
        command_layout.addWidget(self.abort_button)

        # Set the layout of the QGroupBox to command_layout
        command_box.setLayout(command_layout)
        right_layout.addWidget(command_box)

        ##################################################################################################################
        ### manual valve control section #################################################################################
        ##################################################################################################################
        valve_box = QGroupBox("Valve Controls")
        valve_layout = QVBoxLayout()

        self.air_valve_button = QPushButton('Open Air Valve')
        self.air_valve_button.clicked.connect(self.toggle_air_valve)
        valve_layout.addWidget(self.air_valve_button)

        self.vacuum_valve_button = QPushButton('Open Vacuum Valve')
        self.vacuum_valve_button.clicked.connect(self.toggle_vacuum_valve)
        valve_layout.addWidget(self.vacuum_valve_button)

        self.sampling_valve_button = QPushButton('Open Sampling Valve')
        self.sampling_valve_button.clicked.connect(self.toggle_sampling_valve)
        valve_layout.addWidget(self.sampling_valve_button)

        self.close_all_valves_button = QPushButton('Close All Valves')
        self.close_all_valves_button.clicked.connect(self.close_all_valves)
        valve_layout.addWidget(self.close_all_valves_button)

        valve_box.setLayout(valve_layout)
        right_layout.addWidget(valve_box) 


        self.message_display = QTextEdit(self)
        self.message_display.setReadOnly(True)

        left_layout.addWidget(self.message_display, stretch=80)
        left_layout.addLayout(right_layout, stretch=20)


        ##################################################################################################################
        ### manual command input for developement ########################################################################
        ##################################################################################################################
        self.text_entry = QLineEdit(self)
        self.text_entry.setPlaceholderText('Enter message')
        left_layout.addWidget(self.text_entry)

        self.send_button = QPushButton('Send Message')
        self.send_button.clicked.connect(self.send_message)
        left_layout.addWidget(self.send_button)

        self.setLayout(main_layout)

    def add_parameter_input(self, label_text, command_key, layout):
        label = QLabel(label_text)
        label.setSizePolicy(QSizePolicy.Preferred, QSizePolicy.Fixed)
        label.setAlignment(Qt.AlignLeft | Qt.AlignVCenter)

        spin_box = QSpinBox()
        spin_box.setFixedWidth(80)
        spin_box.setMaximum(1000000)

        button = QPushButton('Set')
        button.setFixedWidth(80)

        # Create a horizontal layout to hold label, spin box, and button
        hbox = QHBoxLayout()
        hbox.addWidget(label)
        hbox.addWidget(spin_box)
        hbox.addWidget(button)
        hbox.setAlignment(Qt.AlignVCenter)  # Align the contents vertically center

        container_widget = QWidget()
        container_widget.setLayout(hbox)
        container_widget.setSizePolicy(QSizePolicy.Expanding, QSizePolicy.Fixed)

        layout.addRow(container_widget)


    def set_parameter(self, key, value):
        if "Time" in key:
            value_ms = round(value * 1000)
            command = f"{key}{value_ms}"
        else:
            command = f"{key}{value}"
        self.send_command(command)

    def scan_devices(self):
        self.device_list.clear()
        self.device_list.addItem('Scanning...')
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.worker.scan_devices())

    def add_device(self, address, name):
        self.device_list.addItem(f"{name} ({address})")

    def connect_device(self):
        selected_item = self.device_list.currentItem()
        if selected_item:
            address = selected_item.text().split('(')[-1].strip(')')
            loop = asyncio.get_event_loop()
            loop.run_until_complete(self.worker.connect_device(address))

    def disconnect_device(self):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.worker.disconnect_device())

    def send_message(self):
        message = self.text_entry.text()
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.worker.send_message(message))
        self.text_entry.clear()

    def send_command(self, command):
        loop = asyncio.get_event_loop()
        loop.run_until_complete(self.worker.send_message(command))
        self.display_message(f"Command sent: {command}")

    def toggle_air_valve(self):
        if self.air_valve_open:
            self.send_command("closeAirValve")
            self.air_valve_button.setText("Open Air Valve")
        else:
            self.send_command("openAirValve")
            self.air_valve_button.setText("Close Air Valve")
        self.air_valve_open = not self.air_valve_open

    def toggle_vacuum_valve(self):
        if self.vacuum_valve_open:
            self.send_command("closeVacuumValve")
            self.vacuum_valve_button.setText("Open Vacuum Valve")
        else:
            self.send_command("openVacuumValve")
            self.vacuum_valve_button.setText("Close Vacuum Valve")
        self.vacuum_valve_open = not self.vacuum_valve_open

    def toggle_sampling_valve(self):
        if self.sampling_valve_open:
            self.send_command("closeSamplingValve")
            self.sampling_valve_button.setText("Open Sampling Valve")
        else:
            self.send_command("openSamplingValve")
            self.sampling_valve_button.setText("Close Sampling Valve")
        self.sampling_valve_open = not self.sampling_valve_open

    def close_all_valves(self):
        self.send_command("closeAllValves")
        self.air_valve_button.setText("Open Air Valve")
        self.vacuum_valve_button.setText("Open Vacuum Valve")
        self.sampling_valve_button.setText("Open Sampling Valve")
        self.air_valve_open = False
        self.vacuum_valve_open = False
        self.sampling_valve_open = False

    def display_message(self, message):
        self.message_display.append(message)

if __name__ == '__main__':
    app = QApplication(sys.argv)
    window = MainWindow()
    window.show()
    sys.exit(app.exec_())

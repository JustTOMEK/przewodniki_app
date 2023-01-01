/* eslint-disable @typescript-eslint/no-unused-vars */
import React, {useEffect, useState} from 'react';
import {enableBLEAndroid} from './BLE';
import BleManager, {Peripheral} from 'react-native-ble-manager';
import {RSSI_THRESHOLD, Sensor} from './Sensor';
import {NativeEventEmitter, NativeModules} from 'react-native';

const bleManagerEmitter = new NativeEventEmitter(NativeModules.BleManager);
interface DisconnectData {
  peripheral: string;
  code?: number;
  status?: number;
  domain?: string;
}

export const useBLE = () => {
  const [moduleInitialized, setModuleInitialized] = useState(false);
  const [isScanning, setIsScanning] = useState(false);
  const [sensorsConnected, setSensorsConnected] = useState<Array<Sensor>>([]);
  const [pendingConnections, setPendingConnections] = useState<Array<Sensor>>(
    [],
  );

  useEffect(() => {
    if (!enableBLEAndroid()) {
      // Try again screen
      return;
    }

    function handleDiscovery(peripheral: Peripheral) {
      console.log('Sensor discovered', peripheral);
      if (pendingConnections.length + sensorsConnected.length >= 3) {
        return;
      }
      if (peripheral.rssi > RSSI_THRESHOLD) {
        return;
      }

      let newSensor = new Sensor(peripheral);
      BleManager.connect(peripheral.id)
        .then(() => {
          console.log('Sensor connected', peripheral.id);
          setPendingConnections(current =>
            current.filter(sensor => sensor.id !== newSensor.id),
          );
          newSensor.startListening();
          setSensorsConnected(curret => [...curret, newSensor]);
        })
        .catch(error => {
          // Failure code
          console.error(error);
        });

      setPendingConnections(current => [...current, newSensor]);
    }

    function handleDisconnection(peripheralID: string) {
      console.log('Sensor disconnected', peripheralID);
      setSensorsConnected(current => {
        let newSensorsConnected = [];
        for (let sensor of current) {
          if (sensor.id !== peripheralID) {
            newSensorsConnected.push(sensor);
          } else {
            sensor.destroy();
            console.log('destroy');
          }
        }
        return newSensorsConnected;
      });
    }

    if (!moduleInitialized) {
      setModuleInitialized(true);
      bleManagerEmitter.addListener(
        'BleManagerDiscoverPeripheral',
        peripheral => {
          handleDiscovery(peripheral);
        },
      );

      bleManagerEmitter.addListener(
        'BleManagerDisconnectPeripheral',
        (data: DisconnectData) => {
          handleDisconnection(data.peripheral);
        },
      );

      bleManagerEmitter.addListener('BleManagerStopScan', () => {
        setIsScanning(false);
        console.log('Scan stopped');
      });
      BleManager.start({showAlert: false})
        .then(() => {
          console.log('Module initialized');
        })
        .catch(error => {
          setModuleInitialized(false);
          console.error(error);
        });
    }
  }, [moduleInitialized, pendingConnections.length, sensorsConnected]);

  useEffect(() => {
    if (moduleInitialized && !isScanning && sensorsConnected.length < 3) {
      setIsScanning(true);
      BleManager.scan(['6951f9c0-2375-49f5-8da9-f45c9f067dcb'], 5, false)
        .then(() => {
          console.log('Scan started');
        })
        .catch(error => {
          console.error('Scan falied', error);
          setIsScanning(false);
        });
    }
    if (isScanning && sensorsConnected.length >= 3) {
      BleManager.stopScan();
    }
  }, [moduleInitialized, isScanning, sensorsConnected]);

  return sensorsConnected;
};

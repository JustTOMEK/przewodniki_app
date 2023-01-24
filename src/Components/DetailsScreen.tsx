/* eslint-disable react-native/no-inline-styles */
import React from 'react';
import {NativeStackScreenProps} from '@react-navigation/native-stack';
import {View, Text, Image} from 'react-native';
import {RootStackParamList} from './RootStack';
import {useBLEContext} from '../Tools/bleProvider';

type DetailsScreenProps = NativeStackScreenProps<
  RootStackParamList,
  'Lista Kroków'
>;
export function DetailsScreen({route}: DetailsScreenProps) {
  const {itemId} = route.params;
  const sensorsConnected = useBLEContext().sensorsConnected;
  return (
    <View style={{flex: 1, alignItems: 'center', backgroundColor: 'white'}}>
      <Image source={require('./images/logo.png')} />
      <Text style={{fontSize: 30, color: 'black'}}>
        {' '}
        Żeby dostać się do: {itemId}
      </Text>
      <Text style={{fontSize: 30, color: 'black'}}>
        {' '}
        {sensorsConnected.map((sensor, i) => (
          <Text
            style={{
              textAlign: 'center',
            }}
            key={i}>
            ({sensor.x}, {sensor.y}): {sensor.getDistance()}
          </Text>
        ))}
      </Text>
    </View>
  );
}

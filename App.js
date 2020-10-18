import React from 'react';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getIpAddressAsync } from 'expo-network';
import MapScreen from './components/Map.js';
import SettingsScreen from './components/Settings.js';
import {
  Text,
  View, 
  Animated,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableOpacity
} from 'react-native';

const isIp = require('is-ip');
const fetchAbortCtrl = new AbortController();
const version = Constants.nativeAppVersion;
const statusBarHeight = getStatusBarHeight();
const hudHeight = 42;
const port = 12345;

export default function App() {
  const [error, setError] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [mapSelectionOpen, setMapSelectionOpen] = React.useState(false);
  const [followMarker, setFollowMarker] = React.useState(true);
  const [ownIP, setOwnIP] = React.useState(null);
  const [mapStyle, setMapStyle] = React.useState(0);
  const [data, setData] = React.useState(null);
  // const [data, setData] = React.useState({
  //   lat: 47.5596, lon: 7.5886, head: 231.1313, alt: 1213.131313, speed: 133.1313
  // });

  const widthAnim = new Animated.Value(56);
  const ipRef = React.useRef(null);
  const hasConnectionRef = React.useRef(false);

  Dimensions.addEventListener('change', () => {
    StatusBar.setHidden(false);
  });

  React.useEffect(() => {
    getIpAddressAsync().then(ip => setOwnIP(ip));
  }, []);

  React.useEffect(() => {
    ScreenOrientation.getOrientationAsync().then(orientation => {
      if (settingsOpen) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT);
      } else {
        ScreenOrientation.unlockAsync();
      }
    });
  }, [settingsOpen]);

  React.useEffect(() => {
    Animated.timing(widthAnim, {
      toValue: mapSelectionOpen ? 112 : 56,
      duration: 50,
      useNativeDriver: false
    }).start();
  }, [mapSelectionOpen]);

  const styles = StyleSheet.create({
    container: {
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height
    },
    autoFollowButton: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      backgroundColor: followMarker ? '#4f9eaf' : 'silver'
    },
    settingsButton: {
      position: 'absolute',
      left: 24,
      bottom: 24,
      backgroundColor: settingsOpen ? '#4f9eaf' : 'white'
    },
    button: {
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
      shadowColor: 'black',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.5,
      shadowRadius: 3.84
    },
    hud: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexDirection: 'row',
      top: 12 + statusBarHeight,
      left: 12,
      right: 12,
      height: hudHeight,
      borderRadius: 6,
      backgroundColor: 'rgba(79, 158, 175, 0.75)'
    },
    hudLabel: {
      color: 'white',
      fontWeight: 'bold'
    },
    hudValue: {
      padding: 12,
      fontWeight: 'normal'
    },
    waitingLabel: {
      color: 'white'
    },
    mapSelection: {
      flexDirection: 'row',
      position: 'absolute',
      left: 24,
      bottom: 98,
      shadowColor: 'black',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.5,
      shadowRadius: 3.84,
      borderRadius: 28,
      backgroundColor: 'white'
    },
    mapSelectionButton: {
      backgroundColor: mapSelectionOpen ? '#4f9eaf' : 'white',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    alternateMapStyleButton: {
      position: 'absolute',
      right: 0,
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    }
  });

  return (
    <View styles={styles.container}>
      <MapScreen 
        data={data} 
        mapStyle={mapStyle} 
        followMarker={followMarker} 
        setFollowMarker={setFollowMarker} 
      />
      <TouchableOpacity 
        style={[styles.autoFollowButton, styles.button]} 
        onPress={() => setFollowMarker(!followMarker)} 
      >
        {followMarker ? 
          <MaterialIcons style={styles.icon} name="my-location" size={42} color="white" /> : 
          <MaterialIcons style={styles.icon} name="location-searching" size={42} color="white" />}
      </TouchableOpacity>
      <Animated.View style={[styles.mapSelection, {width: widthAnim}]}>
        <TouchableOpacity 
          style={styles.alternateMapStyleButton} 
          onPress={() => {
            setMapStyle(1 - mapStyle);
            setMapSelectionOpen(false);
          }} 
        >
          <MaterialCommunityIcons name={mapStyle === 1 ? 'map' : 'satellite-variant'} size={42} color='#4f9eaf' />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.mapSelectionButton} 
          onPress={() => setMapSelectionOpen(!mapSelectionOpen)} 
        >
          <MaterialCommunityIcons style={styles.icon} name={mapStyle === 0 ? 'map' : 'satellite-variant'} size={42} color={mapSelectionOpen ? 'white' : '#4f9eaf'} />
        </TouchableOpacity>
      </Animated.View>
      <SettingsScreen 
        settingsOpen={settingsOpen} 
        setSettingsOpen={setSettingsOpen} 
        ipRef={ipRef} 
        placeholderIP={ownIP} 
        statusBarHeight={statusBarHeight} 
        hudHeight={hudHeight} 
        ScreenOrientation={ScreenOrientation} 
      />
      <TouchableOpacity 
        style={[styles.settingsButton, styles.button]} 
        onPress={() => setSettingsOpen(!settingsOpen)} 
      >
        <MaterialIcons style={styles.icon} name={settingsOpen ? 'check' : 'settings'} size={42} color={settingsOpen ? 'white' : '#4f9eaf'} />
      </TouchableOpacity>
      <View style={styles.hud}>
        {data ? <>
          <Text style={styles.hudLabel}>Heading:
            <Text style={styles.hudValue}> {parseInt(data?.head)}</Text>
          </Text>
          <Text style={styles.hudLabel}>Speed:
            <Text style={styles.hudValue}> {Math.round((data?.speed + Number.EPSILON) * 100) / 100}</Text>
          </Text>
          <Text style={styles.hudLabel}>Altitude:
            <Text style={styles.hudValue}> {Math.round((data?.alt + Number.EPSILON) * 100) / 100}</Text>
          </Text>
        </> : <Text style={styles.waitingLabel}>Waiting for server data...</Text>}
      </View>
      <StatusBar barStyle="dark-content" backgroundColor="transparent" translucent />
    </View>
  );
}

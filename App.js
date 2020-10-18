import React from 'react';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getIpAddressAsync } from 'expo-network';
import { useFonts } from 'expo-font';
import MapScreen from './components/Map.js';
import SettingsScreen from './components/Settings.js';
import {
  Text,
  View, 
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  AsyncStorage,
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
  const [serverIP, setServerIP] = React.useState('');
  const [ownIP, setOwnIP] = React.useState(null);
  const [mapStyle, setMapStyle] = React.useState(0);
  const [data, setData] = React.useState(null);
  // const [data, setData] = React.useState({
  //   lat: 47.5596, lon: 7.5886, head: 231.1313, alt: 1213.131313, speed: 133.1313
  // });

  const [loaded] = useFonts({
    'Ubuntu-Bold': require('./assets/fonts/Ubuntu/Ubuntu-Bold.ttf')
  });

  const ipRef = React.useRef(null);
  const hasConnectionRef = React.useRef(false);

  Dimensions.addEventListener('change', () => {
    StatusBar.setHidden(false);
  });

  React.useEffect(() => {
    getIpAddressAsync().then(ip => setOwnIP(ip));
    retrieveSettings();
    startFetchLoop();
  }, []);

  React.useEffect(() => {
    ipRef.current = serverIP;
    if (isIp(serverIP)) storeSettings();
  }, [serverIP]);

  React.useEffect(() => {
    ScreenOrientation.getOrientationAsync().then(orientation => {
      if (settingsOpen) {
        ScreenOrientation.lockAsync(ScreenOrientation.OrientationLock.PORTRAIT_UP);
      } else {
        ScreenOrientation.unlockAsync();
      }
    });
  }, [settingsOpen]);

  function startFetchLoop() {

    if (!isIp(ipRef.current)) {
      setTimeout(() => startFetchLoop(), 10000);
      return;
    }

    const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
      const controller = new AbortController();
      const promise = fetch(url, { signal: controller.signal, ...options });
      if (signal) signal.addEventListener('abort', () => controller.abort());
      const timeout = setTimeout(() => controller.abort(), ms);
      return promise.finally(() => clearTimeout(timeout));
    };

    fetchTimeout(`http://${ipRef.current}:${port}/data`, 3000, { signal: fetchAbortCtrl.signal })
      .then(response => response.json())
      .then(data => {
        hasConnectionRef.current = true;
        setData(data);
        setError(null);
        setTimeout(() => startFetchLoop(), 1000);
      })
      .catch(error => {
        setError(error);
        hasConnectionRef.current = false;
        setTimeout(() => startFetchLoop(), 10000);
        if (error.name === 'AbortError') {
          console.log('Fetch timed out, aborted.', ipRef.current);
        } else {
          console.error('Some weird ass network error happened', ipRef.current, error);
        }
      });
  }

  storeSettings = async () => {
    try {
      await AsyncStorage.setItem('ip', serverIP);
    } catch (error) {
      console.error('Error saving data', error);
    }
  };

  retrieveSettings = async () => {
    try {
      const ip = await AsyncStorage.getItem('ip');
      if (ip !== null) setServerIP(ip);
    } catch (error) {
      console.error('Error retrieving data', error);
    }
  };

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
      top: 12 + (Platform.OS === 'ios' ? statusBarHeight : 0),
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
      width: mapSelectionOpen ? 112 : 56,
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

  useKeepAwake();

  return (loaded ? 
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
      <View style={styles.mapSelection}>
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
      </View>
      <SettingsScreen 
        settingsOpen={settingsOpen} 
        setSettingsOpen={setSettingsOpen} 
        serverIP={serverIP} 
        setServerIP={setServerIP} 
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
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} backgroundColor="#4f9eaf" translucent={false} />
    </View> : null
  );
}

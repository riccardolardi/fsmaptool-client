import React from 'react';
import Constants from 'expo-constants';
import * as ScreenOrientation from 'expo-screen-orientation';
import { useKeepAwake } from 'expo-keep-awake';
import { useFonts } from 'expo-font';
import { getStatusBarHeight } from 'react-native-status-bar-height';
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons';
import { getIpAddressAsync } from 'expo-network';
import { getDeviceTypeAsync } from 'expo-device';
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
import { View as AnimView } from 'react-native-animatable';

const isIp = require('is-ip');
const fetchAbortCtrl = new AbortController();
const version = Constants.manifest.version;
const statusBarHeight = getStatusBarHeight();
const hudHeight = 42;
const port = 12345;

export default function App() {
  const [error, setError] = React.useState(null);
  const [settingsOpen, setSettingsOpen] = React.useState(true);
  const [mapSelectionOpen, setMapSelectionOpen] = React.useState(false);
  const [followMarker, setFollowMarker] = React.useState(true);
  const [lockHeading, setLockHeading] = React.useState(false);
  const [showWaypointOptions, setShowWaypointOptions] = React.useState(false);
  const [showWaypointOptionsButton, setShowWaypointOptionsButton] = React.useState(false);
  const [currentWaypointIndex, setCurrentWaypointIndex] = React.useState(1);
  const [serverIP, setServerIP] = React.useState('');
  const [ownIP, setOwnIP] = React.useState(null);
  const [mapStyle, setMapStyle] = React.useState(0);
  const [deviceType, setDeviceType] = React.useState(undefined);
  const [data, setData] = React.useState(null);

  const ipRef = React.useRef(null);
  const hasConnectionRef = React.useRef(false);

  const waypointArray = React.useRef([]);
  const polylineArray = React.useRef([]);

  const [loaded] = useFonts({
    'Ubuntu-Bold': require('./assets/fonts/Ubuntu/Ubuntu-Bold.ttf')
  });

  Dimensions.addEventListener('change', () => {
    StatusBar.setHidden(false);
  });

  React.useEffect(() => {
    getIpAddressAsync().then(ip => setOwnIP(ip));
    retrieveSettings();
    startFetchLoop();
    getDeviceTypeAsync().then(deviceType => {
      setDeviceType(deviceType === 0 ? 'phone' : 'tablet');
    });
  }, []);

  React.useEffect(() => {
    storeSettings();
    ipRef.current = serverIP;
    if (serverIP === '99999') startDemoMode();
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

  function pad(num, size) {
    num = num.toString();
    while (num.length < size) num = "0" + num;
    return num;
  }

  function startDemoMode() {
    hasConnectionRef.current = true;
    const then = Date.now();
    const demoData = {
      lat: 42.532219,
      lon: 9.7364273,
      speed: 172.21,
      alt: 3212.39,
      head: 45.0
    };
    const interval = setInterval(() => {
      if (ipRef.current !== '99999') {
        setData(null);
        hasConnectionRef.current = false;
        clearInterval(interval);
      }
      const now = Date.now();
      setData({
        ...demoData,
        lat: demoData.lat + ((now - then) * 0.00001),
        lon: demoData.lon + ((now - then) * 0.00001)
      });
    }, 1000);
  }

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
    lockHeadingButton: {
      position: 'absolute',
      right: 24,
      bottom: 98,
      backgroundColor: lockHeading ? '#4f9eaf' : 'silver'
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
    waypointOptions: {
      flexDirection: 'row',
      position: 'absolute',
      right: 24,
      top: 92,
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
    showWaypointOptionsButton: {
      backgroundColor: showWaypointOptions ? '#4f9eaf' : 'white',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28
    },
    waypointButtonBack: {
      display: showWaypointOptions ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    waypointButtonForward: {
      display: showWaypointOptions ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    waypointNumberLabelWrap: {
      display: showWaypointOptions ? 'flex' : 'none',
      justifyContent: 'center', 
      alignItems: 'center',
      width: 56
    },
    waypointNumberLabel: {
      color: '#4f9eaf',
      fontSize: 24,
      fontWeight: 'bold'
    },
    mapSelection: {
      flexDirection: 'row-reverse',
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
      borderRadius: 28
    },
    alternateMapStyleButton: {
      display: mapSelectionOpen ? 'flex' : 'none',
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
        waypointArray={waypointArray} 
        polylineArray={polylineArray} 
        followMarker={followMarker} 
        setFollowMarker={setFollowMarker} 
        lockHeading={lockHeading} 
        setLockHeading={setLockHeading} 
        currentWaypointIndex={currentWaypointIndex} 
        setCurrentWaypointIndex={setCurrentWaypointIndex} 
        showWaypointOptionsButton={showWaypointOptionsButton} 
        setShowWaypointOptionsButton={setShowWaypointOptionsButton} 
      />
      <AnimView 
        style={styles.waypointOptions} 
        animation={showWaypointOptionsButton ? 'bounceInRight' : 'bounceOutRight'} 
        pointerEvents={showWaypointOptionsButton ? 'auto' : 'none'} 
      >
        <TouchableOpacity 
          style={styles.waypointButtonBack} 
          onPress={() => setCurrentWaypointIndex(currentWaypointIndex === 1 ? waypointArray.current.length : currentWaypointIndex - 1)} 
        >
          <MaterialIcons name="arrow-back" size={42} color='#4f9eaf' />
        </TouchableOpacity>
        <View style={styles.waypointNumberLabelWrap}>
          <Text style={styles.waypointNumberLabel}>{currentWaypointIndex}</Text>
        </View>
        <TouchableOpacity 
          style={styles.waypointButtonForward} 
          onPress={() => setCurrentWaypointIndex(currentWaypointIndex === waypointArray.current.length ? 1 : currentWaypointIndex + 1)} 
        >
          <MaterialIcons name="arrow-forward" size={42} color='#4f9eaf' />
        </TouchableOpacity>
        <TouchableOpacity 
          style={styles.showWaypointOptionsButton} 
          onPress={() => setShowWaypointOptions(!showWaypointOptions)} 
        >
          <MaterialCommunityIcons style={styles.icon} name="map-marker-path" size={42} color={showWaypointOptions ? 'white' : '#4f9eaf'} />
        </TouchableOpacity>
      </AnimView>
      <TouchableOpacity 
        style={[styles.autoFollowButton, styles.button]} 
        onPress={() => setFollowMarker(!followMarker)} 
      >
        {followMarker ? 
          <MaterialIcons style={styles.icon} name="my-location" size={42} color="white" /> : 
          <MaterialIcons style={styles.icon} name="location-searching" size={42} color="white" />}
      </TouchableOpacity>
      <TouchableOpacity 
        style={[styles.lockHeadingButton, styles.button]} 
        onPress={() => {
          setLockHeading(!lockHeading);
        }} 
      >
        {lockHeading ? 
          <MaterialCommunityIcons style={styles.icon} name="compass-outline" size={42} color="white" /> : 
          <MaterialCommunityIcons style={styles.icon} name="compass-off-outline" size={42} color="white" />}
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
        deviceType={deviceType} 
        version={version} 
      />
      <TouchableOpacity 
        style={[styles.settingsButton, styles.button]} 
        onPress={() => setSettingsOpen(!settingsOpen)} 
      >
        <MaterialIcons style={styles.icon} name={settingsOpen ? 'check' : 'settings'} size={42} color={settingsOpen ? 'white' : '#4f9eaf'} />
      </TouchableOpacity>
      <View style={styles.hud}>
        {data && hasConnectionRef.current ? <>
          <Text style={styles.hudLabel}>Heading:
            <Text style={styles.hudValue}> {pad(parseInt(data?.head), 3)}</Text>
          </Text>
          <Text style={styles.hudLabel}>Speed:
            <Text style={styles.hudValue}> {parseInt(data?.speed)}</Text>
          </Text>
          <Text style={styles.hudLabel}>Altitude:
            <Text style={styles.hudValue}> {parseInt(data?.alt)}</Text>
          </Text>
        </> : <Text style={styles.waitingLabel}>Waiting for server data...</Text>}
      </View>
      <StatusBar barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'} backgroundColor="#4f9eaf" translucent={false} />
    </View> : null
  );
}

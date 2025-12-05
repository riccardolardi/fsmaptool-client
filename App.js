import React from 'react'
import Constants from 'expo-constants'
import * as ScreenOrientation from 'expo-screen-orientation'
import { useKeepAwake } from 'expo-keep-awake'
import { useFonts } from 'expo-font'
import {
  SafeAreaProvider,
  useSafeAreaInsets,
} from 'react-native-safe-area-context'
import { MaterialCommunityIcons, MaterialIcons } from '@expo/vector-icons'
import { getIpAddressAsync } from 'expo-network'
import { getDeviceTypeAsync } from 'expo-device'
import AsyncStorage from '@react-native-async-storage/async-storage'
import MapScreen from './components/Map.js'
import SettingsScreen from './components/Settings.js'
import {
  Text,
  View,
  Alert,
  Platform,
  StatusBar,
  StyleSheet,
  Dimensions,
  TouchableOpacity,
} from 'react-native'
import { View as AnimView } from 'react-native-animatable'

const isIp = require('is-ip')
const fetchAbortCtrl = new AbortController()
const version = Constants.expoConfig?.version || '1.0.0'
const hudHeight = 42
const port = 12345

function AppContent() {
  const insets = useSafeAreaInsets()
  const [error, setError] = React.useState(null)
  const [settingsOpen, setSettingsOpen] = React.useState(true)
  const [mapSelectionOpen, setMapSelectionOpen] = React.useState(false)
  const [followMarker, setFollowMarker] = React.useState(true)
  const [lockHeading, setLockHeading] = React.useState(false)
  const [showWaypointOptions, setShowWaypointOptions] = React.useState(false)
  const [showWaypointOptionsButton, setShowWaypointOptionsButton] =
    React.useState(false)
  const [currentWaypointIndex, setCurrentWaypointIndex] = React.useState(1)
  const [serverIP, setServerIP] = React.useState('')
  const [ownIP, setOwnIP] = React.useState(null)
  const [mapStyle, setMapStyle] = React.useState(0)
  const [deviceType, setDeviceType] = React.useState(undefined)
  const [data, setData] = React.useState(null)
  const [planeIconIndex, setPlaneIconIndex] = React.useState(0)
  const [currentRegion, setCurrentRegion] = React.useState(null)
  const [zoomRegion, setZoomRegion] = React.useState(null)

  const ipRef = React.useRef(null)
  const hasConnectionRef = React.useRef(false)

  const waypointArray = React.useRef([])
  const polylineArray = React.useRef([])

  const planeIcons = [
    require(`./assets/plane0.png`),
    require(`./assets/plane1.png`),
    require(`./assets/plane2.png`),
    require(`./assets/plane3.png`),
  ]

  if (isItChristmas()) planeIcons.push(require(`./assets/plane4.png`))

  const [loaded] = useFonts({
    'Ubuntu-Bold': require('./assets/fonts/Ubuntu/Ubuntu-Bold.ttf'),
  })

  Dimensions.addEventListener('change', () => {
    StatusBar.setHidden(false)
  })

  React.useEffect(() => {
    getIpAddressAsync().then((ip) => setOwnIP(ip))
    retrieveSettings()
    startFetchLoop()
    getDeviceTypeAsync().then((deviceType) => {
      setDeviceType(deviceType === 0 ? 'phone' : 'tablet')
    })
  }, [])

  React.useEffect(() => {
    storeSettings()
    ipRef.current = serverIP
    if (serverIP === '99999') startDemoMode()
  }, [serverIP])

  React.useEffect(() => {
    ScreenOrientation.getOrientationAsync().then((orientation) => {
      if (settingsOpen) {
        ScreenOrientation.lockAsync(
          ScreenOrientation.OrientationLock.PORTRAIT_UP
        )
      } else {
        ScreenOrientation.unlockAsync()
      }
    })
  }, [settingsOpen])

  function startFetchLoop() {
    if (!isIp(ipRef.current)) {
      setTimeout(() => startFetchLoop(), 10000)
      return
    }

    const fetchTimeout = (url, ms, { signal, ...options } = {}) => {
      const controller = new AbortController()
      const promise = fetch(url, { signal: controller.signal, ...options })
      if (signal) signal.addEventListener('abort', () => controller.abort())
      const timeout = setTimeout(() => controller.abort(), ms)
      return promise.finally(() => clearTimeout(timeout))
    }

    fetchTimeout(`http://${ipRef.current}:${port}/data`, 3000, {
      signal: fetchAbortCtrl.signal,
    })
      .then((response) => response.json())
      .then((data) => {
        hasConnectionRef.current = true
        setData(data)
        setError(null)
        setTimeout(() => startFetchLoop(), 1000)
      })
      .catch((error) => {
        setError(error)
        hasConnectionRef.current = false
        setTimeout(() => startFetchLoop(), 10000)
        if (error.name === 'AbortError') {
          console.log('Fetch timed out, aborted.', ipRef.current)
        } else {
          console.error(
            'Some weird ass network error happened',
            ipRef.current,
            error
          )
        }
      })
  }

  const storeSettings = async () => {
    try {
      if (serverIP) await AsyncStorage.setItem('serverIP', serverIP)
      await AsyncStorage.setItem('planeIconIndex', String(planeIconIndex))
    } catch (error) {
      console.error('Error saving data', error)
    }
  }

  const retrieveSettings = async () => {
    try {
      const storedVersion = await AsyncStorage.getItem('version')
      if (storedVersion !== version) versionAlert()
      const newServerIP = await AsyncStorage.getItem('serverIP')
      if (newServerIP) setServerIP(newServerIP)
      const newPlaneIconIndex = await AsyncStorage.getItem('planeIconIndex')
      if (newPlaneIconIndex !== null)
        setPlaneIconIndex(parseInt(newPlaneIconIndex))
    } catch (error) {
      console.error('Error retrieving data', error)
    }
  }

  function pad(num, size) {
    num = num.toString()
    while (num.length < size) num = '0' + num
    return num
  }

  function startDemoMode() {
    hasConnectionRef.current = true
    const then = Date.now()
    const demoData = {
      lat: 42.532219,
      lon: 9.7364273,
      speed: 172.21,
      alt: 3212.39,
      head: 45.0,
    }
    const interval = setInterval(() => {
      if (ipRef.current !== '99999') {
        setData(null)
        hasConnectionRef.current = false
        clearInterval(interval)
      }
      const now = Date.now()
      setData({
        ...demoData,
        lat: demoData.lat + (now - then) * 0.00001,
        lon: demoData.lon + (now - then) * 0.00001,
      })
    }, 1000)
  }

  function teleport(coordinate) {
    fetch(`http://${ipRef.current}:${port}/teleport`, {
      method: 'POST',
      headers: {
        Accept: 'application/json',
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(coordinate),
    })
  }

  async function versionAlert() {
    await AsyncStorage.setItem('version', version)
    Alert.alert(
      `Say Hi to v${version} 🎉`,
      `Welcome to FS Map Tool v${version}!\nThe app has been updated to support FS 2024 as well as 2020. Happy flying! 🚀`,
      [{ text: 'OK' }],
      { cancelable: false }
    )
  }

  function increasePlaneIconIndex() {
    if (planeIconIndex >= planeIcons.length - 1) {
      setPlaneIconIndex(0)
    } else {
      setPlaneIconIndex(planeIconIndex + 1)
    }
  }

  function isItChristmas() {
    const now = new Date()
    return (
      now.getMonth() === 12 && (now.getDate() === 24 || now.getDate() === 25)
    )
  }

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      width: Dimensions.get('window').width,
      height: Dimensions.get('window').height,
    },
    statusBarBackground: {
      position: 'absolute',
      top: 0,
      left: 0,
      right: 0,
      height: Platform.OS === 'android' ? insets.top : 0,
      backgroundColor: '#4f9eaf',
      zIndex: 1000,
    },
    autoFollowButton: {
      position: 'absolute',
      right: 24,
      bottom: 24,
      backgroundColor: followMarker ? '#4f9eaf' : 'silver',
    },
    lockHeadingButton: {
      position: 'absolute',
      right: 24,
      bottom: 98,
      backgroundColor: lockHeading ? '#4f9eaf' : 'silver',
    },
    settingsButton: {
      position: 'absolute',
      left: 24,
      bottom: 24,
      backgroundColor: settingsOpen ? '#4f9eaf' : 'white',
    },
    plusButton: {
      position: 'absolute',
      left: 24,
      top: 72 + insets.top,
      backgroundColor: 'white',
    },
    minusButton: {
      position: 'absolute',
      left: 24,
      top: 146 + insets.top,
      backgroundColor: 'white',
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
      shadowRadius: 3.84,
    },
    hud: {
      position: 'absolute',
      alignItems: 'center',
      justifyContent: 'space-around',
      flexDirection: 'row',
      top: 12 + insets.top,
      left: 12,
      right: 12,
      height: hudHeight,
      borderRadius: 6,
      backgroundColor: 'rgba(79, 158, 175, 0.75)',
    },
    hudLabel: {
      color: 'white',
      fontWeight: 'bold',
    },
    hudValue: {
      padding: 12,
      fontWeight: 'normal',
    },
    waitingLabel: {
      color: 'white',
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
      backgroundColor: 'white',
    },
    showWaypointOptionsButton: {
      backgroundColor: showWaypointOptions ? '#4f9eaf' : 'white',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    waypointButtonBack: {
      display:
        showWaypointOptions && waypointArray.current.length ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    waypointButtonForward: {
      display:
        showWaypointOptions && waypointArray.current.length ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
    waypointNumberLabelWrap: {
      display:
        showWaypointOptions && waypointArray.current.length ? 'flex' : 'none',
      justifyContent: 'center',
      alignItems: 'center',
      width: 56,
    },
    waypointNumberLabel: {
      color: '#4f9eaf',
      fontSize: 24,
      fontWeight: 'bold',
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
      backgroundColor: 'white',
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
      display: mapSelectionOpen ? 'flex' : 'none',
      alignItems: 'center',
      justifyContent: 'center',
      width: 56,
      height: 56,
      borderRadius: 28,
    },
  })

  useKeepAwake()

  return loaded ? (
    <View style={styles.container}>
      {Platform.OS === 'android' && <View style={styles.statusBarBackground} />}
      <MapScreen
        data={data}
        mapStyle={mapStyle}
        teleport={teleport}
        currentRegion={currentRegion}
        setCurrentRegion={setCurrentRegion}
        zoomRegion={zoomRegion}
        setZoomRegion={setZoomRegion}
        planeIcons={planeIcons}
        waypointArray={waypointArray}
        polylineArray={polylineArray}
        followMarker={followMarker}
        planeIconIndex={planeIconIndex}
        setFollowMarker={setFollowMarker}
        lockHeading={lockHeading}
        setLockHeading={setLockHeading}
        increasePlaneIconIndex={increasePlaneIconIndex}
        currentWaypointIndex={currentWaypointIndex}
        setCurrentWaypointIndex={setCurrentWaypointIndex}
        showWaypointOptionsButton={showWaypointOptionsButton}
        setShowWaypointOptionsButton={setShowWaypointOptionsButton}
      />
      <AnimView
        style={styles.waypointOptions}
        animation={showWaypointOptionsButton ? 'slideInRight' : 'slideOutRight'}
        duration={250}
        pointerEvents={showWaypointOptionsButton ? 'auto' : 'none'}
      >
        <TouchableOpacity
          style={styles.waypointButtonBack}
          onPress={() =>
            setCurrentWaypointIndex(
              currentWaypointIndex === 1
                ? waypointArray.current.length
                : currentWaypointIndex - 1
            )
          }
        >
          <MaterialIcons name="arrow-back" size={42} color="#4f9eaf" />
        </TouchableOpacity>
        <View style={styles.waypointNumberLabelWrap}>
          <Text style={styles.waypointNumberLabel}>{currentWaypointIndex}</Text>
        </View>
        <TouchableOpacity
          style={styles.waypointButtonForward}
          onPress={() =>
            setCurrentWaypointIndex(
              currentWaypointIndex === waypointArray.current.length
                ? 1
                : currentWaypointIndex + 1
            )
          }
        >
          <MaterialIcons name="arrow-forward" size={42} color="#4f9eaf" />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.showWaypointOptionsButton}
          onPress={() => setShowWaypointOptions(!showWaypointOptions)}
        >
          <MaterialCommunityIcons
            style={styles.icon}
            name="map-marker-path"
            size={42}
            color={showWaypointOptions ? 'white' : '#4f9eaf'}
          />
        </TouchableOpacity>
      </AnimView>
      <TouchableOpacity
        style={[styles.autoFollowButton, styles.button]}
        onPress={() => setFollowMarker(!followMarker)}
      >
        {followMarker ? (
          <MaterialIcons
            style={styles.icon}
            name="my-location"
            size={42}
            color="white"
          />
        ) : (
          <MaterialIcons
            style={styles.icon}
            name="location-searching"
            size={42}
            color="white"
          />
        )}
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.lockHeadingButton, styles.button]}
        onPress={() => setLockHeading(!lockHeading)}
      >
        {lockHeading ? (
          <MaterialCommunityIcons
            style={styles.icon}
            name="compass-outline"
            size={42}
            color="white"
          />
        ) : (
          <MaterialCommunityIcons
            style={styles.icon}
            name="compass-off-outline"
            size={42}
            color="white"
          />
        )}
      </TouchableOpacity>
      <View style={styles.mapSelection}>
        <TouchableOpacity
          style={styles.alternateMapStyleButton}
          onPress={() => {
            setMapStyle(1 - mapStyle)
            setMapSelectionOpen(false)
          }}
        >
          <MaterialCommunityIcons
            name={mapStyle === 1 ? 'map' : 'satellite-variant'}
            size={42}
            color="#4f9eaf"
          />
        </TouchableOpacity>
        <TouchableOpacity
          style={styles.mapSelectionButton}
          onPress={() => setMapSelectionOpen(!mapSelectionOpen)}
        >
          <MaterialCommunityIcons
            style={styles.icon}
            name={mapStyle === 0 ? 'map' : 'satellite-variant'}
            size={42}
            color={mapSelectionOpen ? 'white' : '#4f9eaf'}
          />
        </TouchableOpacity>
      </View>
      <TouchableOpacity
        style={[styles.plusButton, styles.button]}
        onPress={() =>
          setZoomRegion({
            ...currentRegion,
            latitudeDelta: currentRegion.latitudeDelta / 2,
            longitudeDelta: currentRegion.longitudeDelta / 2,
          })
        }
      >
        <MaterialIcons
          style={styles.icon}
          name="add"
          size={42}
          color="#4f9eaf"
        />
      </TouchableOpacity>
      <TouchableOpacity
        style={[styles.minusButton, styles.button]}
        onPress={() =>
          setZoomRegion({
            ...currentRegion,
            latitudeDelta: currentRegion.latitudeDelta * 2,
            longitudeDelta: currentRegion.longitudeDelta * 2,
          })
        }
      >
        <MaterialIcons
          style={styles.icon}
          name="remove"
          size={42}
          color="#4f9eaf"
        />
      </TouchableOpacity>
      <SettingsScreen
        settingsOpen={settingsOpen}
        setSettingsOpen={setSettingsOpen}
        serverIP={serverIP}
        setServerIP={setServerIP}
        placeholderIP={ownIP}
        statusBarHeight={insets.top}
        hudHeight={hudHeight}
        ScreenOrientation={ScreenOrientation}
        deviceType={deviceType}
        version={version}
      />
      <TouchableOpacity
        style={[styles.settingsButton, styles.button]}
        onPress={() => setSettingsOpen(!settingsOpen)}
      >
        <MaterialIcons
          style={styles.icon}
          name={settingsOpen ? 'check' : 'settings'}
          size={42}
          color={settingsOpen ? 'white' : '#4f9eaf'}
        />
      </TouchableOpacity>
      <View style={styles.hud}>
        {data && hasConnectionRef.current ? (
          <>
            <Text style={styles.hudLabel}>
              Heading:
              <Text style={styles.hudValue}>
                {' '}
                {pad(parseInt(data?.head), 3)}
              </Text>
            </Text>
            <Text style={styles.hudLabel}>
              Speed:
              <Text style={styles.hudValue}> {parseInt(data?.speed)}</Text>
            </Text>
            <Text style={styles.hudLabel}>
              Altitude:
              <Text style={styles.hudValue}> {parseInt(data?.alt)}</Text>
            </Text>
          </>
        ) : (
          <Text style={styles.waitingLabel}>Waiting for server data...</Text>
        )}
      </View>
      <StatusBar
        barStyle={Platform.OS === 'ios' ? 'dark-content' : 'light-content'}
        backgroundColor="#4f9eaf"
        translucent={false}
      />
    </View>
  ) : null
}

export default function App() {
  return (
    <SafeAreaProvider>
      <AppContent />
    </SafeAreaProvider>
  )
}

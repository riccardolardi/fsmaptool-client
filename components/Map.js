import React from 'react';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import {
  TouchableOpacity,
  StyleSheet,
  Image,
  View,
  Text
} from 'react-native';

export default function MapScreen(props) {
  const { 
    data, 
    mapStyle, 
    lockHeading,
    followMarker, 
    setLockHeading,
    setFollowMarker 
  } = props;
  const mapRef = React.useRef(null);
  const waypointArray = React.useRef([]);
  const polylineArray = React.useRef([]);
  const [currentWaypointIndex, setCurrentWaypointIndex] = React.useState(0);

  React.useEffect(() => {
    if (data && followMarker) animateCamera();
    redrawPolylines();
  }, [data]);

  React.useEffect(() => {
    if (lockHeading) setFollowMarker(true);
    animateCamera();
  }, [lockHeading]);

  React.useEffect(() => {
    if (!followMarker) {
      setLockHeading(false);
    } else {
      animateCamera();
    }
  }, [followMarker]);

  function onPanDrag(e) {
    setFollowMarker(false);
  }

  function onLongPress(e) {
    if (!data) return;
    const coordinate = e.nativeEvent.coordinate;
    const newWaypoint = {
      id: waypointArray.current.length,
      active: currentWaypointIndex === waypointArray.current.length - 1,
      coordinate: coordinate
    };
    const newPolyline = {
      id: waypointArray.current.length,
      color: 'red',
      coordinates: [
        waypointArray.current.length === 0 ? { latitude: data.lat, longitude: data.lon } : waypointArray.current[waypointArray.current.length - 1].coordinate, 
        newWaypoint.coordinate
      ]
    };
    waypointArray.current.push(newWaypoint);
    polylineArray.current.push(newPolyline);
  }

  function redrawPolylines() {
    if (!waypointArray.current.length || waypointArray.current.length !== polylineArray.current.length) return;
    polylineArray.current.forEach((polyline, index) => {
      if (currentWaypointIndex === index) {
        polyline.coordinates = [
          { latitude: data.lat, longitude: data.lon },
          waypointArray.current[currentWaypointIndex].coordinate
        ];
      } else {
        polyline.coordinates = [
          waypointArray.current[index - 1].coordinate,
          waypointArray.current[index].coordinate
        ];
      }
    });
  }

  function moveWaypoint(e) {
    waypointArray.current.forEach(waypoint => {
      waypoint.coordinate = parseInt(e.nativeEvent.id) === waypoint.id ? e.nativeEvent.coordinate : waypoint.coordinate;
    });
    redrawPolylines();
  }

  function removeWaypoint(id) {
    const waypointIndex = waypointArray.current.indexOf(waypointArray.current.find(el => el.id === id));
    waypointArray.current.splice(waypointIndex, 1);
    polylineArray.current.splice(waypointIndex, 1);
    redrawPolylines();
  }

  function animateCamera() {
    if (!data) return;
    mapRef.current.animateCamera({
      center: {
        latitude: data.lat,
        longitude: data.lon
      },
      heading: lockHeading ? data.head : 0
    });
  }

  const styles = StyleSheet.create({
    map: {
      width: '100%',
      height: '100%'
    },
    markerCallout: {
      flex: 1,
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    markerTitle: {
      fontSize: 12,
      paddingRight: 12
    }, 
    markerCloseButton: {
      justifyContent: 'center',
      alignItems: 'center',
      width: 32,
      height: 32,
      backgroundColor: "red",
      borderRadius: 4
    },
    markerCloseButtonText: {
      color: '#fff', 
      fontSize: 16,
      lineHeight: 34
    }
  });

  return (
    <View style={styles.container}>
      <MapView 
        ref={mapRef} 
        style={styles.map} 
        mapType={mapStyle === 0 ? 'standard' : 'hybrid'} 
        initialCamera={{
          center: {
           latitude: 0,
           longitude: 0
          },
          heading: 0,
          pitch: 0,
          altitude: 1000000,
          zoom: 5
        }} 
        compassOffset={{ x: -10, y: 64 }} 
        showsCompass={false} 
        rotateEnabled={false} 
        toolbarEnabled={false} 
        loadingEnabled={true} 
        moveOnMarkerPress={false} 
        onPanDrag={onPanDrag} 
        onLongPress={onLongPress} 
      >
        {data ? <Marker 
          key={0} 
          anchor={{x: 0.5, y: 0.5}} 
          coordinate={{latitude: data.lat, longitude: data.lon}}>
          <View 
            style={{
              transform: [{ rotate: `${data && !lockHeading ? data?.head : 0}deg` }],
              width: 56, height: 56 
            }}>
            <Image 
              source={require('../assets/marker.png')} 
              resizeMode='contain' 
              style={{ flex: 1, width: undefined, height: undefined }} 
            />
          </View>
        </Marker> : null}
        {waypointArray.current.length !== 0 && waypointArray.current.map((marker, index) => <Marker 
          key={index} 
          identifier={String(marker.id)} 
          coordinate={marker.coordinate} 
          tracksViewChanges={false} 
          onDrag={e => moveWaypoint(e)} 
          stopPropagation 
          draggable 
        ><Callout>
          <View style={styles.markerCallout}>
            <Text style={styles.markerTitle}>
              {`Waypoint #${index + 1}`}
            </Text>
            <TouchableOpacity 
              style={styles.markerCloseButton} 
              onPress={() => removeWaypoint(marker.id)} 
            >
              <Text style={styles.markerCloseButtonText}>✕</Text>
            </TouchableOpacity>
          </View>
        </Callout></Marker>)}
        {polylineArray.current.length !== 0 && polylineArray.current.map((polyline, index) => <Polyline 
          key={index} 
          coordinates={polyline.coordinates} 
          strokeColor={polyline.color} 
          strokeWidth={2} 
        />)}
      </MapView>
    </View>
  );
}

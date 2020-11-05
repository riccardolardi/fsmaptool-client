import React from 'react';
import MapView from 'react-native-maps';
import {
  StyleSheet,
  Image,
  Text,
  View
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

  React.useEffect(() => {
    if (!data || !followMarker) return;
    animateCamera();
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
        onPanDrag={e => onPanDrag(e)} 
      >
        {data ? <MapView.Marker 
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
        </MapView.Marker> : null}
      </MapView>
    </View>
  );
}

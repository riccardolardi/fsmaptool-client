import React from 'react'
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
    followMarker, 
    setFollowMarker 
  } = props;
  const mapRef = React.useRef(null);

  React.useEffect(() => {
    if (!data || !followMarker) return;
    mapRef.current.animateCamera({
      center: {
        latitude: data.lat,
        longitude: data.lon
      }
    });
  }, [data]);

  function onPanDrag(e) {
    setFollowMarker(false);
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
              transform: [{ rotate: `${data ? data?.head : 0}deg` }],
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

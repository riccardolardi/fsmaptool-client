import React from 'react'
import MapView from 'react-native-maps';
import {
  StyleSheet,
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
    if (!data || !props.followMarker) return;
    mapRef.current.animateCamera({
      center: {
        latitude: data.lat,
        longitude: data.lon
      }
    });
  }, [data]);

  function onPanDrag(e) {
    props.setFollowMarker(false);
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
          rotation={data.head} 
          coordinate={{latitude: data.lat, longitude: data.lon}} 
          image={require('../assets/icon.png')} 
        /> : null}
      </MapView>
    </View>
  );
}

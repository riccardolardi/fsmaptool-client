import React from 'react';
import MapView, { Marker, Callout, Polyline } from 'react-native-maps';
import { Button, Title, Paragraph, Divider } from 'react-native-paper';
import {
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
  const [markerArray, setMarkerArray] = React.useState([]);
  const [polylineArray, setPolylineArray] = React.useState([]);

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

  function onLongPress(e) {
    const coordinate = e.nativeEvent.coordinate;
    const newMarker = {
      id: markerArray.length,
      coordinate: coordinate
    };
    const newPolyline = {
      id: markerArray.length,
      coordinates: [
        markerArray.length === 0 ? { latitude: data.lat, longitude: data.lon } : markerArray[markerArray.length - 1].coordinate, 
        newMarker.coordinate
      ]
    };
    setMarkerArray(markerArray.concat(newMarker));
    // setPolylineArray(polylineArray.concat(newPolyline));
  }

  function removeMarker(index) {
    setMarkerArray(markerArray.filter(el => el.id !== index));
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
      flexDirection: 'row',
      justifyContent: 'space-between'
    },
    markerTitle: {
      flex: 1,
      fontSize: 12,
      paddingRight: 6
    }, 
    markerCloseButton: {
      flex: 1,
      width: 36
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
        {markerArray.length !== 0 && markerArray.map((marker, index) => <Marker 
          key={index} 
          coordinate={marker.coordinate} 
          tracksViewChanges={false} 
          stopPropagation draggable 
        ><Callout>
          <View style={styles.markerCallout}>
            <Title style={styles.markerTitle}>
              {`Waypoint #${index + 1}`}
            </Title>
            <Button 
              style={styles.markerCloseButton} 
              compact 
              icon="close" 
              mode="contained" 
              color="red" 
              onPress={() => removeMarker(marker.id)} 
            />
          </View>
        </Callout></Marker>)}
        {polylineArray.length !== 0 && polylineArray.map((polyline, index) => <Polyline
          coordinates={polyline.coordinates} strokeColor="#ff0000" strokeWidth={2} 
        />)}
      </MapView>
    </View>
  );
}

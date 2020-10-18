import React from 'react'
import {
  TouchableOpacity,
  StyleSheet,
  Dimensions,
  TextInput,
  Keyboard,
  Platform,
  Linking,
  Button,
  Image,
  Text
} from 'react-native';
import { View } from 'react-native-animatable';

export default function SettingsScreen(props) {
  const { 
    ScreenOrientation,
    statusBarHeight,
    setSettingsOpen,
    placeholderIP,
    settingsOpen,
    setServerIP,
    hudHeight,
    serverIP,
    version
  } = props;

  function linkClicked() {
    Linking.openURL('http://www.fsmaptool.com');
  }

  const styles = StyleSheet.create({
    container: {
      position: 'absolute',
      left: 12,
      right: 12,
      top: 24 + (Platform.OS === 'ios' ? statusBarHeight : 0) + hudHeight,
      bottom: -12,
      borderRadius: 6,
      backgroundColor: 'white',
      shadowColor: 'black',
      shadowOffset: {
        width: 0,
        height: 2,
      },
      shadowOpacity: 0.5,
      shadowRadius: 3.84,
      overflow: 'hidden'
    },
    ipInputField: {
      width: '100%',
      height: 46,
      borderRadius: 6,
      color: '#4f9eaf',
      borderColor: 'silver',
      backgroundColor: 'white',
      borderWidth: 1,
      padding: 6
    },
    label: {
      color: '#4f9eaf',
      fontWeight: 'bold',
      marginBottom: 6
    },
    version: {
      color: 'grey',
      marginBottom: 12
    },
    title: {
      fontFamily: 'Ubuntu-Bold',
      fontSize: 36,
      color: '#4f9eaf',
      fontWeight: 'bold'
    },
    logo: {
      position: 'absolute',
      width: '100%',
      height: '60%',
      bottom: -24,
      resizeMode: 'cover',
      zIndex: -1
    },
    linkLabel: {
      color: '#4f9eaf',
      marginTop: 16,
      marginBottom: 6,
    },
    linkButtonView: {
      alignItems: 'center',
      justifyContent: 'center',
      height: 42,
      backgroundColor: '#4f9eaf',
      borderRadius: 6
    },
    linkButton: {
      color: 'white',
      fontWeight: 'bold',
      zIndex: 10
    }
  });

  return (
    <View style={styles.container} animation={settingsOpen ? 'bounceInUp' : 'bounceOutDown'}>
      <View style={{flex: 1, padding: 12}}>
        <Text style={styles.title}>FS Map Tool</Text>
        <Text style={styles.version}>{`Client v${version ? version : '0.0.1'}`}</Text>
        <Text style={styles.label}>Server IP address:</Text>
        <TextInput 
          style={styles.ipInputField} 
          onChangeText={v => setServerIP(v)} 
          value={serverIP} 
          placeholder={placeholderIP} 
          returnKeyType='done' 
          keyboardType='decimal-pad' 
          multiline={false} 
          blurOnSubmit={true} 
          clearButtonMode='while-editing' 
        />
        <Text style={styles.linkLabel}>For support, feedback etc. please visit</Text>
        <TouchableOpacity 
          style={styles.linkButtonView} 
          onPress={() => linkClicked()}>
          <Text style={styles.linkButton} >www.fsmaptool.com</Text>
        </TouchableOpacity>
      </View>
      <Image style={styles.logo} source={require('../assets/splash.png')} />
    </View>
  );
}

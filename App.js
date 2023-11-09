import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  Button,
  SafeAreaView,
  Alert,
} from "react-native";
import MapView, { Marker, Polygon } from "react-native-maps";
import {
  requestForegroundPermissionsAsync,
  getLastKnownPositionAsync,
  watchPositionAsync,
} from "expo-location";
import * as geolib from "geolib";

const MapScreen = () => {
  const [location, setLocation] = useState(null);
  const [mapRegion, setMapRegion] = useState(null);
  const [markerVisible, setMarkerVisible] = useState(false);
  const [polygonCoordinates, setPolygonCoordinates] = useState([
    // { latitude: -12.946371, longitude: 28.642533 },
    { latitude: -12.94558, longitude: 28.642472 },
    { latitude: -12.946635, longitude: 28.642504 },
    { latitude: -12.946613, longitude: 28.643312 },
    { latitude: -12.946331, longitude: 28.643267 },
  ]);

  const [timer, setTimer] = useState({ hours: 0, minutes: 0, seconds: 0 });
  const [timerInterval, setTimerInterval] = useState(null);
  const [screenBorderColor, setScreenBorderColor] = useState(""); // Default to green

  useEffect(() => {
    (async () => {
      // Request permission for location access
      const { status } = await requestForegroundPermissionsAsync();

      if (status === "granted") {
        // Fetch the last known location
        const lastKnownLocation = await getLastKnownPositionAsync({});
        setLocation(lastKnownLocation);

        // Watch for changes in the user's location
        const locationWatch = await watchPositionAsync(
          {
            accuracy: 6, // Adjust accuracy as needed
            timeInterval: 1000, // Update interval in milliseconds
          },
          (location) => {
            setLocation(location);
          }
        );

        // Clean up the watch when the component unmounts
        return () => {
          locationWatch.remove();
        };
      }
    })();
  }, []);

  useEffect(() => {
    // When the location changes, update the map region
    if (location) {
      setMapRegion({
        latitude: location.coords.latitude,
        longitude: location.coords.longitude,
        latitudeDelta: 0.0922, // Adjust as needed
        longitudeDelta: 0.0421, // Adjust as needed
      });
      if (markerVisible) {
        // Check if the marker is within the polygon
        if (
          geolib.isPointInPolygon(
            {
              latitude: location.coords.latitude,
              longitude: location.coords.longitude,
            },
            polygonCoordinates
          )
        ) {
          // Start or resume the timer when the marker is inside the polygon
          if (!timerInterval) {
            const intervalId = setInterval(() => {
              setTimer((prevTimer) => {
                const seconds = prevTimer.seconds + 1;
                if (seconds === 60) {
                  const minutes = prevTimer.minutes + 1;
                  if (minutes === 60) {
                    return {
                      hours: prevTimer.hours + 1,
                      minutes: 0,
                      seconds: 0,
                    };
                  }
                  return { ...prevTimer, minutes, seconds: 0 };
                }
                return { ...prevTimer, seconds };
              });
            }, 1000);
            setTimerInterval(intervalId);
          }

          // Set the screen border to green when marker is inside the polygon
          setScreenBorderColor("green");
        } else {
          // Pause the timer when the marker is outside the polygon
          if (timerInterval) {
            clearInterval(timerInterval);
            setTimerInterval(null);
          }

          setMarkerVisible(true);
          // Set the screen border to red when marker is outside the polygon
          setScreenBorderColor("red");
        }
      }
    }
  }, [location, polygonCoordinates, markerVisible]);

  const toggleMarkerVisibility = () => {
    // If the button is pressed to hide the marker, pause the timer
    if (markerVisible) {
      if (timerInterval) {
        clearInterval(timerInterval);
        setTimerInterval(null);
      }
    }
    setMarkerVisible(!markerVisible);
  };

  return (
    <SafeAreaView
      style={[styles.container, { borderColor: screenBorderColor }]}
    >
      {mapRegion ? (
        <MapView style={styles.map} initialRegion={mapRegion}>
          {markerVisible && location && (
            <Marker
              coordinate={{
                latitude: location.coords.latitude,
                longitude: location.coords.longitude,
              }}
              title="Device Location"
              description="You are here"
            />
          )}
          <Polygon
            coordinates={polygonCoordinates}
            fillColor="rgba(0, 0, 0, 0.2)" // Adjust the color and opacity
            strokeWidth={2} // Adjust the border width
            strokeColor="rgba(0, 0, 0, 0.8)" // Adjust the border color
          />
        </MapView>
      ) : (
        <Text>Loading...</Text>
      )}
      <View style={styles.timerContainer}>
        <Text
          style={{
            bottom: 70,
            marginLeft: 20,
            fontWeight: "500",
            fontSize: 22,
            elevation: 7,
          }}
        >{`Timer: ${timer.hours}h ${timer.minutes}m ${timer.seconds}s`}</Text>
      </View>
      <View style={styles.buttonContainer}>
        <Button
          title={markerVisible ? "Sign Out" : "Login"}
          onPress={toggleMarkerVisibility}
        />
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    paddingTop: 30, // Adjust this value to account for the status bar height
    borderWidth: 10, // Border width to indicate status
    borderColor: "green", // Default to green
  },
  map: {
    flex: 1,
  },
  buttonContainer: {
    position: "absolute",
    bottom: 20, // Adjust this value to control the distance from the bottom
    left: 0,
    right: 0,
    paddingHorizontal: 20,
  },
});

export default MapScreen;

import React from "react";
import { View, Text, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";

export default function Timer() {
  return (
    <View style={styles.page}>
      <View style = {styles.headerRow}>
      <Text style ={styles.header}>{"Let's get studying!"}</Text>
      </View>
      <View style={styles.contentRow}>
        <View style={styles.timerContainer}>
          </View>
        </View>
        <View style={styles.taskRow}>
          <Text style={styles.subHeader}> {"Today's Session: "} </Text>
          </View>
    </View>
  );
}

const styles = StyleSheet.create({
  page: {
    flex: 1,
    backgroundColor: Colors.backgroundBlue,
    color: Colors.backgroundBlue,
    
  },
   headerRow: {
    paddingTop: 25,
    paddingHorizontal: 5,
  },
  contentRow: {
    paddingTop: 25,                
    alignItems: "center", 
  },
  taskRow:{
    alignItems: "center",
    paddingVertical: 16,
    zIndex: 10,
  },
  header: {
    color: "white",
    fontSize: 60,
    textAlign: "center",
    fontWeight: "bold",
  },
  subHeader:{
    color: "white",
    fontSize: 30,
    fontWeight: "bold",
  },
  timerContainer:{
    justifyContent: "center",
    backgroundColor: Colors.lightBlue,
    borderColor: Colors.borderGray,
    borderWidth: 5,
    borderRadius: 10,
    height: 460,
    width: "80%",
  },
});
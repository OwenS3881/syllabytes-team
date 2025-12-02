import React, {useEffect, useRef, useState} from "react";
import { SafeAreaView, ScrollView, View, Text, Button, Pressable, StyleSheet, Image, TouchableOpacity } from "react-native";
import Colors from "@/constants/Colors";

const WorkSession = 25;
const ShortBreak = 5;
const LongBreak = 10;


export default function Timer() {
  const [phase, setPhase] = useState("work"); // "work", "shortBreak", "longBreak"
  const [timeLeft, setTimeLeft] = useState(WorkSession * 60); // in seconds
  const [isRunning, setIsRunning] = useState(false);
  const [completedWorkSessions, setCompletedWorkSessions] = useState(0);
  const intervalRef = useRef(null);

  const formatTime = (seconds) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins.toString().padStart(2, '0')}:${secs.toString().padStart(2, '0')}`;
  };

  const startTimer = () => {
    if (isRunning) return;
    setIsRunning(true); 
  };

  const pauseTimer = () => {
    setIsRunning(false);
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
  };

  const resetTimer = () => {
    pauseTimer();
    setPhase("Work");
    setTimeLeft(WorkSession * 60);
    setCompletedWorkSessions(0);
  };
  
  const switchPhase = () => {
    if (phase === "work") {
      const nextPhase = completedWorkSessions + 1;
      setCompletedWorkSessions(nextPhase);
      const isLongBreak = nextPhase % 4 === 0;
      setPhase(isLongBreak ? "LongBreak" : "ShortBreak");
      setTimeLeft(isLongBreak ? LongBreak * 60 : ShortBreak * 60);
    } else {
      setPhase("work");
      setTimeLeft(WorkSession * 60);
    }
  };

  useEffect(() => {
    if (!isRunning || intervalRef.current) return;
    intervalRef.current = setInterval(() => {
      setTimeLeft((prev) => {
        if (prev <= 1) {
          clearInterval(intervalRef.current);
          intervalRef.current = null;
          switchPhase();
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => {
      if (intervalRef.current) {
        clearInterval(intervalRef.current);
        intervalRef.current = null;
      }
    };
  }, [isRunning, phase]);


  useEffect(() => {
    // auto-restart the interval when we switch phases and want to keep running
    if (isRunning && !intervalRef.current) {
      intervalRef.current = setInterval(() => {
        setTimeLeft(prev => {
          if (prev <= 1) {
            clearInterval(intervalRef.current);
            intervalRef.current = null;
            nextPhase();
            return 0;
          }
          return prev - 1;
        });
      }, 1000);
    }
  }, [timeLeft, isRunning]);
   // Derived display pieces
  const minutes = String(Math.floor(timeLeft / 60)).padStart(2, "0");
  const seconds = String(timeLeft % 60).padStart(2, "0");

  const longBreaks = Math.floor(completedWorkSessions / 4);
  const shortBreaks = completedWorkSessions - longBreaks;
  const pomodoros = completedWorkSessions;
  return (
    <><SafeAreaView style={styles.page}>
       <ScrollView
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
        bounces={false}
      >
      <View style={styles.headerRow}>
        <Text style={styles.header}>{"Let's get studying!"}</Text>
      </View>

      <View style={styles.contentRow}>
        <View style={styles.timerContainer}>
          <View style={styles.tabsRow}>
            <Text style={styles.tabLabel}>Pomodoro</Text>
            <Text style={styles.tabSeparator}> | </Text>
            <Text style={styles.tabLabel}>Short Break</Text>
            <Text style={styles.tabSeparator}> | </Text>
            <Text style={styles.tabLabel}>Long Break</Text>
          </View>

          <View style={styles.countsRow}>
            <Text style={styles.count}>{pomodoros}</Text>
            <Text style={styles.count}>{shortBreaks}</Text>
            <Text style={styles.count}>{longBreaks}</Text>
          </View>

          <View style={styles.divider} />

          <View style={styles.timeRow}>
            <Text style={styles.timeNumber}>{minutes}</Text>
            <Text style={styles.timeColon}> : </Text>
            <Text style={styles.timeNumber}>{seconds}</Text>
          </View>

          <Pressable
            onPress={isRunning ? pauseTimer : startTimer}
            style={({ pressed }) => [
              styles.startButton,
              pressed && styles.startButtonPressed,
            ]}
          >
            <Text style={styles.startButtonText}>
              {isRunning ? "Pause" : "Start"}
            </Text>
          </Pressable>

          <Pressable onPress={resetTimer} style={styles.resetLink}>
            <Text style={styles.resetText}>Reset</Text>
          </Pressable>
        </View>
      </View>
    <View style={styles.taskRow}>
        <Text style={styles.subHeader}> {"Today's Session: "} </Text>
    </View>

    </ScrollView>
    </SafeAreaView>
    </>
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
  tabsRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    gap: 6,
  },
  tabLabel: {
    color: "#111",
    fontSize: 16,
    fontWeight: "600",
  },
  tabSeparator: {
    color: "#333",
    fontSize: 16,
  },

  countsRow: {
    flexDirection: "row",
    justifyContent: "space-evenly",
    alignItems: "center",
    marginTop: 6,
    paddingHorizontal: 24,
  },
  count: {
    color: "black",
    fontSize: 18,
    fontWeight: "600",
  },

  divider: {
    height: 2,
    backgroundColor: "black",
    marginTop: 8,
    marginBottom: 12,
    alignSelf: "stretch",
  },

  timeRow: {
    flexDirection: "row",
    justifyContent: "center",
    alignItems: "center",
    marginBottom: 24,
  },
  timeNumber: {
    fontSize: 96,
    fontWeight: "700",
    color: "#000",
    fontVariant: ["tabular-nums"],
  },
  timeColon: {
    fontSize: 96,
    fontWeight: "700",
    color: "#000",
    marginHorizontal: 8,
  },

  startButton: {
    backgroundColor: Colors.timerBlue,
    borderColor: Colors.borderGray,
    borderWidth: 4,
    borderRadius: 12,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 12,
    width: "70%",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.25,
    shadowRadius: 6,
    elevation: 6,
  },
  startButtonPressed: {
    opacity: 0.9,
  },
  startButtonText: {
    color: "white",
    fontSize: 40,
    fontWeight: "bold",
    letterSpacing: 0.5,
  },

  resetLink: {
    alignSelf: "center",
    marginTop: 10,
  },
  resetText: {
    color: "black",
    fontSize: 16,
    fontWeight: "600",
    textDecorationLine: "underline",
  },
});
import React, { useState, useEffect } from "react";
import { View, Text, StyleSheet, Image, ScrollView, ActivityIndicator } from "react-native";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import { useFocusEffect } from "@react-navigation/native";
import Colors from "@/constants/Colors";
import API from "@/api/api";

// Assets
import rocket from "@/assets/images/Rocket.png";
import yellowStar from "@/assets/images/yellow_star.png";
import greyStar from "@/assets/images/grey_star.png";

export default function Home() {

  const insets = useSafeAreaInsets();
  const [upcomingTasks, setUpcomingTasks] = useState([]);
  const [loading, setLoading] = useState(true);

  // Fetch upcoming tasks from backend
  const fetchTasks = async () => {
    try {
      setLoading(true);
      const response = await API.get("/studyplans/latest");
      const studyPlan = response.data.studyPlan;
      
      // Collect all tasks with their due dates and course info
      const allTasks = [];
        
        studyPlan.courses?.forEach((course) => {
          course.entries?.forEach((entry) => {
            entry.tasks?.forEach((task) => {
              // Handle both string tasks and object tasks
              let taskText;
              if (typeof task === 'string') {
                taskText = task;
              } else if (task.taskName) {
                taskText = task.taskName;
              } else if (task.taskDescription) {
                taskText = task.taskDescription;
              } else if (task.task) {
                taskText = task.task;
              } else if (task.description) {
                taskText = task.description;
              }
              
              if (taskText) {
                allTasks.push({
                  text: taskText,
                  dueDate: entry.dueDate ? new Date(entry.dueDate) : null,
                  course: course.course,
                  assessmentName: entry.assessmentName,
                });
              }
            });
          });
        });
        
        // Sort by due date (earliest first, null dates last)
        allTasks.sort((a, b) => {
          if (!a.dueDate) return 1;
          if (!b.dueDate) return -1;
          return a.dueDate - b.dueDate;
        });
        
      
      // Take top 3 tasks with dates
      const top3 = allTasks.slice(0, 3).map(t => {
        const dateStr = t.dueDate ? `(${t.dueDate.toLocaleDateString()})` : '';
        return `${t.text || "Untitled task"} ${dateStr}`;
      });
      setUpcomingTasks(top3.length > 0 ? top3 : ["No tasks available"]);
      
    } catch (error) {
      console.log("Error fetching tasks:", error);
      setUpcomingTasks(["Load syllabus to see your tasks here!"]);
    } finally {
      setLoading(false);
    }
  };
  
  // Refresh tasks when screen comes into focus
  useFocusEffect(
    React.useCallback(() => {
      fetchTasks();
    }, [])
  );

  const studiedHours = 0;
  const goalHours = 10;
  const progressPct = Math.min(1, studiedHours / goalHours);  const days = ["Mon", "Tue", "Wed", "Thur", "Fri", "Sat", "Sun"];
  const streakFilled = 0; // no streak initially

  // Keep the progress + streak pinned above the menu bar
  const MENU_HEIGHT = 85; // from components/Menu.jsx
  const bottomOffset = insets.bottom + MENU_HEIGHT + 12;

  return (
    <View style={styles.screen}>
      <ScrollView
        style={styles.container}
        contentContainerStyle={[styles.content, { paddingTop: insets.top + 12 }]}
      >
        {/* Greeting header */}
        <View style={styles.headerCard}>
          <View style={styles.headerTextWrap}>
            <Text style={styles.welcomeTop}>WELCOME,</Text>
            <Text style={styles.welcomeBottom}>STUDENT!</Text>
            <Text style={styles.subtitle}>Get ready to set your studies into orbit</Text>
          </View>
          <Image source={rocket} style={styles.rocket} resizeMode="contain" />
        </View>

        {/* Upcoming tasks */}
        <View style={styles.section}>
          <View style={styles.cardOuter}> 
            <View style={styles.cardInner}>
              <Text style={styles.cardTitle}>Upcoming tasks:</Text>
              {loading ? (
                <ActivityIndicator size="small" color={Colors.menuBlue} style={{ marginTop: 8 }} />
              ) : (
                upcomingTasks.map((t, index) => (
                  <Text key={`${t}-${index}`} style={styles.taskItem}>
                    {"\u2022"} {t}
                  </Text>
                ))
              )}
            </View>
          </View>
        </View>

        {/* Spacer to allow scroll behind fixed footer */}
        <View style={{ height: 220 }} />
      </ScrollView>

      {/* Fixed footer above the menu bar */}
      <View style={[styles.fixedBottom, { bottom: bottomOffset }]}> 
        {/* Hours studied progress */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hours studied</Text>
          <View style={styles.progressRow}>
            <View style={styles.progressTrack}>
              <View style={[styles.progressFill, { width: `${progressPct * 100}%` }]} />
            </View>
            <View style={styles.progressRight}>
              <Text style={styles.progressCount}>{studiedHours} / {goalHours}</Text>
              <Text style={styles.progressUnits}>hours</Text>
            </View>
          </View>
        </View>

        {/* Streak */}
        <View style={styles.section}>
          <Text style={[styles.sectionTitle, { marginBottom: 6 }]}>Streak</Text>
          <View style={styles.streakRow}>
            {days.map((d, i) => {
              const filled = i < streakFilled;
              return (
                <View key={d} style={styles.streakItem}>
                  <View style={[styles.starWrap, filled && styles.starWrapActive]}>
                    <Image
                      source={filled ? yellowStar : greyStar}
                      style={styles.starIcon}
                      resizeMode="contain"
                    />
                  </View>
                  <Text style={[styles.dayLabel, filled && styles.dayLabelActive]}>{d}</Text>
                </View>
              );
            })}
          </View>
        </View>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: Colors.backgroundBlue,
    position: "relative",
  },
  container: {
    flex: 1,
    backgroundColor: Colors.backgroundBlue,
  },
  content: {
    padding: 16,
    paddingBottom: 24,
  },
  fixedBottom: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  headerCard: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    padding: 16,
    borderRadius: 12,
    backgroundColor: Colors.menuBlue,
  },
  headerTextWrap: {
    flex: 1,
    paddingRight: 12,
  },
  welcomeTop: {
    color: "#fff",
    fontSize: 34,
    fontWeight: "900",
    letterSpacing: 1.2,
  },
  welcomeBottom: {
    color: "#fff",
    fontSize: 40,
    fontWeight: "900",
    marginTop: -6,
    letterSpacing: 1.2,
  },
  subtitle: {
    color: "#C8D0E0",
    marginTop: 8,
    fontSize: 16,
    textAlign: "left",
  },
  rocket: {
    width: 84,
    height: 84,
    marginLeft: 8,
  },
  section: {
    marginTop: 16,
  },
  sectionTitle: {
    color: "#fff",
    fontWeight: "700",
    marginBottom: 8,
  },
  smallLabel: {
    color: "#E6E9F2",
    fontSize: 12,
  },
  cardOuter: {
    borderRadius: 25,
    backgroundColor: "#FFFFFF", // true white border wrapper
    padding: 4, // border weight ~4
  },
  cardInner: {
    backgroundColor: Colors.lightBlue,
    borderRadius: 25,
    paddingVertical: 16,
    paddingHorizontal: 16,
  },
  cardTitle: {
    color: "#0A1A2B",
    fontSize: 20,
    fontWeight: "700",
    marginBottom: 8,
  },
  taskItem: {
    color: "#0A1A2B",
    marginBottom: 6,
  },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  progressRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
  },
  progressTrack: {
    height: 10,
    borderRadius: 5, // box rounding 5
    backgroundColor: Colors.menuBlue,
    marginTop: 8,
    overflow: "hidden",
    flex: 1,
    position: "relative",
  },
  progressFill: {
    height: "100%",
    backgroundColor: Colors.yellowstar, // #FFD058
    borderRadius: 5,
    minWidth: 8, // small peek even at 0
  },
  progressRight: {
    width: 64,
    alignItems: "flex-end",
    justifyContent: "center",
  },
  progressCount: {
    color: "#FFFFFF",
    fontWeight: "700",
  },
  progressUnits: {
    color: "#E6E9F2",
    fontSize: 10,
    marginTop: 2,
  },
  streakRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 4,
    paddingVertical: 6,
  },
  streakItem: {
    alignItems: "center",
    width: `${100 / 7}%`,
  },
  starWrap: {
    borderColor: Colors.borderGray, // #B1BACA
    borderWidth: 3,
    borderRadius: 999,
    padding: 2,
    marginBottom: 4,
  },
  starIcon: {
    width: 24,
    height: 24,
  },
  dayLabel: {
    color: "#E6E9F2",
    fontSize: 10,
  },
});

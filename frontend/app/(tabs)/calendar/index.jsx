import React, { useMemo, useState, useCallback } from "react";
import {
    SafeAreaView,
    ScrollView,
    View,
    Text,
    StyleSheet,
    TouchableOpacity,
    ActivityIndicator,
    useWindowDimensions,
} from "react-native";
import {
    addWeeks,
    addDays,
    startOfWeek,
    isSameDay,
    format,
} from "date-fns";
import { useFocusEffect } from "expo-router";
import Colors from "@/constants/Colors";
import CalendarEvent from "@/components/CalendarEvent";
import API from "@/api/api";
import {
    transformCalendarEntries,
    filterEventsForWeek,
    getEventsForDay,
    calculateTaskPosition,
} from "@/utils/calendarUtils";
const HOUR_HEIGHT = 60;
const DEADLINE_ROW_HEIGHT = 50;
const START_HOUR = 6;
const END_HOUR = 23;
const TIME_LABEL_WIDTH = 50;

function DeadlineRow({ days, deadlines, dayColumnWidth }) {
    return (
        <View style={styles.deadlineRow}>
            <View style={[styles.deadlineLabelCell, { width: TIME_LABEL_WIDTH }]}>
                <Text style={styles.deadlineLabelText}>Due</Text>
            </View>
            {days.map((day) => {
                const dayDeadlines = getEventsForDay(deadlines, day);
                return (
                    <View
                        key={day.toISOString()}
                        style={[styles.deadlineDayCell, { width: dayColumnWidth }]}
                    >
                        {dayDeadlines.slice(0, 2).map((deadline) => (
                            <CalendarEvent
                                key={deadline.id}
                                event={deadline}
                                compact
                                style={styles.deadlineEvent}
                            />
                        ))}
                        {dayDeadlines.length > 2 && (
                            <Text style={styles.moreText}>+{dayDeadlines.length - 2}</Text>
                        )}
                    </View>
                );
            })}
        </View>
    );
}

function WeekGrid({ weekStart, deadlines, tasks, screenWidth }) {
    const dayColumnWidth = (screenWidth - TIME_LABEL_WIDTH) / 7;
    
    const hours = useMemo(() => {
        const hrs = [];
        for (let i = START_HOUR; i <= END_HOUR; i++) hrs.push(i);
        return hrs;
    }, []);

    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const gridHeight = (END_HOUR - START_HOUR + 1) * HOUR_HEIGHT;

    const weekDeadlines = useMemo(() => filterEventsForWeek(deadlines, weekStart), [deadlines, weekStart]);
    const weekTasks = useMemo(() => filterEventsForWeek(tasks, weekStart), [tasks, weekStart]);

    return (
        <View style={styles.gridContainer}>
            {/* Day labels header */}
            <View style={styles.DayHeaderRow}>
                <View style={{ width: TIME_LABEL_WIDTH }} />
                {days.map((day) => {
                    const isToday = isSameDay(day, new Date());
                    return (
                    <View
                        key={day.toISOString()}
                            style={[styles.DayHeaderCell, { width: dayColumnWidth }]}
                    >
                            <Text style={[styles.DayHeaderText, isToday && styles.todayHeaderText]}>
                            {format(day, "EEE")}
                        </Text>
                            <View style={[styles.dayNumberContainer, isToday && styles.todayCircle]}>
                                <Text style={[styles.DayHeaderNumber, isToday && styles.todayNumber]}>
                            {format(day, "d")}
                        </Text>
                    </View>
                        </View>
                    );
                })}
            </View>

            {/* Deadline row */}
            <DeadlineRow days={days} deadlines={weekDeadlines} dayColumnWidth={dayColumnWidth} />

            {/* Time grid with tasks - scrollable */}
            <ScrollView
                style={styles.timeScrollView}
                contentContainerStyle={{ height: gridHeight }}
                showsVerticalScrollIndicator={true}
            >
                <View style={styles.timeGridRow}>
                    {/* Time Labels Column */}
                    <View style={[styles.timeLabelsCell, { width: TIME_LABEL_WIDTH }]}>
                        {hours.map((hour) => (
                            <View key={hour} style={[styles.timeLabelCell, { height: HOUR_HEIGHT }]}>
                                <Text style={styles.timeLabelText}>
                                    {format(new Date().setHours(hour, 0, 0, 0), "ha")}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Days Columns */}
                    {days.map((day) => {
                        const dayTasks = getEventsForDay(weekTasks, day)
                            .sort((a, b) => (a.taskOrder || 0) - (b.taskOrder || 0));
                        const isToday = isSameDay(day, new Date());
                        
                        return (
                        <View
                            key={day.toISOString()}
                                style={[
                                    styles.dayColumn,
                                    { width: dayColumnWidth, height: gridHeight },
                                    isToday && styles.todayColumn,
                                ]}
                            >
                            {hours.map((h) => (
                                    <View key={h} style={styles.hourCell} />
                                ))}
                                
                                {dayTasks.map((task, index) => {
                                    const position = calculateTaskPosition(dayTasks, index, HOUR_HEIGHT);
                                    const adjustedTop = position.top - (START_HOUR * HOUR_HEIGHT);
                                    
                                    if (adjustedTop < 0 || adjustedTop >= gridHeight) return null;
                                    
                                    return (
                                <View
                                            key={task.id}
                                            style={[
                                                styles.taskEventContainer,
                                                {
                                                    top: adjustedTop,
                                                    height: Math.min(position.height, gridHeight - adjustedTop),
                                                },
                                            ]}
                                        >
                                            <CalendarEvent event={task} style={styles.taskEvent} />
                                </View>
                                    );
                                })}
                        </View>
                        );
                    })}
                </View>
            </ScrollView>
        </View>
    );
}

export default function Calendar() {
    const { width: screenWidth } = useWindowDimensions();
    const today = new Date();
    const initialWeekStart = startOfWeek(today, { weekStartsOn: 1 });
    
    const [weekOffset, setWeekOffset] = useState(0);
    const [isLoading, setIsLoading] = useState(true);
    const [calendarData, setCalendarData] = useState({ deadlines: [], tasks: [] });

    const currentWeekStart = useMemo(() => addWeeks(initialWeekStart, weekOffset), [initialWeekStart, weekOffset]);

    const fetchCalendarEntries = useCallback(async () => {
        setIsLoading(true);
        try {
            const response = await API.get("/studyplans/calendar");
            const entries = response.data.entries || [];
            const transformed = transformCalendarEntries(entries);
            setCalendarData(transformed);
        } catch (err) {
            setCalendarData({ deadlines: [], tasks: [] });
        } finally {
            setIsLoading(false);
        }
    }, []);

    useFocusEffect(
        useCallback(() => {
            fetchCalendarEntries();
        }, [fetchCalendarEntries])
    );

    const goPrevWeek = () => setWeekOffset((prev) => prev - 1);
    const goNextWeek = () => setWeekOffset((prev) => prev + 1);
    const goToday = () => setWeekOffset(0);

    return (
            <SafeAreaView style={styles.basepage}>
            {/* Navigation Bar */}
                <View style={styles.navBar}>
                <TouchableOpacity onPress={goPrevWeek} style={styles.chevronBtn}>
                        <Text style={styles.chevronText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
                    <Text style={styles.todayBtnText}>Today</Text>
                    </TouchableOpacity>
                <TouchableOpacity onPress={goNextWeek} style={styles.chevronBtn}>
                        <Text style={styles.chevronText}>›</Text>
                    </TouchableOpacity>
                    <Text style={styles.navMonth}>
                    {format(currentWeekStart, "MMMM yyyy")}
                    </Text>
                {isLoading && (
                    <ActivityIndicator 
                        size="small" 
                        color={Colors.lightBlue} 
                        style={{ marginLeft: 10 }}
                    />
                )}
                </View>

            {/* Single Week Grid */}
            <WeekGrid 
                weekStart={currentWeekStart}
                deadlines={calendarData.deadlines}
                tasks={calendarData.tasks}
                screenWidth={screenWidth}
                />
            </SafeAreaView>
    );
}

const styles = StyleSheet.create({
    basepage: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
    },
    gridContainer: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
    },
    timeScrollView: {
        flex: 1,
    },
    timeGridRow: {
        flexDirection: "row",
    },
    DayHeaderRow: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 1,
    },
    DayHeaderCell: {
        alignItems: "center",
    },
    DayHeaderText: {
        color: Colors.gray400,
        fontSize: 11,
        fontWeight: "600",
        textTransform: "uppercase",
    },
    todayHeaderText: {
        color: Colors.lightBlue,
    },
    dayNumberContainer: {
        width: 26,
        height: 26,
        alignItems: "center",
        justifyContent: "center",
        borderRadius: 13,
        marginTop: 2,
    },
    todayCircle: {
        backgroundColor: Colors.buttonBlue,
    },
    DayHeaderNumber: {
        color: Colors.white,
        fontSize: 14,
        fontWeight: "600",
    },
    todayNumber: {
        color: Colors.white,
        fontWeight: "bold",
    },
    
    deadlineRow: {
        flexDirection: "row",
        minHeight: DEADLINE_ROW_HEIGHT,
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 1,
        backgroundColor: Colors.darkGray700,
    },
    deadlineLabelCell: {
        justifyContent: "center",
        alignItems: "center",
    },
    deadlineLabelText: {
        fontSize: 9,
        color: Colors.red400,
        fontWeight: "700",
        textTransform: "uppercase",
    },
    deadlineDayCell: {
        padding: 2,
        borderLeftColor: Colors.borderGray,
        borderLeftWidth: 1,
        justifyContent: "flex-start",
    },
    deadlineEvent: {
        marginBottom: 2,
        height: 18,
    },
    moreText: {
        fontSize: 8,
        color: Colors.gray500,
        textAlign: "center",
    },
    
    timeLabelCell: {
        paddingRight: 4,
        justifyContent: "flex-start",
    },
    timeLabelsCell: {
        borderRightColor: Colors.borderGray,
        borderRightWidth: 1,
    },
    timeLabelText: {
        fontSize: 9,
        color: Colors.gray600,
        textAlign: "right",
    },
    
    dayColumn: {
        borderLeftColor: Colors.borderGray,
        borderLeftWidth: 1,
        position: "relative",
    },
    todayColumn: {
        backgroundColor: "rgba(47, 63, 128, 0.15)",
    },
    hourCell: {
        height: HOUR_HEIGHT,
        borderTopColor: Colors.darkGray600,
        borderTopWidth: 1,
    },
    
    taskEventContainer: {
        position: "absolute",
        left: 1,
        right: 1,
        zIndex: 10,
    },
    taskEvent: {
        flex: 1,
        borderRadius: 3,
    },
    
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 12,
        paddingVertical: 8,
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 1,
        backgroundColor: Colors.backgroundBlue,
    },
    chevronBtn: {
        paddingHorizontal: 10,
        paddingVertical: 6,
        borderRadius: 4,
        backgroundColor: Colors.darkGray600,
    },
    chevronText: {
        color: Colors.white,
        fontSize: 18,
        fontWeight: "600",
    },
    todayBtn: {
        marginHorizontal: 8,
        paddingHorizontal: 14,
        paddingVertical: 6,
        borderRadius: 16,
        backgroundColor: Colors.buttonBlue,
    },
    todayBtnText: {
        color: Colors.white,
        fontWeight: "600",
        fontSize: 13,
    },
    navMonth: {
        marginLeft: 12,
        color: Colors.white,
        fontSize: 16,
        fontWeight: "700",
    },
});

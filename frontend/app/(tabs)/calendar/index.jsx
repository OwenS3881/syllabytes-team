import React, { useMemo, useEffect, useRef, useState } from "react";
import {
    SafeAreaView,
    ScrollView,
    FlatList,
    Dimensions,
    View,
    Text,
    StyleSheet,
    Image,
    TouchableOpacity,
} from "react-native";
import {
    addWeeks,
    addDays,
    startOfWeek,
    isSameDay,
    format,
    differenceInMinutes,
    isSameHour,
} from "date-fns";
import Colors from "@/constants/Colors";
import CalendarEvent from "@/components/CalendarEvent";

const SCREEN_WIDTH = Dimensions.get("window").width; // have width to adjust grid
const DAY_COLUMN_WIDTH = (SCREEN_WIDTH - 56) / 7;
const HOUR_HEIGHT = 60; // pixels per hour

function WeekGrid({ weekStart, events }) {
    const hours = useMemo(() => {
        const hrs = [];
        for (let i = 0; i < 24; i++) {
            hrs.push(i);
        }
        return hrs;
    }, []);

    const days = useMemo(() => {
        return Array.from({ length: 7 }).map((_, i) => addDays(weekStart, i));
    }, [weekStart]);

    const gridHeight = 24 * HOUR_HEIGHT; // 24 hours

    return (
        <View
            style={[
                styles.gridContainer,
                { height: gridHeight, width: SCREEN_WIDTH },
            ]}
        >
            {/* month & year label header */}
            <View style={styles.MonthHeader}>
                <Text style={styles.MonthHeaderText}>
                    {format(weekStart, "MMMM yyyy")}
                </Text>
            </View>

            {/* day labels header */}
            <View style={styles.DayHeaderRow}>
                <View style={styles.timeLabelCell} />
                {days.map((day) => (
                    <View
                        key={day.toISOString()}
                        style={[
                            styles.DayHeaderCell,
                            { width: DAY_COLUMN_WIDTH },
                        ]}
                    >
                        <Text style={styles.DayHeaderText}>
                            {format(day, "EEE")}
                        </Text>
                        <Text style={styles.DayHeaderNumber}>
                            {format(day, "d")}
                        </Text>
                    </View>
                ))}
            </View>

            {/* scrollable times + day columns */}
            <ScrollView
                style={{ flex: 1 }}
                contentContainerStyle={{ height: gridHeight }}
            >
                <View style={{ flexDirection: "row", flex: 1 }}>
                    {/* Time Labels Column */}
                    <View style={styles.timeLabelsCell}>
                        {hours.map((hour) => (
                            <View
                                key={hour}
                                style={[
                                    styles.timeLabelCell,
                                    { height: HOUR_HEIGHT },
                                ]}
                            >
                                <Text style={styles.timeLabelText}>
                                    {format(
                                        new Date().setHours(hour, 0, 0, 0),
                                        "ha"
                                    )}
                                </Text>
                            </View>
                        ))}
                    </View>

                    {/* Days Columns */}
                    {days.map((day) => (
                        <View
                            key={day.toISOString()}
                            style={{
                                width: DAY_COLUMN_WIDTH,
                                borderLeftColor: Colors.borderGray,
                                borderLeftWidth: 1,
                            }}
                        >
                            {/* Horizontal hour lines */}
                            {hours.map((h) => (
                                <View
                                    key={h}
                                    style={{
                                        height: HOUR_HEIGHT,
                                        borderTopColor: Colors.borderGray,
                                        borderTopWidth: 1,
                                    }}
                                >
                                    {isSameDay(day, Date.now()) && (
                                        <CalendarEvent />
                                    )}
                                </View>
                            ))}
                            {/* Event rendering as a component TB made*/}
                        </View>
                    ))}
                </View>
            </ScrollView>
        </View>
    );
}

export default function Calendar() {
    const today = new Date();
    const initialWeekStart = startOfWeek(new Date(), { weekStartsOn: 1 }); // Monday starts week
    const pivot = 200; // arbitrary pivot date for event generation
    const weeks = Array.from({ length: pivot * 2 + 1 }, (_, i) => i - pivot);
    const [visibleWeekStart, setVisibleWeekStart] = useState(initialWeekStart);
    const [currentOffset, setCurrentOffset] = useState(0); // offset from pivot

    const listRef = useRef(null);
    const renderWeek = ({ item }) => (
        <WeekGrid weekStart={addWeeks(initialWeekStart, item)} events={[]} />
    );

    const onViewableItemsChanged = useRef(({ viewableItems }) => {
        const first = viewableItems[0];
        if (first) {
            const offset = first.item; // -200..+200
            setCurrentOffset(offset);
            setVisibleWeekStart(addWeeks(initialWeekStart, offset));
        }
    }).current;

    const goPrevWeek = () =>
        listRef.current?.scrollToIndex({
            index: pivot + (currentOffset - 1),
            animated: true,
        });
    const goNextWeek = () =>
        listRef.current?.scrollToIndex({
            index: pivot + (currentOffset + 1),
            animated: true,
        });
    const goToday = () =>
        listRef.current?.scrollToIndex({ index: pivot, animated: true });

    return (
        <ScrollView>
            <SafeAreaView style={styles.basepage}>
                <View style={styles.navBar}>
                    <TouchableOpacity
                        onPress={goPrevWeek}
                        style={styles.chevronBtn}
                    >
                        <Text style={styles.chevronText}>‹</Text>
                    </TouchableOpacity>
                    <TouchableOpacity onPress={goToday} style={styles.todayBtn}>
                        <Text style={styles.todayText}>Today</Text>
                    </TouchableOpacity>
                    <TouchableOpacity
                        onPress={goNextWeek}
                        style={styles.chevronBtn}
                    >
                        <Text style={styles.chevronText}>›</Text>
                    </TouchableOpacity>
                    <Text style={styles.navMonth}>
                        {format(visibleWeekStart, "MMMM yyyy")}
                    </Text>
                </View>

                <FlatList
                    ref={listRef}
                    horizontal
                    pagingEnabled
                    data={weeks}
                    keyExtractor={(i) => String(i)}
                    renderItem={renderWeek}
                    initialScrollIndex={pivot}
                    getItemLayout={(_, index) => ({
                        length: SCREEN_WIDTH,
                        offset: SCREEN_WIDTH * index,
                        index,
                    })}
                    onViewableItemsChanged={onViewableItemsChanged}
                    viewabilityConfig={{ itemVisiblePercentThreshold: 60 }}
                    showsHorizontalScrollIndicator={false}
                    style={{ flex: 1, alignSelf: "stretch" }}
                />
            </SafeAreaView>
        </ScrollView>
    );
}

const styles = StyleSheet.create({
    basepage: {
        flex: 1,
        justifyContent: "center",
        alignItems: "center",
        backgroundColor: Colors.backgroundBlue,
        color: Colors.backgroundBlue,
    },
    gridContainer: {
        flex: 1,
        backgroundColor: Colors.backgroundBlue,
        zIndex: 5,
    },
    MonthHeader: {
        paddingVertical: 14,
        alignItems: "center",
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 2,
    },
    MonthHeaderText: {
        color: Colors.white,
        fontSize: 24,
        fontWeight: "bold",
    },
    DayHeaderRow: {
        flexDirection: "row",
        paddingVertical: 8,
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 2,
    },
    timeLabelCell: {
        width: 56,
        paddingRight: 6,
    },
    timeLabelsCell: {
        borderRightColor: Colors.borderGray,
        borderRightWidth: 1,
    },
    DayHeaderCell: {
        alignItems: "center",
    },
    DayHeaderText: {
        color: Colors.white,
        fontSize: 16,
        fontWeight: "bold",
    },
    DayHeaderNumber: {
        color: Colors.white,
        fontSize: 14,
    },
    timeLabelText: {
        fontSize: 12,
        color: Colors.gray500,
        textAlign: "right",
    },
    navBar: {
        flexDirection: "row",
        alignItems: "center",
        paddingHorizontal: 8,
        paddingVertical: 4,
        borderBottomColor: Colors.borderGray,
        borderBottomWidth: 1,
    },
    chevronBtn: {
        paddingHorizontal: 3,
        paddingVertical: 1,
        borderRadius: 3,
        backgroundColor: Colors.darkGray600,
    },
    chevronText: {
        color: Colors.white,
        fontSize: 20,
        fontWeight: "600",
    },
    todayBtn: {
        marginHorizontal: 8,
        paddingHorizontal: 12,
        paddingVertical: 6,
        borderRadius: 14,
        backgroundColor: Colors.darkGray600,
    },
    todayText: {
        color: Colors.white,
        fontWeight: "600",
    },
    navMonth: {
        marginLeft: 10,
        color: Colors.white,
        fontSize: 18,
        fontWeight: "700",
    },
});

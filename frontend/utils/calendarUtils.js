import { parseISO, isWithinInterval, isSameDay, addDays, startOfDay, differenceInDays, subDays } from "date-fns";
import Colors from "@/constants/Colors";

// Color mapping for different assessment types
export const assessmentColors = {
    "Assignment": Colors.blue400,
    "Exam": Colors.red400,
    "Peer Review": Colors.green400,
    "Quiz": Colors.yellow500,
    "Project": Colors.buttonBlue,
    "Presentation": "#9B59B6",
    "Lab": "#1ABC9C",
    default: Colors.lightBlue,
};

export const getColorByType = (assessmentType) => {
    return assessmentColors[assessmentType] || assessmentColors.default;
};

// Parse estimated time to hours (handles strings like "3-4 hours" or numbers)
export const parseEstimatedTime = (timeValue) => {
    if (timeValue === null || timeValue === undefined) return 1.5; // Default 1.5 hours
    
    // If it's already a number, return it directly (assume hours)
    if (typeof timeValue === "number") {
        return timeValue > 0 ? timeValue : 1.5;
    }
    
    // Convert to string if not already
    const timeStr = String(timeValue);
    
    const match = timeStr.match(/(\d+(?:\.\d+)?)(?:\s*-\s*(\d+(?:\.\d+)?))?\s*(hour|hr|minute|min)?/i);
    if (!match) return 1.5;
    
    const min = parseFloat(match[1]);
    const max = match[2] ? parseFloat(match[2]) : min;
    const avg = (min + max) / 2;
    
    // Check if it's minutes
    if (match[3] && match[3].toLowerCase().startsWith("min")) {
        return avg / 60;
    }
    
    return avg;
};

/**
 * Normalize a task into a consistent object format
 * Handles: strings, objects with task/taskName/name/title properties
 */
const normalizeTask = (task) => {
    // If task is a plain string, convert it to an object
    if (typeof task === "string") {
        return {
            task: task,
            description: task,
            estimatedTime: null,
        };
    }
    
    // If task is an object, normalize the title property
    const title = task.task || task.taskName || task.name || task.title || task.description || "";
    const description = task.description || task.taskDetails || title;
    const estimatedTime = task.estimatedTime || task.estimatedHours || task.taskDuration || task.allocatedTime || null;
    
    return {
        task: title,
        description: description,
        estimatedTime: estimatedTime,
    };
};

/**
 * Intelligently distribute tasks across available days
 * Strategy: 
 * 1. Use study period if available, otherwise work backwards from due date
 * 2. Distribute tasks proportionally based on estimated time
 * 3. Try to fit ~4-6 hours of work per day max
 * 4. Earlier tasks go on earlier days (logical progression)
 */
const distributeTasks = (tasks, studyPeriod, dueDate) => {
    if (!tasks || tasks.length === 0) return [];
    
    // Normalize and calculate estimated hours for each task
    const tasksWithHours = tasks.map((task, idx) => {
        const normalized = normalizeTask(task);
        return {
            ...normalized,
            originalIndex: idx,
            estimatedHours: parseEstimatedTime(normalized.estimatedTime),
        };
    });
    
    const totalHours = tasksWithHours.reduce((sum, t) => sum + t.estimatedHours, 0);
    
    // Determine available days
    let startDate, endDate;
    
    if (studyPeriod?.start && studyPeriod?.end) {
        startDate = parseISO(studyPeriod.start);
        endDate = parseISO(studyPeriod.end);
    } else if (dueDate) {
        // No study period - work backwards from due date
        // Estimate: need roughly totalHours / 4 days (4 hours/day max)
        const daysNeeded = Math.max(1, Math.ceil(totalHours / 4));
        endDate = subDays(parseISO(dueDate), 1); // Day before due date
        startDate = subDays(endDate, daysNeeded - 1);
    } else {
        // No dates at all - return tasks without dates (won't show on calendar)
        return tasksWithHours.map(t => ({ ...t, assignedDate: null }));
    }
    
    const totalDays = Math.max(1, differenceInDays(endDate, startDate) + 1);
    const hoursPerDay = totalHours / totalDays;
    
    // Distribute tasks across days
    const distributedTasks = [];
    let currentDayIndex = 0;
    let hoursOnCurrentDay = 0;
    const maxHoursPerDay = Math.max(hoursPerDay * 1.5, 3); // Flexible cap
    
    tasksWithHours.forEach((task) => {
        // If this task would overflow the day and we have more days, move to next day
        if (hoursOnCurrentDay > 0 && 
            hoursOnCurrentDay + task.estimatedHours > maxHoursPerDay && 
            currentDayIndex < totalDays - 1) {
            currentDayIndex++;
            hoursOnCurrentDay = 0;
        }
        
        const assignedDate = addDays(startDate, currentDayIndex);
        
        distributedTasks.push({
            ...task,
            assignedDate: assignedDate.toISOString().split('T')[0],
            dayIndex: currentDayIndex,
        });
        
        hoursOnCurrentDay += task.estimatedHours;
        
        // If we've exceeded reasonable hours, move to next day for subsequent tasks
        if (hoursOnCurrentDay >= maxHoursPerDay && currentDayIndex < totalDays - 1) {
            currentDayIndex++;
            hoursOnCurrentDay = 0;
        }
    });
    
    return distributedTasks;
};

/**
 * Transform backend calendar entries into calendar-displayable events
 * @param {Array} entries - Calendar entries from backend
 * @returns {Object} { deadlines: [], tasks: [] }
 */
export const transformCalendarEntries = (entries) => {
    const deadlines = [];
    const tasks = [];
    
    if (!entries || !Array.isArray(entries)) {
        return { deadlines, tasks };
    }
    
    entries.forEach((entry, entryIndex) => {
        const color = getColorByType(entry.assessmentType);
        
        // Create deadline event for due date
        if (entry.dueDate) {
            deadlines.push({
                id: `deadline-${entryIndex}`,
                type: "deadline",
                title: entry.assessmentName,
                course: entry.course,
                assessmentType: entry.assessmentType,
                date: entry.dueDate,
                color,
            });
        }
        
        // Distribute tasks intelligently across study period
        if (entry.tasks && entry.tasks.length > 0) {
            const distributedTasks = distributeTasks(
                entry.tasks,
                entry.studyPeriod,
                entry.dueDate
            );
            
            distributedTasks.forEach((task, taskIndex) => {
                if (!task.assignedDate) return;
                
                const taskTitle = (task.task || "").trim();
                if (!taskTitle) return;
                
                tasks.push({
                    id: `task-${entryIndex}-${taskIndex}`,
                    type: "task",
                    title: taskTitle,
                    description: task.description || taskTitle,
                    estimatedTime: task.estimatedTime,
                    estimatedHours: task.estimatedHours,
                    course: entry.course,
                    parentAssessment: entry.assessmentName,
                    assessmentType: entry.assessmentType,
                    date: task.assignedDate,
                    dueDate: entry.dueDate,
                    studyPeriodStart: entry.studyPeriod?.start,
                    studyPeriodEnd: entry.studyPeriod?.end,
                    color,
                    taskOrder: task.originalIndex,
                });
            });
        }
    });
    
    return { deadlines, tasks };
};

/**
 * Filter events for a specific week
 * @param {Array} events - All events (deadlines or tasks)
 * @param {Date} weekStart - Start of the week (Monday)
 * @returns {Array} Events within the week
 */
export const filterEventsForWeek = (events, weekStart) => {
    const weekEnd = addDays(weekStart, 6);
    
    return events.filter((event) => {
        const eventDate = parseISO(event.date);
        return isWithinInterval(eventDate, { start: startOfDay(weekStart), end: startOfDay(addDays(weekEnd, 1)) });
    });
};

/**
 * Get events for a specific day
 * @param {Array} events - Events to filter
 * @param {Date} day - The day to filter for
 * @returns {Array} Events on that day
 */
export const getEventsForDay = (events, day) => {
    return events.filter((event) => {
        const eventDate = parseISO(event.date);
        return isSameDay(eventDate, day);
    });
};

/**
 * Calculate vertical position for tasks on a day
 * Tasks are stacked starting at 9 AM with their estimated duration
 * @param {Array} dayTasks - All tasks for this day (sorted by taskOrder)
 * @param {number} taskIndex - Index of current task in dayTasks
 * @param {number} hourHeight - Height of one hour in pixels
 * @returns {Object} { top, height }
 */
export const calculateTaskPosition = (dayTasks, taskIndex, hourHeight) => {
    const START_HOUR = 9; // Start showing tasks at 9 AM
    const MIN_HEIGHT = hourHeight * 0.75; // Minimum 45 min display height
    const MAX_HEIGHT = hourHeight * 2.5; // Maximum 2.5 hours display height
    
    // Calculate cumulative start time based on previous tasks
    let cumulativeHours = 0;
    for (let i = 0; i < taskIndex; i++) {
        const prevTask = dayTasks[i];
        const prevDuration = Math.min(prevTask.estimatedHours || 1.5, 2.5);
        cumulativeHours += prevDuration + 0.25; // Add 15 min gap between tasks
    }
    
    const startHour = START_HOUR + cumulativeHours;
    const task = dayTasks[taskIndex];
    const duration = task.estimatedHours || 1.5;
    
    // Cap display height but preserve task info
    const displayHeight = Math.max(MIN_HEIGHT, Math.min(duration * hourHeight, MAX_HEIGHT));
    
    return {
        top: startHour * hourHeight,
        height: displayHeight,
    };
};


import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView, FlatList, Modal, TextInput } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";
import { useSyllabus } from "@/context/SyllabusContext";
import { useRouter } from "expo-router";

export default function SyllabusScreen() {
  const insets = useSafeAreaInsets();
  const availableHeight = Math.max(0, screenHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const [courses, setCourses] = useState([]);
  const [activeIndex, setActiveIndex] = useState(0);
  const listRef = useRef(null);
  const { setCourses: setCoursesCtx, setRawResult: setRawResultCtx, setUploadId: setUploadIdCtx, setUploadedFiles: setUploadedFilesCtx } = useSyllabus();
  const router = useRouter();

  const allowedMimeTypes = useMemo(() => [
    "application/pdf",
    "application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  ], []);

  const allowedExtensions = useMemo(() => new Set(["pdf", "docx"]), []);

  const apiBaseUrl = useMemo(() => {
    if (Platform.OS === "web" && typeof window !== "undefined") {
      return `${window.location.protocol}//${window.location.hostname}:3000`;
    }
    return "http://localhost:3000";
  }, []);

  const validateFile = useCallback((file) => {
    const name = file.name || "file";
    const ext = name.split(".").pop()?.toLowerCase();
    const typeOk = file.mimeType ? allowedMimeTypes.includes(file.mimeType) : true;
    const extOk = ext ? allowedExtensions.has(ext) : false;
    if (!typeOk && !extOk) return false;
    if (file.size && file.size > 20 * 1024 * 1024) return false;
    return true;
  }, [allowedMimeTypes, allowedExtensions]);

  const onPressUpload = useCallback(async () => {
    setError(null);
    setResult(null);
    setStatus("idle");
    const res = await DocumentPicker.getDocumentAsync({
      type: allowedMimeTypes,
      multiple: true,
      copyToCacheDirectory: true,
    });
    if (res.canceled) return;
    const files = (res.assets || []).filter(validateFile);
    if (files.length === 0) {
      setError("Only .pdf and .docx files under 20MB are supported.");
      return;
    }

    setStatus("uploading");
    try {
      const form = new FormData();
      for (const f of files) {
        const name = f.name || (f.mimeType === "application/pdf" ? "upload.pdf" : "upload.docx");
        if (Platform.OS === "web") {
          const blob = await (await fetch(f.uri)).blob();
          const webFile = new File([blob], name, { type: f.mimeType || "application/octet-stream" });
          form.append("files", webFile);
        } else {
          form.append("files", { uri: f.uri, name, type: f.mimeType || "application/octet-stream" });
        }
      }

      const uploadResp = await fetch(`${apiBaseUrl}/api/uploads`, { method: "POST", body: form });
      if (!uploadResp.ok) throw new Error("Upload failed");
      const { uploadId } = await uploadResp.json();
      setUploadIdCtx(uploadId);
      setStatus("processing");

      let attempts = 0;
      const maxAttempts = 60;
      const delay = (ms) => new Promise((r) => setTimeout(r, ms));
      while (attempts < maxAttempts) {
        const s = await fetch(`${apiBaseUrl}/api/uploads/${uploadId}`);
        if (s.ok) {
          const data = await s.json();
          if (data.status === "completed") {
            setResult(data.result);
            if (Array.isArray(data.files)) {
              setUploadedFilesCtx(data.files);
            }
            setStatus("done");
            return;
          }
          if (data.status === "error") {
            throw new Error(data.message || "Processing error");
          }
        }
        attempts += 1;
        await delay(1000);
      }
      throw new Error("Timed out waiting for processing");
    } catch (e) {
      setError(e.message || "Upload error");
      setStatus("error");
    }
  }, [allowedMimeTypes, apiBaseUrl, validateFile]);

  // normalize webhook payload into course array
  const normalizeSyllabusResult = useCallback((payload) => {
    if (!payload) return [];
    if (Array.isArray(payload)) {
      // [{ syllabi: [...courses] }]
      if (payload.length === 1 && Array.isArray(payload[0]?.syllabi)) {
        const list = payload[0].syllabi;
        return list.map((c) => ({
          name: c.course || c.courseName || c.name || "Course",
          exams: c.exams || [],
          projects: c.projects || [],
          assignments: c.assignments || [],
          quizzes: c.quizzes || [],
        }));
      }
      // array of courses
      const looksLikeCourses = payload.every(
        (c) =>
          c &&
          typeof c === "object" &&
          (Array.isArray(c.exams) ||
            Array.isArray(c.projects) ||
            Array.isArray(c.assignments) ||
            Array.isArray(c.quizzes) ||
            c.course ||
            c.courseName ||
            c.name)
      );
      if (looksLikeCourses) {
        return payload.map((c) => ({
          name: c.course || c.courseName || c.name || "Course",
          exams: c.exams || [],
          projects: c.projects || [],
          assignments: c.assignments || [],
          quizzes: c.quizzes || [],
        }));
      }
      return [];
    }
    // { syllabi: [...courses] }
    if (Array.isArray(payload.syllabi)) {
      const list = payload.syllabi;
      return list.map((c) => ({
        name: c.course || c.courseName || c.name || "Course",
        exams: c.exams || [],
        projects: c.projects || [],
        assignments: c.assignments || [],
        quizzes: c.quizzes || [],
      }));
    }
    if (Array.isArray(payload.courses)) return payload.courses;
    if (payload.data && Array.isArray(payload.data.courses)) return payload.data.courses;
    // object keyed by course name
    const keys = Object.keys(payload || {}).filter((k) => {
      const v = payload[k];
      return typeof v === "object" && v !== null && !Array.isArray(v);
    });
    const looksLikeCourseMap = keys.length > 0 && !("files" in payload) && !("summary" in payload) && !("uploadId" in payload);
    if (looksLikeCourseMap) {
      return keys.map((name) => {
        const course = payload[name] || {};
        return {
          name: course.name || course.courseName || name,
          exams: course.exams || course.Exams || [],
          projects: course.projects || course.Projects || [],
          assignments: course.assignments || course.Assignments || [],
          quizzes: course.quizzes || course.Quizzes || [],
        };
      });
    }
    // single course fallback
    if (payload.course || payload.courseName) {
      return [{
        name: payload.course?.name || payload.courseName || "Course",
        exams: payload.exams || [],
        projects: payload.projects || [],
        assignments: payload.assignments || [],
        quizzes: payload.quizzes || [],
      }];
    }
    return [];
  }, []);

  useEffect(() => {
    if (status === "done" && result) {
      const normalized = normalizeSyllabusResult(result);
      setCourses(normalized);
      setCoursesCtx(normalized);
      setRawResultCtx(result);
      setActiveIndex(0);
    }
  }, [status, result, normalizeSyllabusResult]);

  const handleGoLeft = useCallback(() => {
    if (courses.length === 0) return;
    const next = (activeIndex - 1 + courses.length) % courses.length;
    setActiveIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [activeIndex, courses.length]);

  const handleGoRight = useCallback(() => {
    if (courses.length === 0) return;
    const next = (activeIndex + 1) % courses.length;
    setActiveIndex(next);
    listRef.current?.scrollToIndex({ index: next, animated: true });
  }, [activeIndex, courses.length]);

  const updateCourseSection = useCallback((courseIdx, sectionKey, updater) => {
    setCourses((prev) => {
      const next = [...prev];
      const course = { ...next[courseIdx] };
      const currentSection = Array.isArray(course[sectionKey]) ? course[sectionKey] : [];
      course[sectionKey] = updater(currentSection);
      next[courseIdx] = course;
      return next;
    });
  }, []);

  const renderActiveCourse = useCallback(() => {
    const item = courses[activeIndex];
    if (!item) return null;
    return (
      <CoursePage
        key={`course-${activeIndex}`}
        course={item}
        courseIndex={activeIndex}
        availableHeight={availableHeight}
        onEditSection={(section, updater) => updateCourseSection(activeIndex, section, updater)}
      />
    );
  }, [courses, activeIndex, availableHeight, updateCourseSection]);

  return (
    <View style={[
      styles.mockpage,
      { paddingTop: insets.top, paddingBottom: TAB_BAR_HEIGHT + insets.bottom }
    ]}>
      {status === "uploading" || status === "processing" ? (
        <View style={[styles.uploadBox, { minHeight: Math.max(320, availableHeight * 0.7) }]}>
          <Text style={styles.loadingText}>Loading...</Text>
        </View>
      ) : result ? (
        courses.length > 0 ? (
          <ScrollView
            style={styles.carouselScroll}
            contentContainerStyle={{ alignItems: "center", paddingBottom: TAB_BAR_HEIGHT + 12 }}
          >
            <View style={styles.carouselContainer}>
            <Text style={styles.headerText}>Does this info look correct?</Text>
            <View style={styles.carouselControls}>
              <TouchableOpacity onPress={handleGoLeft} style={styles.navButton} accessibilityLabel="Previous course">
                <Feather name="chevron-left" size={24} color={Colors.white} />
              </TouchableOpacity>
              <Text style={styles.carouselTitle}>
                {courses[activeIndex]?.name || "Course"}
              </Text>
              <TouchableOpacity onPress={handleGoRight} style={styles.navButton} accessibilityLabel="Next course">
                <Feather name="chevron-right" size={24} color={Colors.white} />
              </TouchableOpacity>
            </View>
            <View style={{ width: "100%" }}>
              {renderActiveCourse()}
            </View>
            <View style={styles.buttonRow}>
              <TouchableOpacity
                activeOpacity={0.8}
                style={[styles.ctaButton, styles.secondaryButton]}
                onPress={() => { setResult(null); setCourses([]); setStatus("idle"); }}
              >
                <Text style={styles.tryAgainText}>Upload more</Text>
              </TouchableOpacity>
              <ContinueButton courses={courses} onContinue={() => router.push("/(tabs)/syllabus/questions")} />
            </View>
            </View>
          </ScrollView>
        ) : (
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ alignItems: "center" }}>
            <Text style={styles.resultTitle}>Preview</Text>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.tryAgain} onPress={() => { setResult(null); setStatus("idle"); }}>
            <Text style={styles.tryAgainText}>Upload more</Text>
          </TouchableOpacity>
        </ScrollView>
        )
      ) : (
        <TouchableOpacity
          activeOpacity={0.8}
          style={[styles.uploadBox, { minHeight: Math.max(320, availableHeight * 0.7) }]}
          onPress={onPressUpload}
        >
          <Feather name="upload" size={40} color={Colors.lightBlue} />
          <Text style={styles.uploadTitle}>Upload Syllabi</Text>
          <Text style={styles.uploadSubtext}>.doc, .docx, and .pdf files supported.</Text>
          {error ? <Text style={styles.errorText}>{error}</Text> : null}
        </TouchableOpacity>
      )}
    </View>
  );
}

const { height: screenHeight } = Dimensions.get("window");
const TAB_BAR_HEIGHT = 85; // matches components/Menu.jsx

const styles = StyleSheet.create({
  mockpage: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: Colors.backgroundBlue,
    color: Colors.backgroundBlue,
  },
  carouselScroll: {
    width: "100%",
  },
  uploadBox: {
    width: "92%",
    paddingVertical: 40,
    paddingHorizontal: 20,
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.borderGray,
    backgroundColor: "rgba(64, 71, 94, 0.25)",
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
  },
  carouselContainer: {
    width: "92%",
    backgroundColor: "rgba(64, 71, 94, 0.25)",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.borderGray,
    padding: 12,
    gap: 10,
  },
  headerText: {
    color: Colors.backgroundBlue,
    textAlign: "center",
    fontSize: 16,
    fontWeight: "600",
    backgroundColor: Colors.white,
    paddingVertical: 8,
    borderRadius: 12,
    overflow: "hidden",
  },
  carouselControls: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingHorizontal: 8,
    marginBottom: 6,
  },
  carouselTitle: {
    flex: 1,
    textAlign: "center",
    color: Colors.lightBlue,
    fontSize: 18,
    fontWeight: "700",
  },
  navButton: {
    padding: 6,
  },
  uploadTitle: {
    marginTop: 6,
    fontSize: 18,
    fontWeight: "600",
    color: Colors.lightBlue,
    textAlign: "center",
  },
  uploadSubtext: {
    marginTop: 2,
    fontSize: 13,
    color: Colors.borderGray,
    textAlign: "center",
  },
  loadingText: {
    fontSize: 16,
    color: Colors.borderGray,
  },
  errorText: {
    marginTop: 8,
    color: "#ff6b6b",
    fontSize: 13,
  },
  resultContainer: {
    width: "92%",
    backgroundColor: "rgba(64, 71, 94, 0.25)",
    borderRadius: 16,
    borderWidth: 2,
    borderStyle: "dashed",
    borderColor: Colors.borderGray,
    padding: 16,
    maxHeight: Math.max(320, screenHeight * 0.7),
  },
  resultTitle: {
    fontSize: 18,
    fontWeight: "600",
    color: Colors.lightBlue,
    marginBottom: 8,
    textAlign: "center",
  },
  resultJson: {
    width: "100%",
    color: "white",
    fontFamily: Platform.OS === "web" ? "monospace" : undefined,
  },
  tryAgain: {
    marginTop: 16,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.buttonBlue,
    borderRadius: 10,
  },
  tryAgainText: {
    color: "white",
    fontWeight: "600",
  },
  buttonRow: {
    flexDirection: "row",
    gap: 10,
    width: "100%",
    marginTop: 12,
  },
  ctaButton: {
    flex: 1,
    alignSelf: "center",
    paddingVertical: 10,
    paddingHorizontal: 16,
    backgroundColor: Colors.green600,
    borderRadius: 10,
    alignItems: "center",
  },
  secondaryButton: {
    backgroundColor: Colors.buttonBlue,
  },
  disabledButton: {
    opacity: 0.6,
  },
  // course page
  courseCard: {
    width: "100%",
    flex: 1,
    paddingHorizontal: 6,
  },
  courseContent: {
    width: "100%",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    backgroundColor: "rgba(0,0,0,0.15)",
    padding: 12,
    gap: 8,
  },
  sectionContainer: {
    borderRadius: 12,
    borderWidth: 1,
    borderColor: Colors.borderGray,
    backgroundColor: "rgba(255,255,255,0.05)",
    padding: 10,
    marginBottom: 8,
  },
  sectionHeader: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginBottom: 6,
  },
  sectionTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "600",
  },
  editButton: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: Colors.buttonBlue,
  },
  editButtonText: {
    color: Colors.white,
    fontWeight: "600",
  },
  itemsScrollArea: {
    maxHeight: 140,
  },
  itemRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    paddingVertical: 6,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: "rgba(255,255,255,0.1)",
  },
  itemText: {
    color: Colors.white,
  },
  itemDate: {
    color: Colors.gray400,
    marginLeft: 12,
  },
  emptyText: {
    color: Colors.gray300,
    fontStyle: "italic",
  },
  // modal
  modalOverlay: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.6)",
    justifyContent: "center",
    alignItems: "center",
    padding: 16,
  },
  modalCard: {
    width: "92%",
    backgroundColor: Colors.menuBlue,
    borderRadius: 12,
    padding: 14,
  },
  modalTitle: {
    color: Colors.white,
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 8,
  },
  input: {
    backgroundColor: Colors.gray200,
    borderRadius: 8,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginVertical: 6,
    fontSize: 14,
  },
  missingBanner: {
    backgroundColor: Colors.menuBlue,
    borderRadius: 10,
    paddingVertical: 8,
    paddingHorizontal: 10,
    marginBottom: 8,
    borderWidth: 1,
    borderColor: Colors.borderGray,
  },
  missingBannerText: {
    color: Colors.white,
    fontWeight: "600",
  },
  modalActions: {
    marginTop: 10,
    flexDirection: "row",
    justifyContent: "flex-end",
    gap: 10,
  },
  danger: {
    backgroundColor: Colors.red500,
  },
});

function CoursePage({ course, courseIndex, availableHeight, onEditSection }) {
  const [modalVisible, setModalVisible] = useState(false);
  const [modalSection, setModalSection] = useState(null);
  const [newTitle, setNewTitle] = useState("");
  const [newDue, setNewDue] = useState("");
  const [editingIndex, setEditingIndex] = useState(null);

  const openEdit = (section, targetIndex = null) => {
    setModalSection(section);
    if (targetIndex !== null && Array.isArray(course[section]) && course[section][targetIndex]) {
      const it = course[section][targetIndex];
      setNewTitle(it.title || it.name || "");
      setNewDue(it.dueDate || it.date || "");
      setEditingIndex(targetIndex);
    } else {
      setNewTitle("");
      setNewDue("");
      setEditingIndex(null);
    }
    setModalVisible(true);
  };

  const closeEdit = () => {
    setModalVisible(false);
    setEditingIndex(null);
  };

  const handleAddItem = () => {
    if (!modalSection) return;
    const trimmedTitle = (newTitle || "").trim();
    const trimmedDue = (newDue || "").trim();
    if (!trimmedTitle || !trimmedDue) {
      return;
    }
    if (editingIndex !== null) {
      onEditSection(modalSection, (items) => {
        const next = [...items];
        const existing = next[editingIndex] || {};
        next[editingIndex] = { ...existing, title: trimmedTitle, name: trimmedTitle, dueDate: trimmedDue };
        return next;
      });
    } else {
      onEditSection(modalSection, (items) => [...items, { title: trimmedTitle, name: trimmedTitle, dueDate: trimmedDue }]);
    }
    setNewTitle("");
    setNewDue("");
    setEditingIndex(null);
  };

  const handleDeleteItem = (idx) => {
    if (!modalSection) return;
    onEditSection(modalSection, (items) => items.filter((_, i) => i !== idx));
  };

  const renderItems = (list, label) => {
    if (!list || list.length === 0) {
      return (
        <Text style={styles.emptyText}>
          Orbit couldn't detect any {label?.toLowerCase?.()}. Would you like to add some?
        </Text>
      );
    }
    return (
      <>
        {list.map((it, idx) => (
          <View key={idx} style={styles.itemRow}>
            <View style={{ flexDirection: "row", alignItems: "center", flex: 1 }}>
              <Text style={styles.itemText}>{it.title || it.name || "Untitled"}</Text>
              {(it.dueDate || it.date) ? (
                <Text style={styles.itemDate}>{it.dueDate || it.date}</Text>
              ) : null}
            </View>
          </View>
        ))}
      </>
    );
  };

  return (
    <View style={[styles.courseCard, { minHeight: Math.max(360, availableHeight - 120) }]}>
      <ScrollView style={{ flex: 1, width: "100%" }} contentContainerStyle={{ paddingBottom: 12 }}>
        <View style={styles.courseContent}>
          {/* Sections */}
          <Section
            title="Exams"
          onEdit={() => openEdit("exams")}
          missingIndex={firstMissingIndex(course.exams)}
          onFixMissing={() => {
            const idx = firstMissingIndex(course.exams);
            if (idx !== -1) openEdit("exams", idx);
          }}
            childrenScrollable
          >
          <ScrollView style={styles.itemsScrollArea}>
            {renderItems(course.exams, "Exams")}
            </ScrollView>
          </Section>
        <Section
          title="Projects"
          onEdit={() => openEdit("projects")}
          missingIndex={firstMissingIndex(course.projects)}
          onFixMissing={() => {
            const idx = firstMissingIndex(course.projects);
            if (idx !== -1) openEdit("projects", idx);
          }}
          childrenScrollable
        >
          <ScrollView style={styles.itemsScrollArea}>
            {renderItems(course.projects, "Projects")}
            </ScrollView>
          </Section>
        <Section
          title="Assignments"
          onEdit={() => openEdit("assignments")}
          missingIndex={firstMissingIndex(course.assignments)}
          onFixMissing={() => {
            const idx = firstMissingIndex(course.assignments);
            if (idx !== -1) openEdit("assignments", idx);
          }}
          childrenScrollable
        >
          <ScrollView style={styles.itemsScrollArea}>
            {renderItems(course.assignments, "Assignments")}
            </ScrollView>
          </Section>
        <Section
          title="Quizzes"
          onEdit={() => openEdit("quizzes")}
          missingIndex={firstMissingIndex(course.quizzes)}
          onFixMissing={() => {
            const idx = firstMissingIndex(course.quizzes);
            if (idx !== -1) openEdit("quizzes", idx);
          }}
          childrenScrollable
        >
          <ScrollView style={styles.itemsScrollArea}>
            {renderItems(course.quizzes, "Quizzes")}
            </ScrollView>
          </Section>
        </View>
      </ScrollView>

      <Modal visible={modalVisible} transparent animationType="fade" onRequestClose={closeEdit}>
        <View style={styles.modalOverlay}>
          <View style={styles.modalCard}>
            <Text style={styles.modalTitle}>
              Edit {modalSection ? modalSection[0].toUpperCase() + modalSection.slice(1) : ""}
            </Text>
            <TextInput
              value={newTitle}
              onChangeText={setNewTitle}
              placeholder="Title"
              placeholderTextColor="#555"
              style={styles.input}
            />
            <TextInput
              value={newDue}
              onChangeText={setNewDue}
              placeholder="Due date"
              placeholderTextColor="#555"
              style={styles.input}
            />
            <TouchableOpacity style={styles.editButton} onPress={handleAddItem} disabled={!newTitle.trim() || !newDue.trim()}>
              <Text style={styles.editButtonText}>{editingIndex !== null ? "Save" : "Add"}</Text>
            </TouchableOpacity>
            <View style={{ marginTop: 8 }}>
              {(course[modalSection] || []).map((it, idx) => (
                <View key={`md-${idx}`} style={[styles.itemRow, { paddingVertical: 8 }]}>
                  <Text style={styles.itemText}>
                    {(it.title || it.name || "Untitled") + (it.dueDate || it.date ? ` — ${it.dueDate || it.date}` : "")}
                  </Text>
                  <TouchableOpacity style={styles.editButton} onPress={() => openEdit(modalSection, idx)}>
                    <Text style={styles.editButtonText}>Edit</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={[styles.editButton, styles.danger]} onPress={() => handleDeleteItem(idx)}>
                    <Text style={styles.editButtonText}>Delete</Text>
                  </TouchableOpacity>
                </View>
              ))}
            </View>
            <View style={styles.modalActions}>
              <TouchableOpacity style={styles.editButton} onPress={closeEdit}>
                <Text style={styles.editButtonText}>Done</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>
    </View>
  );
}

function Section({ title, onEdit, childrenScrollable, children }) {
  return (
    <View style={styles.sectionContainer}>
      <View style={styles.sectionHeader}>
        <Text style={styles.sectionTitle}>{title}</Text>
        <TouchableOpacity style={styles.editButton} onPress={onEdit}>
          <Text style={styles.editButtonText}>Edit</Text>
        </TouchableOpacity>
      </View>
      {typeof arguments[0]?.missingIndex === "number" && arguments[0].missingIndex !== -1 ? (
        <TouchableOpacity style={styles.missingBanner} onPress={arguments[0].onFixMissing}>
          <Text style={styles.missingBannerText}>*We detected missing dates, add to continue!*</Text>
        </TouchableOpacity>
      ) : null}
      {childrenScrollable ? children : <View>{children}</View>}
    </View>
  );
}

function firstMissingIndex(arr) {
  return Array.isArray(arr) ? arr.findIndex((it) => !(it?.dueDate || it?.date)) : -1;
}

function firstMissingInCourse(course) {
  const check = (arr) => firstMissingIndex(arr);
  const sections = ["exams", "projects", "assignments", "quizzes"];
  for (const s of sections) {
    const idx = check(course?.[s]);
    if (idx !== -1) return { section: s, index: idx };
  }
  return null;
}

function hasAnyMissingDueDate(courses) {
  return (courses || []).some((c) => firstMissingInCourse(c));
}

function ContinueButton({ courses, onContinue }) {
  const disabled = hasAnyMissingDueDate(courses);
  return (
    <TouchableOpacity
      activeOpacity={0.8}
      style={[styles.ctaButton, disabled && styles.disabledButton]}
      disabled={disabled}
      onPress={onContinue}
    >
      <Text style={styles.tryAgainText}>Continue</Text>
    </TouchableOpacity>
  );
}


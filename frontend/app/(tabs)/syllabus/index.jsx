import React, { useCallback, useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, Dimensions, Platform, ScrollView } from "react-native";
import { Feather } from "@expo/vector-icons";
import Colors from "@/constants/Colors";
import { useSafeAreaInsets } from "react-native-safe-area-context";
import * as DocumentPicker from "expo-document-picker";

export default function SyllabusScreen() {
  const insets = useSafeAreaInsets();
  const availableHeight = Math.max(0, screenHeight - insets.top - insets.bottom - TAB_BAR_HEIGHT);
  const [status, setStatus] = useState("idle");
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);

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
        <ScrollView style={styles.resultContainer} contentContainerStyle={{ alignItems: "center" }}>
          <Text style={styles.resultTitle}>Result</Text>
          <Text style={styles.resultJson}>{JSON.stringify(result, null, 2)}</Text>
          <TouchableOpacity activeOpacity={0.8} style={styles.tryAgain} onPress={() => { setResult(null); setStatus("idle"); }}>
            <Text style={styles.tryAgainText}>Upload more</Text>
          </TouchableOpacity>
        </ScrollView>
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
});


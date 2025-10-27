import React from "react";
import {
    View,
    ActivityIndicator,
    StyleSheet,
    Dimensions,
    Modal,
} from "react-native";

const LoadingOverlay = () => {
    return (
        <Modal transparent visible={true} statusBarTranslucent={true}>
            <View style={styles.overlay}>
                <ActivityIndicator size="large" color="#ffffff" />
            </View>
        </Modal>
    );
};

const { width, height } = Dimensions.get("window");

const styles = StyleSheet.create({
    overlay: {
        flex: 1,
        backgroundColor: "rgba(0,0,0,0.6)",
        justifyContent: "center",
        alignItems: "center",
        width,
        height,
        zIndex: 999,
        elevation: 999,
    },
});

export default LoadingOverlay;

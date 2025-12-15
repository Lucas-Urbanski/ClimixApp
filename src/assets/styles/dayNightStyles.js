import { StyleSheet } from "react-native";

export default function createDayNightStyles() {
    return StyleSheet.create({
        fullContainer: { flex: 1 },

        /* backgrounds */
        dayBackground: { backgroundColor: "#BEE6FF" },
        nightBackground: { backgroundColor: "#0b1f3a" },

        contentContainer: { flex: 1, padding: 20 },

        /* text colors */
        textDay: { color: "#022F40" },
        textNight: { color: "#FFFFFF" },
        subTextDay: { color: "#0B4660" },
        subTextNight: { color: "#DCDFF8" },

        /* nav */
        navRow: { flexDirection: "row", justifyContent: "space-around", alignItems: "center", borderTopWidth: 1, height: 80 },
        navRowDay: { backgroundColor: "#001428", borderTopColor: "#10253a" },
        navRowNight: { backgroundColor: "#001428", borderTopColor: "#10253a" },

        navBtnBase: { flex: 1, backgroundColor: "transparent", justifyContent: "center", height: "100%" },
        navTextInactive: { color: '#A8A8FF', fontSize: 14, fontWeight: "700", textAlign: "center" },
        navTextActive: { color: "#ffffff", fontSize: 14, fontWeight: "700", textAlign: "center" },

        /* common UI pieces */
        generateBtn: { marginTop: 10, paddingVertical: 14, borderRadius: 12, alignItems: "center" },

        /* card */
        cardDay: { backgroundColor: "#F0F6FF" },
        cardNight: { backgroundColor: "#1f324a" },

        /* Misc */
        header: { fontSize: 20, fontWeight: "700" },
        subHeader: { fontSize: 16, fontWeight: "700", marginVertical: 8 },
    });
}
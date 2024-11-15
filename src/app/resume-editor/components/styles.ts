import { StyleSheet } from "@react-pdf/renderer";

export const styles = StyleSheet.create({
  page: {
    display: "flex",
    flexDirection: "row",
    backgroundColor: "#fff",
  },
  flexRow: {
    display: "flex",
    flexDirection: "row",
  },
  flexCol: {
    display: "flex",
    flexDirection: "column",
  },
  info: {
    backgroundColor: "#094C42",
    width: "190pt",
    height: "100%",
    flexShrink: 0,
  },
});

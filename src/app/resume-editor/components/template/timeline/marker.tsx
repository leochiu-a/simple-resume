import { View } from "@react-pdf/renderer";

import { styles } from "./styles";

/**
 * The dot an entry hangs off, plus the grey line joining it to the entry below.
 *
 * The reference draws that line as an absolutely positioned bar of
 * `calc(100% + 16px)` sitting behind the dot on a negative z-index. None of that
 * survives: @react-pdf has no `calc()` and negative z-index is unreliable, and
 * the preview would apply both as plain CSS anyway. Instead the marker is a flex
 * column stretched to the entry's height, so the connector only has to take
 * `flex: 1` and it grows to whatever that height turns out to be.
 */
const Marker = ({ connected }: { connected: boolean }) => {
  return (
    <View style={styles.markerColumn}>
      <View style={styles.marker} />
      {connected && <View style={styles.connector} />}
    </View>
  );
};

export default Marker;

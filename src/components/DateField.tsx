import DateTimePicker, { type DateTimePickerEvent } from '@react-native-community/datetimepicker';
import { useState } from 'react';
import { Platform, Pressable, StyleSheet, Text, View } from 'react-native';

import { useColorScheme } from '@/components/useColorScheme';
import Colors from '@/constants/Colors';

// A tappable field that opens the native date picker. Handles the platform
// difference: iOS shows the picker inline until dismissed; Android pops a
// one-shot dialog, so we hide it after a selection.
type DateFieldProps = {
  label?: string;
  value: Date;
  onChange: (date: Date) => void;
};

export default function DateField({ label, value, onChange }: DateFieldProps) {
  const [show, setShow] = useState(false);
  const scheme = useColorScheme();
  const colors = Colors[scheme];

  function handleChange(event: DateTimePickerEvent, selected?: Date) {
    setShow(Platform.OS === 'ios'); // keep open on iOS, close on Android
    if (event.type === 'set' && selected) {
      onChange(selected);
    }
  }

  return (
    <View style={styles.wrapper}>
      <Pressable
        onPress={() => setShow(true)}
        style={[styles.field, { borderColor: colors.tabIconDefault }]}>
        {label ? <Text style={[styles.label, { color: colors.text }]}>{label}</Text> : null}
        <Text style={[styles.value, { color: colors.text }]}>{value.toLocaleDateString()}</Text>
      </Pressable>
      {show ? (
        <DateTimePicker value={value} mode="date" onChange={handleChange} />
      ) : null}
    </View>
  );
}

const styles = StyleSheet.create({
  wrapper: {
    flex: 1,
  },
  field: {
    borderWidth: 1,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 8,
    gap: 2,
  },
  label: {
    fontSize: 11,
    fontWeight: '600',
    opacity: 0.6,
  },
  value: {
    fontSize: 15,
    fontWeight: '600',
  },
});

import { StyleSheet } from 'react-native';
import { TextInput } from 'react-native-paper';

interface NumberFieldProps {
  label: string;
  value: string;
  onChange: (value: string) => void;
  decimal?: boolean;
}

export function NumberField({ label, value, onChange, decimal = false }: NumberFieldProps) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChange}
      keyboardType={decimal ? 'decimal-pad' : 'number-pad'}
      style={styles.field}
    />
  );
}

const styles = StyleSheet.create({
  field: { marginTop: 10 },
});

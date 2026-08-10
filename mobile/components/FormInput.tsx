import { TextInput } from 'react-native-paper';

interface FormInputProps {
  label: string;
  value: string;
  onChangeText: (value: string) => void;
  secureTextEntry?: boolean;
  multiline?: boolean;
  placeholder?: string;
  editable?: boolean;
  keyboardType?: 'default' | 'numeric' | 'email-address' | 'phone-pad';
  autoCapitalize?: 'none' | 'sentences' | 'words' | 'characters';
  style?: object;
}

/** Thin wrapper around Paper TextInput for consistent form fields. */
export function FormInput({
  label,
  value,
  onChangeText,
  secureTextEntry,
  multiline,
  placeholder,
  editable = true,
  keyboardType = 'default',
  autoCapitalize = 'sentences',
  style,
}: FormInputProps) {
  return (
    <TextInput
      mode="outlined"
      label={label}
      value={value}
      onChangeText={onChangeText}
      secureTextEntry={secureTextEntry}
      multiline={multiline}
      placeholder={placeholder}
      editable={editable}
      keyboardType={keyboardType}
      autoCapitalize={autoCapitalize}
      style={[{ marginTop: 10 }, style]}
    />
  );
}

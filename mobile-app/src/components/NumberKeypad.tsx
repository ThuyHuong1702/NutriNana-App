import React from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Platform, Dimensions } from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface NumberKeypadProps {
  onPress: (key: string) => void;
  onDelete: () => void;
  onSave: () => void;
}

const { width } = Dimensions.get('window');
const KEYPAD_HEIGHT = width > 400 ? 300 : 260;

export default function NumberKeypad({ onPress, onDelete, onSave }: NumberKeypadProps) {
  const keys = ['1', '2', '3', '4', '5', '6', '7', '8', '9', '', '0', '.'];
  
  return (
    <View style={styles.keypadContainer}>
      <View style={styles.keysGrid}>
        {keys.map((key, index) => (
          <TouchableOpacity 
            key={index} 
            style={styles.keyBtn} 
            onPress={() => key ? onPress(key) : null}
            disabled={!key}
            activeOpacity={0.7}
          >
            <Text 
                style={styles.keyText} 
                maxFontSizeMultiplier={1.5}
            >
                {key}
            </Text>
          </TouchableOpacity>
        ))}
      </View>
      <View style={styles.actionColumn}>
        <TouchableOpacity style={styles.backspaceBtn} onPress={onDelete} activeOpacity={0.7}>
          <Ionicons name="backspace-outline" size={28} color="#333" />
        </TouchableOpacity>
        <TouchableOpacity style={styles.saveBtnKeypad} onPress={onSave} activeOpacity={0.7}>
          <Text style={styles.saveTextKeypad} maxFontSizeMultiplier={1.2}>Lưu</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  keypadContainer: { 
    flexDirection: 'row', 
    height: KEYPAD_HEIGHT, 
    borderTopWidth: 1, 
    borderTopColor: '#EEE', 
    backgroundColor: '#FAFAFA',
    width: '100%',
  },
  keysGrid: { 
    flex: 3, 
    flexDirection: 'row', 
    flexWrap: 'wrap', 
    borderRightWidth: 1, 
    borderRightColor: '#EEE' 
  },
  keyBtn: { 
    width: '33.33%', 
    height: '25%', 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderRightWidth: 1, 
    borderColor: '#EEE', 
    backgroundColor: '#FFF' 
  },
  keyText: { 
    fontSize: 24, 
    fontWeight: '500', 
    color: '#333' 
  },
  actionColumn: { 
    flex: 1 
  },
  backspaceBtn: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    borderBottomWidth: 1, 
    borderColor: '#EEE', 
    backgroundColor: '#FFF' 
  },
  saveBtnKeypad: { 
    flex: 1, 
    justifyContent: 'center', 
    alignItems: 'center', 
    backgroundColor: '#FDD835' 
  },
  saveTextKeypad: { 
    color: '#333',
    fontSize: 18, 
    fontWeight: 'bold' 
  },
});
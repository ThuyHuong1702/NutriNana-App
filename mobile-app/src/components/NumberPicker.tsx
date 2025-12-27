//src/components/NumberPicker.tsx
import { View, Text, StyleSheet, FlatList, TouchableOpacity, Dimensions } from 'react-native';
import { useRef, useState, useEffect } from 'react';

const { width } = Dimensions.get('window');
const ITEM_HEIGHT = 60; 
const VISIBLE_ITEMS = 5;

interface Props {
  min: number;
  max: number;
  initialValue: number;
  unit: string;
  onValueChange: (val: number) => void;
}

export default function NumberPicker({ min, max, initialValue, unit, onValueChange }: Props) {
  const data = Array.from({ length: max - min + 1 }, (_, i) => min + i);
  const [selected, setSelected] = useState(initialValue);
  const flatListRef = useRef<FlatList>(null);

  useEffect(() => {
    const index = initialValue - min;
    setTimeout(() => {
      flatListRef.current?.scrollToIndex({ index, animated: false, viewPosition: 0.5 });
    }, 100);
  }, []);

  const handleScroll = (event: any) => {
    const offsetY = event.nativeEvent.contentOffset.y;
    const index = Math.round(offsetY / ITEM_HEIGHT);
    const value = min + index;
    if (value >= min && value <= max) {
      setSelected(value);
      onValueChange(value);
    }
  };

  return (
    <View style={styles.container}>
      <View style={styles.highlightLine}>
        <Text style={styles.unitText}>{unit}</Text>
      </View>

      <FlatList
        ref={flatListRef}
        data={data}
        keyExtractor={(item) => item.toString()}
        showsVerticalScrollIndicator={false}
        snapToInterval={ITEM_HEIGHT} 
        decelerationRate="fast"
        contentContainerStyle={{
          paddingVertical: (ITEM_HEIGHT * (VISIBLE_ITEMS - 1)) / 2 
        }}
        onMomentumScrollEnd={handleScroll}
        onScroll={handleScroll}
        scrollEventThrottle={16}
        getItemLayout={(_, index) => ({ length: ITEM_HEIGHT, offset: ITEM_HEIGHT * index, index })}
        renderItem={({ item }) => {
          const isSelected = item === selected;
          return (
            <View style={styles.item}>
              <Text style={[styles.text, isSelected && styles.selectedText]}>
                {item}
              </Text>
            </View>
          );
        }}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    height: ITEM_HEIGHT * VISIBLE_ITEMS,
    width: '100%',
    alignItems: 'center',
    justifyContent: 'center',
  },
  item: {
    height: ITEM_HEIGHT,
    justifyContent: 'center',
    alignItems: 'center',
  },
  text: {
    fontSize: 24,
    color: '#CCC',
    fontWeight: '500',
  },
  selectedText: {
    fontSize: 32,
    color: '#333',
    fontWeight: 'bold',
  },
  highlightLine: {
    position: 'absolute',
    top: ITEM_HEIGHT * 2, 
    width: width * 0.5,
    height: ITEM_HEIGHT,
    backgroundColor: '#FFF9C4', 
    borderRadius: 15,
    zIndex: -1, 
    justifyContent: 'center',
    alignItems: 'flex-end',
    paddingRight: 20,
  },
  unitText: {
    fontSize: 14,
    color: '#666',
    fontWeight: '600',
  }
});
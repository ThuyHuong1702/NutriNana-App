import React, { useEffect, useState } from 'react';
import { View, Text, StyleSheet, ScrollView, TouchableOpacity, Image, Dimensions, StatusBar, Platform } from 'react-native';
import { useLocalSearchParams, useRouter } from 'expo-router';
import { Ionicons } from '@expo/vector-icons';
import axios from 'axios';
import { auth } from '@/src/config/firebase';
import FoodModal from '@/src/components/FoodModal';
import Svg, { Circle, G } from 'react-native-svg';
import { useSafeAreaInsets } from 'react-native-safe-area-context';
import { BACKEND_URL } from '@/src/config/apiConfig';

const { width } = Dimensions.get('window'); 

const MEAL_RATIOS: {[key: string]: number} = {
  'Sáng': 0.25, 'Trưa': 0.35, 'Tối': 0.30, 'Phụ': 0.10
};

export default function MealDetailScreen() {
  const router = useRouter();
  const insets = useSafeAreaInsets(); 
  const params = useLocalSearchParams();
  const mealLabel = params.meal as string; 
  const dateStr = params.date as string || new Date().toISOString().split('T')[0];

  const [logs, setLogs] = useState<any[]>([]);
  const [targetDaily, setTargetDaily] = useState(2000);
  const [detailModalVisible, setDetailModalVisible] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);

  useEffect(() => {
    const fetchData = async () => {
        if (!auth.currentUser) return;
        const uid = auth.currentUser.uid;
        try {
            const profileRes = await axios.get(`${BACKEND_URL}/api/get-profile/${uid}`);
            if (profileRes.data.success) {
                setTargetDaily(profileRes.data.data.DAILY_CALORIE);
            }
            const logRes = await axios.get(`${BACKEND_URL}/api/get-daily-log/${uid}?date_str=${dateStr}`);
            if (logRes.data.success && Array.isArray(logRes.data.data)) {
                const mealLogs = logRes.data.data.filter((item: any) => item.meal_label === mealLabel);
                setLogs(mealLogs);
            }
        } catch (error) {
            console.log("Error fetching meal detail:", error);
        }
    };
    fetchData();
  }, [mealLabel, dateStr]);

  const handleOpenFood = (item: any) => {
      const mappedItem = {
          ...item,
          id: item.C_FOOD_ID,
          name: item.DISH_NAME,
          image_url: item.IMAGE_PATH,
          cal_per_unit: item.BASE_CAL,
          unit: item.UNIT,
          quantity: item.QUANTITY
      };
      setSelectedItem(mappedItem);
      setDetailModalVisible(true);
  };

  // --- TÍNH TOÁN ---
  const mealTargetCalo = Math.round(targetDaily * (MEAL_RATIOS[mealLabel] || 0));
  
  const total = logs.reduce((acc, item) => ({
      cal: acc.cal + (item.LOG_CAL || 0),
      carb: acc.carb + (item.LOG_CARB || (item.BASE_CARB * item.QUANTITY) || 0),
      protein: acc.protein + (item.LOG_PROTEIN || (item.BASE_PROTEIN * item.QUANTITY) || 0),
      fat: acc.fat + (item.LOG_FAT || (item.BASE_FAT * item.QUANTITY) || 0),
  }), { cal: 0, carb: 0, protein: 0, fat: 0 });

  const percentCalo = mealTargetCalo > 0 ? (total.cal / mealTargetCalo) * 100 : 0;
  const isOver = total.cal > mealTargetCalo;

  return (
    <View style={styles.container}>
      <StatusBar barStyle="light-content" backgroundColor="#000" />
      
      {/* HEADER: Dùng padding dynamic theo insets */}
      <View style={[styles.header, { paddingTop: Math.max(insets.top + 10, 40) }]}>
        <TouchableOpacity onPress={() => router.back()} hitSlop={{top: 10, bottom: 10, left: 10, right: 10}}>
            <Ionicons name="arrow-back" size={24} color="#FFF" />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>
            {new Date(dateStr).toLocaleDateString('vi-VN')} • Bữa {mealLabel ? mealLabel.toLowerCase() : ''}
        </Text>
        <View style={{width: 24}} /> 
      </View>

      <ScrollView contentContainerStyle={{paddingBottom: 120}}>
        
        {/* SUMMARY CARD */}
        <View style={styles.summaryCard}>
            <View style={styles.summaryHeader}>
                <Text style={styles.targetText}>
                    Mục tiêu: <Text style={{color: '#4CAF50'}}>{mealTargetCalo}</Text> Calo
                </Text>
                <View style={[styles.statusBadge, {backgroundColor: isOver ? 'rgba(229, 57, 53, 0.2)' : 'rgba(76, 175, 80, 0.2)'}]}>
                    <Text style={{color: isOver ? '#E53935' : '#4CAF50', fontSize: 12, fontWeight: 'bold'}}>
                        {isOver ? `Vượt ${Math.round(percentCalo - 100)}%` : `Dư ${Math.round(mealTargetCalo - total.cal)}`}
                    </Text>
                </View>
            </View>

            <View style={styles.chartRow}>
                {/* CHART CONTAINER */}
                <View style={styles.chartContainer}>
                    <DonutChart 
                        radius={60} 
                        strokeWidth={8} 
                        carbs={total.carb} 
                        protein={total.protein} 
                        fat={total.fat} 
                        totalCal={total.cal}
                    />
                    <View style={styles.chartTextAbsolute}>
                        <Text style={styles.chartLabel}>Đã nạp</Text>
                        <Text 
                            style={styles.chartValue} 
                            numberOfLines={1} 
                            adjustsFontSizeToFit
                        >
                            {Math.round(total.cal)}
                        </Text>
                    </View>
                </View>

                {/* MACRO CONTAINER */}
                <View style={styles.macroContainer}>
                    <MacroRow color="#2196F3" label="Carbs" value={total.carb} total={total.cal} calPerGram={4} />
                    <MacroRow color="#E91E63" label="Protein" value={total.protein} total={total.cal} calPerGram={4} />
                    <MacroRow color="#FFC107" label="Fat" value={total.fat} total={total.cal} calPerGram={9} />
                </View>
            </View>
        </View>

        {/* LIST */}
        <View style={styles.listContainer}>
            <Text style={styles.listTitle}>{logs.length} thực phẩm</Text>
            {logs.map((item, index) => {
                let imgSource = require('@/assets/images/react-logo.png'); 
                if (item.IMAGE_PATH) {
                    imgSource = item.IMAGE_PATH.startsWith('http') ? { uri: item.IMAGE_PATH } : { uri: `${BACKEND_URL}/${item.IMAGE_PATH}` };
                }
                return (
                    <TouchableOpacity key={index} style={styles.foodItem} onPress={() => handleOpenFood(item)}>
                        <Image source={imgSource} style={styles.foodImage} />
                        <View style={styles.foodInfo}>
                            <Text style={styles.foodName}>{item.DISH_NAME}</Text>
                            <Text style={styles.foodUnit}>{item.QUANTITY} ( Đơn vị {item.UNIT || 'phần'} )</Text>
                        </View>
                        <View style={{flexDirection: 'row', alignItems: 'center', minWidth: 70, justifyContent: 'flex-end'}}>
                            <Text style={styles.foodCal}>{Math.round(item.LOG_CAL)} Calo</Text>
                        </View>
                    </TouchableOpacity>
                );
            })}
        </View>
      </ScrollView>

      {/* FOOTER*/}
      <View style={[styles.footer, { paddingBottom: Math.max(insets.bottom + 10, 20) }]}>
        <TouchableOpacity 
            style={styles.addButton}
            onPress={() => router.push({ pathname: '/add-food', params: { meal: mealLabel, date: dateStr } } as any)}
        >
            <Text style={styles.addButtonText}>Ghi thêm</Text>
        </TouchableOpacity>
      </View>

      <FoodModal
        visible={detailModalVisible}
        item={selectedItem}
        onClose={() => setDetailModalVisible(false)}
        onAddToCart={() => setDetailModalVisible(false)}
        backendUrl={BACKEND_URL}
      />
    </View>
  );
}

const DonutChart = ({ radius, strokeWidth, carbs, protein, fat, totalCal }: any) => {
    const carbsCal = carbs * 4;
    const proteinCal = protein * 4;
    const fatCal = fat * 9;
    
    if (totalCal === 0) {
        return (
            <Svg height={radius * 2} width={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
                <Circle cx={radius} cy={radius} r={radius - strokeWidth / 2} stroke="#333" strokeWidth={strokeWidth} fill="transparent" />
            </Svg>
        );
    }

    const circumference = 2 * Math.PI * (radius - strokeWidth / 2);
    const carbsStroke = (carbsCal / totalCal) * circumference;
    const proteinStroke = (proteinCal / totalCal) * circumference;
    const fatStroke = (fatCal / totalCal) * circumference;

    return (
        <Svg height={radius * 2} width={radius * 2} viewBox={`0 0 ${radius * 2} ${radius * 2}`}>
            <G rotation="-90" origin={`${radius}, ${radius}`}>
                <Circle cx={radius} cy={radius} r={radius - strokeWidth / 2} stroke="#333" strokeWidth={strokeWidth} fill="transparent" />
                <Circle cx={radius} cy={radius} r={radius - strokeWidth / 2} stroke="#2196F3" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={[carbsStroke, circumference]} strokeLinecap="round" />
                <Circle cx={radius} cy={radius} r={radius - strokeWidth / 2} stroke="#E91E63" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={[proteinStroke, circumference]} strokeDashoffset={-carbsStroke} strokeLinecap="round" />
                <Circle cx={radius} cy={radius} r={radius - strokeWidth / 2} stroke="#FFC107" strokeWidth={strokeWidth} fill="transparent" strokeDasharray={[fatStroke, circumference]} strokeDashoffset={-(carbsStroke + proteinStroke)} strokeLinecap="round" />
            </G>
        </Svg>
    );
};

const MacroRow = ({color, label, value, total, calPerGram}: any) => {
    const calFromMacro = value * calPerGram;
    const percent = total > 0 ? Math.round((calFromMacro / total) * 100) : 0;
    
    return (
        <View style={styles.macroRow}>
            <View style={{flexDirection: 'row', alignItems: 'center', flex: 1}}>
                <View style={{width: 10, height: 10, borderRadius: 2, backgroundColor: color, marginRight: 8}} />
                <Text style={{color: '#BBB', fontSize: 13}} numberOfLines={1} adjustsFontSizeToFit>{label}</Text>
            </View>
            <View style={{flexDirection: 'row', alignItems: 'center', width: 90, justifyContent: 'flex-end'}}>
                <Text style={{color: '#FFF', fontSize: 13, marginRight: 8}}>{percent}%</Text>
                <Text style={{color: '#FFF', fontSize: 13, fontWeight: '600'}}>{value.toFixed(1)}g</Text>
            </View>
        </View>
    );
};

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: '#000' },
  
  header: {
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between',
    paddingHorizontal: 16, 
    paddingBottom: 16, 
    backgroundColor: '#000'
  },
  headerTitle: { color: '#FFF', fontSize: 16, fontWeight: '600' },
  
  summaryCard: { 
    backgroundColor: '#1E1E1E', 
    margin: 16, 
    padding: 20, 
    borderRadius: 20 
  },
  summaryHeader: { 
    flexDirection: 'row', 
    justifyContent: 'space-between', 
    alignItems: 'center', 
    marginBottom: 20 
  },
  targetText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' },
  statusBadge: { paddingHorizontal: 10, paddingVertical: 6, borderRadius: 8 },
  
  chartRow: { 
    flexDirection: 'row', 
    alignItems: 'center', 
    justifyContent: 'space-between' 
  },
  chartContainer: { 
      width: 120, height: 120, 
      alignItems: 'center', justifyContent: 'center',
      position: 'relative' 
  },
  chartTextAbsolute: { 
      position: 'absolute', 
      alignItems: 'center', 
      justifyContent: 'center', 
      width: 80, height: 80 
  },
  chartLabel: { color: '#AAA', fontSize: 12, marginBottom: 2 },
  chartValue: { color: '#FFF', fontSize: 24, fontWeight: 'bold' },
  
  macroContainer: { 
      flex: 1,
      marginLeft: 20 
  },
  macroRow: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 12,
      justifyContent: 'space-between'
  },

  listContainer: { paddingHorizontal: 16 },
  listTitle: { color: '#FFF', fontSize: 16, fontWeight: 'bold', marginBottom: 16 },
  
  foodItem: { 
      flexDirection: 'row', 
      alignItems: 'center', 
      marginBottom: 20,
      width: '100%' 
  },
  foodImage: { 
      width: 48, height: 48, 
      borderRadius: 12, 
      marginRight: 12, 
      backgroundColor: '#333' 
  },
  foodInfo: { 
      flex: 1, 
      marginRight: 8 
  },
  foodName: { 
      color: '#FFF', 
      fontSize: 15, 
      fontWeight: '500', 
      marginBottom: 4,
      flexWrap: 'wrap' 
  },
  foodUnit: { color: '#888', fontSize: 13 },
  foodCal: { color: '#888', fontSize: 13, marginRight: 4 },

  footer: { 
      position: 'absolute', 
      bottom: 0, left: 0, right: 0, 
      paddingTop: 16, 
      paddingHorizontal: 16,
      backgroundColor: '#000', 
      borderTopWidth: 1, 
      borderTopColor: '#222' 
  },
  addButton: { 
      backgroundColor: '#4CAF50', 
      paddingVertical: 14, 
      borderRadius: 25, 
      alignItems: 'center', 
      justifyContent: 'center' 
  },
  addButtonText: { color: '#FFF', fontSize: 16, fontWeight: 'bold' }
});
import React from 'react';
import { View, FlatList, ActivityIndicator, StyleSheet, KeyboardAvoidingView, Platform } from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { ListingHeader } from './ListingHeader';
import { ListingSearchBar } from './ListingSearchBar';
import { CategorySidebar } from './CategorySidebar';

interface ListingLayoutProps {
  title: string;
  searchPlaceholder: string;
  searchText: string;
  setSearchText: (text: string) => void;
  
  categories: string[];
  selectedCategory: string;
  setSelectedCategory: (cat: string) => void;

  loading: boolean;
  data: any[];
  renderItem: ({ item }: { item: any }) => React.ReactElement;
  renderEmptyComponent: () => React.ReactElement | null;
  
  footerComponent?: React.ReactNode; 
}

export const ListingLayout = ({
  title,
  searchPlaceholder,
  searchText,
  setSearchText,
  categories,
  selectedCategory,
  setSelectedCategory,
  loading,
  data,
  renderItem,
  renderEmptyComponent,
  footerComponent
}: ListingLayoutProps) => {
  return (
    // 1. Sử dụng edges để kiểm soát vùng an toàn: 'top' cho Header, 'bottom' cho Footer
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
      
      {/* 2. KeyboardAvoidingView giúp giao diện không bị bàn phím che mất trên iOS */}
      <KeyboardAvoidingView 
        style={styles.keyboardView} 
        behavior={Platform.OS === 'ios' ? 'padding' : undefined}
      >
        <View style={styles.headerContainer}>
           <ListingHeader title={title} />
           <ListingSearchBar 
             placeholder={searchPlaceholder} 
             value={searchText} 
             onChangeText={setSearchText} 
           />
        </View>

        <View style={styles.contentRow}>
          {/* Sidebar */}
          <View style={styles.sidebarWrapper}>
            <CategorySidebar 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </View>

          {/* Main List */}
          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#FDD835" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={data}
                keyExtractor={(item) => (item.id || item.C_FOOD_ID || Math.random()).toString()}
                // 3. Padding bottom lớn để đảm bảo nội dung cuối không bị Footer che
                contentContainerStyle={[
                   styles.flatListContent,
                   // Nếu có footer thì padding dưới phải nhiều hơn để tránh bị che
                   { paddingBottom: footerComponent ? 100 : 20 } 
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyComponent}
                renderItem={renderItem}
              />
            )}
          </View>
        </View>

        {/* Footer */}
        {footerComponent && (
          <View style={styles.footerContainer}>
             {footerComponent}
          </View>
        )}
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: '#fff',
    // XÓA bỏ paddingTop thủ công, SafeAreaView sẽ tự lo việc này
  },
  keyboardView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    // Gom header và search bar vào một khối để quản lý spacing tốt hơn
    paddingBottom: 8,
  },
  contentRow: { 
    flex: 1, // Chiếm toàn bộ không gian còn lại
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0',
    overflow: 'hidden' // Ngăn nội dung con tràn ra ngoài
  },
  sidebarWrapper: {
    // 4. Quan trọng: Giới hạn chiều rộng Sidebar
    // Dùng width cố định hoặc max-width để khi chữ to không đẩy List đi mất
    width: 90, 
    maxWidth: '25%', 
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  listContainer: { 
    flex: 1, // List sẽ chiếm hết phần còn lại của chiều ngang
    backgroundColor: '#FFF', 
    paddingHorizontal: 12 
  },
  flatListContent: {
    paddingVertical: 10,
    flexGrow: 1
  },
  footerContainer: { 
    backgroundColor: '#FFF',
    borderTopWidth: 1,
    borderTopColor: '#EEE',
    // Không cần set height cố định, để nó tự giãn theo nội dung bên trong
  }
});
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
    <SafeAreaView style={styles.container} edges={['top', 'left', 'right', 'bottom']}>
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
          <View style={styles.sidebarWrapper}>
            <CategorySidebar 
              categories={categories} 
              selectedCategory={selectedCategory} 
              onSelect={setSelectedCategory} 
            />
          </View>

          <View style={styles.listContainer}>
            {loading ? (
              <ActivityIndicator size="large" color="#FDD835" style={{ marginTop: 40 }} />
            ) : (
              <FlatList
                data={data}
                keyExtractor={(item) => (item.id || item.C_FOOD_ID || Math.random()).toString()}
                contentContainerStyle={[
                   styles.flatListContent,
                   { paddingBottom: footerComponent ? 100 : 20 } 
                ]}
                showsVerticalScrollIndicator={false}
                ListEmptyComponent={renderEmptyComponent}
                renderItem={renderItem}
              />
            )}
          </View>
        </View>

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
  },
  keyboardView: {
    flex: 1,
    display: 'flex',
    flexDirection: 'column',
  },
  headerContainer: {
    paddingBottom: 8,
  },
  contentRow: { 
    flex: 1, 
    flexDirection: 'row', 
    borderTopWidth: 1, 
    borderTopColor: '#F0F0F0',
    overflow: 'hidden' 
  },
  sidebarWrapper: {
    width: 90, 
    maxWidth: '25%', 
    borderRightWidth: 1,
    borderRightColor: '#F0F0F0',
  },
  listContainer: { 
    flex: 1, 
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
  }
});
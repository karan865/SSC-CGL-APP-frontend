import React, { useEffect, useState, useCallback } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  RefreshControl,
  StatusBar,
} from 'react-native';
import { TopicsScreenProps } from '../navigation/types';
import { useExam } from '../context/ExamContext';
import { subjectApi } from '../services/api/subjectApi';
import { Topic } from '../types/topic';
import { LoadingView } from '../components/LoadingView';
import { ErrorView } from '../components/ErrorView';

export const TopicsScreen: React.FC<TopicsScreenProps> = ({ route, navigation }) => {
  const { subjectId, subjectName } = route.params;
  const { examSlug } = useExam();

  const [topics, setTopics] = useState<Topic[]>([]);
  const [loading, setLoading] = useState<boolean>(true);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  const fetchTopics = useCallback(async () => {
    setError(null);
    try {
      const data = await subjectApi.getTopics(subjectId, examSlug);
      setTopics(data);
    } catch (err: any) {
      setError(err.message || 'Failed to fetch topics. Please check connection.');
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, [subjectId, examSlug]);

  useEffect(() => {
    fetchTopics();
  }, [fetchTopics]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    fetchTopics();
  }, [fetchTopics]);

  const handleSelectTopic = (topic: Topic) => {
    navigation.navigate('Difficulty', {
      subjectId,
      topicId: topic._id,
      topicName: topic.name,
      totalQuestions: topic.totalQuestions,
      targetQuestions: topic.targetQuestions,
    });
  };

  if (loading && !refreshing) {
    return (
      <View style={styles.screenRoot}>
        <LoadingView message={`Loading topics for ${subjectName}...`} />
      </View>
    );
  }

  if (error && topics.length === 0) {
    return (
      <View style={styles.screenRoot}>
        <View style={styles.errorContainer}>
          <ErrorView message={error} onRetry={fetchTopics} />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screenRoot}>
      <StatusBar barStyle="light-content" />
      <View style={styles.container}>
        {/* TOPIC BANNER */}
        <View style={styles.subjectBanner}>
          <View style={styles.subjectPill}>
            <Text style={styles.subjectPillText}>SUBJECT</Text>
          </View>
          <Text style={styles.bannerTitle}>{subjectName}</Text>
          <Text style={styles.bannerSubtitle}>
            Select a topic to configure your practice test session.
          </Text>
        </View>

        <View style={styles.listHeader}>
          <Text style={styles.listHeaderTitle}>Curated Topics</Text>
          <Text style={styles.listHeaderCount}>
            {topics.length} Available
          </Text>
        </View>

        <FlatList
          data={topics}
          keyExtractor={(item) => item._id}
          contentContainerStyle={styles.listContent}
          showsVerticalScrollIndicator={true}
          nestedScrollEnabled={true}
          keyboardShouldPersistTaps="handled"
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={onRefresh}
              colors={['#4f46e5']}
              tintColor="#4f46e5"
            />
          }
          renderItem={({ item, index }) => (
            <TouchableOpacity
              style={styles.topicCard}
              onPress={() => handleSelectTopic(item)}
              activeOpacity={0.7}
            >
              <View style={styles.indexBox}>
                <Text style={styles.indexText}>
                  {(index + 1).toString().padStart(2, '0')}
                </Text>
              </View>

              <View style={styles.topicInfo}>
                <View style={{ flexDirection: 'row', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 3 }}>
                  <Text style={[styles.topicName, { flex: 1, marginRight: 8, marginBottom: 0 }]}>{item.name}</Text>
                  {item.totalQuestions !== undefined && (
                    <View style={{ backgroundColor: '#e0e7ff', paddingHorizontal: 6, paddingVertical: 2, borderRadius: 4, borderWidth: 1, borderColor: '#c7d2fe' }}>
                      <Text style={{ fontSize: 12, color: '#4338ca', fontWeight: '700' }}>{item.totalQuestions} Qs</Text>
                    </View>
                  )}
                </View>
                <Text style={[styles.topicRule, { color: '#4338ca', fontWeight: '600' }]}>
                  {item.questionCountSpecifiedByPDF ? `${item.questionCount} Target Qs` : (item.targetQuestions ? `${item.targetQuestions} Target Qs` : (item.totalQuestions ? `${item.totalQuestions} Target Qs` : 'Target Qs Not Spec.'))} • {item.marksSpecifiedByPDF ? `${item.marks} Marks` : 'Marks Not Spec.'}
                </Text>
              </View>

              <View style={styles.arrowCircle}>
                <Text style={styles.arrowText}>➔</Text>
              </View>
            </TouchableOpacity>
          )}
          ListEmptyComponent={
            <View style={styles.emptyContainer}>
              <Text style={styles.emptyEmoji}>📋</Text>
              <Text style={styles.emptyTitle}>No Topics Available Yet</Text>
              <Text style={styles.emptySubtitle}>
                Topics for this subject will be seeded in subsequent modules.
              </Text>
            </View>
          }
        />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  screenRoot: {
    flex: 1,
    backgroundColor: '#f8fafc',
  },
  container: {
    flex: 1,
    paddingHorizontal: 18,
    paddingTop: 16,
  },
  errorContainer: {
    flex: 1,
    padding: 16,
    justifyContent: 'center',
  },
  subjectBanner: {
    backgroundColor: '#0f172a',
    borderRadius: 16,
    padding: 18,
    marginBottom: 20,
    shadowColor: '#0f172a',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 10,
    elevation: 4,
  },
  subjectPill: {
    backgroundColor: '#1e293b',
    paddingHorizontal: 8,
    paddingVertical: 3,
    borderRadius: 6,
    alignSelf: 'flex-start',
    marginBottom: 8,
  },
  subjectPillText: {
    color: '#818cf8',
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  bannerTitle: {
    fontSize: 20,
    fontWeight: '800',
    color: '#ffffff',
    marginBottom: 4,
  },
  bannerSubtitle: {
    fontSize: 13,
    color: '#94a3b8',
    lineHeight: 18,
  },
  listHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 12,
  },
  listHeaderTitle: {
    fontSize: 17,
    fontWeight: '700',
    color: '#0f172a',
  },
  listHeaderCount: {
    fontSize: 12,
    color: '#64748b',
    fontWeight: '600',
  },
  listContent: {
    paddingBottom: 48,
    flexGrow: 1,
  },
  topicCard: {
    backgroundColor: '#ffffff',
    borderRadius: 14,
    padding: 16,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: '#e2e8f0',
    flexDirection: 'row',
    alignItems: 'center',
    shadowColor: '#000000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.03,
    shadowRadius: 6,
    elevation: 2,
  },
  indexBox: {
    width: 36,
    height: 36,
    borderRadius: 10,
    backgroundColor: '#f1f5f9',
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 14,
  },
  indexText: {
    fontSize: 13,
    fontWeight: '700',
    color: '#475569',
  },
  topicInfo: {
    flex: 1,
  },
  topicName: {
    fontSize: 16,
    fontWeight: '700',
    color: '#0f172a',
    marginBottom: 3,
  },
  topicRule: {
    fontSize: 12,
    color: '#64748b',
  },
  arrowCircle: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: '#eff6ff',
    alignItems: 'center',
    justifyContent: 'center',
    marginLeft: 10,
  },
  arrowText: {
    fontSize: 12,
    color: '#2563eb',
    fontWeight: 'bold',
  },
  emptyContainer: {
    paddingTop: 56,
    alignItems: 'center',
    paddingHorizontal: 20,
  },
  emptyEmoji: {
    fontSize: 40,
    marginBottom: 12,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1e293b',
    marginBottom: 6,
  },
  emptySubtitle: {
    fontSize: 13,
    color: '#64748b',
    textAlign: 'center',
    lineHeight: 18,
  },
});

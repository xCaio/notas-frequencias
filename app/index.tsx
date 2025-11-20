import React, { useEffect, useState } from 'react';
import {
  SafeAreaView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  FlatList,
  Modal,
  Alert,
  StyleSheet,
  ScrollView,
  Platform,
  KeyboardAvoidingView,
} from 'react-native';
import AsyncStorage from '@react-native-async-storage/async-storage';

type Student = {
  name: string;
  grades: number[]; // length 5
  attendance: number; // 0-100
};

const STORAGE_KEY = '@students_v1';
const SUBJECTS = ['Matemática', 'Português', 'Ciências', 'História', 'Inglês'];

const clamp = (v: number, a: number, b: number) => Math.max(a, Math.min(b, v));
const avg = (arr: number[]) => (arr.length ? arr.reduce((s, x) => s + x, 0) / arr.length : 0);

export default function Index() {
  const [students, setStudents] = useState<Student[]>([]);
  const [modalVisible, setModalVisible] = useState(false);
  const [editingIndex, setEditingIndex] = useState<number>(-1);
  const [form, setForm] = useState<{ name: string; grades: string[]; attendance: string }>({
    name: '',
    grades: Array(5).fill(''),
    attendance: '',
  });

  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    save();
  }, [students]);

  const load = async () => {
    try {
      const raw = await AsyncStorage.getItem(STORAGE_KEY);
      if (raw) {
        const parsed: Student[] = JSON.parse(raw);
        // garantir formato
        const normalized = parsed.map((p) => ({
          name: p.name || '',
          grades: (p.grades || [0, 0, 0, 0, 0]).map((n) => Number.isFinite(n) ? n : 0).slice(0, 5).concat(Array(Math.max(0, 5 - (p.grades || []).length)).fill(0)),
          attendance: typeof p.attendance === 'number' ? clamp(p.attendance, 0, 100) : 0,
        }));
        setStudents(normalized);
      }
    } catch (e) {
      console.warn('Erro ao carregar:', e);
    }
  };

  const save = async () => {
    try {
      await AsyncStorage.setItem(STORAGE_KEY, JSON.stringify(students));
    } catch (e) {
      console.warn('Erro ao salvar:', e);
    }
  };

  const studentAverage = (student: Student) => {
    return Number(avg(student.grades).toFixed(2));
  };

  const classAveragePerSubject = () => {
    if (!students.length) return SUBJECTS.map(() => 0);
    return SUBJECTS.map((_, si) => {
      const vals = students.map((s) => s.grades[si] ?? 0);
      return Number(avg(vals).toFixed(2));
    });
  };

  const classAverageOverall = () => {
    if (!students.length) return 0;
    const avgs = students.map((s) => studentAverage(s));
    return Number(avg(avgs).toFixed(2));
  };

  const perSubject = classAveragePerSubject();
  const overallClassAvg = classAverageOverall();

  // CRUD helpers
  const openNew = () => {
    setEditingIndex(-1);
    setForm({ name: '', grades: Array(5).fill(''), attendance: '' });
    setModalVisible(true);
  };

  const openEdit = (idx: number) => {
    const s = students[idx];
    setEditingIndex(idx);
    setForm({ name: s.name, grades: s.grades.map(String), attendance: String(s.attendance) });
    setModalVisible(true);
  };

  const removeStudent = (idx: number) => {
    Alert.alert('Remover', 'Deseja remover este aluno?', [
      { text: 'Cancelar', style: 'cancel' },
      {
        text: 'Remover',
        style: 'destructive',
        onPress: () => setStudents((prev) => prev.filter((_, i) => i !== idx)),
      },
    ]);
  };

  const saveForm = () => {
    if (!form.name.trim()) return Alert.alert('Validação', 'Informe o nome do aluno');

    const gradesNum = form.grades.map((g) => {
      const n = Number(g.replace(',', '.'));
      return clamp(isNaN(n) ? 0 : n, 0, 10);
    }).slice(0, 5).concat(Array(Math.max(0, 5 - form.grades.length)).fill(0));

    let att = Number(form.attendance.replace(',', '.'));
    att = clamp(isNaN(att) ? 0 : att, 0, 100);

    const newStudent: Student = { name: form.name.trim(), grades: gradesNum, attendance: att };

    if (editingIndex >= 0) {
      setStudents((prev) => prev.map((s, i) => (i === editingIndex ? newStudent : s)));
    } else {
      setStudents((prev) => [...prev, newStudent]);
    }

    setModalVisible(false);
  };

  const studentsAboveClassAvg = students.filter((s) => studentAverage(s) > overallClassAvg);
  const studentsLowAttendance = students.filter((s) => s.attendance < 75);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Sistema de Notas e Frequência</Text>
        <TouchableOpacity onPress={openNew} style={styles.addBtn}>
          <Text style={{ color: 'white' }}>+ Novo Aluno</Text>
        </TouchableOpacity>
      </View>

      <ScrollView style={{ width: '100%' }} contentContainerStyle={{ paddingBottom: 40 }}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Média da turma por disciplina</Text>
          {SUBJECTS.map((s, i) => (
            <Text key={s}>
              {s}: {perSubject[i]}
            </Text>
          ))}
          <Text style={{ marginTop: 8, fontWeight: '600' }}>Média geral da turma: {overallClassAvg}</Text>
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Alunos (total: {students.length})</Text>
          {students.length === 0 ? (
            <Text>Nenhum aluno cadastrado — use + Novo Aluno</Text>
          ) : (
            <FlatList
              data={students}
              keyExtractor={(_, i) => String(i)}
              renderItem={({ item, index }) => (
                <View style={styles.card}>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.name}>{item.name}</Text>
                    <Text>Média: {studentAverage(item)}</Text>
                    <Text>Frequência: {item.attendance}%</Text>
                    <Text>Notas: {item.grades.map((g, i) => `${SUBJECTS[i]}: ${g}`).join(' | ')}</Text>

                    <View style={{ flexDirection: 'row', marginTop: 6 }}>
                      {studentAverage(item) > overallClassAvg && <Text style={styles.tag}>Acima da média da turma</Text>}
                      {item.attendance < 75 && <Text style={[styles.tag, { backgroundColor: '#ffcccc' }]}>Frequência &lt; 75%</Text>}
                    </View>
                  </View>

                  <View style={{ justifyContent: 'space-between' }}>
                    <TouchableOpacity onPress={() => openEdit(index)} style={styles.smallBtn}>
                      <Text>Editar</Text>
                    </TouchableOpacity>

                    <TouchableOpacity onPress={() => removeStudent(index)} style={[styles.smallBtn, { backgroundColor: '#fdd' }]}>
                      <Text>Remover</Text>
                    </TouchableOpacity>
                  </View>
                </View>
              )}
            />
          )}
        </View>

        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Relatórios rápidos</Text>
          <Text>Alunos com média acima da turma: {studentsAboveClassAvg.length}</Text>
          {studentsAboveClassAvg.map((s, i) => (
            <Text key={i}>— {s.name} (média {studentAverage(s)})</Text>
          ))}

          <View style={{ height: 8 }} />
          <Text>Alunos com frequência abaixo de 75%: {studentsLowAttendance.length}</Text>
          {studentsLowAttendance.map((s, i) => (
            <Text key={i}>— {s.name} ({s.attendance}%)</Text>
          ))}
        </View>
      </ScrollView>

      <Modal visible={modalVisible} animationType="slide">
        <SafeAreaView style={{ flex: 1 }}>
          <KeyboardAvoidingView behavior={Platform.OS === 'ios' ? 'padding' : undefined} style={{ flex: 1 }}>
            <ScrollView contentContainerStyle={{ padding: 16 }}>
              <Text style={{ fontSize: 18, fontWeight: '700', marginBottom: 12 }}>{editingIndex >= 0 ? 'Editar Aluno' : 'Novo Aluno'}</Text>

              <Text>Nome</Text>
              <TextInput
                style={styles.input}
                value={form.name}
                onChangeText={(t) => setForm((f) => ({ ...f, name: t }))}
                placeholder="Nome do aluno"
              />

              <Text style={{ marginTop: 8 }}>Notas (0 - 10)</Text>
              {SUBJECTS.map((s, i) => (
                <View key={s} style={{ marginTop: 6 }}>
                  <Text>{s}</Text>
                  <TextInput
                    keyboardType="numeric"
                    style={styles.input}
                    value={form.grades[i]}
                    onChangeText={(t) =>
                      setForm((f) => {
                        const g = [...f.grades];
                        g[i] = t;
                        return { ...f, grades: g };
                      })
                    }
                    placeholder="0"
                  />
                </View>
              ))}

              <Text style={{ marginTop: 8 }}>Frequência (%)</Text>
              <TextInput
                keyboardType="numeric"
                style={styles.input}
                value={form.attendance}
                onChangeText={(t) => setForm((f) => ({ ...f, attendance: t }))}
                placeholder="0 - 100"
              />

              <View style={{ flexDirection: 'row', justifyContent: 'space-between', marginTop: 24 }}>
                <TouchableOpacity onPress={() => setModalVisible(false)} style={[styles.btn, { backgroundColor: '#eee' }]}>
                  <Text>Cancelar</Text>
                </TouchableOpacity>
                <TouchableOpacity onPress={saveForm} style={styles.btn}>
                  <Text style={{ color: 'white' }}>Salvar</Text>
                </TouchableOpacity>
              </View>

            </ScrollView>
          </KeyboardAvoidingView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, alignItems: 'center', backgroundColor: '#fff' },
  header: { width: '100%', padding: 16, flexDirection: 'row', alignItems: 'center', justifyContent: 'space-between' },
  title: { fontSize: 20, fontWeight: '700', marginTop: 30 },
  addBtn: { backgroundColor: '#2a9d8f', padding: 10, borderRadius: 8, marginTop: 30 },
  section: { paddingHorizontal: 16, width: '100%', marginBottom: 12 },
  sectionTitle: { fontWeight: '700', marginBottom: 6 },
  card: { backgroundColor: '#fafafa', padding: 12, marginVertical: 6, borderRadius: 8, flexDirection: 'row', width: '100%' },
  name: { fontSize: 16, fontWeight: '700' },
  smallBtn: { padding: 8, backgroundColor: '#ddd', borderRadius: 6, marginBottom: 6 },
  tag: { backgroundColor: '#cfeadf', padding: 6, borderRadius: 6, marginRight: 8 },
  input: { borderWidth: 1, borderColor: '#ddd', padding: 8, borderRadius: 6, marginTop: 4 },
  btn: { backgroundColor: '#2a9d8f', padding: 12, borderRadius: 8, minWidth: 120, alignItems: 'center' },
});

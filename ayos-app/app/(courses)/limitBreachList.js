import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity } from 'react-native';
import { useLocalSearchParams, useNavigation, useRouter } from "expo-router";
import AsyncStorage from '@react-native-async-storage/async-storage';
import axios from 'axios';
import Card from '../../components/Card';
import { GlobalStyles } from '../../constants/styles';
import { AntDesign } from "@expo/vector-icons";
import Loading from "../../components/Loading";
import * as FileSystem from 'expo-file-system';
import * as Sharing from 'expo-sharing';




const LimitBreachList = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const courseCode = params.courseCode;
    const ip_address = process.env.EXPO_PUBLIC_BASE_IP;
    const [students, setStudents] = useState([]);
    const [loading, setLoading] = useState(false);
    const [studentAttendanceTotal, setStudentAttendanceTotal] = useState({});
    const [weeklyAttendance, setWeeklyAttendance] = useState([]);
    const [exceededLimitStudents, setExceededLimitStudents] = useState([]);
    const [atLimitStudents, setAtLimitStudents] = useState([]);
    const [showExceededLimit, setShowExceededLimit] = useState(true);
    const [showAtLimit, setShowAtLimit] = useState(true);




    useEffect(() => {
        setLoading(true);
        fetchLimitBreaches();
    }, [courseCode]);

    const fetchLimitBreaches = async () => {
        try {
            const token = await AsyncStorage.getItem("auth");
            const response = await axios.get(`http://${ip_address}:8000/course/limitBreaches?courseCode=${courseCode}`, {
                headers: { Authorization: `Bearer ${token}` },
            });
            setExceededLimitStudents(response.data.exceededLimit);
            setAtLimitStudents(response.data.atLimit);
            setLoading(false);
        } catch (error) {
            console.error("Error fetching limit breaches:", error.message);
            setLoading(false);
        }
    };


    const goBackToCourses = () => {
        router.back();
    };

    const toggleExceededLimit = () => {
        setShowExceededLimit(!showExceededLimit);
    };

    const toggleAtLimit = () => {
        setShowAtLimit(!showAtLimit);
    };

    const exportStudentsToCSV = async (students) => {
        let csvContent ="Name,Surname,Email,Student ID,Absences\n";  
    
        students.forEach(student => {
            const row = `${student.name},${student.surname},${student.email},${student.studentId},${student.absences}`;
            csvContent += row + "\n";
        });
    
        const fileName = `${FileSystem.cacheDirectory}AbsentStudents.csv`;
    
        await FileSystem.writeAsStringAsync(fileName, csvContent, { encoding: FileSystem.EncodingType.UTF8 });
    
        await Sharing.shareAsync(fileName, {
            mimeType: 'text/csv',
            dialogTitle: 'Share your CSV file',
            UTI: 'public.csv'
        });
    
        return fileName;
    };

    const handleExportToCSV = () => {
        const studentsToExport = [];
        if (showExceededLimit) {
            studentsToExport.push(...exceededLimitStudents);
        }
        if (showAtLimit) {
            studentsToExport.push(...atLimitStudents);
        }
        exportStudentsToCSV(studentsToExport);
    };

    const handleSendEmails = async () => {
        try {
          const token = await AsyncStorage.getItem("auth");
          const postData = {
            exceededLimitStudents: exceededLimitStudents,
            atLimitStudents: atLimitStudents,
            courseCode: courseCode,
          };
      
          const response = await axios.post(`http://${ip_address}:8000/sendAttendanceWarnings`, postData, {
            headers: { Authorization: `Bearer ${token}` },
          });
      
          if (response.status === 200) {
            alert('Emails sent successfully');
          }
        } catch (error) {
          console.error('Failed to send emails:', error.message);
          alert('Failed to send emails');
        }
      };



    return (
        <ScrollView style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={goBackToCourses}>
                    <View style={styles.backIconView}>
                        <AntDesign name="arrowleft" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerText}>DEVAMSIZLIKLAR</Text>

                <TouchableOpacity onPress={handleSendEmails}>
                    <View style={styles.backIconView}>
                        <AntDesign name="export" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                
            </View>
            <Loading visible={loading} />
            {!loading && (
                <ScrollView contentContainerStyle={styles.contentContainer}>
                    <Card attendance="attended">
                        <TouchableOpacity style={styles.optionButton} onPress={toggleExceededLimit}>
                            <Text style={styles.subHeader}>Sınırı Geçen Öğrenciler</Text>
                            <AntDesign name={showExceededLimit ? "down" : "right"} size={24} color="white" />
                        </TouchableOpacity>
                    </Card>
                    {showExceededLimit && exceededLimitStudents.length === 0 ? (
                        <Card><Text style={styles.text}>Kayıt bulunamadı.</Text></Card>
                    ) : showExceededLimit && (
                        exceededLimitStudents.map((student, index) => (
                            <Card key={index} style={styles.card}>
                                <Text style={styles.text}>{student.name} {student.surname} - {student.studentId}</Text>
                                <Text style={styles.text}>{student.email}</Text>
                                <Text style={styles.text}>Toplam Devamsızlık: {student.absences} hafta</Text>
                            </Card>
                        ))
                    )}
                    <Card attendance="attended">
                        <TouchableOpacity style={styles.optionButton} onPress={toggleAtLimit}>
                            <Text style={styles.subHeader}>Sınırdaki Öğrenciler</Text>
                            <AntDesign name={showAtLimit ? "down" : "right"} size={24} color="white" />
                        </TouchableOpacity>
                    </Card>
                    {showAtLimit && atLimitStudents.length === 0 ? (
                        <Card><Text style={styles.text}>Kayıt bulunamadı.</Text></Card>
                    ) : showAtLimit && (
                        atLimitStudents.map((student, index) => (
                            <Card key={index} style={styles.card}>
                                <Text style={styles.text}>{student.name} {student.surname} - {student.studentId}</Text>
                                <Text style={styles.text}>{student.email}</Text>
                                <Text style={styles.text}>Toplam Devamsızlık: {student.absences} hafta</Text>
                            </Card>
                        ))
                    )}
                </ScrollView>
            )}

        </ScrollView>
    );


};

export default LimitBreachList;

const styles = StyleSheet.create({
    container: {
        flex: 1,
        backgroundColor: GlobalStyles.surfaceColors.primary,
    },
    card: {
        marginVertical: 8,
        padding: 15,
        backgroundColor: '#f9c2ff',
    },
    text: {

        color: "white"
    },
    headerContainer: {
        flexDirection: "row",
        alignItems: "center",
        justifyContent: "center",
        padding: 18,
        backgroundColor: GlobalStyles.surfaceColors.secondary500,
    },
    headerText: {
        color: GlobalStyles.surfaceColors.primary,
        fontSize: 24,
        fontWeight: "bold",
        marginLeft: "auto",
        marginRight: "auto",
    },

    camIconView: {
        alignItems: "flex-end",
        justifyContent: "flex-end",
    },
    contentContainer: {
        flexGrow: 1,
        paddingVertical: 20,
        paddingHorizontal: 10,
    },
    cardContainer: {
        marginBottom: 20,
    },
    subHeader: {
        fontSize: 20,
        fontWeight: 'bold',
        color: GlobalStyles.surfaceColors.text,

    },
    optionButton: {

        borderRadius: 8,
        shadowColor: "black",
        flexDirection: "row",
        justifyContent: "space-between",
    },
    optionText: {
        color: "white",
    },
    buttonText: {
        color: 'white',
        fontSize: 16,
        backgroundColor: '#007BFF',
        padding: 10,
        borderRadius: 5,
        textAlign: 'center',
        marginVertical: 10,
    }
});


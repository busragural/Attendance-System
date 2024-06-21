import React, { useEffect, useState } from 'react';
import { View, Text, FlatList, StyleSheet, ScrollView, TouchableOpacity, Alert } from 'react-native';
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
    const [loading, setLoading] = useState(false);
    const [exceededLimitStudents, setExceededLimitStudents] = useState([]);
    const [atLimitStudents, setAtLimitStudents] = useState([]);
    const [showExceededLimit, setShowExceededLimit] = useState(true);
    const [showAtLimit, setShowAtLimit] = useState(true);
    const [menuVisible, setMenuVisible] = useState(false);




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
        let csvContent = "Group,Name,Surname,Email,Student ID,Absences\n";

        exceededLimitStudents.forEach(student => {
            const row = `Kaldı,${student.name},${student.surname},${student.email},${student.studentId},${student.absences}`;
            csvContent += row + "\n";
        });


        atLimitStudents.forEach(student => {
            const row = `Sınırda,${student.name},${student.surname},${student.email},${student.studentId},${student.absences}`;
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

    const confirmSendEmails = () => {
        Alert.alert(
            "E-posta Gönderme Onayı",
            "Seçili öğrencilere uyarı e-postalarını göndermek istediğinizden emin misiniz?",
            [
                { text: "Hayır", style: "cancel" },
                { text: "Evet", onPress: () => handleSendEmails() }
            ],
            { cancelable: true }
        );
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
                Alert.alert('Email gönderme başarılı.');


            }
        } catch (error) {
            console.error('Failed to send emails:', error.message);
            alert('Email gönderilirken hata oluştu.');


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
                <TouchableOpacity onPress={() => setMenuVisible(!menuVisible)}>
                    <View style={styles.menuIconView}>
                        <AntDesign name="bars" size={30} color="white" />
                    </View>
                </TouchableOpacity>

            </View>

            {menuVisible && (
                <TouchableOpacity style={styles.backdrop} onPress={() => setMenuVisible(false)}>
                    <View style={styles.menuOptions} onStartShouldSetResponder={() => true}>
                        <TouchableOpacity style={styles.menuOption} onPress={() => {
                            handleExportToCSV();
                            setMenuVisible(false);
                        }}>
                            <AntDesign name="file1" size={24} color={GlobalStyles.surfaceColors.dark} style={styles.menuIcon} />
                            <Text style={styles.menuOptionText}>Dışarı Aktar</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuOption} onPress={() => {
                            confirmSendEmails();
                            setMenuVisible(false);
                        }}>
                            <AntDesign name="mail" size={24} color={GlobalStyles.surfaceColors.dark} style={styles.menuIcon} />
                            <Text style={styles.menuOptionText}>Mail Gönder</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            )}


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
    },
    menuOptions: {
        position: 'absolute',
        right: 10,
        top: 50,
        backgroundColor: GlobalStyles.surfaceColors.primary,
        borderRadius: 10,
        padding: 16,
        shadowColor: "#000",
        shadowOffset: {
            width: 0,
            height: 2,
        },
        shadowOpacity: 0.25,
        shadowRadius: 3.84,
        elevation: 5,
        zIndex: 1000,
    },
    menuOption: {
        flexDirection: 'row',
        alignItems: 'center',
        marginBottom: 10,
        borderBottomColor: "#ddd",
        borderBottomWidth: 1
    },
    menuIcon: {
        marginRight: 10,
    },
    menuOptionText: {
        fontSize: 16,
        color: GlobalStyles.surfaceColors.dark,
        padding: 8,
        fontWeight: "400",
    },
    backdrop: {
        position: 'absolute',
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        backgroundColor: 'rgba(0,0,0,0.4)',
        zIndex: 999
    },
});


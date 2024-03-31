import React, { useState, useEffect } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlobalStyles } from '../../constants/styles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/Card';
import { BarChart } from 'react-native-chart-kit';
import { LineChart } from 'react-native-chart-kit';
import PrimaryButton from '../../components/PrimaryButton';

const deviceWidth = Dimensions.get('window').width;


const CourseStatistics = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const courseCode = params.courseCode;
    const courseStartDate = params.courseStartDate;
    const courseWeek = params.courseWeek;

    const [studentNumbers, setStudentNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weeklyAttendance, setWeeklyAttendance] = useState([]);
    const [studentAttendanceTotal, setStudentAttendanceTotal] = useState({});

    const ip_address = process.env.EXPO_PUBLIC_BASE_IP;


    const goBackToCourses = () => {
        router.back();
    };
    useEffect(() => {
        const fetchData = async () => {
            try {
                const token = await AsyncStorage.getItem("auth");
                const response = await axios.get(
                    `http://${ip_address}:8000/course/studentNumbers?courseCode=${courseCode}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data = response.data;
                console.log("data nemis", data);
                setStudentNumbers(data.studentNumbers); // Verileri state'e kaydet

            } catch (error) {
                console.error("Error fetching student numbers:", error.message);
            }
        };

        const fetchWeeklyAttendance = async () => {
            try {
                const token = await AsyncStorage.getItem("auth");
                const response = await axios.get(
                    `http://${ip_address}:8000/course/weeklyAttendance?courseCode=${courseCode}`,
                    {
                        headers: {
                            Authorization: `Bearer ${token}`,
                        },
                    }
                );
                const data = response.data;
                console.log(" data:", data);
                console.log("Weekly attendance data:", data.weeklyAttendance);
                data.weeklyAttendance.forEach(entry => {
                    // Access studentIds array for each entry
                    const studentIds = entry.attendanceData;
                    // Now you can use studentIds array as needed
                    console.log("test", studentIds);
                });
                const sortedData = data.weeklyAttendance.sort((a, b) => new Date(a._id) - new Date(b._id));
                setWeeklyAttendance(sortedData);
                console.log(weeklyAttendance);

                const formattedData = data.weeklyAttendance.reduce((acc, entry) => {
                    entry.attendanceData.forEach(student => {
                        if (!acc[student.studentId]) {
                            acc[student.studentId] = { studentId: student.studentId, trueAttended: 0, falseAttended: 0 };
                        }
                        if (student.attended) {
                            acc[student.studentId].trueAttended++;
                        } else {
                            acc[student.studentId].falseAttended++;
                        }
                    });
                    return acc;
                }, {});
                setStudentAttendanceTotal(formattedData);
                console.log("son ", studentAttendanceTotal);

            } catch (error) {
                console.error("Error fetching weekly attendance:", error.message);
            }
        };


        fetchData();
        fetchWeeklyAttendance();


    }, []);

    // Katılım oranlarını temsil eden verileri oluşturma
    const participationData = weeklyAttendance.map(item => {
        const totalParticipants = item.totalTrue + item.totalFalse;
        const participationRate = totalParticipants === 0 ? 0 : Math.round((item.totalTrue / totalParticipants) * 100);
        return participationRate;
    });

    // Tarih verilerini oluşturma
    const dateLabels = weeklyAttendance.map(item => item._id);

    return (
        <ScrollView style={styles.lecturesContainer}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={goBackToCourses}>
                    <View style={styles.backIconView}>
                        <AntDesign name="arrowleft" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerText}>İSTATİSTİK</Text>
            </View>

            <Card>
                <Text style={styles.lecture}>Derse kayıtlı {studentNumbers.length} kişi bulunmaktadır.</Text>
            </Card>

            <Card>
            <Text style={styles.cardTitle}>Haftalık Katılım Grafiği</Text>

                <ScrollView horizontal={true}>
                    <View style={{ flexDirection: 'row' }}>
                        <BarChart
                            data={{
                                // labels: dateLabels,
                                labels: [1, 2, 3, 4, 5, 6, 7, 8, 9, 10, 11, 12, 13, 14],
                                datasets: [{ data: participationData }],

                            }}
                            width={deviceWidth * 0.9} // Grafik genişliği
                            height={220} // Grafik yüksekliği
                            yAxisSuffix="%" // Y eksenine eklenecek önek
                            chartConfig={{
                                backgroundColor: GlobalStyles.surfaceColors.secondaryRed,
                                backgroundGradientFrom: GlobalStyles.surfaceColors.secondaryRed,
                                backgroundGradientTo: GlobalStyles.surfaceColors.secondaryRed,
                                decimalPlaces: 0,
                                color: (opacity = 1) => `rgba(0, 119, 182, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16,

                                    paddingRight: 1
                                },
                                propsForDots: {
                                    r: "6",
                                    strokeWidth: "2",
                                    stroke: "#ffa726"
                                },
                                barPercentage: 0.4 // Bar genişliği
                            }}
                            style={{
                                marginVertical: 8,
                                borderRadius: 16,
                                marginLeft: 'auto',
                                marginRight: 'auto',

                            }}
                        />
                    </View>
                </ScrollView>

            </Card>
            
            <Card>
            <Text style={styles.cardTitle}>Haftalık Katılım Tablosu</Text>
                <View style={styles.tableHeader}>
                    <Text style={styles.wideTableCell}>Tarih</Text>
                    <Text style={styles.tableHeaderText}>Var</Text>
                    <Text style={styles.tableHeaderText}>Yok</Text>
                    <Text style={styles.tableHeaderText}>Oran</Text>
                </View>
                {weeklyAttendance.map((item, index) => {
                    const totalParticipants = item.totalTrue + item.totalFalse;
                    const participationRate = totalParticipants === 0 ? 0 : Math.round((item.totalTrue / totalParticipants) * 100);
                    return (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.wideTableCell}>{item._id}</Text>
                            <Text style={styles.tableCell}>{item.totalTrue}</Text>
                            <Text style={styles.tableCell}>{item.totalFalse}</Text>
                            <Text style={styles.tableCell}>{participationRate}%</Text>
                        </View>
                    );
                })}
            </Card>

            <Card>
            <Text style={styles.cardTitle}>Öğrenci Devamsızlık Oranları</Text>
                <View style={styles.tableHeader}>
                    <Text style={styles.wideTableCell}>Numara</Text>
                    <Text style={styles.tableHeaderText}>Var</Text>
                    <Text style={styles.tableHeaderText}>Yok</Text>
                    <Text style={styles.tableHeaderText}>Oran</Text>
                </View>
                {Object.values(studentAttendanceTotal).map((item, index) => {
                    const attendanceRate = (item.trueAttended / 14) * 100; // 14 haftalık ders için devamsızlık oranı
                    return (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.wideTableCell}>{item.studentId}</Text>
                            <Text style={styles.tableCell}>{item.trueAttended}</Text>
                            <Text style={styles.tableCell}>{item.falseAttended}</Text>
                            <Text style={styles.tableCell}>{attendanceRate.toFixed(2)}%</Text>
                        </View>
                    );
                })}
            </Card>




        </ScrollView>
    );
};

export default CourseStatistics;

const styles = StyleSheet.create({
    lecturesContainer: {
        flex: 1,
        backgroundColor: GlobalStyles.surfaceColors.primary,
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
    loadingText: {
        textAlign: "center",
        marginTop: 20,
        fontSize: 16,

    },
    lecture: {
        color: GlobalStyles.surfaceColors.text,
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: deviceWidth * 0.07, // Cihaz genişliğinin %10'u
        borderBottomWidth: 1,
        borderBottomColor: GlobalStyles.surfaceColors.text,
        marginBottom: 5,
    },


    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,

        color: GlobalStyles.surfaceColors.text,
    },
    wideTableCell: {
        flex: 2, // İlk sütuna daha fazla alan vermek için
        fontSize: 16,
        color: GlobalStyles.surfaceColors.text,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
    },
    tableCell: {
        flex: 1,
        fontSize: 16,
        textAlign: 'center',
        color: GlobalStyles.surfaceColors.text,
    },
    cardTitle: {
        fontSize: 18,
        fontWeight: 'bold',
        textAlign: 'center',
        marginBottom: 10,
        color: GlobalStyles.surfaceColors.text,
        alignSelf: 'center',
    },
});

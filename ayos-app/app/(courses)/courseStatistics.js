import React, { useState, useEffect, useMemo } from 'react';
import { Dimensions, ScrollView, StyleSheet, Text, TouchableOpacity, View } from 'react-native';
import { AntDesign } from "@expo/vector-icons";
import { useLocalSearchParams, useRouter } from 'expo-router';
import { GlobalStyles } from '../../constants/styles';
import axios from 'axios';
import AsyncStorage from '@react-native-async-storage/async-storage';
import Card from '../../components/Card';
import { BarChart, LineChart } from 'react-native-chart-kit';
import PrimaryButton from '../../components/PrimaryButton';
import Loading from '../../components/Loading';

const deviceWidth = Dimensions.get('window').width;


const CourseStatistics = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const courseCode = params.courseCode;
    const courseStartDate = params.courseStartDate;
    const courseWeek = params.courseWeek;
    const courseLimit = params.courseLimit;

    console.log("limir", courseLimit)


    const [studentNumbers, setStudentNumbers] = useState([]);
    const [loading, setLoading] = useState(true);
    const [weeklyAttendance, setWeeklyAttendance] = useState([]);
    const [studentAttendanceTotal, setStudentAttendanceTotal] = useState({});


    const ip_address = process.env.EXPO_PUBLIC_BASE_IP;


    const goBackToCourses = () => {
        router.back();
    };
    useEffect(() => {
        setLoading(true);
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
                setStudentNumbers(data.studentNumbers);

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
                    const studentIds = entry.attendanceData;
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
                setLoading(false);

            } catch (error) {
                console.error("Error fetching weekly attendance:", error.message);
                setLoading(false);
            }
        };


        fetchData();
        fetchWeeklyAttendance();


    }, []);

    const participationData = weeklyAttendance.map(item => {
        const totalParticipants = item.totalTrue + item.totalFalse;
        const participationRate = totalParticipants === 0 ? 0 : Math.round((item.totalTrue / totalParticipants) * 100);
        return participationRate;
    });

    const labels = useMemo(() => {
        if (Object.keys(studentAttendanceTotal).length > 0) {
            const firstStudent = Object.values(studentAttendanceTotal)[0];
            const totalClasses = firstStudent.trueAttended + firstStudent.falseAttended;
            return Array.from({ length: totalClasses }, (_, i) => i + 1);
        }
        return [];
    }, [studentAttendanceTotal]);

    const formatDate = (dateString) => {
        const date = new Date(dateString);
        return `${date.getDate().toString().padStart(2, '0')}/${(date.getMonth() + 1).toString().padStart(2, '0')}/${date.getFullYear()}`;
    };

    const getRowStyle = (falseAttended) => {

        if (falseAttended == courseLimit) {
            return styles.atLimitRow;
        } else if (falseAttended > courseLimit) {
            return styles.exceededLimitRow;
        } else {
            return styles.normalRow;
        }
    };

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

            <Card attendance="attended">
                <Text style={styles.lecture}>Derse kayıtlı {studentNumbers.length} kişi bulunmaktadır.</Text>
            </Card>

            <Card attendance="attended">
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>HAFTALIK KATILIM GRAFİĞİ</Text>
                </View>
                <ScrollView horizontal={true}>
                    <View style={{ flexDirection: 'row' }}>
                        <BarChart
                            data={{

                                labels: labels,
                                datasets: [{ data: participationData }],

                            }}
                            width={deviceWidth * 1.3}
                            height={220}
                            yAxisSuffix="%"
                            chartConfig={{
                                backgroundColor: GlobalStyles.surfaceColors.secondaryRed,
                                backgroundGradientFrom: GlobalStyles.surfaceColors.secondaryRed,
                                backgroundGradientTo: GlobalStyles.surfaceColors.secondaryRed,
                                decimalPlaces: 0,
                                color: (opacity = 0.2) => `rgba(29, 45, 68, ${opacity})`,
                                labelColor: (opacity = 1) => `rgba(255, 255, 255, ${opacity})`,
                                style: {
                                    borderRadius: 16,


                                },

                                barPercentage: 0.3
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

            <Card attendance="attended">
                <View style={styles.cardHeader}>
                    <Text style={styles.cardTitle}>HAFTALIK KATILIM TABLOSU</Text>
                </View>
                <View style={styles.tableHeader}>
                    <Text style={styles.wideTableCell}>Tarih</Text>
                    <Text style={styles.tableHeaderText}>Var</Text>
                    <Text style={styles.tableHeaderText}>Yok</Text>
                    <Text style={styles.tableHeaderText}>Oran</Text>
                </View>
                {weeklyAttendance.map((item, index) => {
                    const formattedDate = formatDate(item._id);

                    const totalParticipants = item.totalTrue + item.totalFalse;
                    const participationRate = totalParticipants === 0 ? 0 : Math.round((item.totalTrue / totalParticipants) * 100);
                    return (
                        <View key={index} style={styles.tableRow}>
                            <Text style={styles.wideTableCell}> {formattedDate} ({index + 1})</Text>
                            <Text style={styles.tableCell}>{item.totalTrue}</Text>
                            <Text style={styles.tableCell}>{item.totalFalse}</Text>
                            <Text style={styles.tableCell}>{participationRate}%</Text>
                        </View>
                    );
                })}
            </Card>
            <View style={styles.ratioTableContainer}>



                <Card attendance="attended">
                    <View style={styles.cardHeader}>
                        <Text style={styles.cardTitle}>DEVAMSIZLIK ORANLARI</Text>
                    </View>
                    <View style={styles.tableHeader}>
                        <Text style={styles.wideTableCell}>Numara</Text>
                        <Text style={styles.tableHeaderText}>Var</Text>
                        <Text style={styles.tableHeaderText}>Yok</Text>
                        <Text style={styles.tableHeaderText}>Oran</Text>
                    </View>
                    {Object.values(studentAttendanceTotal).map((item, index) => {
                        const attendanceRate = (item.trueAttended / courseWeek) * 100;
                        const rowStyle = getRowStyle(item.falseAttended);
                        return (
                            <View key={index} style={rowStyle}>
                                <Text style={styles.wideTableCell}>{item.studentId}</Text>
                                <Text style={styles.tableCell}>{item.trueAttended}</Text>
                                <Text style={styles.tableCell}>{item.falseAttended}</Text>
                                <Text style={styles.tableCell}>{attendanceRate.toFixed(0)}%</Text>
                            </View>
                        );
                    })}
                </Card>

            </View>
            <Loading visible={loading} />

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
        fontSize: 14,
        fontWeight: "bold"
    },
    tableHeader: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        paddingLeft: deviceWidth * 0.07,
        borderBottomWidth: 1,
        borderBottomColor: GlobalStyles.surfaceColors.dark,
        marginBottom: 5,
    },


    tableHeaderText: {
        fontWeight: 'bold',
        fontSize: 16,
        flex: 1,

        color: GlobalStyles.surfaceColors.text,
    },
    wideTableCell: {
        flex: 2,
        fontSize: 16,
        color: GlobalStyles.surfaceColors.text,
        fontWeight: "bold",
    },
    tableRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: `rgba(255, 255, 255, 0.2)`
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
    cardHeader: {
        backgroundColor: 'rgba(29, 45, 68, 0.6)',
        paddingTop: 10,
        paddingHorizontal: 12,
        marginBottom: 16,
        alignItems: 'center',
        borderRadius: 8,
    },
    normalRow: {
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: `rgba(255, 255, 255, 0.2)`,
    },
    atLimitRow: {
        backgroundColor: '#C9BF34',
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: `rgba(255, 255, 255, 0.2)`
    },
    exceededLimitRow: {
        backgroundColor: GlobalStyles.surfaceColors.error,
        flexDirection: 'row',
        justifyContent: 'space-between',
        marginBottom: 5,
        borderBottomWidth: 1,
        borderBottomColor: `rgba(255, 255, 255, 0.2)`
    },
    ratioTableContainer: {
        flex: 1,
        marginBottom: 12,
    }
});

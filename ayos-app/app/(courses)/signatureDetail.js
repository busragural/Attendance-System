import { useLocalSearchParams, useRouter } from 'expo-router';
import React, { useState, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, FlatList } from 'react-native';
import { GlobalStyles } from '../../constants/styles';
import { AntDesign } from "@expo/vector-icons";
import Loading from '../../components/Loading';
import Card from '../../components/Card';
import DropDownPicker from 'react-native-dropdown-picker';

const SignatureDetail = () => {
    const router = useRouter();
    const params = useLocalSearchParams();
    const courseCode = params.courseCode;
    const [signatures, setSignatures] = useState([]);
    const [formattedSignatures, setFormattedSignatures] = useState([]);
    const [loading, setLoading] = useState(false);
    const [sortMode, setSortMode] = useState('studentId');
    const [open, setOpen] = useState(false);

    const ip_address = process.env.EXPO_PUBLIC_BASE_IP;

    useEffect(() => {
        const fetchSignatures = async () => {
            setLoading(true);
            try {
                const response = await fetch(`http://${ip_address}:8000/getSignaturesByCourse?courseCode=${courseCode}`);
                const data = await response.json();
                if (Array.isArray(data)) {
                    setSignatures(data);
                    setFormattedSignatures(formatAndSortSignatures(data, sortMode));
                } else {
                    setSignatures([]);
                    setFormattedSignatures([]);
                }
            } catch (error) {
                console.error('Failed to fetch signatures:', error);
                setSignatures([]);
                setFormattedSignatures([]);
            } finally {
                setLoading(false);
            }
        };
        fetchSignatures();
    }, [courseCode]);

    useEffect(() => {
        setFormattedSignatures(formatAndSortSignatures(signatures, sortMode));
    }, [signatures, sortMode]);

    const formatAndSortSignatures = (signatures, mode) => {
        const formatted = signatures.map(sig => ({
            ...sig,
            groups: formatGroups(sig.groups)
        }));

        return sortSignatures(formatted, mode);
    };



    const sortSignatures = (signatures, mode) => {
        switch (mode) {
            case 'studentId':
                return [...signatures].sort((a, b) => a.studentId.localeCompare(b.studentId));
            case 'groupCount':
                return [...signatures].sort((a, b) => b.groups.length - a.groups.length);
            default:
                return signatures;
        }
    };

    const formatGroups = (groups) => {
        return groups
            .filter(group => group.some(week => week !== null))
            .map((group, index) => ({
                key: `${group.join(', ')} haftaları benzer.`,
                text: `Grup ${index + 1}: ${group.filter(week => week !== null).map(week => `${week}. hafta`).join(', ')}`
            }));
    };

    const goBackToCourses = () => {
        router.back();
    };

    const renderEmptyComponent = () => (
        <Card style={styles.signatureBlock}>
            <Text style={styles.emptyText}>Kayıt bulunamadı.</Text>
        </Card>
    );


    return (
        <View style={styles.container}>
            <View style={styles.headerContainer}>
                <TouchableOpacity onPress={goBackToCourses}>
                    <View style={styles.backIconView}>
                        <AntDesign name="arrowleft" size={30} color="white" />
                    </View>
                </TouchableOpacity>
                <Text style={styles.headerText}>İMZA BENZERLİKLERİ</Text>
            </View>
            <View style={styles.contentContainer}>
                <DropDownPicker
                    open={open}
                    value={sortMode}
                    items={[
                        { label: 'Öğrenci numarasına göre', value: 'studentId' },
                        { label: 'Grup sayısına göre', value: 'groupCount' }
                    ]}
                    setOpen={setOpen}
                    setValue={setSortMode}
                    setItems={() => { }}
                    zIndex={3000}
                    zIndexInverse={1000}
                    style={{
                        backgroundColor: GlobalStyles.surfaceColors.primary,
                        marginBottom: 8
                    }}
                    dropDownContainerStyle={{
                        backgroundColor: GlobalStyles.surfaceColors.primary
                    }}
                    labelStyle={{
                        color: GlobalStyles.surfaceColors.dark
                    }}
                    //arrowColor="#0077b6" 
                    listItemLabelStyle={{
                        color: '#666'
                    }}
                />

                <Loading visible={loading} />

                {!loading && (
                    signatures.length === 0 ? renderEmptyComponent() : (
                        <FlatList
                            data={formattedSignatures}
                            renderItem={({ item }) => (
                                <Card style={styles.signatureBlock} attendance="attended">
                                    <Text style={styles.studentIdText}>Öğrenci: {item.studentId}</Text>
                                    {item.groups.map((groupText, index) => (
                                        <Text key={index} style={styles.groupText}>• {groupText.text}</Text>
                                    ))}
                                </Card>
                            )}
                            keyExtractor={item => item.studentId.toString()}
                        />
                    )
                )}

            </View>
        </View>
    );
};

const styles = StyleSheet.create({
    container: {
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
    studentIdText: {
        fontSize: 18,
        fontWeight: 'bold',
        marginBottom: 10,
        color: "white"
    },
    contentContainer: {
        margin: 16,
        flex: 1
    },
    groupText: {
        color: "white",
        marginBottom: 5,

    },
    text: {

        color: "white"
    },
    emptyText: {
        color: "white",

    },


});

export default SignatureDetail;

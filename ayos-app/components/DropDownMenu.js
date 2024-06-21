import React, { useState } from 'react';
import { View, Text, TouchableOpacity, StyleSheet, Modal } from 'react-native';
import { AntDesign } from "@expo/vector-icons";

const DropdownMenu = ({ onSendEmails, onExportCSV }) => {
    const [menuVisible, setMenuVisible] = useState(false);

    const toggleMenu = () => {
        setMenuVisible(!menuVisible);
    };

    return (
        <View style={styles.menuContainer}>
            <TouchableOpacity onPress={toggleMenu} style={styles.menuTrigger}>
                <AntDesign name="bars" size={24} color="white" />
            </TouchableOpacity>

            <Modal
                visible={menuVisible}
                transparent={true}
                onRequestClose={toggleMenu}
            >
                <TouchableOpacity
                    style={styles.modalOverlay}
                    activeOpacity={1}
                    onPressOut={toggleMenu} 
                >
                    <View style={styles.dropdownMenu}>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            onSendEmails();
                            toggleMenu();
                        }}>
                            <Text style={styles.menuText}>Mail Gönder</Text>
                        </TouchableOpacity>
                        <TouchableOpacity style={styles.menuItem} onPress={() => {
                            onExportCSV();
                            toggleMenu();
                        }}>
                            <Text style={styles.menuText}>CSV Olarak Dışarı Aktar</Text>
                        </TouchableOpacity>
                    </View>
                </TouchableOpacity>
            </Modal>
        </View>
    );
};

export default DropdownMenu;

const styles = StyleSheet.create({
    menuContainer: {
        position: 'absolute',
        top: 0,
        right: 0,
        alignItems: 'flex-end',
        padding: 10
    },
    menuTrigger: {
        padding: 10
    },
    modalOverlay: {
        flex: 1,
        justifyContent: 'flex-start',
        alignItems: 'flex-end',
        paddingTop: 100,  
        backgroundColor: 'rgba(0, 0, 0, 0)'  
    },
    dropdownMenu: {
        marginTop: 5,
        backgroundColor: '#333',
        borderRadius: 8,
        padding: 10,
        shadowColor: '#000',
        shadowOpacity: 0.2,
        shadowRadius: 3,
        shadowOffset: { width: 0, height: 2 },
        elevation: 10
    },
    menuItem: {
        paddingVertical: 10,
        paddingHorizontal: 20
    },
    menuText: {
        color: 'white',
        fontSize: 16
    }
});

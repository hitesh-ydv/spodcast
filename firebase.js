import { initializeApp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-app.js";
import { getFirestore, doc, setDoc, updateDoc, serverTimestamp } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-firestore.js";
import { getDatabase, ref, set, onDisconnect } from "https://www.gstatic.com/firebasejs/9.22.2/firebase-database.js";

// Firebase Configuration
const firebaseConfig = {
    apiKey: "AIzaSyAojJ8KcQWqDZx_UGT4adJSY02saI4UNFg",
    authDomain: "spodcast-17e6f.firebaseapp.com",
    projectId: "spodcast-17e6f",
    storageBucket: "spodcast-17e6f.firebasestorage.app",
    messagingSenderId: "302639795590",
    appId: "1:302639795590:web:83f2f109c38df2e6477007",
    measurementId: "G-6GRTJSEG0K",
    databaseURL: "https://spodcast-17e6f-default-rtdb.firebaseio.com" // Add Realtime Database URL
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
const db = getFirestore(app);
const rtdb = getDatabase(app);

// DOM Elements
const popup = document.getElementById("popup");
const mainBody = document.getElementById("main");
const profileName = document.getElementById("user-fname");
const userNameInput = document.getElementById("userName");
const submitNameButton = document.getElementById("submitName");
const loader = document.getElementById("loader");
const buttonText = document.getElementById("buttonText");
const firstLetter = document.getElementById("header-img");
const firstLetter2 = document.getElementById("user-img");

// Check if the user's name is already stored
const savedUserName = localStorage.getItem("userName");
if (savedUserName) {
    profileName.textContent = savedUserName;
    firstLetter.textContent = savedUserName.charAt(0).toUpperCase();
    firstLetter2.textContent = savedUserName.charAt(0).toUpperCase();
    popup.style.display = "none";
    mainBody.style.display = "block";

    // Mark the user as online in Firebase and update last seen
    const userRef = ref(rtdb, `onlineUsers/${savedUserName}`);
    set(userRef, true);
    onDisconnect(userRef).remove();

    // Update Firestore with the last seen timestamp
    const userDoc = doc(db, "users", savedUserName);
    updateDoc(userDoc, { lastSeen: serverTimestamp() });
}

// Handle submit button click
submitNameButton.addEventListener("click", async () => {
    const userName = userNameInput.value.trim();

    if (!userName) {
        alert("Please enter a valid name.");
        return;
    }

    // Show loader and remove button text
    loader.style.display = "inline-block";
    buttonText.style.display = "none";
    submitNameButton.disabled = true;

    try {
        // Save user data to Firestore with last seen timestamp
        const userDoc = doc(db, "users", userName);
        await setDoc(userDoc, { 
            name: userName, 
            lastSeen: serverTimestamp() 
        });

        // Save user name to local storage
        localStorage.setItem("userName", userName);

        // Mark the user as online in Realtime Database
        const userRef = ref(rtdb, `onlineUsers/${userName}`);
        set(userRef, true);
        onDisconnect(userRef).remove();

        // Update UI
        profileName.textContent = userName;
        firstLetter.textContent = userName.charAt(0).toUpperCase(); // Get the first letter
        firstLetter2.textContent = userName.charAt(0).toUpperCase();
        popup.style.display = "none";
        mainBody.style.display = "block";

        console.log("Name saved successfully!");
    } catch (error) {
        console.error("Error saving name to Firebase:", error);
        alert("Failed to save your name. Please try again.");
    } finally {
        // Hide loader and restore button text
        loader.style.display = "none";
        buttonText.style.display = "inline-block";
        submitNameButton.disabled = false;
    }
});
 
import { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db } from "../firebase";
import PhoneIcon from "@mui/icons-material/Phone";
import TextsmsIcon from "@mui/icons-material/Textsms";
import SettingsIcon from "@mui/icons-material/Settings";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc, getDocs, updateDoc, deleteDoc, collection } from "firebase/firestore";

export default function CommunicationTracker() {
  const [contactName, setContactName] = useState("");
  const [communicationType, setCommunicationType] = useState("phone");
  const [contacts, setContacts] = useState([]);
  const [showSettings, setShowSettings] = useState(false);
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [customTime, setCustomTime] = useState("");
  const [customCommType, setCustomCommType] = useState("call");
  const [deleteConfirmation, setDeleteConfirmation] = useState(null);
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) {
      setIsAuthenticated(true);
      fetchContacts(user.uid);
    } else {
      setIsAuthenticated(false);
      console.error("No user found");
    }
  }, [isAuthenticated]);  // Add isAuthenticated as a dependency
  

  const fetchContacts = async (userId) => {
    try {
      const contactsRef = collection(db, "users", userId, "contacts");
      const querySnapshot = await getDocs(contactsRef);
      const contactList = [];
      querySnapshot.forEach((doc) => {
        contactList.push({ ...doc.data(), id: doc.id });
      });
      setContacts(contactList);
    } catch (error) {
      console.error("Error fetching contacts:", error);
    }
  };

  const handleAddContact = async () => {
    if (contactName.trim() === "") {
      alert("Please enter a contact name.");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    const newContact = {
      name: contactName,
      lastContact: [],
    };

    try {
      await setDoc(doc(db, "users", user.uid, "contacts", contactName), newContact);
      setContactName("");
      fetchContacts(user.uid);
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const handleLogCommunication = async (contactId, type, customDate) => {
    if (!isAuthenticated) {
      console.error("User not authenticated");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    const contactRef = doc(db, "users", user.uid, "contacts", contactId);
    const newEntry = { date: customDate, type };

    try {
      // Update the contact's communication history
      const updatedContacts = contacts.map((contact) =>
        contact.id === contactId
          ? {
              ...contact,
              lastContact: [
                ...contact.lastContact,
                newEntry
              ]
                .sort((a, b) => new Date(b.date) - new Date(a.date)) // Sort communications by date
                .slice(0, 10) // Limit to the last 10 communications
          }
          : contact
      );

      setContacts(updatedContacts);

      await updateDoc(contactRef, {
        lastContact: updatedContacts.find(c => c.id === contactId).lastContact,
      });
    } catch (error) {
      console.error("Error logging communication:", error);
    }
  };

  const handleAddCommunicationTime = async () => {
    if (!selectedContactId || !customTime) {
      alert("Please select a contact and enter a time.");
      return;
    }
  
    const formattedTime = new Date(customTime).toISOString(); // Format the custom time as ISO string
    
    await handleLogCommunication(selectedContactId, customCommType, formattedTime);
    setCustomTime(""); // Reset the custom time field
  };

  const handleDeleteContact = async (contactId) => {
    if (deleteConfirmation === contactId) {
      const user = getAuth().currentUser;
      if (!user) return;

      try {
        await deleteDoc(doc(db, "users", user.uid, "contacts", contactId));
        setDeleteConfirmation(null);
        fetchContacts(user.uid);
      } catch (error) {
        console.error("Error deleting contact:", error);
      }
    } else {
      setDeleteConfirmation(contactId);
    }
  };

  const handleDeleteCommunication = async (contactId, communicationIndex) => {
    if (!isAuthenticated) {
      console.error("User not authenticated");
      return;
    }

    const user = getAuth().currentUser;
    if (!user) return;

    const contactRef = doc(db, "users", user.uid, "contacts", contactId);
    const updatedContact = { ...contacts.find(c => c.id === contactId) };
    updatedContact.lastContact.splice(communicationIndex, 1);

    try {
      await updateDoc(contactRef, { lastContact: updatedContact.lastContact });
      fetchContacts(user.uid);
    } catch (error) {
      console.error("Error deleting communication:", error);
    }
  };

  const handleSettingsClick = (contactId) => {
    setSelectedContactId(selectedContactId === contactId ? null : contactId);
    setShowSettings(selectedContactId !== contactId);
  };

  const handleLogout = () => {
    signOut(getAuth())
      .then(() => navigate("/login"))
      .catch((error) => console.error("Error logging out:", error));
  };

  const formatTimeAgo = (date) => {
    const now = new Date();
    const diffInMs = now - new Date(date);
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return "Today";
    if (diffInDays === 1) return "1 day ago";
    return `${diffInDays} days ago`;
  };

  return (
    <div style={{ backgroundColor: "#1c1c1c", color: "white", padding: "20px", borderRadius: "10px", fontFamily: "Arial, sans-serif" }}>
      <div style={{ display: "flex", justifyContent: "space-between", padding: "10px", backgroundColor: "#333", borderRadius: "10px" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/communications">
            <button style={{ backgroundColor: "transparent", border: "none" }}>
              <PhoneIcon style={{ color: "white", fontSize: "24px" }} />
            </button>
          </Link>
        </div>
        <button onClick={handleLogout} style={{ color: "white", backgroundColor: "transparent", border: "none", fontSize: "18px" }}>
          Log Out
        </button>
      </div>

      <h3 style={{ marginTop: "20px", fontSize: "24px", fontWeight: "bold", color: "white" }}>Communication Tracker</h3>

      <div>
        <input
          type="text"
          value={contactName}
          onChange={(e) => setContactName(e.target.value)}
          placeholder="Enter contact name"
          style={{ padding: "12px", borderRadius: "8px", width: "100%", marginBottom: "10px", fontSize: "16px", backgroundColor: "#444", border: "none", color: "white" }}
        />
        <button onClick={handleAddContact} style={{ padding: "12px 20px", backgroundColor: "white", color: "black", borderRadius: "8px", fontSize: "16px" }}>
          Add Contact
        </button>
      </div>

      <h4 style={{ marginTop: "20px", fontSize: "20px", fontWeight: "bold", color: "white" }}>Contacts</h4>
      {contacts.length === 0 ? (
        <p style={{ color: "white" }}>No contacts found. Please add a contact.</p>
      ) : (
        contacts.map((contact) => (
          <div key={contact.id} style={{ backgroundColor: "#444", padding: "15px", borderRadius: "8px", marginBottom: "15px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "white", fontWeight: "bold" }}>{contact.name}</span>
              <span style={{ color: "white", fontSize: "12px" }}>
                {contact.lastContact.length > 0
                  ? `${formatTimeAgo(contact.lastContact[0].date)} - ${contact.lastContact[0].type}`
                  : ""}
              </span>
              <div style={{ display: "flex", gap: "10px" }}>
                <button onClick={() => handleLogCommunication(contact.id, "call", new Date().toISOString())} style={{ color: "black", fontSize: "18px" }}>
                  <PhoneIcon />
                </button>
                <button onClick={() => handleLogCommunication(contact.id, "text", new Date().toISOString())} style={{ color: "black", fontSize: "18px" }}>
                  <TextsmsIcon />
                </button>
                <button onClick={() => handleSettingsClick(contact.id)} style={{ color: "black", fontSize: "18px" }}>
                  <SettingsIcon />
                </button>
              </div>
            </div>

            {showSettings && selectedContactId === contact.id && (
              <div style={{ marginTop: "15px", padding: "15px", backgroundColor: "#555", borderRadius: "8px" }}>
                <h4 style={{ fontSize: "20px", fontWeight: "bold", color: "white" }}>Communication History</h4>
                {contact.lastContact && contact.lastContact.length > 0 ? (
                  contact.lastContact.map((entry, index) => (
                    <div key={index} style={{ display: "flex", justifyContent: "space-between" }}>
                      <p style={{ color: "white" }}>{new Date(entry.date).toLocaleString()} - {entry.type}</p>
                      <button
                        onClick={() => handleDeleteCommunication(contact.id, index)}
                        style={{ color: "white", backgroundColor: "transparent", border: "none", fontSize: "16px" }}
                      >
                        Delete
                      </button>
                    </div>
                  ))
                ) : (
                  <p style={{ color: "white" }}>No history yet.</p>
                )}

                <input type="datetime-local" value={customTime} onChange={(e) => setCustomTime(e.target.value)} style={{ marginRight: "10px", padding: "10px", borderRadius: "8px", backgroundColor: "#444", color: "white" }} />
                <select value={customCommType} onChange={(e) => setCustomCommType(e.target.value)} style={{ padding: "10px", borderRadius: "8px", backgroundColor: "#444", color: "white" }}>
                  <option value="call">Call</option>
                  <option value="text">Text</option>
                </select>
                <button onClick={handleAddCommunicationTime} style={{ padding: "10px 20px", backgroundColor: "white", color: "black", borderRadius: "8px", marginTop: "10px" }}>
                  Add Communication
                </button>

                <button
                  onClick={() => handleDeleteContact(contact.id)}
                  style={{ padding: "10px", backgroundColor: "red", color: "white", borderRadius: "8px", marginTop: "10px" }}
                >
                  Delete Contact
                </button>
              </div>
            )}
          </div>
        ))
      )}
    </div>
  );
}

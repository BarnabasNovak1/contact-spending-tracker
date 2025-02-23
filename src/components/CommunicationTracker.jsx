import React, { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { db, storage } from "../firebase";
import PhoneIcon from "@mui/icons-material/Phone";
import TextsmsIcon from "@mui/icons-material/Textsms";
import SettingsIcon from "@mui/icons-material/Settings";
import InfoIcon from "@mui/icons-material/Info";
import Avatar from "@mui/material/Avatar";
import { Link, useNavigate } from "react-router-dom";
import { doc, setDoc, getDocs, updateDoc, collection, deleteDoc } from "firebase/firestore";
import { ref, uploadBytesResumable, getDownloadURL } from "firebase/storage";
import DeleteIcon from "@mui/icons-material/Delete";

export default function CommunicationTracker() {
  const [contactName, setContactName] = useState("");
  const [contacts, setContacts] = useState([]);
  const [showSettings, setShowSettings] = useState({});
  const [showInfo, setShowInfo] = useState({});
  const [selectedContactId, setSelectedContactId] = useState(null);
  const [customTime, setCustomTime] = useState("");
  const [customCommType, setCustomCommType] = useState("call");
  const [image, setImage] = useState(null);
  const [imageUrl, setImageUrl] = useState(null);
  const [newName, setNewName] = useState("");
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
  }, []);

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
      imageUrl: imageUrl || null,
    };

    try {
      await setDoc(doc(db, "users", user.uid, "contacts", contactName), newContact);
      setContactName("");
      setImageUrl(null);
      setImage(null);
      fetchContacts(user.uid);
    } catch (error) {
      console.error("Error adding contact:", error);
    }
  };

  const handleUploadImage = (e) => {
    const file = e.target.files[0];
    if (file) {
      const storageRef = ref(storage, `contact_images/${file.name}`);
      const uploadTask = uploadBytesResumable(storageRef, file);

      uploadTask.on(
        "state_changed",
        (snapshot) => {
          const progress = (snapshot.bytesTransferred / snapshot.totalBytes) * 100;
          console.log("Upload is " + progress + "% done");
        },
        (error) => {
          console.error("Error uploading image:", error);
        },
        async () => {
          const url = await getDownloadURL(uploadTask.snapshot.ref);
          setImageUrl(url);
        }
      );
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
      const updatedContacts = contacts.map((contact) =>
        contact.id === contactId
          ? { ...contact, lastContact: [...contact.lastContact, newEntry].sort((a, b) => new Date(b.date) - new Date(a.date)).slice(0, 10) }
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

  const handleSettingsClick = (contactId) => {
    setShowSettings((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
  };

  const handleInfoClick = (contactId) => {
    setShowInfo((prev) => ({
      ...prev,
      [contactId]: !prev[contactId],
    }));
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

    if (diffInDays === 0) return "Last contact was made: Today";
    if (diffInDays === 1) return "Last contact was made: 1 day ago";
    return `Last contact was made: ${diffInDays} days ago`;
  };

  const handleDeleteLog = async (contactId, logIndex) => {
    const user = getAuth().currentUser;
    if (!user) return;

    const contactRef = doc(db, "users", user.uid, "contacts", contactId);
    try {
      const updatedContacts = contacts.map((contact) => {
        if (contact.id === contactId) {
          const updatedLogs = contact.lastContact.filter((_, index) => index !== logIndex);
          return { ...contact, lastContact: updatedLogs };
        }
        return contact;
      });

      setContacts(updatedContacts);

      await updateDoc(contactRef, {
        lastContact: updatedContacts.find(c => c.id === contactId).lastContact,
      });
    } catch (error) {
      console.error("Error deleting log:", error);
    }
  };

  const handleSaveChanges = async (contactId) => {
    const user = getAuth().currentUser;
    if (!user) return;

    const contactRef = doc(db, "users", user.uid, "contacts", contactId);

    const updatedContact = {
      name: newName || contactName, // new name or original name if not updated
      imageUrl: imageUrl || null, // use imageUrl or null if not updated
    };

    try {
      await updateDoc(contactRef, updatedContact);
      setNewName("");
      fetchContacts(user.uid);
    } catch (error) {
      console.error("Error saving contact changes:", error);
    }
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
            <div style={{ display: "flex", alignItems: "flex-start" }}>
  <Avatar
    src={contact.imageUrl || undefined}
    alt={contact.name}
    style={{
      width: 50,
      height: 50,
      marginRight: 10,
      backgroundColor: "#444",
      color: "white",
      display: "flex",
      justifyContent: "center", // Align the text in the center of the Avatar
      alignItems: "center", // Center the content in the Avatar
      fontSize: "24px",
    }}
  >
    {!contact.imageUrl && contact.name && contact.name.charAt(0).toUpperCase()}
  </Avatar>

  <div style={{ flexShrink: 0 }}>
    <span style={{ color: "white", fontWeight: "bold", fontSize: "18px" }}>
      {contact.name}
    </span>
    <div style={{ color: "white", fontSize: "12px" }}>
      {contact.lastContact.length > 0
        ? `${formatTimeAgo(contact.lastContact[0].date)} - ${contact.lastContact[0].type}`
        : ""}
    </div>
  </div>
</div>


            <div style={{ display: "flex", gap: "10px", marginTop: "10px" }}>
              <button onClick={() => handleLogCommunication(contact.id, "call", new Date().toISOString())} style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "10px", borderRadius: "5px" }}>
                Call
              </button>
              <button onClick={() => handleLogCommunication(contact.id, "message", new Date().toISOString())} style={{ backgroundColor: "#008CBA", color: "white", border: "none", padding: "10px", borderRadius: "5px" }}>
                Message
              </button>

              <button onClick={() => handleSettingsClick(contact.id)} style={{ backgroundColor: "#f2f2f2", color: "black", border: "none", padding: "10px", borderRadius: "5px" }}>
                <SettingsIcon />
              </button>

              <button onClick={() => handleInfoClick(contact.id)} style={{ backgroundColor: "#f2f2f2", color: "black", border: "none", padding: "10px", borderRadius: "5px" }}>
                <InfoIcon />
              </button>
            </div>

            {showSettings[contact.id] && (
              <div style={{ marginTop: "10px" }}>
                <input
                  type="text"
                  value={newName}
                  onChange={(e) => setNewName(e.target.value)}
                  placeholder="Edit contact name"
                  style={{ padding: "12px", borderRadius: "8px", width: "100%", marginBottom: "10px", fontSize: "16px", backgroundColor: "#444", border: "none", color: "white" }}
                />
                <button onClick={() => handleSaveChanges(contact.id)} style={{ backgroundColor: "#4CAF50", color: "white", border: "none", padding: "10px", borderRadius: "5px", marginTop: "10px" }}>
                  Save Changes
                </button>
              </div>
            )}
            
            {showInfo[contact.id] && (
  <div
    style={{
      display: "flex",
      justifyContent: "space-between",
      marginTop: "10px",
      color: "white",
      backgroundColor: "#333",
      padding: "20px",
      borderRadius: "10px",
    }}
  >
    {/* Communication History (Left Side) */}
<div style={{ width: "45%", paddingRight: "20px" }}>
  <h4>Communication Log</h4>
  {contact.lastContact.length > 0 ? (
    <ul style={{ color: "white", listStyleType: "none", padding: "0" }}>
      {contact.lastContact.map((log, index) => {
        const logDate = new Date(log.date);
        const formattedDate = logDate.toLocaleDateString("en-US", {
          weekday: "short",
          year: "numeric",
          month: "short",
          day: "numeric",
        });
        const formattedTime = logDate.toLocaleTimeString("en-US", {
          hour: "2-digit",
          minute: "2-digit",
        });

        return (
          <li key={index} style={{ marginBottom: "10px" }}>
            <strong>{formattedDate}</strong> at <strong>{formattedTime}</strong> - {log.type}
            <DeleteIcon
              onClick={() => handleDeleteLog(contact.id, index)}
              style={{
                cursor: "pointer",
                marginLeft: "10px",
                color: "red",
              }}
            />
          </li>
        );
      })}
    </ul>
  ) : (
    <p>No communication logs yet.</p>
  )}
</div>

    {/* Log Custom Communication (Right Side) */}
    <div style={{ width: "45%", paddingLeft: "20px" }}>
      <h4>Log Custom Communication</h4>
      <input
        type="datetime-local"
        value={customTime}
        onChange={(e) => setCustomTime(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "5px",
          backgroundColor: "#444",
          color: "white",
          border: "none",
          marginBottom: "10px",
          width: "100%",
        }}
      />
      <select
        value={customCommType}
        onChange={(e) => setCustomCommType(e.target.value)}
        style={{
          padding: "10px",
          borderRadius: "5px",
          backgroundColor: "#444",
          color: "white",
          border: "none",
          marginBottom: "10px",
          width: "100%",
        }}
      >
        <option value="call">Call</option>
        <option value="message">Message</option>
      </select>
      <div style={{ display: "flex", justifyContent: "flex-end" }}>
        <button
          onClick={() => {
            handleLogCommunication(contact.id, customCommType, customTime);
            setCustomTime("");
          }}
          style={{
            backgroundColor: "#4CAF50",
            color: "white",
            padding: "10px 20px",
            borderRadius: "5px",
            border: "none",
            cursor: "pointer",
            fontSize: "16px",
          }}
        >
          Save
        </button>
      </div>
    </div>
  </div>
)}

          </div>
        ))
      )}
    </div>
  );
}

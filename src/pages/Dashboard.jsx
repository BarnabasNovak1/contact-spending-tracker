import { useState, useEffect } from "react";
import { getAuth, signOut } from "firebase/auth";
import { getDocs, collection, query, orderBy, limit } from "firebase/firestore";
import { db } from "../firebase";
import { Link, useNavigate } from "react-router-dom";
import HomeIcon from "@mui/icons-material/Home";
import PhoneIcon from "@mui/icons-material/Phone";
import AttachMoneyIcon from "@mui/icons-material/AttachMoney";

export default function Dashboard() {
  const [communications, setCommunications] = useState([]);
  const [spending, setSpending] = useState([]);
  const [pinnedContacts, setPinnedContacts] = useState([]);
  const navigate = useNavigate();

  useEffect(() => {
    const user = getAuth().currentUser;
    if (user) {
      fetchCommunications(user.uid);
      fetchSpending(user.uid);
    }
  }, []);

  const reloadCommunications = () => {
    const user = getAuth().currentUser;
    if (user) {
      fetchCommunications(user.uid);
    }
  };

  const fetchCommunications = async (userId) => {
    try {
      const q = query(
        collection(db, "users", userId, "communications"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const communicationsData = [];
      querySnapshot.forEach((doc) => {
        communicationsData.push(doc.data());
      });

      // Separate pinned contacts from others
      const pinned = communicationsData.filter((comm) => comm.pinned);
      const nonPinned = communicationsData.filter((comm) => !comm.pinned);

      setPinnedContacts(pinned);
      setCommunications(nonPinned);
    } catch (error) {
      console.error("Error fetching communications:", error);
    }
  };

  const fetchSpending = async (userId) => {
    try {
      const q = query(
        collection(db, "users", userId, "spending"),
        orderBy("timestamp", "desc"),
        limit(5)
      );
      const querySnapshot = await getDocs(q);
      const spendingData = [];
      querySnapshot.forEach((doc) => {
        spendingData.push(doc.data());
      });
      setSpending(spendingData);
    } catch (error) {
      console.error("Error fetching spending:", error);
    }
  };

  const calculateLastMonthSpending = () => {
    const lastMonth = new Date();
    lastMonth.setMonth(lastMonth.getMonth() - 1);

    const total = spending.reduce((acc, item) => {
      const itemDate = new Date(item.timestamp.seconds * 1000);
      if (itemDate.getMonth() === lastMonth.getMonth()) {
        return acc + item.amount;
      }
      return acc;
    }, 0);
    return total.toFixed(2);
  };

  const handleLogout = () => {
    signOut(getAuth())
      .then(() => {
        console.log("User logged out");
        navigate("/login");
      })
      .catch((error) => {
        console.error("Error logging out:", error);
      });
  };

  return (
    <div>
      {/* Top Navigation */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", padding: "10px 20px", backgroundColor: "#333" }}>
        <div style={{ display: "flex", gap: "20px" }}>
          <Link to="/dashboard" style={{ color: "white", fontSize: "16px" }}>
            <HomeIcon />
          </Link>
          <Link to="/communications" style={{ color: "white", fontSize: "16px" }} onClick={reloadCommunications}>
            <PhoneIcon />
          </Link>
          <Link to="/spending" style={{ color: "white", fontSize: "16px" }}>
            <AttachMoneyIcon />
          </Link>
        </div>
        <button onClick={handleLogout} style={{ color: "white", backgroundColor: "transparent", border: "none", fontSize: "16px" }}>
          Log Out
        </button>
      </div>

      <h3>Dashboard</h3>

      <div style={{ display: "flex" }}>
        {/* Latest Communications Section */}
        <div style={{ width: "50%", marginRight: "20px" }}>
          <h4>Latest Communications</h4>

          {/* Pinned Contacts */}
          {pinnedContacts.length > 0 && (
            <div>
              <h5>Pinned Contacts</h5>
              <ul>
                {pinnedContacts.map((comm, index) => (
                  <li key={index}>
                    <div>{comm.name}</div>
                    <div>{comm.communicationType}</div>
                    <div>{new Date(comm.timestamp.seconds * 1000).toLocaleString()}</div>
                  </li>
                ))}
              </ul>
            </div>
          )}

          {/* Non-Pinned Contacts */}
          <h5>Other Communications</h5>
          <ul>
            {communications.length === 0 ? (
              <li>No communications found. Please add a contact.</li>
            ) : (
              communications.map((comm, index) => (
                <li key={index}>
                  <div>{comm.name}</div>
                  <div>{comm.communicationType}</div>
                  <div>{new Date(comm.timestamp.seconds * 1000).toLocaleString()}</div>
                </li>
              ))
            )}
          </ul>
          <Link to="/communications">View All Communications</Link>
        </div>

        {/* Last Month's Spending Section */}
        <div style={{ width: "50%" }}>
          <h4>Last Month's Spending</h4>
          <p>Total: ${calculateLastMonthSpending()}</p>
          <Link to="/spending">View All Spending</Link>
        </div>
      </div>
    </div>
  );
}

import React, { useState, useEffect, useRef } from "react";
import styles from "../cssfiles/Advanceddashboard.module.css";
import { useNavigate } from "react-router-dom";
import { FaArrowLeft } from "react-icons/fa";
import Webcam from "react-webcam";
import axios from "axios";
import DashboardOverview from "./DashboardOverview";
import DashboardTables from "./DashboardTables";
import MessageModal from "./MessageModal";
import MonthlyAppointments from "../tabels/MonthlyAppointments";

const AdvancedDashboard = () => {
  const navigate = useNavigate();

  // כלל המשתנים של המצב
  const [stats, setStats] = useState([]);
  const [notifications, setNotifications] = useState([]);
  const [delayedTreatments, setDelayedTreatments] = useState([]);
  const [selectedTable, setSelectedTable] = useState(null);
  const [tableData, setTableData] = useState([]);
  const [tableTitle, setTableTitle] = useState("");
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [message, setMessage] = useState("");
  const [phoneNumber, setPhoneNumber] = useState("");
  const [sendToAll, setSendToAll] = useState(false);
  const [recommendedCars, setRecommendedCars] = useState([]);

  const [showCameraPanel, setShowCameraPanel] = useState(false);
  const [image, setImage] = useState(null);
  const [plate, setPlate] = useState("");
  const [loading, setLoading] = useState(false);
  const webcamRef = useRef(null);

  const goToDashboard = () => {
    navigate("/dashboard");
  };

  const capturePhoto = () => {
    const screenshot = webcamRef.current.getScreenshot();
    setImage(screenshot);
  };

  
 const submitPhoto = async () => {
  if (!image || !image.startsWith("data:image")) {
    alert("❌ אין תמונה לשליחה. ודא שצילמת תמונה קודם.");
    return;
  }

  setLoading(true);

  try {
    console.log("📤 שולח תמונה לשרת לזיהוי לוחית...");
    const blob = await (await fetch(image)).blob();
    const formData = new FormData();
    formData.append("image", blob, "plate.png");

    // 1. שליחת התמונה לשרת לזיהוי מספר רכב
    const detectRes = await axios.post("http://localhost:3300/api/plate-detect", formData);
    let { plateNumber } = detectRes.data;

    if (!plateNumber) throw new Error("לא זוהתה לוחית מהשרת.");

    // 2. ניקוי הלוחית מכל תווים לא מספריים
    const cleanedPlate = plateNumber.replace(/[^\d]/g, "");
    setPlate(cleanedPlate);

    // 3. בקשת בדיקה לפי מספר רכב בלבד (בלי תאריך)
    const checkRes = await axios.get("http://localhost:5000/api/treatments/check", {
      params: { plate: cleanedPlate }
    });

    const { exists, customerName, idNumber, workerName } = checkRes.data;

    if (exists) {
      console.log("✅ טיפול נמצא:", { plateNumber: cleanedPlate, customerName, idNumber, workerName });

      // 4. ניווט לטופס טיפול עם הנתונים
      navigate("/create-treatment", {
        state: {
          plateNumber: cleanedPlate,
          customerName,
          idNumber,
          workerName
        }
      });
    } else {
      alert("🚫 לא נמצא טיפול פתוח לרכב זה.");
    }

  } catch (err) {
    console.error("❌ שגיאה בזיהוי או בבדיקת טיפול:", err);
    alert("❌ לא הצלחנו לזהות מספר רכב או לבדוק טיפול.");
  } finally {
    setLoading(false);
  }
};





  useEffect(() => {
    setStats([
      { title: "סה״כ תורים לחודש", value: 25, key: "appointments" },
      { title: "רכבים בטיפול", value: 12, key: "carsUnderMaintenance" },
      { title: "לקוחות חדשים", value: 8, key: "newCustomers" },
      { title: "הכנסות החודש (₪)", value: 12000, key: "income" },
      { title: "טיפולים שהתעכבו", value: 2, key: "delayedTreatments" },
    ]);

    setNotifications([
      { message: "🔧 רכב חדש נכנס לטיפול", type: "carsUnderMaintenance" },
      { message: "📅 לקוח קבע תור חדש למחר", type: "appointments" },
      { message: "💰 התקבל תשלום עבור טיפול", type: "income" },
      { message: "⚠️ עיכוב בטיפול ללקוח מסוים", type: "delayedTreatments" },
    ]);

    setDelayedTreatments([
      { רכב: "יונדאי i20", סיבה: "מחכים לחלפים", איחור: "3 ימים", לוחית: "123-45-678" },
      { רכב: "טויוטה קורולה", סיבה: "חוסר כוח אדם", איחור: "יום אחד", לוחית: "987-65-432" },
    ]);
  }, []);

  useEffect(() => {
    const today = new Date();

    const cars = [
      { id: 1, owner: "ישראל כהן", plateNumber: "123-45-678", lastServiceDate: "2025-08-10", lastKm: 20000, avgMonthlyKm: 2000 },
      { id: 2, owner: "דני לוי", plateNumber: "987-65-432", lastServiceDate: "2023-06-15", lastKm: 45000, avgMonthlyKm: 1800 },
      { id: 3, owner: "מיכל לוי", plateNumber: "789-12-345", lastServiceDate: "2023-10-01", lastKm: 30000, avgMonthlyKm: 2200 },
    ];

    const filteredCars = cars.map((car) => {
      const lastServiceDate = new Date(car.lastServiceDate);
      const monthsSinceService =
        (today.getFullYear() - lastServiceDate.getFullYear()) * 12 +
        (today.getMonth() - lastServiceDate.getMonth());
      const estimatedKm = car.lastKm + monthsSinceService * car.avgMonthlyKm;
      const needsService = monthsSinceService >= 6 || estimatedKm - car.lastKm >= 15000;
      return needsService
        ? {
            "מספר רכב": car.plateNumber,
            "בעלים": car.owner,
            "קילומטרים משוערים": estimatedKm.toLocaleString(),
            "חודשים מהטיפול האחרון": monthsSinceService,
          }
        : null;
    }).filter(car => car !== null);

    setRecommendedCars(filteredCars);
  }, []);

  const showTable = (key) => {
    let data = [];
    let title = "";
    switch (key) {
      case "recommendedCars":
        data = recommendedCars;
        title = "רכבים מומלצים לבדיקה";
        break;
      case "newCustomers":
        data = [
          { name: "ישראל כהן", phone: "050-1234567", joined: "15/03/2025" },
          { name: "מיכל לוי", phone: "052-9876543", joined: "18/03/2025" },
        ];
        title = "לקוחות חדשים";
        break;
      case "todayAppointments":
        fetch("http://localhost:5000/api/appointments")
          .then(res => res.json())
          .then(data => {
            const today = new Date().toISOString().slice(0, 10);
            const todaysAppointments = data.filter(a => a.date === today);
            setTableTitle("תורים להיום");
            setTableData(todaysAppointments.map(a => ({
              "מזהה תור": a.appointmentNumber,
              "שם": a.name,
              "ת'ז": a.idNumber,
              "מספר רכב": a.carNumber,
              "שעה": a.time,
              "תיאור": a.description,
              _id: a._id,
              treatmentId: a.treatment?.treatmentId
            })));
            setSelectedTable("todayAppointments");
          });
        return;
      case "carsUnderMaintenance":
        data = delayedTreatments;
        title = "רכבים בטיפול";
        break;
      case "appointments":
        setSelectedTable("monthlyAppointments");
        return;
      case "delayedTreatments":
        data = delayedTreatments;
        title = "טיפולים שהתעכבו";
        break;
      default:
        data = [];
    }

    setSelectedTable(key);
    setTableData(data);
    setTableTitle(title);
  };

  const handleConfirmArrival = async (value) => {
    const [, appointmentId] = value.split("-");
    try {
      const res = await fetch("http://localhost:5000/api/treatments/confirm-arrival", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ appointmentId })
      });

      const data = await res.json();
      if (res.ok) {
        alert("✅ טיפול נוסף!");
        showTable("todayAppointments");
      } else {
        alert("❌ שגיאה: " + data.message);
      }
    } catch (error) {
      alert("❌ שגיאה בחיבור לשרת");
    }
  };

  const tableHeaders = {
    todayAppointments: ["מזהה תור", "שם", "ת'ז", "מספר רכב", "שעה", "תיאור", "פעולה"],
    recommendedCars: ["מספר רכב", "בעלים", "קילומטרים משוערים", "חודשים מהטיפול האחרון"],
    newCustomers: ["שם", "טלפון", "תאריך הצטרפות"],
    carsUnderMaintenance: ["רכב", "סיבה", "איחור", "לוחית"],
    delayedTreatments: ["רכב", "סיבה", "איחור", "לוחית"]
  };

  return (
    <div className={styles.dashboardContainer}>
      <header className={styles.dashboardHeader}>
        <h2 className={styles.headerTitle}>לוח ניהול מתקדם</h2>
        <button className={styles.backBtn} onClick={goToDashboard}>
          <FaArrowLeft className={styles.icon} /> חזור לדשבורד
        </button>
      </header>

      <aside className={styles.sidebar}>
        <button className={styles.sendMessageBtn} onClick={() => setIsModalOpen(true)}>📩 שליחת הודעות</button>
        <button className={styles.sendMessageBtn} onClick={() => showTable("recommendedCars")}>🚗 רכבים מומלצים</button>
        <button className={styles.sendMessageBtn}>הורדת דוח חודשי</button>
        <button className={styles.sendMessageBtn} onClick={() => showTable("todayAppointments")}>📅 תורים להיום</button>
        <button className={styles.sendMessageBtn} onClick={() => navigate("/create-treatment")}>➕ הוספת טיפול חדש</button>
        <button className={styles.sendMessageBtn} onClick={() => setShowCameraPanel(prev => !prev)}>📷 הפעל מצלמה</button>
      </aside>

      <main className={styles.mainContent}>
        <DashboardOverview
          stats={stats}
          notifications={notifications}
          onStatClick={showTable}
          onNotificationClick={showTable}
        />

        <DashboardTables
          selectedTable={selectedTable}
          tableTitle={tableTitle}
          tableData={tableData}
          tableHeaders={tableHeaders}
          onClose={() => setSelectedTable(null)}
          onConfirmArrival={handleConfirmArrival}
        />

        {selectedTable === "monthlyAppointments" && (
          <MonthlyAppointments onClose={() => setSelectedTable(null)} />
        )}
      </main>

      {/* 🎥 מצלמה בצד */}
      {showCameraPanel && (
        <div style={{
          position: "fixed",
          top: "80px",
          right: "20px",
          backgroundColor: "#fff",
          padding: "20px",
          border: "2px solid #ccc",
          borderRadius: "10px",
          zIndex: 1000,
          width: "320px"
        }}>
          <h4>📸 מצלמה</h4>
          {!image && (
            <>
              <Webcam
                ref={webcamRef}
                screenshotFormat="image/jpeg"
                width={280}
                videoConstraints={{ facingMode: "environment" }}
              />
              <button style={{ marginTop: 10 }} onClick={capturePhoto}>📷 צלם</button>
            </>
          )}

          {image && (
            <>
              <img src={image} alt="צולם" width={280} />
              <button style={{ marginTop: 10 }} onClick={submitPhoto} disabled={loading}>
                {loading ? "⏳ שולח..." : "✅ שלח לזיהוי"}
              </button>
              <button onClick={() => setImage(null)}>🔄 צלם שוב</button>
            </>
          )}

          {plate && <p style={{ marginTop: 10 }}>🔢 לוחית שזוהתה: <strong>{plate}</strong></p>}

          <button style={{ marginTop: 10 }} onClick={() => {
            setShowCameraPanel(false);
            setImage(null);
            setPlate("");
          }}>❌ סגור</button>
        </div>
      )}

      <MessageModal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSend={() => alert("📤 הודעה נשלחה!")}
        sendToAll={sendToAll}
        setSendToAll={setSendToAll}
        phoneNumber={phoneNumber}
        setPhoneNumber={setPhoneNumber}
        message={message}
        setMessage={setMessage}
      />
    </div>
  );
};

export default AdvancedDashboard;

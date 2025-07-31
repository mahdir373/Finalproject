const Appointment = require('../models/Appointment');
const Treatment = require('../models/Treatment');
const Client = require('../models/Customer');
const Invoice = require('../models/Invoice');
// שליפה כללית
const getAllTreatments = async (req, res) => {
  try {
    const treatments = await Treatment.find().sort({ createdAt: -1 });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפת טיפולים', error: err.message });
  }
};

const getTreatmentById = async (req, res) => {
  const treatmentId = parseInt(req.params.treatmentId);
  if (isNaN(treatmentId)) {
    return res.status(400).json({ message: "מזהה טיפול לא תקין" });
  }

  try {
    const treatment = await Treatment.findOne({ treatmentNumber: treatmentId });
    if (!treatment) return res.status(404).json({ message: 'טיפול לא נמצא' });
    res.json(treatment);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפה לפי מזהה טיפול', error: err.message });
  }
};


// שליפה לפי מזהה תור
const getTreatmentsByAppointmentNumber = async (req, res) => {
  try {
    const treatments = await Treatment.find({ appointmentNumber: req.params.appointmentNumber });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפה לפי מזהה תור', error: err.message });
  }
};

// שליפה לפי תאריך
const getTreatmentsByDate = async (req, res) => {
  try {
    const treatments = await Treatment.find({ date: req.params.date });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפה לפי תאריך', error: err.message });
  }
};

// שליפה לפי מספר רכב
const getTreatmentsByCarPlate = async (req, res) => {
  try {
    const treatments = await Treatment.find({ carPlate: req.params.carPlate });
    res.json(treatments);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפה לפי רכב', error: err.message });
  }
};

// הוספת טיפול חדש
// הוספת טיפול חדש
const addTreatment = async (req, res) => {
  try {
    const last = await Treatment.findOne().sort({ treatmentNumber: -1 });
    const nextNumber = last ? last.treatmentNumber + 1 : 6001;
    const treatmentId = nextNumber.toString();

    const invoiceFile = req.files?.invoice?.[0]?.filename || '';
    const images = req.files?.images?.map(f => f.filename) || [];

    let {
      date,
      cost,
      carPlate,
      description,
      workerName,
      customerName,
      repairTypeId,
      status,
      treatmentServices // ✅ נוספה שורה זו
    } = req.body;

    // ✅ עיבוד treatmentServices אם הוא מחרוזת (כמו שמתקבל מ־FormData)
    if (treatmentServices && typeof treatmentServices === 'string') {
      try {
        treatmentServices = JSON.parse(treatmentServices);
      } catch (err) {
        return res.status(400).json({ message: "פורמט לא תקין של treatmentServices", error: err.message });
      }
    }

    const treatment = new Treatment({
      treatmentNumber: nextNumber,
      treatmentId,
      date,
      cost: isNaN(Number(cost)) ? 0 : Number(cost),
      carPlate,
      invoiceFile,
      description,
      workerName,
      customerName,
      images,
      repairTypeId: isNaN(Number(repairTypeId)) ? null : Number(repairTypeId),
      status,
      treatmentServices // ✅ שמירה במסד הנתונים
    });

    await treatment.save();
    res.status(201).json({ message: "✅ הטיפול נשמר", treatment });
  } catch (err) {
    console.error("❌ שגיאה בשמירת טיפול:", err);
    res.status(500).json({ message: "❌ שגיאה בהוספת טיפול", error: err.message });
  }
};

// עדכון טיפול
const updateTreatment = async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) return res.status(404).json({ message: "טיפול לא נמצא" });

    // ✅ עדכון שדות רגילים
    treatment.date = req.body?.date || treatment.date;
    treatment.cost = isNaN(Number(req.body?.cost)) ? treatment.cost : Number(req.body.cost);
    treatment.carPlate = req.body?.carPlate || treatment.carPlate;
    treatment.description = req.body?.description || treatment.description;
    treatment.workerName = req.body?.workerName || treatment.workerName;
    treatment.customerName = req.body?.customerName || treatment.customerName;
    treatment.status = req.body?.status || treatment.status;
    treatment.repairTypeId = req.body?.repairTypeId || treatment.repairTypeId;
    treatment.workerId = req.body?.workerId || treatment.workerId;
    treatment.idNumber = req.body?.idNumber || treatment.idNumber;

    // ✅ עדכון סיבת עיכוב ותאריך משוער
    if (req.body?.delayReason !== undefined) {
      treatment.delayReason = req.body.delayReason;
    }
    if (req.body?.estimatedReleaseDate !== undefined) {
      treatment.estimatedReleaseDate = req.body.estimatedReleaseDate
        ? new Date(req.body.estimatedReleaseDate)
        : null;
    }

    // ✅ עדכון treatmentServices
    if (req.body?.treatmentServices) {
      console.log("📥 התקבל treatmentServices בעדכון:", req.body.treatmentServices);

      try {
        treatment.treatmentServices =
          typeof req.body.treatmentServices === "string"
            ? JSON.parse(req.body.treatmentServices)
            : req.body.treatmentServices;
      } catch (err) {
        console.error("❌ שגיאה בפיענוח treatmentServices בעת עדכון:", err);
      }
    }

    // ✅ עדכון קבצים
    if (req.files?.invoice?.[0]) {
      treatment.invoiceFile = req.files.invoice[0].filename;
    }
    if (req.files?.images?.length) {
      treatment.images = req.files.images.map(file => file.filename);
    }

    await treatment.save();
    res.json({ message: "✅ הטיפול עודכן בהצלחה", treatment });
  } catch (err) {
    console.error("❌ שגיאה בעדכון טיפול:", err);
    res.status(500).json({ message: "❌ שגיאה בעדכון טיפול", error: err.message });
  }
};



// אישור הגעה ויצירת טיפול מתור
const confirmArrivalAndAddTreatment = async (req, res) => {
  try {
    const { appointmentId } = req.body;

    // מציאת התור לפי מזהה
    const appointment = await Appointment.findById(appointmentId);
    if (!appointment) return res.status(404).json({ message: "❌ תור לא נמצא" });

    // קביעת מספר טיפול רץ
    const lastTreatment = await Treatment.findOne().sort({ treatmentNumber: -1 });
    const nextTreatmentNumber = lastTreatment ? lastTreatment.treatmentNumber + 1 : 6001;

    // יצירת הטיפול החדש
    const treatment = new Treatment({
      treatmentNumber: nextTreatmentNumber,
      treatmentId: nextTreatmentNumber.toString(),
      appointmentNumber: appointment.appointmentNumber,
      date: appointment.date,
      carPlate: appointment.carNumber,
      customerName: appointment.name,
      description: appointment.description || "",
      treatmentType: "",
      workerName: "",
      images: [],
      cost: 0,
      repairTypeId: null, // ניתן להשאיר null או להסיר לגמרי אם לא נדרש יותר
      status: 'בטיפול'
    });

    // שמירת הטיפול
    await treatment.save();

    // עדכון התור עם מזהה טיפול
    appointment.treatment = treatment._id;
    await appointment.save();

    // החזרת תגובה עם אובייקט הטיפול
    res.status(201).json({
      message: "✅ טיפול נוצר בהצלחה (ללא סוג טיפול)",
      treatment
    });
  } catch (err) {
    console.error("❌ שגיאה ביצירת טיפול:", err);
    res.status(500).json({
      message: "❌ שגיאה ביצירת טיפול",
      error: err.message
    });
  }
};


// שליפה לפי אובייקט ID
const getTreatmentByObjectId = async (req, res) => {
  try {
    const treatment = await Treatment.findById(req.params.id);
    if (!treatment) return res.status(404).json({ message: 'טיפול לא נמצא' });
    res.json(treatment);
  } catch (err) {
    res.status(500).json({ message: 'שגיאה בשליפה לפי מזהה', error: err.message });
  }
};

// בדיקה לפי מספר רכב
const checkTreatmentByPlate = async (req, res) => {
  const { plate } = req.query;
  if (!plate) return res.status(400).json({ message: 'חובה לציין plate' });

  try {
    const cleanedPlate = plate.replace(/[^\d]/g, "");

    const treatment = await Treatment.findOne({ carPlate: cleanedPlate });

    if (!treatment) {
      console.log("🚫 טיפול לא נמצא עם לוחית:", cleanedPlate);
      return res.json({ exists: false });
    }

    const client = await Client.findOne({
      vehicles: { $in: [cleanedPlate] }
    });

    if (!client) {
      console.log("🚫 לקוח לא נמצא עם מספר רכב:", cleanedPlate);
      return res.json({ exists: false });
    }

    return res.json({
      exists: true,
      treatmentId: treatment._id,
      customerName: client.name,
      idNumber: client.idNumber,
      workerName: treatment.workerName || ''
    });

  } catch (err) {
    console.error("❌ שגיאה בבדיקת טיפול לפי לוחית:", err);
    res.status(500).json({ message: "שגיאה פנימית", error: err.message });
  }
};


const getRevenueByCategory = async (req, res) => {
  try {
    const treatments = await Treatment.find({});

    const categoryMap = {};

    treatments.forEach(t => {
      const cost = Number(t.cost) || 0;
      const services = t.treatmentServices || [];

      services.forEach(service => {
        const category = service?.category || "לא ידוע";
        if (!categoryMap[category]) {
          categoryMap[category] = 0;
        }
        categoryMap[category] += cost;
      });
    });

    const result = Object.entries(categoryMap).map(([name, value]) => ({ name, value }));
    console.log("🚀 נתוני תגובה:", result);


    res.json(result);
  } catch (err) {
    console.error("שגיאה בשליפת הכנסות לפי קטגוריה:", err);
    res.status(500).json({ message: "שגיאה בשליפת הכנסות לפי קטגוריה", error: err.message });
  }
};



const updateTreatmentCostFromInvoice = async (req, res) => {
  try {
    const { treatmentId } = req.params;

    // חיפוש החשבונית לפי treatmentId
    const invoice = await Invoice.findOne({ treatmentId });
    if (!invoice) {
      return res.status(404).json({ message: "⚠️ חשבונית לא נמצאה עבור טיפול זה" });
    }

    const costToUpdate = invoice.total || invoice.totalWithVAT;
    if (typeof costToUpdate !== 'number') {
      return res.status(400).json({ message: "⚠️ סכום לא תקין בחשבונית" });
    }

    const updatedTreatment = await Treatment.findOneAndUpdate(
      { _id: treatmentId },
      { cost: costToUpdate },
      { new: true }
    );

    if (!updatedTreatment) {
      return res.status(404).json({ message: "⚠️ טיפול לא נמצא" });
    }

    res.json({
      message: "✅ עלות הטיפול עודכנה בהצלחה מהחשבונית",
      cost: updatedTreatment.cost,
      treatment: updatedTreatment
    });
  } catch (error) {
    console.error("❌ שגיאה בעדכון עלות טיפול:", error.message);
    res.status(500).json({ message: "❌ שגיאה בעדכון טיפול", error: error.message });
  }
};

// ✅ סכום כולל של טיפולים לחודש הנוכחי
const getMonthlyRevenue = async (req, res) => {
  try {
    const startOfMonth = new Date();
    startOfMonth.setDate(1);
    startOfMonth.setHours(0, 0, 0, 0);

    const endOfMonth = new Date(startOfMonth);
    endOfMonth.setMonth(endOfMonth.getMonth() + 1);

    const treatments = await Treatment.find({
      date: { $gte: startOfMonth, $lt: endOfMonth }
    });

    const totalRevenue = treatments.reduce((sum, t) => sum + (t.cost || 0), 0);

    res.json({ totalRevenue });
  } catch (error) {
    console.error("❌ שגיאה בשליפת הכנסות חודשיות:", error);
    res.status(500).json({ message: "שגיאה בשליפת הכנסות חודשיות" });
  }
};

const deleteTreatment = async (req, res) => {
  try {
    const { id } = req.params;
    const deleted = await Treatment.findByIdAndDelete(id);

    if (!deleted) {
      return res.status(404).json({ message: "❌ טיפול לא נמצא למחיקה" });
    }

    res.status(200).json({ message: "✅ הטיפול נמחק בהצלחה" });
  } catch (error) {
    console.error("❌ שגיאה במחיקת טיפול:", error.message);
    res.status(500).json({ message: "❌ שגיאה בשרת", error: error.message });
  }
};



const getMonthlyReportData = async (req, res) => {
  try {
    const treatments = await Treatment.find().sort({ createdAt: -1 });

    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1);
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0);

    // ✅ סינון טיפולי החודש לפי תאריך
    const monthlyTreatments = treatments.filter(t => {
      const tDate = new Date(t.date);
      return tDate >= startOfMonth && tDate <= endOfMonth;
    });

    const totalRevenue = monthlyTreatments.reduce((sum, t) => sum + (Number(t.cost) || 0), 0);
    const totalTreatments = monthlyTreatments.length;

    const newCustomers = await Client.find({
      createdAt: { $gte: startOfMonth, $lte: endOfMonth }
    }).countDocuments();

    res.json({
      treatments: monthlyTreatments,
      totalRevenue,
      totalTreatments,
      newCustomers
    });
  } catch (error) {
    console.error("❌ שגיאה בדוח החודשי:", error);
    res.status(500).json({ message: "שגיאה בשליפת הדוח החודשי" });
  }
};





module.exports = {
  getAllTreatments,
  getTreatmentById,
  getTreatmentsByAppointmentNumber,
  getTreatmentsByDate,
  getTreatmentsByCarPlate,
  addTreatment,
  updateTreatment,
  confirmArrivalAndAddTreatment,
  getTreatmentByObjectId,
  checkTreatmentByPlate,
  getRevenueByCategory,
  updateTreatmentCostFromInvoice,
  getMonthlyRevenue,
  deleteTreatment,
  getMonthlyReportData
};
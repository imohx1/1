import { useState, useEffect } from 'react'
import './App.css'
import { scheduleData } from './scheduleData'
import { MapPin, ChevronLeft, ChevronRight } from 'lucide-react'

function App() {
  const [currentTime, setCurrentTime] = useState(new Date())

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentTime(new Date())
    }, 1000)
    return () => clearInterval(timer)
  }, [])

  const formatTime = (date) => {
    return date.toLocaleTimeString('ar-SA', { 
      hour: '2-digit', 
      minute: '2-digit',
      hour12: false 
    })
  }

  const parseTime = (timeStr) => {
    const [time, period] = timeStr.split(' ');
    let [hours, minutes] = time.split(':').map(Number);
    if (period === 'م' && hours !== 12) {
      hours += 12;
    } else if (period === 'ص' && hours === 12) {
      hours = 0;
    }
    return { hours, minutes };
  };

  const getDayName = (dayIndex) => {
    const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس', 'الجمعة', 'السبت'];
    return days[dayIndex];
  };

  const getCurrentDayName = (date) => {
    const dayIndex = date.getDay(); // 0 for Sunday, 1 for Monday, etc.
    return getDayName(dayIndex);
  };

  const formatDate = (date) => {
    return date.toLocaleDateString('ar-SA-u-ca-islamic', {   year: 'numeric',
      month: 'numeric',
      day: 'numeric'
    })
  }

  // Group schedule by day
  const [filterDay, setFilterDay] = useState('');

  const dayMap = {
    '1': 'الأحد',
    '2': 'الاثنين',
    '3': 'الثلاثاء',
    '4': 'الأربعاء',
    '5': 'الخميس',
    '6': 'الجمعة',
    '7': 'السبت',
  };

  const groupedSchedule = scheduleData.reduce((acc, item) => {
    if (!acc[item.day]) {
      acc[item.day] = []
    }
    acc[item.day].push(item)
    return acc
  }, {});

  const allClasses = scheduleData.map(classItem => {
    const [startTimeStr, endTimeStr] = classItem.time.split(" - ");
    const start = parseTime(startTimeStr);
    const end = parseTime(endTimeStr);

    const today = new Date(currentTime);
    const classDayIndex = ["الأحد", "الاثنين", "الثلاثاء", "الأربعاء", "الخميس", "الجمعة", "السبت"].indexOf(classItem.day);
    
    // Adjust date to match the class day for comparison
    const classDate = new Date(today);
    classDate.setDate(today.getDate() + (classDayIndex - today.getDay() + 7) % 7);

    const startDateTime = new Date(classDate);
    startDateTime.setHours(start.hours, start.minutes, 0, 0);

    const endDateTime = new Date(classDate);
    endDateTime.setHours(end.hours, end.minutes, 0, 0);

    const endDateTimePlus25 = new Date(endDateTime.getTime() + 25 * 60 * 1000); // Add 25 minutes

    return { ...classItem, startDateTime, endDateTime, endDateTimePlus25 };
  }).filter(item => !item.isCancelled && !item.isSelfStudy);

  const sortedClasses = allClasses.sort((a, b) => a.startDateTime - b.startDateTime);

  const [mainDisplayedClassIndex, setMainDisplayedClassIndex] = useState(0);
  const [classSearchIndex, setClassSearchIndex] = useState("");

  useEffect(() => {
    let newInitialIndex = 0;
    if (sortedClasses.length > 0) {
      for (let i = 0; i < sortedClasses.length; i++) {
        const classItem = sortedClasses[i];
        if (currentTime >= classItem.startDateTime && currentTime <= new Date(classItem.startDateTime.getTime() + 25 * 60 * 1000)) {
          newInitialIndex = i;
          break;
        }
        if (currentTime < classItem.startDateTime) {
          newInitialIndex = i;
          break;
        }
      }
    }
    setMainDisplayedClassIndex(newInitialIndex);
  }, [currentTime, sortedClasses]);

  const handlePrevClass = () => {
    setMainDisplayedClassIndex(prevIndex => Math.max(0, prevIndex - 1));
  };

  const handleNextClass = () => {
    setMainDisplayedClassIndex(prevIndex => Math.min(sortedClasses.length - 1, prevIndex + 1));
  };

  const handleClassSearchChange = (e) => {
    setClassSearchIndex(e.target.value);
  };

  const applyClassSearch = () => {
    const index = parseInt(classSearchIndex, 10);
    if (!isNaN(index) && index >= 1 && index <= sortedClasses.length) {
      setMainDisplayedClassIndex(index - 1);
    } else {
      alert("الرجاء إدخال رقم محاضرة صحيح.");
    }
  };

  const mainDisplayedClass = sortedClasses[mainDisplayedClassIndex];
  const prevDisplayedClass = sortedClasses[mainDisplayedClassIndex - 1];
  const nextDisplayedClass = sortedClasses[mainDisplayedClassIndex + 1];

  const filteredGroupedSchedule = Object.entries(groupedSchedule).filter(([day]) => {
    if (!filterDay) return true;
    const mappedDay = dayMap[filterDay];
    return day === mappedDay;
  });

  return (
    <div className="app-container">
      <header className="header">
        <p className="subtitle">تخصص: برمجة وتطوير الويب</p>
        <h1 className="title">جدول محمد الخزيم</h1>
      </header>

      <main className="main-content">
        <section className="schedule-section">
          <h2 className="section-title">الجدول الكامل</h2>
          <div className="filter-container">
            <input
              type="number"
              placeholder="أدخل رقم اليوم (1-7)"
              value={filterDay}
              onChange={(e) => setFilterDay(e.target.value)}
              min="1"
              max="7"
              className="day-filter-input"
            />
          </div>
          
          <div className="table-container">
            <table className="schedule-table">
              <thead>
                <tr>
                  <th>اليوم</th>
                  <th>المادة</th>
                  <th>الوقت</th>
                  <th>المدرس</th>
                  <th>المبنى والغرفة</th>
                </tr>
              </thead>
              <tbody>
                {filteredGroupedSchedule.map(([day, classes]) => (
                  classes.map((classItem, index) => (
                    <tr 
                      key={`${day}-${index}`}
                      className={`
                        ${classItem.isCancelled || classItem.isSelfStudy ? 'cancelled-row' : ''}
                        ${classItem.day === 'الأحد' || classItem.day === 'الثلاثاء' || classItem.day === 'الخميس' ? 'light-gray-row' : ''}
                        ${classItem.day === 'الاثنين' || classItem.day === 'الأربعاء' ? 'white-row' : ''}
                      `}
                    
                    >
                      <td className="day-cell">
                        {day}
                      </td>
                      <td className="subject-cell">
                        <div className="subject-name">{classItem.subject}</div>
                        {classItem.note && (
                          <div className="subject-note">{classItem.note}</div>
                        )}
                      </td>
                      <td className="time-cell">{classItem.time}</td>
                      <td className="teacher-cell">{classItem.teacher}</td>
                      <td className="building-cell">
                        <MapPin className="location-icon" size={14} />
                        {classItem.building}
                      </td>
                    </tr>
                  ))
                ))}
              </tbody>
            </table>
          </div>
        </section>

        <section className="next-class-section">
          <div className="class-search-container">
            <input
              type="number"
              placeholder="أدخل رقم المحاضرة"
              value={classSearchIndex}
              onChange={handleClassSearchChange}
              min="1"
              max={sortedClasses.length}
              className="class-search-input"
            />
            <button onClick={applyClassSearch} className="class-search-button">عرض</button>
          </div>

          <div className="next-class-cards-wrapper">
            {/* Past Classes Panel */}
            <div className="side-panel past-classes-panel">
              <div className="panel-header">
                <h2>المحاضرات السابقة</h2>
              </div>
              <div className="panel-body">
                {sortedClasses.slice(0, mainDisplayedClassIndex).reverse().map((classItem, index) => (
                  <div key={index} className="side-panel-class-item">
                    <h3>{classItem.subject}</h3>
                    <p>{classItem.time}</p>
                    <p>{classItem.teacher}</p>
                    <p>{classItem.building}</p>
                    <p>({classItem.day})</p>
                  </div>
                ))}
              </div>
            </div>

            {/* Main Current/Next Class Card */}
            <div className="next-class-card main-card">
              <div className="card-header">
                <span className="alarm-icon">⏰</span>
                <h2>
                  {mainDisplayedClass && currentTime >= mainDisplayedClass.startDateTime && currentTime <= new Date(mainDisplayedClass.startDateTime.getTime() + 25 * 60 * 1000)
                    ? "المحاضرة الحالية"
                    : mainDisplayedClass ? "المحاضرة القادمة" : "لا توجد محاضرات"}
                </h2>
              </div>
              {mainDisplayedClass ? (
                <div className="card-body">
                  <h3 className="next-class-subject">{mainDisplayedClass.subject}</h3>
                  <p className="next-class-time">{mainDisplayedClass.time}</p>
                  <p className="next-class-teacher">{mainDisplayedClass.teacher}</p>
                  <p className="next-class-location">
                    <MapPin className="location-icon" size={14} />
                    {mainDisplayedClass.building}
                  </p>
                  <p className="next-class-day">({mainDisplayedClass.day})</p>
                </div>
              ) : (
                <div className="card-body">
                  <p className="next-class-subject">لا توجد محاضرات حاليًا أو قادمة.</p>
                </div>
              )}
              <div className="card-footer">
                <div className="navigation-buttons">
                  <button onClick={handlePrevClass} disabled={mainDisplayedClassIndex === 0}>
                    <ChevronRight size={24} />
                  </button>
                  <div className="current-time">{formatTime(currentTime)}</div>
                  <button onClick={handleNextClass} disabled={mainDisplayedClassIndex === sortedClasses.length - 1}>
                    <ChevronLeft size={24} />
                  </button>
                </div>
                <div className="last-update">
                  آخر تحديث: {formatDate(currentTime)} {formatTime(currentTime)}
                </div>
              </div>
            </div>

            {/* Upcoming Classes Panel */}
            <div className="side-panel upcoming-classes-panel">
              <div className="panel-header">
                <h2>المحاضرات القادمة</h2>
              </div>
              <div className="panel-body">
                {sortedClasses.slice(mainDisplayedClassIndex + 1).map((classItem, index) => (
                  <div key={index} className="side-panel-class-item">
                    <h3>{classItem.subject}</h3>
                    <p>{classItem.time}</p>
                    <p>{classItem.teacher}</p>
                    <p>{classItem.building}</p>
                    <p>({classItem.day})</p>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </section>
      </main>
    </div>
  )
}

export default App

